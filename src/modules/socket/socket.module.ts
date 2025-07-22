import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StoryGateway } from './story.gateway';
import { ImageGateway } from './image.gateway';
import { AudioGateway } from './audio.gateway';
import { RepositoriesModule } from '../../database/repositories/repositories.module';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
    RepositoriesModule,
  ],
  providers: [
    SocketGateway, 
    SocketService, 
    StoryGateway, 
    ImageGateway,
    AudioGateway
  ],
  exports: [SocketService, StoryGateway, ImageGateway, AudioGateway],
})
export class SocketModule {} 