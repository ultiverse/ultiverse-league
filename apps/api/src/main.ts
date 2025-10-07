import 'reflect-metadata';
import { randomUUID } from 'crypto';

// Polyfill for Node.js < 19
if (!globalThis.crypto) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  globalThis.crypto = { randomUUID } as any;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add global API prefix for versioning, excluding health checks
  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  // Serve static files from web app build
  const webDistPath = join(__dirname, '..', '..', '..', 'apps', 'web', 'dist');
  console.log(`🌐 Serving static files from: ${webDistPath}`);

  app.use(express.static(webDistPath));

  // SPA fallback - serve index.html for any non-API and non-health routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/') || req.path === '/health') {
      return next();
    }
    res.sendFile(join(webDistPath, 'index.html'));
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
