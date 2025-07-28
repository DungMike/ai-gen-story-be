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
import { BatchJobRepository } from '@/database/repositories/batch-job.repository';
import { StoryProcessingData, StoryProgressData, StoryCompleteData, StoryErrorData } from '@/types/socket.types';
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
export class StoryGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(StoryGateway.name);

  constructor(
    private readonly socketService: SocketService,
    private readonly storyRepository: StoryRepository,
    private readonly batchJobRepository: BatchJobRepository,
  ) {}

  afterInit(server: Server) {
    // Don't set server here - it should be set by SocketGateway
    this.logger.log('StoryGateway initialized');
  }

  @SubscribeMessage('join-story-room')
  async handleJoinStoryRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { storyId: string }
  ) {
    try {

      const user = client.data.user;
      const { storyId } = data;

      if (!storyId) {
        client.emit('error', { 
          code: 'INVALID_STORY_ID',
          message: 'Story ID is required' 
        });
        return;
      }
      const story = await this.storyRepository.findById(storyId);
      if (!story) {
        client.emit('error', { 
          code: 'STORY_NOT_FOUND',
          message: 'Story not found' 
        });
        return;
      }
      
      // Check if user has permission to view this story
      const hasPermission = await this.checkStoryPermission(user, story.userId);
      
      if (!hasPermission) {
        client.emit('error', { 
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to view this story' 
        });
        return;
      }
      
      // Debug server status before joining
      this.debugServerStatus();
      
      // Try to join room with retry
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await this.socketService.joinRoom(client.id, `story-${storyId}`);
          this.logger.log(`User ${user.sub} joined story room: ${storyId}`);
          break;
        } catch (error) {
          retryCount++;
          this.logger.warn(`Join room attempt ${retryCount} failed: ${error.message}`);
          
          if (retryCount >= maxRetries) {
            throw error;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      client.emit('joined-story-room', { 
        storyId,
        story: {
          id: story._id,
          title: story.title,
          status: story.status,
          createdAt: story.createdAt,
          updatedAt: story.updatedAt
        },
        timestamp: new Date()
      });
      return;
    } catch (error) {
      this.logger.error(`Failed to join story room: ${error.message}`);
      client.emit('error', { 
        code: 'JOIN_FAILED',
        message: 'Failed to join story room',
        details: error.message
      });
    }
  }

  @SubscribeMessage('leave-story-room')
  async handleLeaveStoryRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { storyId: string }
  ) {
    try {
      const { storyId } = data;
      
      if (!storyId) {
        client.emit('error', { 
          code: 'INVALID_STORY_ID',
          message: 'Story ID is required' 
        });
        return;
      }

      await this.socketService.leaveRoom(client.id, `story-${storyId}`);
      this.logger.log(`User ${client.data.user.sub} left story room: ${storyId}`);
      
      client.emit('left-story-room', { 
        storyId,
        timestamp: new Date()
      });
    } catch (error) {
      this.logger.error(`Failed to leave story room: ${error.message}`);
      client.emit('error', { 
        code: 'LEAVE_FAILED',
        message: 'Failed to leave story room',
        details: error.message
      });
    }
  }

  @SubscribeMessage('get-story-status')
  async handleGetStoryStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { storyId: string }
  ) {
    try {
      const user = client.data.user;
      const { storyId } = data;

      if (!storyId) {
        client.emit('error', { 
          code: 'INVALID_STORY_ID',
          message: 'Story ID is required' 
        });
        return;
      }

      // Check if user has permission to view this story
      const hasPermission = await this.checkStoryPermission(user, storyId);
      
      if (!hasPermission) {
        client.emit('error', { 
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to view this story' 
        });
        return;
      }

      const story = await this.storyRepository.findById(storyId);
      
      client.emit('story-status', {
        storyId,
        status: story.status,
        progress: story.status?.storyGenerated ? 100 : 0,
        lastUpdated: story.updatedAt,
        timestamp: new Date()
      });
    } catch (error) {
      this.logger.error(`Failed to get story status: ${error.message}`);
      client.emit('error', { 
        code: 'STATUS_FAILED',
        message: 'Failed to get story status',
        details: error.message
      });
    }
  }

  @SubscribeMessage('get-rooms-info')
  async handleGetRoomsInfo(
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    try {
      const user = client.data.user;
      
      // Only allow admin users to get room info
      if (user.role !== 'admin') {
        client.emit('error', { 
          code: 'PERMISSION_DENIED',
          message: 'Only admin users can get room information' 
        });
        return;
      }

      const allRooms = this.getAllRooms();
      const storyRooms = this.getStoryRooms();
      
      client.emit('rooms-info', {
        allRooms,
        storyRooms,
        totalRooms: allRooms.length,
        totalStoryRooms: storyRooms.length,
        timestamp: new Date()
      });
    } catch (error) {
      this.logger.error(`Failed to get rooms info: ${error.message}`);
      client.emit('error', { 
        code: 'ROOMS_INFO_FAILED',
        message: 'Failed to get rooms information',
        details: error.message
      });
    }
  }

  // batch stories events
  @SubscribeMessage('batch-stories-status')
  async handleGetBatchStoriesStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { batchId: string }
  ) {
    const { batchId } = data;
    const batchJob = await this.batchJobRepository.findById(batchId);
    console.log("🚀 ~ StoryGateway ~ handleGetBatchStoriesStatus ~ batchJob:", batchJob)
    if (!batchJob) {
      client.emit('error', { 
        code: 'BATCH_JOB_NOT_FOUND',
        message: 'Batch job not found' 
      });
      return;
    }
    client.emit('batch-stories-status', batchJob);
    return;
  }

  private async checkStoryPermission(user: any, userId: string): Promise<boolean> {
    try {
      if (!user) {
        return false;
      }
      
      if (!user.sub) {
        return false;
      }
      // Check if user owns the story
      return userId.toString() === user.sub;
    } catch (error) {
      this.logger.error(`Permission check failed: ${error.message}`);
      return false;
    }
  }

  // Story processing events with enhanced data
  emitStoryProcessingStart(storyId: string, data: StoryProcessingData): void {
    const enhancedData = {
      ...data,
      timestamp: new Date(),
      estimatedTime: 30000, // 30 seconds estimate
      step: 'story_generation' as const
    };
    
    // Get room info using SocketService
    const roomName = `story-${storyId}`;
    const roomInfo = this.socketService.getRoomInfo(roomName);
    
    if (roomInfo) {
      this.logger.log(`Story processing started: ${storyId}, Room: ${roomName}, Clients: ${roomInfo.clientCount}`);
    } else {
      this.logger.log(`Story processing started: ${storyId}, Room: ${roomName} (no clients connected)`);
    }
    
    this.socketService.emitToRoom(roomName, 'story:processing:start', enhancedData);
    this.logger.log(`Story processing started: ${storyId}`);
  }

  // Get all rooms (for debugging/admin purposes)
  getAllRooms(): { roomName: string; clientCount: number }[] {
    return this.socketService.getRoomsWithClientCount();
  }

  // Get specific room info
  getRoomInfo(roomName: string): { roomName: string; clientCount: number; clients: string[] } | null {
    return this.socketService.getRoomInfo(roomName);
  }

  // Get all story rooms
  getStoryRooms(): { roomName: string; clientCount: number; storyId: string }[] {
    const allRooms = this.socketService.getRoomsWithClientCount();
    return allRooms
      .filter(room => room.roomName.startsWith('story-'))
      .map(room => ({
        ...room,
        storyId: room.roomName.replace('story-', '')
      }));
  }

  // Log room information for debugging
  logRoomInfo(): void {
    const allRooms = this.getAllRooms();
    const storyRooms = this.getStoryRooms();
    
    this.logger.log('=== ROOM INFORMATION ===');
    this.logger.log(`Total Rooms: ${allRooms.length}`);
    this.logger.log(`Story Rooms: ${storyRooms.length}`);
    
    if (allRooms.length > 0) {
      this.logger.log('All Rooms:');
      allRooms.forEach(room => {
        this.logger.log(`  - ${room.roomName}: ${room.clientCount} clients`);
      });
    }
    
    if (storyRooms.length > 0) {
      this.logger.log('Story Rooms:');
      storyRooms.forEach(room => {
        this.logger.log(`  - ${room.roomName} (Story ID: ${room.storyId}): ${room.clientCount} clients`);
      });
    }
    this.logger.log('========================');
  }

  // Debug server status
  debugServerStatus(): void {
    this.logger.log('=== SERVER STATUS ===');
    this.logger.log(`Server ready: ${this.socketService.isServerReady()}`);
    this.socketService.logServerStatus();
    this.logger.log('=====================');
  }

  emitStoryProcessingProgress(storyId: string, data: StoryProgressData): void {
    const enhancedData = {
      ...data,
      timestamp: new Date(),
      estimatedTimeRemaining: this.calculateEstimatedTimeRemaining(data.progress)
    };
    this.socketService.emitToRoom(`story-${storyId}`, 'story:processing:progress', enhancedData);
    this.logger.log(`Story processing progress: ${storyId} - ${data.progress}% - ${data.step}`);
  }

  emitStoryProcessingComplete(storyId: string, data: StoryCompleteData): void {
    const enhancedData = {
      ...data,
      timestamp: new Date(),
      success: true,
      wordCount: data.generatedWordCount,
      processingTimeMs: data.processingTime
    };
    this.socketService.emitToRoom(`story-${storyId}`, 'story:processing:complete', enhancedData);
    this.logger.log(`Story processing completed: ${storyId} - ${data.generatedWordCount} words in ${data.processingTime}ms`);
  }

  emitStoryProcessingError(storyId: string, data: StoryErrorData): void {
    try {
      this.server.to(`story-${storyId}`).emit('story-processing-error', {
        storyId,
        ...data,
        timestamp: new Date()
      });
      this.logger.log(`Emitted story processing error for story ${storyId}`);
    } catch (error) {
      this.logger.error(`Error emitting story processing error for story ${storyId}:`, error);
    }
  }

  // New methods for batch stories events
  emitBatchStoriesStart(batchId: string, data: {
    batchId: string;
    totalStories: number;
    timestamp: Date;
  }): void {
    try {
      this.server.to(`batch-${batchId}`).emit('batch-stories-start', {
        ...data,
        timestamp: new Date()
      });
      this.logger.log(`Emitted batch stories start for batch ${batchId}`);
    } catch (error) {
      this.logger.error(`Error emitting batch stories start for batch ${batchId}:`, error);
    }
  }

  emitBatchStoriesProgress(batchId: string, data: {
    batchId: string;
    currentStory: number;
    totalStories: number;
    progress: number;
    message: string;
    timestamp: Date;
  }): void {
    try {
      this.server.to(`batch-${batchId}`).emit('batch-stories-progress', {
        ...data,
        timestamp: new Date()
      });
      this.logger.log(`Emitted batch stories progress for batch ${batchId}: ${data.progress}%`);
    } catch (error) {
      this.logger.error(`Error emitting batch stories progress for batch ${batchId}:`, error);
    }
  }

  emitBatchStoriesComplete(batchId: string, data: {
    batchId: string;
    totalStories: number;
    completedStories: number;
    failedStories: number;
    storyIds: string[];
    errors: string[];
    timestamp: Date;
  }): void {
    try {
      this.server.to(`batch-${batchId}`).emit('batch-stories-complete', {
        ...data,
        timestamp: new Date()
      });
      this.logger.log(`Emitted batch stories complete for batch ${batchId}: ${data.completedStories}/${data.totalStories} successful`);
    } catch (error) {
      this.logger.error(`Error emitting batch stories complete for batch ${batchId}:`, error);
    }
  }

  emitBatchStoriesError(batchId: string, data: {
    batchId: string;
    error: string;
    timestamp: Date;
  }): void {
    try {
      this.server.to(`batch-${batchId}`).emit('batch-stories-error', {
        ...data,
        timestamp: new Date()
      });
      this.logger.log(`Emitted batch stories error for batch ${batchId}: ${data.error}`);
    } catch (error) {
      this.logger.error(`Error emitting batch stories error for batch ${batchId}:`, error);
    }
  }

  // Auto mode events
  emitAutoModeStart(storyId: string, data: {
    storyId: string;
    step: string;
    config: any;
    timestamp: Date;
  }): void {
    try {
      this.server.to(`story-${storyId}`).emit('auto-mode-start', {
        ...data,
        timestamp: new Date()
      });
      this.logger.log(`Emitted auto mode start for story ${storyId}, step: ${data.step}`);
    } catch (error) {
      this.logger.error(`Error emitting auto mode start for story ${storyId}:`, error);
    }
  }

  emitAutoModeProgress(storyId: string, data: {
    storyId: string;
    step: string;
    progress: number;
    message: string;
    timestamp: Date;
  }): void {
    try {
      this.server.to(`story-${storyId}`).emit('auto-mode-progress', {
        ...data,
        timestamp: new Date()
      });
      this.logger.log(`Emitted auto mode progress for story ${storyId}, step: ${data.step}, progress: ${data.progress}%`);
    } catch (error) {
      this.logger.error(`Error emitting auto mode progress for story ${storyId}:`, error);
    }
  }

  emitAutoModeComplete(storyId: string, data: {
    storyId: string;
    step: string;
    completedSteps: string[];
    timestamp: Date;
  }): void {
    try {
      this.server.to(`story-${storyId}`).emit('auto-mode-complete', {
        ...data,
        timestamp: new Date()
      });
      this.logger.log(`Emitted auto mode complete for story ${storyId}, step: ${data.step}`);
    } catch (error) {
      this.logger.error(`Error emitting auto mode complete for story ${storyId}:`, error);
    }
  }

  emitAutoModeError(storyId: string, data: {
    storyId: string;
    step: string;
    error: string;
    timestamp: Date;
  }): void {
    try {
      this.server.to(`story-${storyId}`).emit('auto-mode-error', {
        ...data,
        timestamp: new Date()
      });
      this.logger.log(`Emitted auto mode error for story ${storyId}, step: ${data.step}, error: ${data.error}`);
    } catch (error) {
      this.logger.error(`Error emitting auto mode error for story ${storyId}:`, error);
    }
  }

  private calculateEstimatedTimeRemaining(progress: number): number {
    const totalEstimatedTime = 30000; // 30 seconds
    const remainingProgress = 100 - progress;
    return Math.round((remainingProgress / 100) * totalEstimatedTime);
  }

  private isRetryableError(error: string): boolean {
    const retryableErrors = [
      'timeout',
      'network',
      'rate limit',
      'service unavailable',
      'temporary'
    ];
    return retryableErrors.some(retryableError => 
      error.toLowerCase().includes(retryableError)
    );
  }
} 