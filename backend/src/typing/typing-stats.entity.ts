import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Content } from './content.entity';

@Entity('typing_stats')
export class TypingStats {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Content)
    @JoinColumn({ name: 'content_id' })
    content: Content;

    @Column()
    cpm: number;

    @Column('decimal', { precision: 5, scale: 2 })
    accuracy: number;

    @Column({ name: 'verse_count' })
    verseCount: number;

    @CreateDateColumn({ name: 'session_date', type: 'date', default: () => 'CURRENT_DATE' })
    sessionDate: Date;
}
