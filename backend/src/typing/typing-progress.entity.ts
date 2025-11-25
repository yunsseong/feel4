import { Entity, Column, PrimaryColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { ContentType } from './content.entity';

@Entity('typing_progress')
export class TypingProgress {
    @PrimaryColumn('uuid')
    userId: string;

    @OneToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'enum', enum: ContentType, name: 'content_type', default: ContentType.BIBLE })
    contentType: ContentType;

    @Column({ name: 'work_title' })
    workTitle: string; // 성경: '창세기', 소설: '무정'

    @Column()
    chapter: number;

    @Column({ default: 1 })
    section: number; // 성경: verse, 소설: paragraph

    @Column({ name: 'cursor_pos', default: 0 })
    cursorPos: number;

    @UpdateDateColumn({ name: 'last_updated' })
    lastUpdated: Date;
}
