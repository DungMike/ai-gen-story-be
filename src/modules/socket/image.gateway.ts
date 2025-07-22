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
export class ImageGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ImageGateway.name);

  constructor(
    private readonly socketService: SocketService,
    private readonly storyRepository: StoryRepository,
  ) {}

  afterInit(server: Server) {
    // Don't set server here - it should be set by SocketGateway
    this.logger.log('ImageGateway initialized');
  }

  @SubscribeMessage('join-image-room')
  async handleJoinImageRoom(
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

      // Join the image room
      await this.socketService.joinRoom(client.id, `image-${storyId}`);
      this.logger.log(`User ${user.sub} joined image room: ${storyId}`);
      
      client.emit('joined-image-room', { storyId });
    } catch (error) {
      this.logger.error(`Failed to join image room: ${error.message}`);
      client.emit('error', { message: 'Failed to join image room' });
    }
  }

  @SubscribeMessage('leave-image-room')
  async handleLeaveImageRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { storyId: string }
  ) {
    const { storyId } = data;
    await this.socketService.leaveRoom(client.id, `image-${storyId}`);
    this.logger.log(`User ${client.data.user.sub} left image room: ${storyId}`);
    client.emit('left-image-room', { storyId });
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

  // Image processing events
  emitImageProcessingStart(storyId: string, data: { storyId: string; message: string }): void {
    this.socketService.emitToRoom(`image-${storyId}`, 'image:processing:start', data);
    this.logger.log(`Image processing started: ${storyId}`);
  }

  emitImageProcessingProgress(storyId: string, data: { storyId: string; progress: number; chunk: number; totalChunks: number }): void {
    this.socketService.emitToRoom(`image-${storyId}`, 'image:processing:progress', data);
    this.logger.log(`Image processing progress: ${storyId} - ${data.progress}%`);
  }

  emitImageProcessingComplete(storyId: string, data: { storyId: string; imageUrl: string; description: string }): void {
    this.socketService.emitToRoom(`image-${storyId}`, 'image:processing:complete', data);
    this.logger.log(`Image processing completed: ${storyId}`);
  }

  emitImageProcessingError(storyId: string, data: { storyId: string; error: string }): void {
    this.socketService.emitToRoom(`image-${storyId}`, 'image:processing:error', data);
    this.logger.error(`Image processing error: ${storyId} - ${data.error}`);
  }
} 