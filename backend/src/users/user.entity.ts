import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({ default: 'google' })
  provider: string;

  @Column({ nullable: true, name: 'avatar_url' })
  avatarUrl: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Theme settings
  @Column({ name: 'font_family', default: 'Nanum Myeongjo' })
  fontFamily: string;

  @Column({ name: 'font_size', default: 36 })
  fontSize: number;

  @Column({ name: 'font_color', default: '#374151' })
  fontColor: string;

  @Column({ name: 'background_color', default: '#FFFFFF' })
  backgroundColor: string;
}
