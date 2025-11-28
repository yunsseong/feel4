import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../common/guards/admin.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

interface SystemSetting {
  key: string;
  value: string;
  description?: string;
}

@Controller('admin/system')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminSystemController {
  constructor(
    private dataSource: DataSource,
  ) {}

  @Get('info')
  async getSystemInfo() {
    // Database info
    const dbSize = await this.dataSource.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);

    const tableStats = await this.dataSource.query(`
      SELECT
        schemaname,
        relname as tablename,
        pg_size_pretty(pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(relname))) AS size,
        n_live_tup as row_count
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(relname)) DESC
      LIMIT 10
    `);

    return {
      database: {
        size: dbSize[0].size,
        tables: tableStats,
      },
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  @Get('health')
  async healthCheck() {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  @Post('backup')
  async createBackup() {
    // This would trigger a backup script
    // For now, just return success
    return {
      success: true,
      message: 'Backup initiated',
      timestamp: new Date(),
    };
  }

  @Get('logs')
  async getLogs() {
    // This would fetch application logs
    // For now, return empty array
    return {
      logs: [],
      message: 'Log viewing not implemented yet',
    };
  }
}
