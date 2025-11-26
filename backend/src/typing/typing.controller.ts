import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TypingService } from './typing.service';
import { ContentType } from './content.entity';

@Controller('typing')
export class TypingController {
    constructor(private readonly typingService: TypingService) { }

    @Get('content')
    async getContent(@Req() req, @Query('type') contentType?: ContentType) {
        // 비로그인 사용자는 기본 콘텐츠 제공
        return this.typingService.getContent(req.user || null, contentType);
    }

    @Get('content/list')
    async getContentList(@Query('type') contentType: ContentType) {
        return this.typingService.getContentList(contentType);
    }

    @Post('content/set')
    async setContent(
        @Req() req,
        @Body() body: {
            contentType: ContentType;
            workTitle: string;
            chapter?: number;
            section?: number;
        }
    ) {
        // 비로그인 사용자도 작품 선택 가능
        return this.typingService.setContent(req.user || null, body);
    }

    @Post('content/next')
    async getNextContent(
        @Req() req,
        @Body() body: {
            contentType: ContentType;
            workTitle: string;
            chapter: number;
            section: number;
        }
    ) {
        // 현재 위치 기반으로 다음 콘텐츠 가져오기
        return this.typingService.getNextContent(req.user || null, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('submit')
    async submit(
        @Req() req,
        @Body() body: {
            contentType: ContentType;
            workTitle: string;
            chapter: number;
            section: number;
            cpm: number;
            accuracy: number;
        }
    ) {
        return this.typingService.submit(req.user, body);
    }
}
