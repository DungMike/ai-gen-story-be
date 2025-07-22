import { ApiProperty } from '@nestjs/swagger';

/**
 * Audio generation status enum
 */
export enum AudioGenerationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Audio event types enum
 */
export enum AudioEventType {
  JOIN_ROOM = 'join-audio-room',
  LEAVE_ROOM = 'leave-audio-room',
  GET_STATUS = 'get-audio-status',
  STATUS_UPDATE = 'audio-status-update',
  STATUS_ERROR = 'audio-status-error',
  GENERATION_PROGRESS = 'audio-generation-progress',
  GENERATION_COMPLETED = 'audio-generation-completed',
  GENERATION_FAILED = 'audio-generation-failed',
  GENERATION_STATUS = 'audio-generation-status'
}

/**
 * Audio room payload DTO
 */
export class AudioRoomPayloadDto {
  @ApiProperty({
    description: 'Story ID for the audio room',
    example: '507f1f77bcf86cd799439011'
  })
  storyId: string;
}

/**
 * Audio status response DTO
 */
export class AudioStatusResponseDto {
  @ApiProperty({
    description: 'Story ID',
    example: '507f1f77bcf86cd799439011'
  })
  storyId: string;

  @ApiProperty({
    description: 'Total number of audio chunks',
    example: 10
  })
  total: number;

  @ApiProperty({
    description: 'Number of completed chunks',
    example: 5
  })
  completed: number;

  @ApiProperty({
    description: 'Number of failed chunks',
    example: 1
  })
  failed: number;

  @ApiProperty({
    description: 'Number of pending chunks',
    example: 3
  })
  pending: number;

  @ApiProperty({
    description: 'Number of processing chunks',
    example: 1
  })
  processing: number;

  @ApiProperty({
    description: 'Generation progress percentage',
    example: 60
  })
  progress: number;
}

/**
 * Audio generation progress DTO
 */
export class AudioGenerationProgressDto extends AudioStatusResponseDto {
  @ApiProperty({
    description: 'Current chunk index being processed',
    example: 3
  })
  chunkIndex: number;

  @ApiProperty({
    description: 'Current chunk status',
    enum: AudioGenerationStatus
  })
  status: AudioGenerationStatus;

  @ApiProperty({
    description: 'Additional data for the chunk',
    required: false
  })
  data?: any;
}

/**
 * Audio generation completed DTO
 */
export class AudioGenerationCompletedDto extends AudioStatusResponseDto {
  @ApiProperty({
    description: 'Completed chunk index',
    example: 3
  })
  chunkIndex: number;

  @ApiProperty({
    description: 'Generated audio file path',
    example: '/uploads/audio/chunk_3.mp3'
  })
  audioFilePath: string;
}

/**
 * Audio generation failed DTO
 */
export class AudioGenerationFailedDto extends AudioStatusResponseDto {
  @ApiProperty({
    description: 'Failed chunk index',
    example: 3
  })
  chunkIndex: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Failed to generate audio for chunk'
  })
  error: string;
}

/**
 * Audio status error DTO
 */
export class AudioStatusErrorDto {
  @ApiProperty({
    description: 'Story ID',
    example: '507f1f77bcf86cd799439011'
  })
  storyId: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Failed to get audio status'
  })
  error: string;
} 