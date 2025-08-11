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
import { AudioChunkRepository } from '@/modules/audio/repositories/audio-chunk.repository';

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
    private readonly audioChunkRepository: AudioChunkRepository,
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
    console.log("🚀 ~ AudioGateway ~ handleJoinAudioRoom ~ data:", data)
    try {
      const user = client.data.user;
      console.log("🚀 ~ AudioGateway ~ handleJoinAudioRoom ~ user:", user)
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
      console.log("🚀 ~ AudioGateway ~ handleJoinAudioRoom ~ storyId:", storyId)
      
      // Send current audio status to the client
      const statusData = await this.getAudioStatusData(storyId);
      client.emit('audio:status:update', statusData);
      
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

  @SubscribeMessage('get-audio-status')
  async handleGetAudioStatus(
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

      const statusData = await this.getAudioStatusData(storyId);
      client.emit('audio:status:update', statusData);
    } catch (error) {
      this.logger.error(`Failed to get audio status: ${error.message}`);
      client.emit('error', { message: 'Failed to get audio status' });
    }
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

  private async getAudioStatusData(storyId: string) {
    const statusCounts = await this.audioChunkRepository.getStatusCountsByStoryId(storyId);
    const progress = statusCounts.total > 0 ? 
      ((statusCounts.completed + statusCounts.failed) / statusCounts.total) * 100 : 0;

    return {
      storyId,
      ...statusCounts,
      progress: Math.round(progress),
    };
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

  // Audio generation events
  emitAudioGenerationStart(storyId: string, data: { storyId: string; totalChunks: number }): void {
    this.socketService.emitToRoom(`audio-${storyId}`, 'audio:generation:start', data);
    this.logger.log(`Audio generation started: ${storyId}`);
  }

  emitAudioGenerationProgress(storyId: string, data: { storyId: string; chunkIndex: number; status: string; progress: number, totalChunks: number }): void {
    this.socketService.emitToRoom(`audio-${storyId}`, 'audio:generation:progress', data);
    this.logger.log(`Audio generation progress: ${storyId} - chunk ${data.chunkIndex}/${data.totalChunks}`);
  }

  emitAudioGenerationComplete(storyId: string, data: { storyId: string; audioUrl: string; duration: number }): void {
    this.socketService.emitToRoom(`audio-${storyId}`, 'audio:generation:complete', data);
    this.logger.log(`Audio generation completed: ${storyId}`);
  }

  emitAudioGenerationError(storyId: string, data: { storyId: string; error: string }): void {
    this.socketService.emitToRoom(`audio-${storyId}`, 'audio:generation:error', data);
    this.logger.error(`Audio generation error: ${storyId} - ${data.error}`);
  }

  // Audio merge events
  emitAudioMergeStart(storyId: string, data: { storyId: string; message: string }): void {
    this.socketService.emitToRoom(`audio-${storyId}`, 'audio:merge:start', data);
    this.logger.log(`Audio merge started: ${storyId}`);
  }

  emitAudioMergeProgress(storyId: string, data: { storyId: string; progress: number; message: string; jobId: string }): void {
    this.socketService.emitToRoom(`audio-${storyId}`, 'audio:merge:progress', data);
    this.logger.log(`Audio merge progress: ${storyId} - ${data.progress}%`);
  }

  emitAudioMergeComplete(storyId: string, data: { storyId: string; outputPath: string; totalDuration: number; fileSize: number; chunkCount: number; jobId: string }): void {
    this.socketService.emitToRoom(`audio-${storyId}`, 'audio:merge:complete', data);
    this.logger.log(`Audio merge completed: ${storyId}`);
  }

  emitAudioMergeError(storyId: string, data: { storyId: string; error: string; jobId: string }): void {
    this.socketService.emitToRoom(`audio-${storyId}`, 'audio:merge:error', data);
    this.logger.error(`Audio merge error: ${storyId} - ${data.error}`);
  }

  // Status update events
  async notifyAudioGenerationStatus(storyId: string, totalChunks?: number): Promise<void> {
    try {
      const statusData = await this.getAudioStatusData(storyId);
      const finalStatusData = {
        ...statusData,
        totalChunks: totalChunks || statusData.total
      };
      
      this.socketService.emitToRoom(`audio-${storyId}`, 'audio:status:update', finalStatusData);
      this.logger.log(`Audio status updated for story: ${storyId}`);
    } catch (error) {
      this.logger.error(`Error notifying audio generation status for story ${storyId}:`, error);
    }
  }
} 