import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as cors from 'cors';
import * as express from 'express';
import { join } from 'path';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Get config service
  const configService = app.get(ConfigService);
  
  // Security middleware
  app.use(helmet());
  
  // CORS configuration
  app.use(cors({
    origin: configService.get('cors.origin'),
    credentials: configService.get('cors.credentials'),
  }));
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Serve static files from uploads directory
  // This allows direct access to files like: http://localhost:3001/uploads/images/...
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res, path) => {
      // Set cache headers for better performance
      res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      // Set appropriate CORS headers for images
      res.set('Access-Control-Allow-Origin', configService.get('cors.origin'));
      res.set('Access-Control-Allow-Credentials', 'true');
    },
  });

  // Global prefix
  app.setGlobalPrefix('api');
  
  // Setup Swagger
  setupSwagger(app);
  
  // Start server
  const port = configService.get('port') || 3001;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap(); 