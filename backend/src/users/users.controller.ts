import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from './user.entity';

interface UpdateThemeDto {
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
}

interface ThemeSettings {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
}

@Controller('users')
export class UsersController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req): Promise<Partial<User>> {
    const user = req.user as User;
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };
  }

  @Get('settings/theme')
  @UseGuards(JwtAuthGuard)
  async getThemeSettings(@Request() req): Promise<ThemeSettings> {
    const user = req.user as User;
    return {
      fontFamily: user.fontFamily,
      fontSize: user.fontSize,
      fontColor: user.fontColor,
      backgroundColor: user.backgroundColor,
    };
  }

  @Patch('settings/theme')
  @UseGuards(JwtAuthGuard)
  async updateThemeSettings(
    @Request() req,
    @Body() updateThemeDto: UpdateThemeDto,
  ): Promise<ThemeSettings> {
    const user = req.user as User;

    if (updateThemeDto.fontFamily !== undefined) {
      user.fontFamily = updateThemeDto.fontFamily;
    }
    if (updateThemeDto.fontSize !== undefined) {
      user.fontSize = updateThemeDto.fontSize;
    }
    if (updateThemeDto.fontColor !== undefined) {
      user.fontColor = updateThemeDto.fontColor;
    }
    if (updateThemeDto.backgroundColor !== undefined) {
      user.backgroundColor = updateThemeDto.backgroundColor;
    }

    await this.userRepository.save(user);

    return {
      fontFamily: user.fontFamily,
      fontSize: user.fontSize,
      fontColor: user.fontColor,
      backgroundColor: user.backgroundColor,
    };
  }
}
