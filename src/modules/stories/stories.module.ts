import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';
import { FileUploadController } from './file-upload.controller';
import { UsersModule } from '../users/users.module';
import { RepositoriesModule } from '../../database/repositories/repositories.module';
import { AiModule } from '../../services/ai/ai.module';
import { FileModule } from '../../services/file/file.module';
import { BullModule } from '@nestjs/bull';
import { StoryGenerationProcessor } from './stories.processor';
import { SocketModule } from '../socket/socket.module';
import { BatchStoriesProcessor } from './batch-stories.processor';
import { AutoModeProcessor } from './auto-mode.processor';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
    BullModule.registerQueue(
      {
        name: 'story-generation',
      },
      {
        name: 'batch-stories',
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      },
      {
        name: 'auto-mode',
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      },
      {
        name: 'image-generation',
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      },
      {
        name: 'audio-generation',
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      },
      {
        name: 'audio-merge',
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      }
    ),
    UsersModule,
    RepositoriesModule,
    AiModule,
    FileModule,
    SocketModule,
  ],
  controllers: [StoriesController, FileUploadController],
  providers: [
    StoriesService,
    StoryGenerationProcessor,
    BatchStoriesProcessor,
    AutoModeProcessor,
  ],
  exports: [StoriesService],
})
export class StoriesModule {} 