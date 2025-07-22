import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { StoryRepository } from '@/database/repositories/story.repository';
import { GeminiService } from '@/services/ai/gemini.service';
import { FileUploadService } from '@/services/file/file-upload.service';
import { FileStorageService } from '@/services/file/file-storage.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { StoryResponseDto } from './dto/story-response.dto';
import { PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { GenerateStoryDto } from './dto/generate-story.dto';
import { UpdateStoryDto } from '@/types';
import { StoryGateway } from '../socket/story.gateway';
import { PageOptionDto } from './dto/page-option.dto';

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name);

  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly geminiService: GeminiService,
    private readonly fileUploadService: FileUploadService,
    private readonly fileStorageService: FileStorageService,
    private readonly storyGateway: StoryGateway,
    @InjectQueue('story-generation') private storyQueue: Queue,
  ) {}

  private addFileUrls(story: any): StoryResponseDto {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    return {
      ...story,
      files: {
        originalFileUrl: story.files?.originalFile ? `${baseUrl}/api/files/${story.files.originalFile}` : null,
        generatedFileUrl: story.files?.generatedFile ? `${baseUrl}/api/files/${story.files.generatedFile}` : null,
      }
    };
  }

  async findAll( pageOptionDto: PageOptionDto): Promise<PaginatedResponseDto<StoryResponseDto>> {
    const result = await this.storyRepository.findAll(pageOptionDto);

    const {page, limit} = pageOptionDto;
    
    const totalPages = Math.ceil(result.total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    return {
      data: result.stories.map(story => this.addFileUrls(story)),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNext,
        hasPrev
      }
    };
  }

  async findById(id: string): Promise<StoryResponseDto> {
    const story = await this.storyRepository.findById(id);
    if (!story) {
      throw new Error('Story not found');
    }
    return story;
  }

  async create(createStoryDto: CreateStoryDto, user?: any): Promise<StoryResponseDto> {
    try {
      // Extract file path from URL
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
      const fileUrl = createStoryDto.fileUrl;
      
      if (!fileUrl.startsWith(`${baseUrl}/api/files/`)) {
        throw new Error('Invalid file URL format');
      }
      
      // Extract file path from URL
      const filePath = fileUrl.replace(`${baseUrl}/api/files/`, '');
      
      // Create story data
      const storyData = {
        ...createStoryDto,
        userId: user?.sub, // Add user ID from JWT payload
        files: {
          originalFile: filePath,
        },
      } as any;
      
      const story = await this.storyRepository.create(storyData);
      
      this.logger.log(`Story created with ID: ${story._id}`);
      return this.addFileUrls(story);
    } catch (error) {
      this.logger.error('Error creating story:', error);
      throw error;
    }
  }

  // New method to enqueue story generation job
  async enqueueStoryGeneration(id: string, generateStoryDto: GenerateStoryDto, userId?: string): Promise<{ message: string; jobId: string }> {
    try {
      const story = await this.storyRepository.findById(id);
      if (!story) {
        throw new Error('Story not found');
      }
      if (story.userId.toString() !== userId) {
        throw new Error('You are not authorized to generate this story');
      }

      // Add job to queue
      const job = await this.storyQueue.add({ 
        storyId: id, 
        generateStoryDto, 
        userId 
      });

      this.logger.log(`Story generation job queued for ID: ${id}, Job ID: ${job.id}`);
      
      return { 
        message: 'Story generation job has been queued successfully', 
        jobId: job.id.toString() 
      };
    } catch (error) {
      this.logger.error('Error queuing story generation:', error);
      throw error;
    }
  }

  // Existing generateStory method (used by processor)
  async generateStory(id: string, generateStoryDto: GenerateStoryDto, userId?: string) {
    const startTime = Date.now();
    
    try {
      // Emit start event with enhanced data
      this.storyGateway.emitStoryProcessingStart(id, {
        storyId: id,
        step: 'story_generation',
        timestamp: new Date(),
        estimatedTime: 30000,
        totalSteps: 4
      });

      const story = await this.storyRepository.findById(id);
      if (!story) {
        throw new Error('Story not found');
      }
      if (story.userId.toString() !== userId) {
        throw new Error('You are not authorized to generate this story');
      }

      // Emit progress - Reading file
      this.storyGateway.emitStoryProcessingProgress(id, {
        storyId: id,
        progress: 25,
        step: 'reading_file',
        message: 'Reading original story file...',
        timestamp: new Date(),
        currentStep: 1,
        totalSteps: 4
      });

      // Read original content from file
      const originalContent = await this.fileUploadService.readFileContent(story.files.originalFile);
      
      if (!originalContent || originalContent.trim().length === 0) {
        throw new Error('Original story file is empty or could not be read');
      }

      // Emit progress - AI processing
      this.storyGateway.emitStoryProcessingProgress(id, {
        storyId: id,
        progress: 50,
        step: 'ai_processing',
        message: 'AI is generating your story...',
        timestamp: new Date(),
        currentStep: 2,
        totalSteps: 4
      });

      // Generate story with AI
      const generatedContent = await this.geminiService.generateStory(
        originalContent,
        generateStoryDto?.customPrompt ? generateStoryDto.customPrompt : story.customPrompt
      );

        if (!generatedContent || generatedContent.trim().length === 0) {
          throw new Error('AI failed to generate story content');
        }

      // Emit progress - Saving file
      this.storyGateway.emitStoryProcessingProgress(id, {
        storyId: id,
        progress: 75,
        step: 'saving_file',
        message: 'Saving generated story...',
        timestamp: new Date(),
        currentStep: 3,
        totalSteps: 4
      });

      // Save generated story to file
      const generatedFilePath = await this.fileStorageService.saveGeneratedStory(
        story._id,
        generatedContent
      );

      // Calculate processing time
      const processingTime = Date.now() - startTime;
      const wordCount = generatedContent.split(' ').length;

      // Update story with nested properties
      const updateData: UpdateStoryDto = {
        generatedContent,
        files: {
          ...story.files,
          generatedFile: generatedFilePath,
        },
        status: {
          ...story.status,
          storyGenerated: true,
          lastGeneratedAt: new Date(),
        },
        metadata: {
          ...story.metadata,
          generatedWordCount: wordCount,
          processingTime,
          originalWordCount: originalContent.split(' ').length,
          generationPrompt: generateStoryDto?.customPrompt || story.customPrompt,
        },
      };

      const updatedStory = await this.storyRepository.update(id, updateData);

      // Emit complete event with enhanced data
      this.storyGateway.emitStoryProcessingComplete(id, {
        storyId: id,
        generatedContent,
        generatedWordCount: wordCount,
        processingTime,
        timestamp: new Date(),
        originalWordCount: originalContent.split(' ').length,
        filePath: generatedFilePath,
        success: true
      });

      this.logger.log(`Story generated successfully for ID: ${id} - ${wordCount} words in ${processingTime}ms`);
      return this.addFileUrls(updatedStory);
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Emit error event with enhanced data
      this.storyGateway.emitStoryProcessingError(id, {
        storyId: id,
        error: error.message,
        step: 'story_generation',
        timestamp: new Date(),
        processingTime,
        retryable: this.isRetryableError(error.message)
      });
      
      this.logger.error(`Error generating story for ID: ${id}:`, error);
      throw error;
    }
  }

  private isRetryableError(error: string): boolean {
    const retryableErrors = [
      'timeout',
      'network',
      'rate limit',
      'service unavailable',
      'temporary',
      'quota exceeded',
      'connection'
    ];
    return retryableErrors.some(retryableError => 
      error.toLowerCase().includes(retryableError)
    );
  }
} 