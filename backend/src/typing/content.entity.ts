import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn } from 'typeorm';

export enum ContentType {
    BIBLE = 'bible',
    NOVEL = 'novel',
    POEM = 'poem',
    ESSAY = 'essay',
}

@Entity('content')
@Index(['contentType', 'workTitle', 'chapter', 'section'], { unique: true })
export class Content {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: ContentType, name: 'content_type' })
    contentType: ContentType;

    @Column({ name: 'work_title' })
    workTitle: string; // 성경: '창세기', 소설: '무정', 시: '진달래꽃'

    @Column({ nullable: true })
    author: string; // 성경: null, 소설: '이광수', 시: '김소월'

    @Column({ default: 1 })
    chapter: number; // 성경: 장, 소설: 챕터, 시: 1

    @Column({ default: 1 })
    section: number; // 성경: 절, 소설: 문단, 시: 연

    @Column('text')
    content: string;

    @Column({ name: 'display_reference', nullable: true })
    displayReference: string; // '창세기 1:1', '무정 1장 1문단', '진달래꽃 1연'

    @Column({ name: 'publication_year', nullable: true })
    publicationYear: number;

    @Column({ name: 'is_public_domain', default: true })
    isPublicDomain: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
