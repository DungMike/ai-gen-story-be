import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { SocketService } from './socket.service';
import { StoryRepository } from '@/database/repositories/story.repository';
import { WsAuthGuard } from '@/common/guards/ws-auth.guard';

interface AuthenticatedSocket extends Socket {
  data: {
    user: any;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
})
@UseGuards(WsAuthGuard)
export class AudioGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AudioGateway.name);

  constructor(
    private readonly socketService: SocketService,
    private readonly storyRepository: StoryRepository,
  ) {}

  afterInit(server: Server) {
    // Don't set server here - it should be set by SocketGateway
    this.logger.log('AudioGateway initialized');
  }

  @SubscribeMessage('join-audio-room')
  async handleJoinAudioRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { storyId: string }
  ) {
    try {
      const user = client.data.user;
      const { storyId } = data;

      // Check if user has permission to view this story
      const hasPermission = await this.checkStoryPermission(user, storyId);
      
      if (!hasPermission) {
        client.emit('error', { message: 'You do not have permission to view this story' });
        return;
      }

      // Join the audio room
      await this.socketService.joinRoom(client.id, `audio-${storyId}`);
      this.logger.log(`User ${user.sub} joined audio room: ${storyId}`);
      
      client.emit('joined-audio-room', { storyId });
    } catch (error) {
      this.logger.error(`Failed to join audio room: ${error.message}`);
      client.emit('error', { message: 'Failed to join audio room' });
    }
  }

  @SubscribeMessage('leave-audio-room')
  async handleLeaveAudioRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { storyId: string }
  ) {
    const { storyId } = data;
    await this.socketService.leaveRoom(client.id, `audio-${storyId}`);
    this.logger.log(`User ${client.data.user.sub} left audio room: ${storyId}`);
    client.emit('left-audio-room', { storyId });
  }

  private async checkStoryPermission(user: any, storyId: string): Promise<boolean> {
    try {
      const story = await this.storyRepository.findById(storyId);
      if (!story) {
        return false;
      }
      
      // Check if user owns the story
      return story.userId.toString() === user.sub;
    } catch (error) {
      this.logger.error(`Permission check failed: ${error.message}`);
      return false;
    }
  }

  // Audio processing events
  emitAudioProcessingStart(storyId: string, data: { storyId: string; message: string }): void {
    this.socketService.emitToRoom(`audio-${storyId}`, 'audio:processing:start', data);
    this.logger.log(`Audio processing started: ${storyId}`);
  }

  emitAudioProcessingProgress(storyId: string, data: { storyId: string; progress: number; chunk: number; totalChunks: number }): void {
    this.socketService.emitToRoom(`audio-${storyId}`, 'audio:processing:progress', data);
    this.logger.log(`Audio processing progress: ${storyId} - ${data.progress}%`);
  }

  emitAudioProcessingComplete(storyId: string, data: { storyId: string; audioUrl: string; duration: number }): void {
    this.socketService.emitToRoom(`audio-${storyId}`, 'audio:processing:complete', data);
    this.logger.log(`Audio processing completed: ${storyId}`);
  }

  emitAudioProcessingError(storyId: string, data: { storyId: string; error: string }): void {
    this.socketService.emitToRoom(`audio-${storyId}`, 'audio:processing:error', data);
    this.logger.error(`Audio processing error: ${storyId} - ${data.error}`);
  }
} 