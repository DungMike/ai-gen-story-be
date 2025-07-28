import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { AudioMergerService } from '../../services/audio/audio-merger.service';
import { AudioChunkRepository } from './repositories/audio-chunk.repository';
import { AudioGateway } from '../socket/audio.gateway';

export interface AudioMergeJob {
  storyId: string;
  userId: string;
  priority: 'high' | 'normal' | 'low';
  retryAttempts: number;
  maxRetries: number;
}

export interface AudioMergeJobResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  metadata: {
    totalDuration: number;
    fileSize: number;
    chunkCount: number;
  };
}

@Processor('audio-merge')
@Injectable()
export class AudioMergeProcessor {
  private readonly logger = new Logger(AudioMergeProcessor.name);

  constructor(
    private readonly audioMergerService: AudioMergerService,
    private readonly audioChunkRepository: AudioChunkRepository,
    private readonly audioGateway: AudioGateway,
  ) {}

  @Process('merge-audio-files')
  async handleAudioMerge(job: Job<AudioMergeJob>): Promise<AudioMergeJobResult> {
    const { storyId, userId } = job.data;
    
    this.logger.log(`Starting audio merge job for story ${storyId}, attempt ${job.attemptsMade + 1}`);
    
    try {
      // Emit progress event
      this.audioGateway.emitAudioMergeProgress(storyId, {
        storyId,
        progress: 0,
        message: 'Validating audio chunks...',
        jobId: job.id.toString()
      });

      // Validate all chunks are completed
      const statusCounts = await this.audioChunkRepository.getStatusCountsByStoryId(storyId);
      
      if (statusCounts.completed !== statusCounts.total) {
        throw new Error(`Not all chunks completed. Completed: ${statusCounts.completed}, Total: ${statusCounts.total}`);
      }

      // Emit progress event
      this.audioGateway.emitAudioMergeProgress(storyId, {
        storyId,
        progress: 20,
        message: 'Loading audio files...',
        jobId: job.id.toString()
      });

      // Get all completed chunks sorted by chunkIndex
      const completedChunks = await this.audioChunkRepository.findCompletedByStoryId(storyId);
      
      if (completedChunks.length === 0) {
        throw new Error('No completed audio chunks found');
      }

      // Validate chunk sequence
      const expectedIndices = Array.from({ length: completedChunks.length }, (_, i) => i);
      const actualIndices = completedChunks.map(chunk => chunk.chunkIndex).sort();
      
      if (!expectedIndices.every((index, i) => index === actualIndices[i])) {
        throw new Error('Audio chunks are not in sequential order');
      }

      // Emit progress event
      this.audioGateway.emitAudioMergeProgress(storyId, {
        storyId,
        progress: 40,
        message: 'Merging audio files...',
        jobId: job.id.toString()
      });

      // Merge audio files
      const mergeResult = await this.audioMergerService.mergeAudioFiles(
        completedChunks.map(chunk => chunk.audioFile),
        storyId
      );

      // Emit progress event
      this.audioGateway.emitAudioMergeProgress(storyId, {
        storyId,
        progress: 80,
        message: 'Finalizing merged file...',
        jobId: job.id.toString()
      });

      // Update database with merge result
      await this.audioChunkRepository.updateMergeMetadata(storyId, {
        mergedFilePath: mergeResult.outputPath,
        totalDuration: mergeResult.totalDuration,
        fileSize: mergeResult.fileSize,
        chunkCount: mergeResult.chunkCount,
        mergedAt: new Date(),
        jobId: job.id.toString()
      });

      // Emit completion event
      this.audioGateway.emitAudioMergeComplete(storyId, {
        storyId,
        outputPath: mergeResult.outputPath,
        totalDuration: mergeResult.totalDuration,
        fileSize: mergeResult.fileSize,
        chunkCount: mergeResult.chunkCount,
        jobId: job.id.toString()
      });

      this.logger.log(`Audio merge completed successfully for story ${storyId}`);
      
      return {
        success: true,
        outputPath: mergeResult.outputPath,
        metadata: {
          totalDuration: mergeResult.totalDuration,
          fileSize: mergeResult.fileSize,
          chunkCount: mergeResult.chunkCount
        }
      };

    } catch (error) {
      this.logger.error(`Audio merge failed for story ${storyId}:`, error);
      
      // Emit error event
      this.audioGateway.emitAudioMergeError(storyId, {
        storyId,
        error: error.message,
        jobId: job.id.toString()
      });

      return {
        success: false,
        error: error.message,
        metadata: {
          totalDuration: 0,
          fileSize: 0,
          chunkCount: 0
        }
      };
    }
  }
} 