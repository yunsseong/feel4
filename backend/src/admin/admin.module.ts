import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminContentController } from './admin-content.controller';
import { AdminUserController } from './admin-user.controller';
import { AdminStatsController } from './admin-stats.controller';
import { AdminSystemController } from './admin-system.controller';
import { Content } from '../typing/content.entity';
import { User } from '../users/user.entity';
import { TypingStats } from '../typing/typing-stats.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Content, User, TypingStats]),
  ],
  controllers: [
    AdminContentController,
    AdminUserController,
    AdminStatsController,
    AdminSystemController,
  ],
})
export class AdminModule {}
