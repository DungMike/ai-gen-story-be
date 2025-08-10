import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ImageChunkRepository } from './repositories/image-chunk.repository';
import { ImageGateway } from '../socket/image.gateway';
import { ImageChunkResponseDto, ImageProcessingResponseDto } from './dto/image-response.dto';
import { AIImageService } from '../../services/ai/image.service';
import { FileStorageService } from '../../services/file/file-storage.service';
import { StoryRepository } from '../../database/repositories/story.repository';
import { ImageChunk, ImageChunkDocument } from './schemas/image-chunk.schema';
import { UserDocument } from '@/database/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ZipHelper } from '../../helpers/zip.helper';
import { GenerateImagesDto } from './dto/generate-image.dto';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private readonly imageChunkRepository: ImageChunkRepository,
    @InjectModel(ImageChunk.name)
    private imageChunkModel: Model<ImageChunkDocument>,
    private readonly imageGateway: ImageGateway,
    private readonly aiImageService: AIImageService,
    private readonly fileStorageService: FileStorageService,
    private readonly storyRepository: StoryRepository,
    @InjectQueue('image-generation') private imageQueue: Queue,
    private readonly zipHelper: ZipHelper,
  ) {}

  // New method to enqueue image generation job
  async enqueueImageGeneration(storyId: string, userId: string, generateImagesDto: GenerateImagesDto): Promise<{ message: string; jobId: string }> {
    try {
      const story = await this.storyRepository.findById(storyId);
      if (!story) {
        throw new Error('Story not found');
      }
      if (story.userId.toString() !== userId) {
        throw new Error('You are not authorized to generate images for this story');
      }

      // Add job to queue
      const job = await this.imageQueue.add({ 
        storyId, 
        userId,
        generateImagesDto
      });

      this.logger.log(`Image generation job queued for story ID: ${storyId}, Job ID: ${job.id}`);
      
      return { 
        message: 'Image generation job has been queued successfully', 
        jobId: job.id.toString() 
      };
    } catch (error) {
      this.logger.error('Error queuing image generation:', error);
      throw error;
    }
  }

  // Existing generateImages method (used by processor)
  async generateImages(
    storyId: string,
    user: UserDocument,
    generateImagesDto: GenerateImagesDto
  ): Promise<ImageProcessingResponseDto> {
    try {
      // Get story content
      const story = await this.storyRepository.findById(storyId);
      if (!story) {
        throw new NotFoundException('Story not found');
      }

      if (!story.generatedContent) {
        throw new BadRequestException('Story content not generated yet');
      }
      if(story.userId.toString() !== user._id.toString()) {
        throw new BadRequestException('You are not authorized to generate images for this story');
      }

      // Default configuration
      const config = {
        artStyle: 'realistic',
        imageSize: '1024x1024',
        maxWordsPerChunk: generateImagesDto.maxWordsPerChunk || 500,
        aiModel: 'gemini',
        quality : 'standard'
      };
      const { artStyle, imageSize, maxWordsPerChunk, aiModel, quality } = config;

      // Generate master prompt from entire story content
      this.logger.log('Generating master prompt for story consistency...');
      const masterPrompt = await this.aiImageService.generateMasterPrompt(story.generatedContent, generateImagesDto.customPrompt);
      // Split content into chunks
      const chunks = this.splitContentIntoChunks(story.generatedContent, maxWordsPerChunk);

      // Emit start event
      this.imageGateway.emitImageProcessingStart(storyId, {
        storyId,
        message: `Starting image generation for ${chunks.length} chunks with master prompt consistency`
      });

      const imageChunks: any[] = [];
      const startTime = Date.now();

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Emit progress event
        this.imageGateway.emitImageProcessingProgress(storyId, {
          storyId,
          progress: (i / chunks.length) * 100,
          chunk: i + 1,
          totalChunks: chunks.length
        });

        const chunkPrompt = await this.aiImageService.generateChunkPrompt(chunk, masterPrompt);
        try {
          console.log('Generating chunk prompt for chunk', i);
          // Generate chunk-specific prompt using master prompt
          this.logger.log(`Generating prompt for chunk ${i + 1}/${chunks.length}...`);
          
            // Generate multiple images with retry logic for policy violations
            const imageResult = await this.aiImageService.generateImages(chunkPrompt, {
              size: imageSize,
              quality,
              model: aiModel,
              numberOfImages: 1,
              storyId // Pass storyId for automatic file saving
            },
            i,
            story.title || `Story_${storyId}`
          );

            this.logger.log(`Generated ${imageResult.totalImages} images for chunk ${i}`);

            // Validate image generation result
            if (!imageResult.images || imageResult.images.length === 0) {
              throw new Error('No images were generated');
            }

            // Use saved image paths from AI service
            const savedImagePaths = imageResult.savedImagePaths || [];
            const primaryImagePath = savedImagePaths[0] || '';

          // Validate that we have a primary image path
          if (!primaryImagePath) {
            throw new Error('Failed to save primary image');
          }

          // Create image chunk record with primary image and variants
          const imageChunk = await this.imageChunkRepository.create({
            storyId,
            chunkIndex: i,
            content: chunk,
            imageFile: primaryImagePath,
            prompt: chunkPrompt,
            status: 'completed',
            style: {
              artStyle,
              masterPrompt, // Store master prompt for consistency tracking
              imageVariants: savedImagePaths.slice(1) // Store additional variants
            },
            metadata: {
              aiModel,
              imageSize,
              processingTime: Date.now() - startTime,
              quality,
              masterPromptGenerated: true,
              totalImagesGenerated: imageResult.totalImages
            }
          });

          imageChunks.push(imageChunk);
          this.logger.log(`Successfully generated image for chunk ${i + 1}`);
        } catch (error) {
          console.error(`Error generating image for chunk ${i}:`, error);
          // Create failed record with a placeholder image path to satisfy validation
          await this.imageChunkRepository.create({
            storyId,
            chunkIndex: i,
            content: chunk,
            imageFile: 'failed_generation', // Use placeholder to satisfy required field
            prompt: chunkPrompt,
            status: 'failed',
            style: { artStyle },
            metadata: {
              aiModel,
              imageSize,
              processingTime: 0,
              quality,
              error: `Failed after 3 retry attempts: ${error.message}`
            }
          });

          // Emit error event
          this.imageGateway.emitImageProcessingError(storyId, {
            storyId,
            error: error.message
          });
        }
      }

      // Update story status
      await this.storyRepository.update(storyId, {
        status: {  imagesGenerated: true, storyGenerated: true }
      });

      // Get processing stats
      const stats = await this.imageChunkRepository.getProcessingStats(storyId);

      // Emit complete event
      this.imageGateway.emitImageProcessingComplete(storyId, {
        storyId,
        imageUrl: '', // Will be updated when file serving is implemented
        description: `Generated ${stats.total} images successfully with master prompt consistency`
      });

      return {
        storyId,
        totalImages: stats.total,
        completedImages: stats.completed,
        failedImages: stats.failed,
        processingImages: stats.processing,
        pendingImages: stats.pending,
        progress: 100
      };
    } catch (error) {
      console.trace(error);
      // Emit error event
      this.imageGateway.emitImageProcessingError(storyId, {
        storyId,
        error: error.message
      });
      throw error;
    }
  }

  async getImageChunks(storyId: string): Promise<ImageChunkResponseDto[]> {
    // Query for both string and ObjectId formats to handle existing data
    const imageChunks = await this.imageChunkModel.find({
      $or: [
        { storyId: storyId },
        { storyId: new Types.ObjectId(storyId) }
      ]
    });
    return imageChunks.map(chunk => this.transformToResponseDto(chunk));
  }

  // retryImageChunk
  async retryImageChunk(id: string) {
    const imageChunk = await this.imageChunkRepository.findById(id);
    if (!imageChunk) {
      throw new NotFoundException('Image chunk not found');
    }

    // Check if the chunk is already completed
    if (imageChunk.status === 'completed') {
      throw new BadRequestException('Image chunk is already completed');
    }

    // Retry logic using AI service
    try {
      const story = await this.storyRepository.findById(Object(imageChunk.storyId));
      if (!story || !story.generatedContent) {
        throw new BadRequestException('Story content not found for retry');
      }

      // Generate master prompt for consistency
      const masterPrompt = await this.aiImageService.generateMasterPrompt(story.generatedContent, '');

      // Generate new chunk prompt using master prompt
      const chunkPrompt = await this.aiImageService.generateChunkPrompt(imageChunk.content, masterPrompt);
      // Ensure the prompt is sanitized
      const sanitizedPrompt = await this.aiImageService.sanitizePrompt(chunkPrompt);
      // Use enhanced retry logic from AI service
      const imageResult = await this.aiImageService.generateImages(sanitizedPrompt, {
        size: imageChunk.metadata.imageSize,
        quality: imageChunk.metadata.quality,
        model: imageChunk.metadata.aiModel,
        numberOfImages: 1,
        storyId:  Object(imageChunk.storyId),      
      },
      imageChunk.chunkIndex,
      story.title || `Story_${imageChunk.storyId}`
    );
      // Use saved image paths from AI service
      const savedImagePaths = imageResult.savedImagePaths || [];
      const primaryImagePath = savedImagePaths[0] || '';
      if (!primaryImagePath) {
        throw new BadRequestException('Failed to save primary image after retry');
      }
      // Update image chunk with new data
      await this.imageChunkRepository.update(id, {
        imageFile: primaryImagePath,
        prompt: sanitizedPrompt,
        status: 'completed',
        style: {
          ...imageChunk.style,
          masterPrompt,
          imageVariants: savedImagePaths.slice(1) // Store additional variants
        },
        metadata: {
          ...imageChunk.metadata,
          processingTime: Date.now() - (imageChunk as any).createdAt?.getTime() || 0,
          masterPromptGenerated: true,
          totalImagesGenerated: imageResult.totalImages
        }
      });
    } catch (error) {
      console.error(`Error retrying image chunk ${id}:`, error);
      throw new BadRequestException(`Failed to retry image chunk: ${error.message}`);
    }

  }

  async getImageChunk(id: string): Promise<ImageChunkResponseDto> {
    const imageChunk = await this.imageChunkRepository.findById(id);
    if (!imageChunk) {
      throw new NotFoundException('Image chunk not found');
    }
    return this.transformToResponseDto(imageChunk);
  }

  async getProcessingStatus(storyId: string): Promise<ImageProcessingResponseDto> {
    const stats = await this.imageChunkRepository.getProcessingStats(storyId);
    const images = await this.imageChunkRepository.findByStoryId(storyId);
    
    const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    return {
      storyId,
      totalImages: stats.total,
      completedImages: stats.completed,
      failedImages: stats.failed,
      processingImages: stats.processing,
      pendingImages: stats.pending,
      progress,
      images: images.map(img => this.transformToResponseDto(img))
    };
  }

  async retryFailedImages(storyId: string): Promise<ImageProcessingResponseDto> {
    const failedImages = await this.imageChunkRepository.findByStoryIdAndStatus(storyId, 'failed');
    
    if (failedImages.length === 0) {
      throw new BadRequestException('No failed images to retry');
    }

    // Get story content for master prompt generation
    const story = await this.storyRepository.findById(storyId);
    if (!story || !story.generatedContent) {
      throw new BadRequestException('Story content not found for retry');
    }

    // Generate master prompt for consistency
    const masterPrompt = await this.aiImageService.generateMasterPrompt(story.generatedContent, '');

    // Retry each failed image
    for (const failedImage of failedImages as ImageChunkDocument[]) {
      try {
        // Generate new chunk prompt using master prompt
        const chunkPrompt = await this.aiImageService.generateChunkPrompt(failedImage.content, masterPrompt);
        
        // Use enhanced retry logic from AI service
        const imageResult = await this.aiImageService.generateImages(chunkPrompt, {
          size: failedImage.metadata.imageSize,
          quality: failedImage.metadata.quality,
          model: failedImage.metadata.aiModel,
          numberOfImages: 4,
          storyId // Pass storyId for automatic file saving
        },
        failedImage.chunkIndex,
        story.title || `Story_${storyId}`
      );

        // Use saved image paths from AI service
        const savedImagePaths = imageResult.savedImagePaths || [];
        const primaryImagePath = savedImagePaths[0] || '';

        await this.imageChunkRepository.update(failedImage._id.toString(), {
          imageFile: primaryImagePath,
          prompt: chunkPrompt,
          status: 'completed',
          style: {
            ...failedImage.style,
            masterPrompt,
            imageVariants: savedImagePaths.slice(1)
          },
          metadata: {
            ...failedImage.metadata,
            processingTime: Date.now() - (failedImage as any).createdAt?.getTime() || 0,
            masterPromptGenerated: true,
            totalImagesGenerated: imageResult.totalImages
          }
        });
      } catch (error) {
        console.error(`Error retrying image chunk ${failedImage.chunkIndex}:`, error);
        
        // Update failed record with error and mark as failed after retries
        await this.imageChunkRepository.update(failedImage._id.toString(), {
          metadata: {
            ...failedImage.metadata,
            error: `Retry failed after 3 attempts: ${error.message}`
          }
        });
      }
    }

    return this.getProcessingStatus(storyId);
  }

  async deleteImageChunk(id: string): Promise<void> {
    const imageChunk = await this.imageChunkRepository.findById(id);
    if (!imageChunk) {
      throw new NotFoundException('Image chunk not found');
    }

    // Delete file from storage
    if (imageChunk.imageFile) {
      await this.fileStorageService.deleteFile(imageChunk.imageFile);
    }

    await this.imageChunkRepository.delete(id);
  }

  async deleteAllImages(storyId: string): Promise<void> {
    const imageChunks = await this.imageChunkRepository.findByStoryId(storyId);
    
    // Delete all files from storage
    for (const chunk of imageChunks) {
      if (chunk.imageFile) {
        await this.fileStorageService.deleteFile(chunk.imageFile);
      }
    }

    await this.imageChunkRepository.deleteByStoryId(storyId);
  }

  private splitContentIntoChunks(content: string, maxWordsPerChunk: number): string[] {
    const words = content.split(/\s+/);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += maxWordsPerChunk) {
      const chunk = words.slice(i, i + maxWordsPerChunk).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
    }

    return chunks;
  }

 
  private transformToResponseDto(imageChunk: any): ImageChunkResponseDto {
    return {
      _id: imageChunk._id.toString(),
      storyId: imageChunk.storyId.toString(),
      chunkIndex: imageChunk.chunkIndex,
      imageFile: imageChunk.imageFile,
      status: imageChunk.status,
      style: imageChunk.style,
      metadata: imageChunk.metadata,
      createdAt: imageChunk.createdAt,
      updatedAt: imageChunk.updatedAt
    };
  }

  async downloadImagesAsZip(storyId: string, userId: string): Promise<{ zipPath: string; filename: string }> {
    try {
      // Verify story exists and user has access
      const story = await this.storyRepository.findById(storyId);
      if (!story) {
        throw new NotFoundException('Story not found');
      }
      if (story.userId.toString() !== userId) {
        throw new BadRequestException('You are not authorized to download images for this story');
      }

      // Get all image chunks for the story
      const imageChunks = await this.getImageChunks(storyId);
      
      if (imageChunks.length === 0) {
        throw new NotFoundException('No images found for this story');
      }

      // Use ZIP helper to create the archive
      return this.zipHelper.createStoryImagesZip(storyId, story.title, imageChunks);
    } catch (error) {
      this.logger.error('Error creating ZIP file:', error);
      throw error;
    }
  }
} 