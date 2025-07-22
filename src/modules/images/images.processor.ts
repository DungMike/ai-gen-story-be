import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { ImagesService } from './images.service';

@Processor('image-generation')
@Injectable()
export class ImageGenerationProcessor {
  private readonly logger = new Logger(ImageGenerationProcessor.name);

  constructor(private readonly imagesService: ImagesService) {}

  @Process()
  async handleImageGeneration(job: Job) {
    const { storyId, userId, generateImagesDto } = job.data;
    this.logger.log(`Processing image generation for story ID: ${storyId}`);
    
    try {
      // Create a minimal user object for the service
      const user = { _id: userId } as any;
      await this.imagesService.generateImages(storyId, user, generateImagesDto);
      this.logger.log(`Image generation completed for story ID: ${storyId}`);
    } catch (error) {
      this.logger.error(`Error processing image generation for story ID: ${storyId}`, error.stack);
      throw error;
    }
  }
} 