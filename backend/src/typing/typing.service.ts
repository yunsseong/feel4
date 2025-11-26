import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Content, ContentType } from './content.entity';
import { TypingProgress } from './typing-progress.entity';
import { TypingStats } from './typing-stats.entity';
import { User } from '../users/user.entity';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CONTENT_LIST_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

@Injectable()
export class TypingService {
    constructor(
        @InjectRepository(Content)
        private contentRepository: Repository<Content>,
        @InjectRepository(TypingProgress)
        private progressRepository: Repository<TypingProgress>,
        @InjectRepository(TypingStats)
        private statsRepository: Repository<TypingStats>,
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
    ) { }

    async getContent(user: { userId: string; email: string } | null, contentType?: ContentType) {
        // 비로그인 사용자: 랜덤 콘텐츠 제공
        if (!user) {
            return this.getRandomContent(contentType);
        }

        // Get current progress or default
        let progress = await this.progressRepository.findOne({ where: { userId: user.userId } });

        if (!progress) {
            // 신규 사용자: 랜덤 작품의 첫 문단으로 시작
            const randomContent = await this.getRandomFirstContent(contentType);
            progress = this.progressRepository.create({
                userId: user.userId,
                contentType: randomContent.contentType,
                workTitle: randomContent.workTitle,
                chapter: 1,
                section: 1,
            });
            await this.progressRepository.save(progress);
        } else if (contentType && contentType !== progress.contentType) {
            // 콘텐츠 타입 변경: 해당 타입의 랜덤 작품 첫 문단으로
            const randomContent = await this.getRandomFirstContent(contentType);
            progress.contentType = randomContent.contentType;
            progress.workTitle = randomContent.workTitle;
            progress.chapter = 1;
            progress.section = 1;
            progress.cursorPos = 0;
            await this.progressRepository.save(progress);
        }

        // Fetch content with cache
        const content = await this.getContentByPosition(
            progress.contentType,
            progress.workTitle,
            progress.chapter,
            progress.section,
        );

        if (!content) {
            // Fallback for MVP testing
            return {
                contentType: progress.contentType,
                workTitle: progress.workTitle,
                chapter: progress.chapter,
                section: progress.section,
                content: '태초에 하나님이 천지를 창조하시니라',
                displayReference: '창세기 1:1',
                author: null,
                cursorPos: progress.cursorPos,
            };
        }

        return {
            contentType: content.contentType,
            workTitle: content.workTitle,
            chapter: content.chapter,
            section: content.section,
            content: content.content,
            displayReference: content.displayReference,
            author: content.author,
            cursorPos: progress.cursorPos,
        };
    }

    // 캐싱된 콘텐츠 조회 헬퍼
    private async getContentByPosition(
        contentType: ContentType,
        workTitle: string,
        chapter: number,
        section: number,
    ): Promise<Content | null> {
        const cacheKey = `content:${contentType}:${workTitle}:${chapter}:${section}`;

        const cached = await this.cacheManager.get<Content>(cacheKey);
        if (cached) {
            return cached;
        }

        const content = await this.contentRepository.findOne({
            where: { contentType, workTitle, chapter, section },
        });

        if (content) {
            await this.cacheManager.set(cacheKey, content, CACHE_TTL);
        }

        return content;
    }

    private async getRandomFirstContent(contentType?: ContentType) {
        // 콘텐츠 타입이 지정되지 않으면 소설, 시, 수필 중 랜덤 선택
        const randomTypes = [ContentType.NOVEL, ContentType.POEM, ContentType.ESSAY];
        const selectedType = contentType || randomTypes[Math.floor(Math.random() * randomTypes.length)];

        // 해당 타입의 랜덤 작품 첫 문단 가져오기
        const content = await this.contentRepository
            .createQueryBuilder('content')
            .where('content.content_type = :contentType', { contentType: selectedType })
            .andWhere('content.chapter = 1')
            .andWhere('content.section = 1')
            .orderBy('RANDOM()')
            .getOne();

        if (!content) {
            return {
                contentType: selectedType,
                workTitle: '샘플',
            };
        }

        return {
            contentType: content.contentType,
            workTitle: content.workTitle,
        };
    }

    private async getRandomContent(contentType?: ContentType) {
        // 콘텐츠 타입이 지정되지 않으면 소설, 시, 수필 중 랜덤 선택
        const randomTypes = [ContentType.NOVEL, ContentType.POEM, ContentType.ESSAY];
        const selectedType = contentType || randomTypes[Math.floor(Math.random() * randomTypes.length)];

        // 해당 타입의 랜덤 작품의 첫 문단 가져오기 (chapter=1, section=1)
        const content = await this.contentRepository
            .createQueryBuilder('content')
            .where('content.content_type = :contentType', { contentType: selectedType })
            .andWhere('content.chapter = 1')
            .andWhere('content.section = 1')
            .orderBy('RANDOM()')
            .getOne();

        if (!content) {
            // Fallback
            return {
                contentType: selectedType,
                workTitle: '샘플',
                chapter: 1,
                section: 1,
                content: '필사의 감동을 느껴보세요.',
                displayReference: '샘플 텍스트',
                author: null,
                cursorPos: 0,
            };
        }

        return {
            contentType: content.contentType,
            workTitle: content.workTitle,
            chapter: content.chapter,
            section: content.section,
            content: content.content,
            displayReference: content.displayReference,
            author: content.author,
            cursorPos: 0,
        };
    }

