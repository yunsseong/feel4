import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypingController } from './typing.controller';
import { TypingService } from './typing.service';
import { Bible } from './bible.entity';
import { Content } from './content.entity';
import { TypingProgress } from './typing-progress.entity';
import { TypingStats } from './typing-stats.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Bible, Content, TypingProgress, TypingStats])],
    controllers: [TypingController],
    providers: [TypingService],
})
export class TypingModule { }
