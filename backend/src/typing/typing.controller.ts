import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TypingService } from './typing.service';

@Controller('typing')
@UseGuards(AuthGuard('jwt'))
export class TypingController {
    constructor(private readonly typingService: TypingService) { }

    @Get('content')
    async getContent(@Req() req) {
        return this.typingService.getContent(req.user);
    }

    @Post('submit')
    async submit(@Req() req, @Body() body: { book: string; chapter: number; verse: number; cpm: number; accuracy: number }) {
        return this.typingService.submit(req.user, body);
    }
}
