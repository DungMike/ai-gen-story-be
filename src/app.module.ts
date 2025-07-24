import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from './database/database.module';
import { RepositoriesModule } from './database/repositories/repositories.module';
import { StoriesModule } from './modules/stories/stories.module';
import { UsersModule } from './modules/users/users.module';
import { ImagesModule } from './modules/images/images.module';
import { AudioModule } from './modules/audio/audio.module';
import { SocketModule } from './modules/socket/socket.module';
import { AiModule } from './services/ai/ai.module';

import { AuthGuard } from './common/guards/auth.guard';
import { ApiKeyStatsController } from './controllers/api-key-stats.controller';
import configuration from './config/configuration';
import { BullModule } from '@nestjs/bullmq';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    DatabaseModule,
    RepositoriesModule,
    StoriesModule,
    UsersModule,
    ImagesModule,
    AudioModule,
    SocketModule,
    AiModule,
  ],
  controllers: [ApiKeyStatsController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {} 