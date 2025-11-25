import { Entity, Column, PrimaryColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('typing_progress')
export class TypingProgress {
    @PrimaryColumn('uuid')
    userId: string;

    @OneToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'bible_book' })
    bibleBook: string;

    @Column()
    chapter: number;

    @Column()
    verse: number;

    @Column({ name: 'cursor_pos', default: 0 })
    cursorPos: number;

    @UpdateDateColumn({ name: 'last_updated' })
    lastUpdated: Date;
}
