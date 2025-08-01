import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { StoryGateway } from './story.gateway';
import { ImageGateway } from './image.gateway';
import { AudioGateway } from './audio.gateway';
import { RepositoriesModule } from '../../database/repositories/repositories.module';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { AudioChunk, AudioChunkSchema } from '../audio/schemas/audio-chunk.schema';
import { AudioChunkRepository } from '../audio/repositories/audio-chunk.repository';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
    MongooseModule.forFeature([
      { name: AudioChunk.name, schema: AudioChunkSchema },
    ]),
    RepositoriesModule,
  ],
  providers: [
    SocketGateway, 
    SocketService, 
    StoryGateway, 
    ImageGateway,
    AudioGateway,
    AudioChunkRepository
  ],
  exports: [SocketService, StoryGateway, ImageGateway, AudioGateway],
})
export class SocketModule {} 