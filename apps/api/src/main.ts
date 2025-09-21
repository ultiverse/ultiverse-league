import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, RequestMethod } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add global API prefix for versioning, excluding health checks
  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown props
      forbidNonWhitelisted: false,
      transform: true, // converts primitives (e.g., strings to numbers)
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:5173', // Local development
      'https://ultiverse-web.onrender.com', // Production web app
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false, // set true only if you send cookies/Authorization with credentials
    maxAge: 600, // cache preflight for 10 minutes
  });

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
void bootstrap();
