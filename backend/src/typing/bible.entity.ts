import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('bible')
@Index(['book', 'chapter', 'verse'], { unique: true })
export class Bible {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    book: string;

    @Column()
    chapter: number;

    @Column()
    verse: number;

    @Column('text')
    content: string;
}
