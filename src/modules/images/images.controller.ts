import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body, Res,
  HttpStatus,
  HttpException
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ImagesService } from './images.service';
import { ImageChunkResponseDto, ImageProcessingResponseDto } from './dto/image-response.dto';
import { ZipHelper } from '../../helpers/zip.helper';
import { GenerateImagesDto } from './dto/generate-image.dto';

@ApiTags('Images')
@Controller('images')
@ApiBearerAuth()
export class ImagesController {
  constructor(
    private readonly imagesService: ImagesService,
    private readonly zipHelper: ZipHelper
  ) {}

  @Post('generate/:storyId')
  @Auth()
  @ApiOperation({ summary: 'Queue image generation for a story' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Image generation job queued successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Image generation job has been queued successfully' },
        jobId: { type: 'string', example: '123' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Story not found' })
  @ApiResponse({ status: 400, description: 'Story content not generated yet' })
  async generateImages(
    @Param('storyId') storyId: string,
    @Body() generateImagesDto: GenerateImagesDto,
    @CurrentUser() user: any
  ): Promise<{ message: string; jobId: string }> {
    return this.imagesService.enqueueImageGeneration(storyId, user.sub, generateImagesDto);
  }

  @Get('story/:storyId')
  @Auth()
  @ApiOperation({ summary: 'Get all images for a story' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'Images retrieved successfully', type: [ImageChunkResponseDto] })
  async getImageChunks(
    @Param('storyId') storyId: string,
    @CurrentUser() user: any
  ): Promise<ImageChunkResponseDto[]> {
    return this.imagesService.getImageChunks(storyId);
  }

  @Get('chunk/:id')
  @Auth()
  @ApiOperation({ summary: 'Get a specific image chunk' })
  @ApiParam({ name: 'id', description: 'Image chunk ID' })
  @ApiResponse({ status: 200, description: 'Image chunk retrieved successfully', type: ImageChunkResponseDto })
  @ApiResponse({ status: 404, description: 'Image chunk not found' })
  async getImageChunk(
    @Param('id') id: string,
    @CurrentUser() user: any
  ): Promise<ImageChunkResponseDto> {
    return this.imagesService.getImageChunk(id);
  }

  @Get('status/:storyId')
  @Auth()
  @ApiOperation({ summary: 'Get image processing status for a story' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'Status retrieved successfully', type: ImageProcessingResponseDto })
  async getProcessingStatus(
    @Param('storyId') storyId: string,
    @CurrentUser() user: any
  ): Promise<ImageProcessingResponseDto> {
    return this.imagesService.getProcessingStatus(storyId);
  }

  @Post('retry/:storyId')
  @Auth()
  @ApiOperation({ summary: 'Retry failed images for a story' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'Failed images retried successfully', type: ImageProcessingResponseDto })
  @ApiResponse({ status: 400, description: 'No failed images to retry' })
  async retryFailedImages(
    @Param('storyId') storyId: string,
    @CurrentUser() user: any
  ): Promise<ImageProcessingResponseDto> {
    return this.imagesService.retryFailedImages(storyId);
  }

  // retry chunk
  @Post('retry-chunk/:id')
  @Auth()
  @ApiOperation({ summary: 'Retry a specific image chunk' })
  @ApiParam({ name: 'id', description: 'Image chunk ID' })
  @ApiResponse({ status: 200, description: 'Image chunk retried successfully', type: ImageChunkResponseDto })
  @ApiResponse({ status: 404, description: 'Image chunk not found' })
  async retryImageChunk(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.imagesService.retryImageChunk(id);
  }

  @Delete('chunk/:id')
  @Auth()
  @ApiOperation({ summary: 'Delete a specific image chunk' })
  @ApiParam({ name: 'id', description: 'Image chunk ID' })
  @ApiResponse({ status: 200, description: 'Image chunk deleted successfully' })
  @ApiResponse({ status: 404, description: 'Image chunk not found' })
  async deleteImageChunk(
    @Param('id') id: string,
    @CurrentUser() user: any
  ): Promise<{ message: string }> {
    await this.imagesService.deleteImageChunk(id);
    return { message: 'Image chunk deleted successfully' };
  }

  @Delete('story/:storyId')
  @Auth()
  @ApiOperation({ summary: 'Delete all images for a story' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'All images deleted successfully' })
  async deleteAllImages(
    @Param('storyId') storyId: string,
    @CurrentUser() user: any
  ): Promise<{ message: string }> {
    await this.imagesService.deleteAllImages(storyId);
    return { message: 'All images deleted successfully' };
  }

  @Get('download/:storyId')
  @Auth()
  @ApiOperation({ summary: 'Download all images for a story as ZIP' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'Images downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  @ApiResponse({ status: 400, description: 'No images found for this story' })
  async downloadImages(
    @Param('storyId') storyId: string,
    @Res() res: Response,
    @CurrentUser() user: any
  ): Promise<void> {
    try {
      const { zipPath, filename } = await this.imagesService.downloadImagesAsZip(storyId, user.sub);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Stream the file to the response
      const fileStream = require('fs').createReadStream(zipPath);
      fileStream.pipe(res);
      
      // Clean up the temp file after streaming
      fileStream.on('end', () => {
        this.zipHelper.cleanupZipFile(zipPath);
      });
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to download images', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('preview/:id')
  @Auth()
  @ApiOperation({ summary: 'Get image preview' })
  @ApiParam({ name: 'id', description: 'Image chunk ID' })
  @ApiResponse({ status: 200, description: 'Image preview retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Image chunk not found' })
  async getImagePreview(
    @Param('id') id: string,
    @Res() res: Response,
    @CurrentUser() user: any
  ): Promise<void> {
    try {
      const imageChunk = await this.imagesService.getImageChunk(id);
      
      if (!imageChunk.imageFile) {
        throw new HttpException('Image file not found', HttpStatus.NOT_FOUND);
      }

      // This would need to be implemented with file serving
      // For now, we'll return the file path
      res.status(HttpStatus.OK).json({
        imageFile: imageChunk.imageFile,
        message: 'Image preview endpoint - implement file serving'
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to get image preview', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 