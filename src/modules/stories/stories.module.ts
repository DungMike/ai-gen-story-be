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

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
    BullModule.registerQueue({
      name: 'story-generation',
    }),
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
  ],
  exports: [StoriesService],
})
export class StoriesModule {} 