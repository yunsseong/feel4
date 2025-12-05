import { Controller, Get, Post, UseGuards, Req, Res, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() req) { }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req, @Res() res: Response) {
        const { access_token } = await this.authService.login(req.user);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3200';
        const isProduction = process.env.NODE_ENV === 'production';

        // HttpOnly 쿠키로 토큰 설정 (웹용)
        res.cookie('accessToken', access_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax', // lax면 충분 (같은 메인 도메인)
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
            path: '/',
            domain: isProduction ? '.stellax.cc' : undefined, // 서브도메인 간 쿠키 공유
        });

        // 모바일 앱용: URL에 토큰 포함 (앱에서 저장 후 제거)
        res.redirect(`${frontendUrl}/login?success=true&token=${access_token}`);
    }

    @Post('logout')
    @HttpCode(200)
    async logout(@Res() res: Response) {
        const isProduction = process.env.NODE_ENV === 'production';
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            domain: isProduction ? '.stellax.cc' : undefined,
        });
        res.json({ message: 'Logged out successfully' });
    }
}
