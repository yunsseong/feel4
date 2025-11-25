import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bible } from './bible.entity';
import { TypingProgress } from './typing-progress.entity';
import { TypingStats } from './typing-stats.entity';
import { User } from '../users/user.entity';

@Injectable()
export class TypingService {
    constructor(
        @InjectRepository(Bible)
        private bibleRepository: Repository<Bible>,
        @InjectRepository(TypingProgress)
        private progressRepository: Repository<TypingProgress>,
        @InjectRepository(TypingStats)
        private statsRepository: Repository<TypingStats>,
    ) { }

    async getContent(user: { userId: string; email: string }) {
        // Get current progress or default to Genesis 1:1
        let progress = await this.progressRepository.findOne({ where: { userId: user.userId } });
        if (!progress) {
            // Create default progress if not exists
            // We need to ensure the user entity exists or just use userId
            // Since TypingProgress.userId is PK and FK, we can just save it.
            progress = this.progressRepository.create({
                userId: user.userId,
                bibleBook: '창세기',
                chapter: 1,
                verse: 1,
            });
            await this.progressRepository.save(progress);
        }

        // Fetch verse content
        const verse = await this.bibleRepository.findOne({
            where: {
                book: progress.bibleBook,
                chapter: progress.chapter,
                verse: progress.verse,
            },
        });

        if (!verse) {
            // Handle end of book or missing data
            // For MVP, if no verse found, return a placeholder or error
            return {
                book: progress.bibleBook,
                chapter: progress.chapter,
                verse: progress.verse,
                content: '태초에 하나님이 천지를 창조하시니라', // Fallback for MVP testing
                cursorPos: progress.cursorPos
            };
        }

        return {
            book: verse.book,
            chapter: verse.chapter,
            verse: verse.verse,
            content: verse.content,
            cursorPos: progress.cursorPos,
        };
    }

    async submit(user: { userId: string; email: string }, data: { book: string; chapter: number; verse: number; cpm: number; accuracy: number }) {
        // Update stats
        // We need a real User entity for relation, or just ID if we change relation to ID
        // TypingStats has ManyToOne User. We can pass { id: userId } as User partial.
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
            // Check if next verse exists
            const nextVerse = await this.bibleRepository.findOne({
                where: { book: data.book, chapter: data.chapter, verse: data.verse + 1 }
            });

            if (nextVerse) {
                progress.verse += 1;
            } else {
                // Check next chapter
                const nextChapter = await this.bibleRepository.findOne({
                    where: { book: data.book, chapter: data.chapter + 1, verse: 1 }
                });
                if (nextChapter) {
                    progress.chapter += 1;
                    progress.verse = 1;
                }
                // Else end of book (stay on last verse or mark finished)
            }
            progress.cursorPos = 0;
            await this.progressRepository.save(progress);
        }

        return { success: true };
    }
}
