import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TypingService } from './typing.service';
import { ContentType } from './content.entity';

@Controller('typing')
@UseGuards(AuthGuard('jwt'))
export class TypingController {
    constructor(private readonly typingService: TypingService) { }

    @Get('content')
    async getContent(@Req() req, @Query('type') contentType?: ContentType) {
        return this.typingService.getContent(req.user, contentType);
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
        return this.typingService.setContent(req.user, body);
    }

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
