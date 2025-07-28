import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { StoriesService } from './stories.service';
import { StoryGateway } from '../socket/story.gateway';
import { BatchJobRepository } from '@/database/repositories/batch-job.repository';

export interface BatchStoryJob {
  batchId: string;
  stories: {
    title?: string;
    customPrompt?: string;
    fileUrl?: string;
  }[];
  autoMode?: {
    enabled: boolean;
    generateImages?: boolean;
    generateAudio?: boolean;
    mergeAudio?: boolean;
    imageStyle?: string;
    audioVoice?: string;
    customPromptImage?: string;
    customPromptAudio?: string;
    wordPerChunkImage?: number;
    wordPerChunkAudio?: number;
  };
  userId?: string;
}

export interface BatchStoryResult {
  batchId: string;
  totalStories: number;
  completedStories: number;
  failedStories: number;
  storyIds: string[];
  errors: string[];
}

@Processor('batch-stories')
@Injectable()
export class BatchStoriesProcessor {
  private readonly logger = new Logger(BatchStoriesProcessor.name);

  constructor(
    private readonly storiesService: StoriesService,
    private readonly storyGateway: StoryGateway,
    private readonly batchJobRepository: BatchJobRepository,
    @InjectQueue('story-generation') private readonly storyGenerationQueue: Queue,
  ) {}

  @Process('process-batch-stories')
  async processBatchStories(job: Job<BatchStoryJob>): Promise<BatchStoryResult> {
    const { batchId, stories, autoMode, userId } = job.data;
    
    this.logger.log(`Starting batch story processing for batch ${batchId} with ${stories.length} stories`);
    
    // Emit batch start event
    this.storyGateway.emitBatchStoriesStart(batchId, {
      batchId,
      totalStories: stories.length,
      timestamp: new Date()
    });

    const result: BatchStoryResult = {
      batchId,
      totalStories: stories.length,
      completedStories: 0,
      failedStories: 0,
      storyIds: [],
      errors: []
    };

    try {
      // Update batch job status to processing
      await this.batchJobRepository.update(batchId, {
        status: 'processing',
        startedAt: new Date()
      });

      // Process each story sequentially
      for (let i = 0; i < stories.length; i++) {
        const storyData = stories[i];
        const fileUrl = storyData.fileUrl;
        const title = storyData.title || `Story ${i + 1}`;
        const customPrompt = storyData.customPrompt;

        try {
          this.logger.log(`Processing story ${i + 1}/${stories.length} for batch ${batchId}`);

          // Update progress in database
          const progress = {
            currentFile: i + 1,
            currentStep: 'story',
            percentage: ((i + 1) / stories.length) * 100
          };
          await this.batchJobRepository.updateProgress(batchId, progress);

          // Emit progress event
          this.storyGateway.emitBatchStoriesProgress(batchId, {
            batchId,
            currentStory: i + 1,
            totalStories: stories.length,
            progress: progress.percentage,
            message: `Creating story ${i + 1} of ${stories.length}`,
            timestamp: new Date()
          });

          const startTime = new Date();

          // Create story
          const story = await this.storiesService.create({
            fileUrl,
            title,
            customPrompt
          }, { sub: userId });

          result.storyIds.push(story._id.toString());
          result.completedStories++;

          // Update batch job results
          await this.updateBatchJobResult(batchId, {
            originalFile: fileUrl,
            storyId: story._id,
            status: 'completed',
            processingTime: new Date().getTime() - startTime.getTime()
          });

          // If auto mode is enabled, queue story generation
          if (autoMode?.enabled) {
            await this.storyGenerationQueue.add('generate-story', {
              storyId: story._id.toString(),
              generateStoryDto: {
                customPrompt: customPrompt || '',
                autoMode: autoMode
              },
              userId
            });
          }

          this.logger.log(`Successfully created story ${i + 1} with ID: ${story._id}`);
        } catch (error) {
          this.logger.error(`Failed to create story ${i + 1} for batch ${batchId}:`, error);
          result.failedStories++;
          result.errors.push(`Story ${i + 1}: ${error.message}`);

          // Update batch job results with error
          await this.updateBatchJobResult(batchId, {
            originalFile: fileUrl,
            status: 'failed',
            error: error.message,
            processingTime: 0
          });
        }
      }

      // Update batch job status to completed
      await this.batchJobRepository.update(batchId, {
        status: 'completed',
        processedFiles: result.completedStories,
        failedFiles: result.failedStories,
        completedAt: new Date()
      });

      // Emit batch complete event
      this.storyGateway.emitBatchStoriesComplete(batchId, {
        batchId,
        totalStories: result.totalStories,
        completedStories: result.completedStories,
        failedStories: result.failedStories,
        storyIds: result.storyIds,
        errors: result.errors,
        timestamp: new Date()
      });

      this.logger.log(`Batch ${batchId} completed: ${result.completedStories} successful, ${result.failedStories} failed`);
      
      return result;
    } catch (error) {
      this.logger.error(`Batch ${batchId} failed:`, error);
      
      // Update batch job status to failed
      await this.batchJobRepository.update(batchId, {
        status: 'failed',
        completedAt: new Date()
      });
      
      // Emit batch error event
      this.storyGateway.emitBatchStoriesError(batchId, {
        batchId,
        error: error.message,
        timestamp: new Date()
      });
      
      throw error;
    }
  }

  private async updateBatchJobResult(batchId: string, result: any): Promise<void> {
    try {
      const batchJob = await this.batchJobRepository.findById(batchId);
      if (batchJob) {
        const updatedResults = [...batchJob.results, result];
        await this.batchJobRepository.updateResults(batchId, updatedResults);
      }
    } catch (error) {
      this.logger.error(`Error updating batch job result for batch ${batchId}:`, error);
    }
  }
} 