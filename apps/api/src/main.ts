import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import { statSync, readdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add global API prefix for versioning, excluding health checks
  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  // Serve static files from web app build (at the root)
  const webDistPath = join(__dirname, '..', '..', 'web', 'dist');
  console.log(`🌐 Serving static files from: ${webDistPath}`);

  // Check if the directory exists
  try {
    const stats = statSync(webDistPath);
    console.log(`📁 Static directory exists: ${stats.isDirectory()}`);
    const files = readdirSync(webDistPath);
    console.log(`📄 Files in static directory: ${files.join(', ')}`);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Error accessing static directory: ${errorMessage}`);
  }

  app.use(express.static(webDistPath));

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
      'https://ultiverse-league.onrender.com',
      'https://ultiverse-api.onrender.com',
      'https://ultiverse.ca',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false, // set true only if you send cookies/Authorization with credentials
    maxAge: 600, // cache preflight for 10 minutes
  });

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
void bootstrap();
