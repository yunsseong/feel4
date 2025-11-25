import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { TypingModule } from './typing/typing.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/user.entity';
import { TypingProgress } from './typing/typing-progress.entity';
import { TypingStats } from './typing/typing-stats.entity';
import { Bible } from './typing/bible.entity';
import { Content } from './typing/content.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'feel4',
      entities: [User, TypingProgress, TypingStats, Bible, Content],
      synchronize: true, // Set to false in production
    }),
    UsersModule,
    TypingModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
