import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content, ContentType } from './content.entity';
import { TypingProgress } from './typing-progress.entity';
import { TypingStats } from './typing-stats.entity';
import { User } from '../users/user.entity';

@Injectable()
export class TypingService {
    constructor(
        @InjectRepository(Content)
        private contentRepository: Repository<Content>,
        @InjectRepository(TypingProgress)
        private progressRepository: Repository<TypingProgress>,
        @InjectRepository(TypingStats)
        private statsRepository: Repository<TypingStats>,
    ) { }

    async getContent(user: { userId: string; email: string }, contentType?: ContentType) {
        // Get current progress or default
        let progress = await this.progressRepository.findOne({ where: { userId: user.userId } });

        if (!progress) {
            // Create default progress - start with Bible Genesis 1:1
            progress = this.progressRepository.create({
                userId: user.userId,
                contentType: contentType || ContentType.BIBLE,
                workTitle: contentType === ContentType.POEM ? '진달래꽃' :
                          contentType === ContentType.NOVEL ? '운수 좋은 날' : '창세기',
                chapter: 1,
                section: 1,
            });
            await this.progressRepository.save(progress);
        } else if (contentType && contentType !== progress.contentType) {
            // User switched content type - find first content of that type
            const firstContent = await this.contentRepository.findOne({
                where: { contentType },
                order: { workTitle: 'ASC', chapter: 'ASC', section: 'ASC' },
            });

            if (firstContent) {
                progress.contentType = contentType;
                progress.workTitle = firstContent.workTitle;
                progress.chapter = firstContent.chapter;
                progress.section = firstContent.section;
                progress.cursorPos = 0;
                await this.progressRepository.save(progress);
            }
        }

        // Fetch content
        const content = await this.contentRepository.findOne({
            where: {
                contentType: progress.contentType,
                workTitle: progress.workTitle,
                chapter: progress.chapter,
                section: progress.section,
            },
        });

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

    async getContentList(contentType: ContentType) {
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
            // Check if next section exists in same work
            const nextSection = await this.contentRepository.findOne({
                where: {
                    contentType: data.contentType,
                    workTitle: data.workTitle,
                    chapter: data.chapter,
                    section: data.section + 1
                }
            });

            if (nextSection) {
                progress.section += 1;
            } else {
                // Check next chapter
                const nextChapter = await this.contentRepository.findOne({
                    where: {
                        contentType: data.contentType,
                        workTitle: data.workTitle,
                        chapter: data.chapter + 1,
                        section: 1
                    }
                });
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

    async setContent(
        user: { userId: string; email: string },
        data: {
            contentType: ContentType;
            workTitle: string;
            chapter?: number;
            section?: number;
        }
    ) {
        // Find the content to start from
        const content = await this.contentRepository.findOne({
            where: {
                contentType: data.contentType,
                workTitle: data.workTitle,
                chapter: data.chapter || 1,
                section: data.section || 1,
            },
        });

        if (!content) {
            throw new Error('Content not found');
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
