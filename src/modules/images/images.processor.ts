import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ImagesService } from './images.service';

export interface ImageGenerationJob {
  storyId: string;
  userId?: string;
  generateImagesDto?: any;
  autoModeConfig?: {
    generateAudio?: boolean;
    mergeAudio?: boolean;
    audioVoice?: string;
  };
}

@Processor('image-generation')
@Injectable()
export class ImageGenerationProcessor {
  private readonly logger = new Logger(ImageGenerationProcessor.name);

  constructor(
    private readonly imagesService: ImagesService,
    @InjectQueue('auto-mode') private readonly autoModeQueue: Queue,
  ) {}

  @Process('generate-images')
  async handleImageGeneration(job: Job<ImageGenerationJob>) {
    const { storyId, userId, generateImagesDto, autoModeConfig } = job.data;
    this.logger.log(`Processing image generation for story ID: ${storyId}`);
    
    try {
      // Create a minimal user object for the service
      const user = { _id: userId } as any;
      await this.imagesService.generateImages(storyId, user, generateImagesDto);
      this.logger.log(`Image generation completed for story ID: ${storyId}`);

      // Check if we should continue with auto mode pipeline
      if (autoModeConfig && (autoModeConfig.generateAudio || autoModeConfig.mergeAudio)) {
        this.logger.log(`Continuing auto mode pipeline for story ${storyId} - queuing audio generation`);
        
        // Queue the next step (audio generation)
        await this.autoModeQueue.add('process-auto-mode', {
          storyId,
          userId,
          config: autoModeConfig,
          currentStep: 'audio'
        });
      }
    } catch (error) {
      this.logger.error(`Error processing image generation for story ID: ${storyId}`, error.stack);
      throw error;
    }
  }
} 