import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AudioService } from './audio.service';
import { VoiceOption } from './constant/type';

export interface AudioGenerationJob {
  storyId: string;
  userId?: string;
  voiceModel?: string;
  voiceStyle?: string;
  wordPerChunk?: number;
  customPrompt?: string;
  autoModeConfig?: {
    mergeAudio?: boolean;
  };
}

@Processor('audio-generation')
@Injectable()
export class AudioGenerationProcessor {
  private readonly logger = new Logger(AudioGenerationProcessor.name);

  constructor(
    private readonly audioService: AudioService,
    @InjectQueue('auto-mode') private readonly autoModeQueue: Queue,
    @InjectQueue('audio-merge') private readonly audioMergeQueue: Queue,
  ) {}

  @Process('generate-audio')
  async handleAudioGeneration(job: Job<AudioGenerationJob>) {
    const { storyId, userId, voiceModel, voiceStyle, wordPerChunk, customPrompt, autoModeConfig } = job.data;
    this.logger.log(`Processing audio generation for story ID: ${storyId}`);
    
    try {
      // Create a minimal user object for the service
      await this.audioService.generateAudioForStory(storyId, voiceStyle as VoiceOption, wordPerChunk, customPrompt, autoModeConfig);
      this.logger.log(`Audio generation completed for story ID: ${storyId}`);

      // Add audio merge job
      await this.audioMergeQueue.add('merge-audio', {
      storyId,
      userId
      });

    } catch (error) {
      this.logger.error(`Error processing audio generation for story ID: ${storyId}`, error.stack);
      throw error;
    }
  }
} 