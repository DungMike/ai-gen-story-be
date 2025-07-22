import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { AudioController } from './audio.controller';
import { AudioService } from './audio.service';
import { AudioGenerationProcessor } from './audio.processor';
import { AudioChunk, AudioChunkSchema } from './schemas/audio-chunk.schema';
import { AudioChunkRepository } from './repositories/audio-chunk.repository';
import { UsersModule } from '../users/users.module';
import { RepositoriesModule } from '../../database/repositories/repositories.module';
import { AiModule } from '../../services/ai/ai.module';
import { FileModule } from '../../services/file/file.module';
import { SocketModule } from '../socket/socket.module';
import { HelpersModule } from '../../helpers/helpers.module';
import { AudioGateway } from './audio.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AudioChunk.name, schema: AudioChunkSchema }
    ]),
    BullModule.registerQueue({
      name: 'audio-generation',
    }),
    UsersModule,
    RepositoriesModule,
    AiModule,
    FileModule,
    SocketModule,
    HelpersModule,
  ],
  controllers: [AudioController],
  providers: [
    AudioService,
    AudioGenerationProcessor,
    AudioChunkRepository,
    AudioGateway,
  ],
  exports: [AudioService]
})
export class AudioModule {} 