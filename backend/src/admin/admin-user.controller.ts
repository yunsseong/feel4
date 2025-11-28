import { Controller, Get, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../common/guards/admin.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';

@Controller('admin/users')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminUserController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Get('list')
  async listUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('role') role?: UserRole,
  ) {
    const skip = (page - 1) * limit;
    const where = role ? { role } : {};

    const [items, total] = await this.userRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('stats')
  async getUserStats() {
    const total = await this.userRepository.count();
    const admins = await this.userRepository.count({ where: { role: UserRole.ADMIN } });
    const users = await this.userRepository.count({ where: { role: UserRole.USER } });

    const recentUsers = await this.userRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      total,
      admins,
      users,
      recentUsers,
    };
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userRepository.findOne({ where: { id } });
  }

  @Put(':id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ) {
    await this.userRepository.update(id, { role });
    return this.userRepository.findOne({ where: { id } });
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    const result = await this.userRepository.delete(id);
    return { success: (result.affected || 0) > 0 };
  }
}
