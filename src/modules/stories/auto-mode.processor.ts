import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { StoryGateway } from '../socket/story.gateway';

export interface AutoModeJob {
  storyId: string;
  userId?: string;
  config: {
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
  currentStep: 'images' | 'audio' | 'merge';
}

export interface AutoModeResult {
  storyId: string;
  success: boolean;
  completedSteps: string[];
  errors: string[];
}

@Processor('auto-mode')
@Injectable()
export class AutoModeProcessor {
  private readonly logger = new Logger(AutoModeProcessor.name);

  constructor(
    private readonly storyGateway: StoryGateway,
    @InjectQueue('image-generation') private readonly imageGenerationQueue: Queue,
    @InjectQueue('audio-generation') private readonly audioGenerationQueue: Queue,
    @InjectQueue('audio-merge') private readonly audioMergeQueue: Queue,
  ) {}

  @Process('process-auto-mode')
  async processAutoMode(job: Job<AutoModeJob>): Promise<AutoModeResult> {
    const { storyId, userId, config, currentStep } = job.data;
    
    this.logger.log(`Processing auto mode for story ${storyId}, step: ${currentStep}`);
    
    const result: AutoModeResult = {
      storyId,
      success: false,
      completedSteps: [],
      errors: []
    };

    try {
      // Emit auto mode start event
      this.storyGateway.emitAutoModeStart(storyId, {
        storyId,
        step: currentStep,
        config,
        timestamp: new Date()
      });

      switch (currentStep) {
        case 'images':
          if (config.generateImages) {
            await this.processImageGeneration(storyId, config, userId);
            result.completedSteps.push('images');
          }
          break;

        case 'audio':
          if (config.generateAudio) {
            await this.processAudioGeneration(storyId, config, userId);
            result.completedSteps.push('audio');
          }
          break;

        case 'merge':
          if (config.mergeAudio) {
            await this.processAudioMerge(storyId, userId);
            result.completedSteps.push('merge');
          }
          break;

        default:
          throw new Error(`Unknown auto mode step: ${currentStep}`);
      }

      result.success = true;
      
      // Emit auto mode complete event
      this.storyGateway.emitAutoModeComplete(storyId, {
        storyId,
        step: currentStep,
        completedSteps: result.completedSteps,
        timestamp: new Date()
      });

      this.logger.log(`Auto mode step ${currentStep} completed for story ${storyId}`);
      
      return result;
    } catch (error) {
      this.logger.error(`Error processing auto mode step ${currentStep} for story ${storyId}:`, error);
      
      result.errors.push(`${currentStep}: ${error.message}`);
      
      // Emit auto mode error event
      this.storyGateway.emitAutoModeError(storyId, {
        storyId,
        step: currentStep,
        error: error.message,
        timestamp: new Date()
      });
      
      throw error;
    }
  }

  private async processImageGeneration(storyId: string, config: any, userId?: string): Promise<void> {
    this.logger.log(`Queuing image generation for story ${storyId}`);
    
    // Emit progress event
    this.storyGateway.emitAutoModeProgress(storyId, {
      storyId,
      step: 'images',
      progress: 0,
      message: 'Queuing image generation...',
      timestamp: new Date()
    });

    // Add image generation job with auto mode config
    await this.imageGenerationQueue.add('generate-images', {
      storyId,
      userId,
      generateImagesDto: {
        customPrompt: config.customPromptImage,
        maxWordsPerChunk: config.wordPerChunkImage || 500
      },
      autoModeConfig: {
        generateAudio: config.generateAudio,
        mergeAudio: config.mergeAudio,
        audioVoice: config.audioVoice,
        customPromptAudio: config.customPromptAudio,
        wordPerChunkAudio: config.wordPerChunkAudio
      }
    });

    this.logger.log(`Image generation queued for story ${storyId}`);
  }

  private async processAudioGeneration(storyId: string, config: any, userId?: string): Promise<void> {
    console.log("🚀 ~ AutoModeProcessor ~ processAudioGeneration ~ config:", config)
    this.logger.log(`Queuing audio generation for story ${storyId}`);
    
    // Emit progress event
    this.storyGateway.emitAutoModeProgress(storyId, {
      storyId,
      step: 'audio',
      progress: 0,
      message: 'Queuing audio generation...',
      timestamp: new Date()
    });

    // Add audio generation job with auto mode config
    await this.audioGenerationQueue.add('generate-audio', {
      storyId,
      userId,
      voiceStyle: config.audioVoice || 'KORE',
      modelVoice: config.modelVoice,
      wordPerChunk: config.wordPerChunkAudio || 500,
      customPrompt: config.customPromptAudio,
      autoModeConfig: {
        mergeAudio: config.mergeAudio
      }
    });

    this.logger.log(`Audio generation queued for story ${storyId}`);
  }

  private async processAudioMerge(storyId: string, userId?: string): Promise<void> {
    this.logger.log(`Queuing audio merge for story ${storyId}`);
    
    // Emit progress event
    this.storyGateway.emitAutoModeProgress(storyId, {
      storyId,
      step: 'merge',
      progress: 0,
      message: 'Queuing audio merge...',
      timestamp: new Date()
    });

    // Add audio merge job
    await this.audioMergeQueue.add('merge-audio', {
      storyId,
      userId
    });

    this.logger.log(`Audio merge queued for story ${storyId}`);
  }
} 