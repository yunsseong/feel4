import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3200', 'http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3201);
}
bootstrap();
