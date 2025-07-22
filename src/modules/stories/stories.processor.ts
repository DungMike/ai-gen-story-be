import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { StoriesService } from './stories.service';

@Processor('story-generation')
@Injectable()
export class StoryGenerationProcessor {
  private readonly logger = new Logger(StoryGenerationProcessor.name);

  constructor(private readonly storiesService: StoriesService) {}

  @Process()
  async handleStoryGeneration(job: Job) {
    const { storyId, generateStoryDto, userId } = job.data;
    this.logger.log(`Processing story generation for ID: ${storyId}`);
    
    try {
      await this.storiesService.generateStory(storyId, generateStoryDto, userId);
      this.logger.log(`Story generation completed for ID: ${storyId}`);
    } catch (error) {
      this.logger.error(`Error processing story generation for ID: ${storyId}`, error.stack);
      throw error;
    }
  }
} 