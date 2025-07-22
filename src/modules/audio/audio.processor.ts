import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { AudioService } from './audio.service';
import { AudioEventType } from './dto/audio-events.dto';

@Processor('audio-generation')
@Injectable()
export class AudioGenerationProcessor {
  private readonly logger = new Logger(AudioGenerationProcessor.name);

  constructor(private readonly audioService: AudioService) {}

  @Process('generate-audio')
  async handleAudioGeneration(job: Job) {
    const { storyId, voiceModel, voiceStyle, wordPerChunk } = job.data;
    this.logger.log(`Processing audio generation for story ID: ${storyId}`);
    
    try {
      // Create a minimal user object for the service
      await this.audioService.generateAudioForStory(storyId, voiceModel, voiceStyle, wordPerChunk);
      this.logger.log(`Audio generation completed for story ID: ${storyId}`);
    } catch (error) {
      this.logger.error(`Error processing audio generation for story ID: ${storyId}`, error.stack);
      throw error;
    }
  }

} 