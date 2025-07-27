import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AudioChunkRepository } from './repositories/audio-chunk.repository';
import { CreateAudioChunkDto } from './dto/create-audio-chunk.dto';
import { UpdateAudioChunkDto } from './dto/update-audio-chunk.dto';
import { AudioGenerationResponseDto, AudioGenerationStatusResponseDto, AudioDownloadResponseDto } from './dto/audio-response.dto';
import { AudioGenerationStatus } from './dto/audio-events.dto';
import { TTSService } from '../../services/ai/tts.service';
import { FileStorageService } from '../../services/file/file-storage.service';
import { ZipHelper } from '../../helpers/zip.helper';
import { AudioGateway } from './audio.gateway';
import { StoryRepository } from '../../database/repositories/story.repository';
import * as fs from 'fs';
import * as path from 'path';
import { AudioFormat, VoiceOption } from './constant/type';

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);

  constructor(
    private readonly audioChunkRepository: AudioChunkRepository,
    @InjectQueue('audio-generation') private readonly audioGenerationQueue: Queue,
    private readonly ttsService: TTSService,
    private readonly fileStorageService: FileStorageService,
    private readonly zipHelper: ZipHelper,
    private readonly audioGateway: AudioGateway,
    private readonly storyRepository: StoryRepository,
  ) {}

  // New method to enqueue audio generation job
  async enqueueAudioGeneration(
    storyId: string, 
    userId: string,
    voiceStyle: VoiceOption,
    wordPerChunk: number = 500
  ): Promise<{ message: string; jobId: string }> {
    try {
      const story = await this.storyRepository.findById(storyId);
      if (!story) {
        throw new Error('Story not found');
      }
      if (story.userId.toString() !== userId) {
        throw new Error('You are not authorized to generate audio for this story');
      }

      // Add job to queue
      const job = await this.audioGenerationQueue.add('generate-audio', { 
        storyId, 
        userId,
        voiceStyle,
        wordPerChunk
      });

      this.logger.log(`Audio generation job queued for story ID: ${storyId}, Job ID: ${job.id}`);
      
      return { 
        message: 'Audio generation job has been queued successfully', 
        jobId: job.id.toString() 
      };
    } catch (error) {
      this.logger.error('Error queuing audio generation:', error);
      throw error;
    }
  }

  async create(createAudioChunkDto: CreateAudioChunkDto) {
    return this.audioChunkRepository.create(createAudioChunkDto);
  }

  async findAll() {
    return this.audioChunkRepository.findAll();
  }

  async findById(id: string) {
    const audioChunk = await this.audioChunkRepository.findById(id);
    if (!audioChunk) {
      throw new NotFoundException(`Audio chunk with ID ${id} not found`);
    }
    return audioChunk;
  }

  async findByStoryId(storyId: string) {
    return this.audioChunkRepository.findByStoryId(storyId);
  }

  async update(id: string, updateAudioChunkDto: UpdateAudioChunkDto) {
    const audioChunk = await this.audioChunkRepository.update(id, updateAudioChunkDto);
    if (!audioChunk) {
      throw new NotFoundException(`Audio chunk with ID ${id} not found`);
    }
    return audioChunk;
  }

  async remove(id: string) {
    const audioChunk = await this.audioChunkRepository.remove(id);
    if (!audioChunk) {
      throw new NotFoundException(`Audio chunk with ID ${id} not found`);
    }
    return audioChunk;
  }

  async generateAudioForStory(
    storyId: string,
    voiceModel: 'google-tts' | 'elevenlabs' = 'google-tts',
    voiceStyle: VoiceOption,
    wordPerChunk: number = 500
  ): Promise<AudioGenerationResponseDto> {
    try {
      this.logger.log(`Starting audio generation for story ${storyId}`);

      // Get story content from database
      const story = await this.storyRepository.findById(storyId);
      if (!story) {
        throw new NotFoundException('Story not found');
      }

      if (!story.generatedContent) {
        throw new BadRequestException('Story content not generated yet');
      }

      // Split story content into chunks
      const textChunks = await this.ttsService.splitTextIntoChunks(story.generatedContent, wordPerChunk);
      this.logger.log(`Text chunks: ${textChunks.length}`);

      // Create audio chunk records
      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i];        
        await this.generateAudioChunk(storyId, i, chunk, voiceStyle);
      }

      // Notify clients about the start of audio generation
      await this.audioGateway.notifyAudioGenerationStatus(storyId);

      // Update story status
      await this.storyRepository.update(storyId, {
        status: { storyGenerated: true, audioGenerated: true, imagesGenerated: true }
      });

      return {
        success: true,
        message: `Audio generation started for ${textChunks.length} chunks`
      };
    } catch (error) {
      this.logger.error(`Error starting audio generation for story ${storyId}:`, error);
      throw new BadRequestException(`Failed to start audio generation: ${error.message}`);
    }
  }

  async getAudioGenerationStatus(storyId: string): Promise<AudioGenerationStatusResponseDto> {
    try {
      const statusCounts = await this.audioChunkRepository.getStatusCountsByStoryId(storyId);
      const progress = statusCounts.total > 0 ? 
        ((statusCounts.completed + statusCounts.failed) / statusCounts.total) * 100 : 0;

      return {
        success: true,
        message: 'Audio generation status retrieved successfully',
        data: {
          storyId,
          totalChunks: statusCounts.total,
          completedChunks: statusCounts.completed,
          failedChunks: statusCounts.failed,
          pendingChunks: statusCounts.pending,
          processingChunks: statusCounts.processing,
          progress: Math.round(progress),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting audio generation status for story ${storyId}:`, error);
      throw new BadRequestException(`Failed to get audio generation status: ${error.message}`);
    }
  }

  // async retryFailedAudioChunks(storyId: string): Promise<AudioGenerationResponseDto> {
  //   try {
  //     const failedChunks = await this.audioChunkRepository.findFailedByStoryId(storyId);
      
  //     if (failedChunks.length === 0) {
  //       return {
  //         success: true,
  //         message: 'No failed audio chunks found',
  //         data: {
  //           audioChunks: [],
  //           totalChunks: 0,
  //           completedChunks: 0,
  //           failedChunks: 0,
  //         },
  //       };
  //     }

  //     for (const chunk of failedChunks) {
  //       // Reset status to pending
  //       await this.audioChunkRepository.updateStatusByStoryIdAndChunkIndex(
  //         storyId,
  //         chunk.chunkIndex,
  //         'pending',
  //       );

  //       // Add job to queue for retry
  //       await this.audioGenerationQueue.add('generate-audio', {
  //         storyId,
  //         chunkIndex: chunk.chunkIndex,
  //         text: chunk.text,
  //         voiceModel: chunk.style?.voiceModel || 'google-tts',
  //       });
  //     }

  //     // Notify clients about retry
  //     await this.audioGateway.notifyAudioGenerationStatus(storyId);

  //     return {
  //       success: true,
  //       message: `Retrying ${failedChunks.length} failed audio chunks`,
  //       data: {
  //         audioChunks: failedChunks,
  //         totalChunks: failedChunks.length,
  //         completedChunks: 0,
  //         failedChunks: 0,
  //       },
  //     };
  //   } catch (error) {
  //     this.logger.error(`Error retrying failed audio chunks for story ${storyId}:`, error);
  //     throw new BadRequestException(`Failed to retry audio chunks: ${error.message}`);
  //   }
  // }

  async downloadAudioFiles(storyId: string): Promise<AudioDownloadResponseDto> {
    try {
      const completedChunks = await this.audioChunkRepository.findCompletedByStoryId(storyId);
      
      if (completedChunks.length === 0) {
        throw new BadRequestException('No completed audio chunks found for download');
      }

      // Create temporary directory for audio files
      const tempDir = path.join(process.cwd(), 'temp', `audio_${storyId}_${Date.now()}`);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Copy audio files to temp directory
      const audioFiles = [];
      let totalDuration = 0;

      for (const chunk of completedChunks) {
        if (chunk.audioFile && fs.existsSync(chunk.audioFile)) {
          const fileName = `chunk_${chunk.chunkIndex}.${AudioFormat.MP3}`;
          const destPath = path.join(tempDir, fileName);
          
          fs.copyFileSync(chunk.audioFile, destPath);
          audioFiles.push(destPath);
          
          totalDuration += chunk.metadata?.duration || 0;
        }
      }

      if (audioFiles.length === 0) {
        throw new BadRequestException('No valid audio files found');
      }

      // Create ZIP file
      const zipFileName = `story_${storyId}_audio_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
      const files = audioFiles.map(filePath => ({ path: filePath, name: path.basename(filePath) }));
      const { zipPath: zipFilePath } = await this.zipHelper.createZipFile(files, zipFileName);

      // Get file size
      const fileStats = fs.statSync(zipFilePath);
      const fileSize = fileStats.size;

      // Generate download URL
      const downloadUrl = `/api/audio/download/${path.basename(zipFilePath)}`;

      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });

      return {
        success: true,
        message: 'Audio files packaged successfully',
        data: {
          downloadUrl,
          fileName: zipFileName,
          fileSize,
          totalDuration,
        },
      };
    } catch (error) {
      this.logger.error(`Error downloading audio files for story ${storyId}:`, error);
      throw new BadRequestException(`Failed to download audio files: ${error.message}`);
    }
  }

  async deleteAudioChunksByStoryId(storyId: string): Promise<void> {
    try {
      const audioChunks = await this.audioChunkRepository.findByStoryId(storyId);
      
      // Delete audio files from filesystem
      for (const chunk of audioChunks) {
        if (chunk.audioFile && fs.existsSync(chunk.audioFile)) {
          fs.unlinkSync(chunk.audioFile);
        }
      }

      // Delete from database
      await this.audioChunkRepository.removeByStoryId(storyId);
      
      this.logger.log(`Deleted ${audioChunks.length} audio chunks for story ${storyId}`);
    } catch (error) {
      this.logger.error(`Error deleting audio chunks for story ${storyId}:`, error);
      throw new BadRequestException(`Failed to delete audio chunks: ${error.message}`);
    }
  }

  async getAudioChunkByStoryIdAndIndex(storyId: string, chunkIndex: number) {
    const audioChunk = await this.audioChunkRepository.findByStoryIdAndChunkIndex(storyId, chunkIndex);
    if (!audioChunk) {
      throw new NotFoundException(`Audio chunk not found for story ${storyId}, index ${chunkIndex}`);
    }
    return audioChunk;
  }


  async generateAudioChunk(
    storyId: string,
    chunkIndex: number,
    text: string,
    voiceStyle: VoiceOption,

  ): Promise<{ success: boolean; audioFilePath?: string; processingTime?: number; duration?: number }> {
    try {
      // Update status to processing
      await this.audioChunkRepository.updateStatusByStoryIdAndChunkIndex(
        storyId,
        chunkIndex,
        AudioGenerationStatus.PROCESSING,
      );

      const startTime = Date.now();

      // Generate audio using TTS service
      const audioFilePath = await this.ttsService.generateAudio(text, voiceStyle, storyId, chunkIndex);
      
      const processingTime = Date.now() - startTime;
      
      // Get audio duration
      const duration = await this.ttsService.getAudioDuration(audioFilePath);
      // create a new audio chunk
      const audioChunk = await this.audioChunkRepository.create({
        storyId,
        chunkIndex,
        audioFile: audioFilePath,
        status: AudioGenerationStatus.COMPLETED,
        content: text,
        metadata: {
          audioFormat: AudioFormat.WAV,
          processingTime: processingTime,
          quality: 'standard',
          duration: duration,
          aiModel: 'google-tts',
        },
      });



      this.logger.log(`Audio generation completed for story ${storyId}, chunk ${chunkIndex}`);
      
      return {
        success: true,
        audioFilePath,
        processingTime,
        duration,
      };
    } catch (error) {
      this.logger.error(`Audio generation failed for story ${storyId}, chunk ${chunkIndex}:`, error);
      
      // Update status and error in a single operation
      await this.audioChunkRepository.updateAudioChunkComplete(
        storyId,
        chunkIndex,
        {
          status: AudioGenerationStatus.FAILED,
          metadata: {
            error: error.message,
          },
        },
      );

      throw error;
    }
  }
} 