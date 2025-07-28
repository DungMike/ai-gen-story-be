import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { StoriesService } from './stories.service';

export interface StoryGenerationJob {
  storyId: string;
  generateStoryDto: {
    customPrompt: string;
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
  };
  userId?: string;
}

@Processor('story-generation')
@Injectable()
export class StoryGenerationProcessor {
  private readonly logger = new Logger(StoryGenerationProcessor.name);

  constructor(private readonly storiesService: StoriesService) {}

  @Process('generate-story')
  async handleStoryGeneration(job: Job<StoryGenerationJob>) {
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