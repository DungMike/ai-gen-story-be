import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { AudioController } from './audio.controller';
import { AudioService } from './audio.service';
import { AudioChunkRepository } from './repositories/audio-chunk.repository';
import { AudioChunk, AudioChunkSchema } from './schemas/audio-chunk.schema';
import { AudioGateway } from './audio.gateway';
import { AudioGenerationProcessor } from './audio.processor';
import { AudioMergeProcessor } from './audio-merge.processor';
import { AudioMergerService } from '../../services/audio/audio-merger.service';
import { AiModule } from '../../services/ai/ai.module';
import { FileModule } from '../../services/file/file.module';
import { HelpersModule } from '../../helpers/helpers.module';
import { RepositoriesModule } from '../../database/repositories/repositories.module';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AudioChunk.name, schema: AudioChunkSchema },
    ]),
    BullModule.registerQueue(
      {
        name: 'audio-generation',
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
    AiModule,        // For TTSService
    FileModule,      // For FileStorageService
    HelpersModule,   // For ZipHelper
    RepositoriesModule, // For StoryRepository
    SocketModule,    // For AudioGateway
  ],
  controllers: [AudioController],
  providers: [
    AudioService,
    AudioChunkRepository,
    AudioGateway,
    AudioGenerationProcessor,
    AudioMergeProcessor,
    AudioMergerService,
  ],
  exports: [AudioService, AudioChunkRepository],
})
export class AudioModule {} 