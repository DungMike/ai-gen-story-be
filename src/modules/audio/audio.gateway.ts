import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AudioChunkRepository } from './repositories/audio-chunk.repository';
import {
    AudioEventType,
    AudioGenerationStatus,
    AudioRoomPayloadDto,
    AudioStatusResponseDto,
    AudioGenerationProgressDto,
    AudioGenerationCompletedDto,
    AudioGenerationFailedDto,
    AudioStatusErrorDto,
} from './dto/audio-events.dto';

/**
 * WebSocket Gateway for real-time audio generation communication
 * Handles client connections, room management, and status updates
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/audio',
})
export class AudioGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AudioGateway.name);
  
  /**
   * Map to track connected clients per story room
   * Key: storyId, Value: Set of client IDs
   */
  private readonly connectedClients = new Map<string, Set<string>>();

  constructor(private readonly audioChunkRepository: AudioChunkRepository) {}

  /**
   * Handle client connection
   * @param client - Connected socket client
   */
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * Handle client disconnection
   * Clean up client from all story rooms
   * @param client - Disconnected socket client
   */
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.removeClientFromAllRooms(client.id);
  }

  /**
   * Handle client joining audio room for a specific story
   * @param client - Socket client
   * @param payload - Room payload containing storyId
   */
  @SubscribeMessage(AudioEventType.JOIN_ROOM)
  handleJoinAudioRoom(client: Socket, payload: AudioRoomPayloadDto): void {
    const { storyId } = payload;
    
    if (!this.isValidStoryId(storyId)) {
      this.logger.warn(`Invalid storyId provided: ${storyId}`);
      return;
    }

    const roomName = this.getRoomName(storyId);
    client.join(roomName);
    
    this.addClientToRoom(storyId, client.id);
    
    this.logger.log(`Client ${client.id} joined audio room for story ${storyId}`);
  }

  /**
   * Handle client leaving audio room for a specific story
   * @param client - Socket client
   * @param payload - Room payload containing storyId
   */
  @SubscribeMessage(AudioEventType.LEAVE_ROOM)
  handleLeaveAudioRoom(client: Socket, payload: AudioRoomPayloadDto): void {
    const { storyId } = payload;
    
    if (!this.isValidStoryId(storyId)) {
      this.logger.warn(`Invalid storyId provided: ${storyId}`);
      return;
    }

    const roomName = this.getRoomName(storyId);
    client.leave(roomName);
    
    this.removeClientFromRoom(storyId, client.id);
    
    this.logger.log(`Client ${client.id} left audio room for story ${storyId}`);
  }

  /**
   * Handle client requesting audio generation status
   * @param client - Socket client
   * @param payload - Room payload containing storyId
   */
  @SubscribeMessage(AudioEventType.GET_STATUS)
  async handleGetAudioStatus(client: Socket, payload: AudioRoomPayloadDto): Promise<void> {
    const { storyId } = payload;
    
    if (!this.isValidStoryId(storyId)) {
      this.logger.warn(`Invalid storyId provided: ${storyId}`);
      return;
    }

    try {
      const statusData = await this.getAudioStatusData(storyId);
      client.emit(AudioEventType.STATUS_UPDATE, statusData);
    } catch (error) {
      this.logger.error(`Error getting audio status for story ${storyId}:`, error);
      const errorResponse: AudioStatusErrorDto = {
        storyId,
        error: 'Failed to get audio status',
      };
      client.emit(AudioEventType.STATUS_ERROR, errorResponse);
    }
  }

  /**
   * Notify clients about audio generation progress for a specific chunk
   * @param storyId - Story ID
   * @param chunkIndex - Chunk index
   * @param status - Generation status
   * @param data - Additional data
   */
  async notifyAudioGenerationProgress(
    storyId: string,
    chunkIndex: number,
    status: AudioGenerationStatus,
    data?: any
  ): Promise<void> {
    try {
      const statusData = await this.getAudioStatusData(storyId);
      const progressData: AudioGenerationProgressDto = {
        ...statusData,
        chunkIndex,
        status,
        data,
      };

      this.server.to(this.getRoomName(storyId)).emit(
        AudioEventType.GENERATION_PROGRESS,
        progressData
      );
    } catch (error) {
      this.logger.error(`Error notifying audio generation progress for story ${storyId}:`, error);
    }
  }

  /**
   * Notify clients about audio generation completion for a specific chunk
   * @param storyId - Story ID
   * @param chunkIndex - Chunk index
   * @param audioFilePath - Generated audio file path
   */
  async notifyAudioGenerationCompleted(
    storyId: string,
    chunkIndex: number,
    audioFilePath: string
  ): Promise<void> {
    try {
      const statusData = await this.getAudioStatusData(storyId);
      const completedData: AudioGenerationCompletedDto = {
        ...statusData,
        chunkIndex,
        audioFilePath,
      };

      this.server.to(this.getRoomName(storyId)).emit(
        AudioEventType.GENERATION_COMPLETED,
        completedData
      );
    } catch (error) {
      this.logger.error(`Error notifying audio generation completion for story ${storyId}:`, error);
    }
  }

  /**
   * Notify clients about audio generation failure for a specific chunk
   * @param storyId - Story ID
   * @param chunkIndex - Chunk index
   * @param error - Error message
   */
  async notifyAudioGenerationFailed(
    storyId: string,
    chunkIndex: number,
    error: string
  ): Promise<void> {
    try {
      const statusData = await this.getAudioStatusData(storyId);
      const failedData: AudioGenerationFailedDto = {
        ...statusData,
        chunkIndex,
        error,
      };

      this.server.to(this.getRoomName(storyId)).emit(
        AudioEventType.GENERATION_FAILED,
        failedData
      );
    } catch (error) {
      this.logger.error(`Error notifying audio generation failure for story ${storyId}:`, error);
    }
  }

  /**
   * Notify clients about overall audio generation status
   * @param storyId - Story ID
   */
  async notifyAudioGenerationStatus(storyId: string): Promise<void> {
    try {
      const statusData = await this.getAudioStatusData(storyId);
      
      this.server.to(this.getRoomName(storyId)).emit(
        AudioEventType.GENERATION_STATUS,
        statusData
      );
    } catch (error) {
      this.logger.error(`Error notifying audio generation status for story ${storyId}:`, error);
    }
  }

  /**
   * Get audio status data for a story
   * @param storyId - Story ID
   * @returns Audio status response data
   */
  private async getAudioStatusData(storyId: string): Promise<AudioStatusResponseDto> {
    const statusCounts = await this.audioChunkRepository.getStatusCountsByStoryId(storyId);
    const progress = statusCounts.total > 0 ? 
      ((statusCounts.completed + statusCounts.failed) / statusCounts.total) * 100 : 0;

    return {
      storyId,
      ...statusCounts,
      progress: Math.round(progress),
    };
  }

  /**
   * Get room name for a story
   * @param storyId - Story ID
   * @returns Room name
   */
  private getRoomName(storyId: string): string {
    return `audio-story-${storyId}`;
  }

  /**
   * Validate story ID format
   * @param storyId - Story ID to validate
   * @returns True if valid, false otherwise
   */
  private isValidStoryId(storyId: string): boolean {
    return storyId && typeof storyId === 'string' && storyId.trim().length > 0;
  }

  /**
   * Add client to a story room
   * @param storyId - Story ID
   * @param clientId - Client ID
   */
  private addClientToRoom(storyId: string, clientId: string): void {
    if (!this.connectedClients.has(storyId)) {
      this.connectedClients.set(storyId, new Set());
    }
    this.connectedClients.get(storyId).add(clientId);
  }

  /**
   * Remove client from a story room
   * @param storyId - Story ID
   * @param clientId - Client ID
   */
  private removeClientFromRoom(storyId: string, clientId: string): void {
    const clients = this.connectedClients.get(storyId);
    if (clients) {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.connectedClients.delete(storyId);
      }
    }
  }

  /**
   * Remove client from all story rooms
   * @param clientId - Client ID
   */
  private removeClientFromAllRooms(clientId: string): void {
    for (const [storyId, clients] of this.connectedClients.entries()) {
      if (clients.has(clientId)) {
        clients.delete(clientId);
        if (clients.size === 0) {
          this.connectedClients.delete(storyId);
        }
      }
    }
  }

  /**
   * Get number of connected clients for a story
   * @param storyId - Story ID
   * @returns Number of connected clients
   */
  getConnectedClientsCount(storyId: string): number {
    const clients = this.connectedClients.get(storyId);
    return clients ? clients.size : 0;
  }

  /**
   * Get all connected clients for a story
   * @param storyId - Story ID
   * @returns Set of client IDs
   */
  getConnectedClients(storyId: string): Set<string> {
    return this.connectedClients.get(storyId) || new Set();
  }

  emitAudioGenerationComplete(storyId: string, data: any): void {
    this.server.to(`audio-${storyId}`).emit('audio:generation:complete', data);
  }

  emitAudioGenerationError(storyId: string, data: any): void {
    this.server.to(`audio-${storyId}`).emit('audio:generation:error', data);
  }

  // Audio Merge Events
  emitAudioMergeProgress(storyId: string, data: {
    storyId: string;
    progress: number;
    message: string;
    jobId: string;
  }): void {
    this.server.to(`audio-${storyId}`).emit('audio:merge:progress', data);
  }

  emitAudioMergeComplete(storyId: string, data: {
    storyId: string;
    outputPath: string;
    totalDuration: number;
    fileSize: number;
    chunkCount: number;
    jobId: string;
  }): void {
    this.server.to(`audio-${storyId}`).emit('audio:merge:complete', data);
  }

  emitAudioMergeError(storyId: string, data: {
    storyId: string;
    error: string;
    jobId: string;
  }): void {
    this.server.to(`audio-${storyId}`).emit('audio:merge:error', data);
  }
} 