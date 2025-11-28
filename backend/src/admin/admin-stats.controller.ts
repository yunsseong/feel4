import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../common/guards/admin.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Content, ContentType } from '../typing/content.entity';
import { TypingStats } from '../typing/typing-stats.entity';

@Controller('admin/stats')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminStatsController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(TypingStats)
    private statsRepository: Repository<TypingStats>,
  ) {}

  @Get('overview')
  async getOverview() {
    const totalUsers = await this.userRepository.count();
    const totalContent = await this.contentRepository.count();

    const contentByType = await this.contentRepository
      .createQueryBuilder('content')
      .select('content.content_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('content.content_type')
      .getRawMany();

    const workCount = await this.contentRepository
      .createQueryBuilder('content')
      .select('COUNT(DISTINCT content.work_title)', 'count')
      .getRawOne();

    const totalTypingSessions = await this.statsRepository.count();

    return {
      users: totalUsers,
      content: totalContent,
      works: parseInt(workCount.count),
      typingSessions: totalTypingSessions,
      contentByType,
    };
  }

  @Get('typing')
  async getTypingStats(
    @Query('days') days: number = 7,
  ) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const stats = await this.statsRepository
      .createQueryBuilder('stats')
      .select('stats.session_date', 'date')
      .addSelect('COUNT(*)', 'sessions')
      .addSelect('AVG(stats.cpm)', 'avgCpm')
      .addSelect('AVG(stats.accuracy)', 'avgAccuracy')
      .where('stats.session_date >= :since', { since })
      .groupBy('stats.session_date')
      .orderBy('stats.session_date', 'ASC')
      .getRawMany();

    return stats;
  }

  @Get('content/popular')
  async getPopularContent(@Query('limit') limit: number = 10) {
    const popular = await this.statsRepository
      .createQueryBuilder('stats')
      .leftJoinAndSelect('stats.content', 'content')
      .select('content.work_title', 'workTitle')
      .addSelect('content.content_type', 'contentType')
      .addSelect('COUNT(*)', 'sessionCount')
      .addSelect('AVG(stats.cpm)', 'avgCpm')
      .addSelect('AVG(stats.accuracy)', 'avgAccuracy')
      .groupBy('content.work_title, content.content_type')
      .orderBy('COUNT(*)', 'DESC')
      .limit(limit)
      .getRawMany();

    return popular;
  }

  @Get('users/active')
  async getActiveUsers(@Query('limit') limit: number = 10) {
    const activeUsers = await this.statsRepository
      .createQueryBuilder('stats')
      .leftJoinAndSelect('stats.user', 'user')
      .select('user.id', 'userId')
      .addSelect('user.email', 'email')
      .addSelect('user.nickname', 'nickname')
      .addSelect('COUNT(*)', 'sessionCount')
      .addSelect('AVG(stats.cpm)', 'avgCpm')
      .addSelect('MAX(stats.session_date)', 'lastActivity')
      .groupBy('user.id, user.email, user.nickname')
      .orderBy('COUNT(*)', 'DESC')
      .limit(limit)
      .getRawMany();

    return activeUsers;
  }
}
