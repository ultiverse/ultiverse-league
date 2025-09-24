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
  // Try multiple possible paths to find the web dist directory
  const possiblePaths = [
    join(__dirname, '..', '..', '..', 'apps', 'web', 'dist'),
    join(__dirname, '..', '..', 'web', 'dist'),
    join(process.cwd(), 'apps', 'web', 'dist'),
    join(process.cwd(), 'web', 'dist')
  ];

  let webDistPath: string | null = null;

  for (const path of possiblePaths) {
    try {
      const stats = statSync(path);
      if (stats.isDirectory()) {
        webDistPath = path;
        console.log(`✅ Found web dist directory at: ${webDistPath}`);
        const files = readdirSync(webDistPath);
        console.log(`📄 Files in static directory: ${files.join(', ')}`);
        break;
      }
    } catch (error) {
      console.log(`❌ Path not found: ${path}`);
    }
  }

  if (!webDistPath) {
    console.error('❌ Could not find web dist directory in any of the expected locations');
    console.log('Current working directory:', process.cwd());
    console.log('__dirname:', __dirname);
    // Fallback to prevent crash
    webDistPath = join(__dirname, '..', '..', '..', 'apps', 'web', 'dist');
  }

  app.use(express.static(webDistPath));

  // SPA fallback - serve index.html for any non-API and non-health routes
  app.use((req, res, next) => {
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