    async getContentList(contentType: ContentType) {
        const cacheKey = `content_list:${contentType}`;

        // Try to get from cache
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Get unique work titles for a content type
        const works = await this.contentRepository
            .createQueryBuilder('content')
            .select('content.work_title', 'workTitle')
            .addSelect('content.author', 'author')
            .addSelect('content.publication_year', 'publicationYear')
            .where('content.content_type = :contentType', { contentType })
            .groupBy('content.work_title')
            .addGroupBy('content.author')
            .addGroupBy('content.publication_year')
            .orderBy('content.work_title', 'ASC')
            .getRawMany();

        // Store in cache
        await this.cacheManager.set(cacheKey, works, CONTENT_LIST_CACHE_TTL);

        return works;
    }

    async submit(
        user: { userId: string; email: string },
        data: {
            contentType: ContentType;
            workTitle: string;
            chapter: number;
            section: number;
            cpm: number;
            accuracy: number;
        }
    ) {
        // Update stats
        const stats = this.statsRepository.create({
            user: { id: user.userId } as User,
            cpm: data.cpm,
            accuracy: data.accuracy,
            verseCount: 1,
        });
        await this.statsRepository.save(stats);

        // Update progress
        let progress = await this.progressRepository.findOne({ where: { userId: user.userId } });
        if (progress) {
            // Check if next section exists in same work (캐싱 적용)
            const nextSection = await this.getContentByPosition(
                data.contentType,
                data.workTitle,
                data.chapter,
                data.section + 1,
            );

            if (nextSection) {
                progress.section += 1;
            } else {
                // Check next chapter (캐싱 적용)
                const nextChapter = await this.getContentByPosition(
                    data.contentType,
                    data.workTitle,
                    data.chapter + 1,
                    1,
                );
                if (nextChapter) {
                    progress.chapter += 1;
                    progress.section = 1;
                }
                // Else end of work (stay on last section or mark finished)
            }
            progress.cursorPos = 0;
            await this.progressRepository.save(progress);
        }

        return { success: true };
    }

    async getNextContent(
        user: { userId: string; email: string } | null,
        data: {
            contentType: ContentType;
            workTitle: string;
            chapter: number;
            section: number;
        }
    ) {
        // 다음 섹션 찾기 (캐싱 적용)
        let nextContent = await this.getContentByPosition(
            data.contentType,
            data.workTitle,
            data.chapter,
            data.section + 1,
        );

        // 다음 섹션이 없으면 다음 챕터의 첫 섹션
        if (!nextContent) {
            nextContent = await this.getContentByPosition(
                data.contentType,
                data.workTitle,
                data.chapter + 1,
                1,
            );
        }

        // 다음 챕터도 없으면 같은 타입의 다른 랜덤 작품 선택
        if (!nextContent) {
            nextContent = await this.contentRepository
                .createQueryBuilder('content')
                .where('content.content_type = :contentType', { contentType: data.contentType })
                .andWhere('content.work_title != :workTitle', { workTitle: data.workTitle })
                .andWhere('content.chapter = 1')
                .andWhere('content.section = 1')
                .orderBy('RANDOM()')
                .getOne();
        }

        // 다른 작품도 없으면 현재 작품 처음으로 돌아가기 (fallback)
        if (!nextContent) {
            nextContent = await this.getContentByPosition(
                data.contentType,
                data.workTitle,
                1,
                1,
            );
        }

        if (!nextContent) {
            throw new Error('Content not found');
        }

        // 로그인 사용자는 진행 저장
        if (user) {
            let progress = await this.progressRepository.findOne({ where: { userId: user.userId } });
            if (progress) {
                progress.contentType = nextContent.contentType;
                progress.workTitle = nextContent.workTitle;
                progress.chapter = nextContent.chapter;
                progress.section = nextContent.section;
                progress.cursorPos = 0;
                await this.progressRepository.save(progress);
            }
        }

        return {
            contentType: nextContent.contentType,
            workTitle: nextContent.workTitle,
            chapter: nextContent.chapter,
            section: nextContent.section,
            content: nextContent.content,
            displayReference: nextContent.displayReference,
            author: nextContent.author,
            cursorPos: 0,
        };
    }

    async setContent(
        user: { userId: string; email: string } | null,
        data: {
            contentType: ContentType;
            workTitle: string;
            chapter?: number;
            section?: number;
        }
    ) {
        // Find the content to start from (캐싱 적용)
        const content = await this.getContentByPosition(
            data.contentType,
            data.workTitle,
            data.chapter || 1,
            data.section || 1,
        );

        if (!content) {
            throw new Error('Content not found');
        }

        // 비로그인 사용자는 진행 저장 없이 콘텐츠만 반환
        if (!user) {
            return {
                contentType: content.contentType,
                workTitle: content.workTitle,
                chapter: content.chapter,
                section: content.section,
                content: content.content,
                displayReference: content.displayReference,
                author: content.author,
                cursorPos: 0,
            };
        }

        // Update or create progress
        let progress = await this.progressRepository.findOne({ where: { userId: user.userId } });
        if (!progress) {
            progress = this.progressRepository.create({
                userId: user.userId,
                contentType: data.contentType,
                workTitle: data.workTitle,
                chapter: data.chapter || 1,
                section: data.section || 1,
            });
        } else {
            progress.contentType = data.contentType;
            progress.workTitle = data.workTitle;
            progress.chapter = data.chapter || 1;
            progress.section = data.section || 1;
            progress.cursorPos = 0;
        }
        await this.progressRepository.save(progress);

        return {
            contentType: content.contentType,
            workTitle: content.workTitle,
            chapter: content.chapter,
            section: content.section,
            content: content.content,
            displayReference: content.displayReference,
            author: content.author,
            cursorPos: 0,
        };
    }
}
