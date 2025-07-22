import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Res,
  HttpStatus,
  HttpException
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AudioService } from './audio.service';
import { AudioChunkResponseDto, AudioGenerationResponseDto, AudioGenerationStatusResponseDto, AudioDownloadResponseDto, VoiceOptionsResponseDto } from './dto/audio-response.dto';
import { CreateAudioChunkDto } from './dto/create-audio-chunk.dto';
import { AudioGenerateDto } from './dto/audio-generate.dto';
import { ZipHelper } from '../../helpers/zip.helper';
import { VoiceOption } from './constant/type';

@ApiTags('Audio')
@Controller('audio')
@ApiBearerAuth()
export class AudioController {
  constructor(
    private readonly audioService: AudioService,
    private readonly zipHelper: ZipHelper
  ) {}

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Get all audio chunks' })
  @ApiResponse({ status: 200, description: 'Audio chunks retrieved successfully' })
  async findAll(): Promise<AudioChunkResponseDto[]> {
    return this.audioService.findAll() as any;
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get audio chunk by ID' })
  @ApiParam({ name: 'id', description: 'Audio chunk ID' })
  @ApiResponse({ status: 200, description: 'Audio chunk retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Audio chunk not found' })
  async findOne(@Param('id') id: string): Promise<AudioChunkResponseDto> {
    return this.audioService.findById(id) as any;
  }

  @Get('story/:storyId')
  @Auth()
  @ApiOperation({ summary: 'Get all audio chunks for a story' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'Audio chunks retrieved successfully' })
  async findByStoryId(@Param('storyId') storyId: string): Promise<AudioChunkResponseDto[]> {
    return this.audioService.findByStoryId(storyId) as any;
  }

  @Post('generate/:storyId')
  @Auth()
  @ApiOperation({ summary: 'Queue audio generation for a story' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Audio generation job queued successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Audio generation job has been queued successfully' },
        jobId: { type: 'string', example: '123' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Story not found' })
  @ApiResponse({ status: 400, description: 'Story content not generated yet' })
  async generateAudioForStory(
    @Param('storyId') storyId: string,
    @Body() audioGenerateDto: AudioGenerateDto,
    @CurrentUser() user: any
  ): Promise<{ message: string; jobId: string }> {
    return this.audioService.enqueueAudioGeneration(
      storyId, 
      user.sub,
      audioGenerateDto.voiceStyle,
      audioGenerateDto.wordPerChunk
    );
  }

  @Get('status/:storyId')
  @Auth()
  @ApiOperation({ summary: 'Get audio generation status for a story' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'Status retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getAudioGenerationStatus(
    @Param('storyId') storyId: string
  ): Promise<AudioGenerationStatusResponseDto> {
    return this.audioService.getAudioGenerationStatus(storyId);
  }

  // @Post('retry/:storyId')
  // @Auth()
  // @ApiOperation({ summary: 'Retry failed audio chunks for a story' })
  // @ApiParam({ name: 'storyId', description: 'Story ID' })
  // @ApiResponse({ status: 200, description: 'Retry started successfully' })
  // @ApiResponse({ status: 400, description: 'Bad request' })
  // async retryFailedAudioChunks(
  //   @Param('storyId') storyId: string,
  //   @CurrentUser() user: any
  // ): Promise<AudioGenerationResponseDto> {
  //   return this.audioService.retryFailedAudioChunks(storyId);
  // }

  @Get('download/:storyId')
  @Auth()
  @ApiOperation({ summary: 'Download all audio files for a story as ZIP' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'Audio files downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  @ApiResponse({ status: 400, description: 'No audio files found for this story' })
  async downloadAudioFiles(
    @Param('storyId') storyId: string,
    @Res() res: Response,
    @CurrentUser() user: any
  ): Promise<void> {
    try {
      const result = await this.audioService.downloadAudioFiles(storyId);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.fileName}"`);
      
      // Stream the file to the response
      const fileStream = require('fs').createReadStream(result.data.downloadUrl.replace('/api/audio/download/', 'temp/'));
      fileStream.pipe(res);
      
      // Clean up the temp file after streaming
      fileStream.on('end', () => {
        this.zipHelper.cleanupZipFile(result.data.downloadUrl.replace('/api/audio/download/', 'temp/'));
      });
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to download audio files', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  @Auth()
  @ApiOperation({ summary: 'Delete an audio chunk' })
  @ApiParam({ name: 'id', description: 'Audio chunk ID' })
  @ApiResponse({ status: 200, description: 'Audio chunk deleted successfully' })
  @ApiResponse({ status: 404, description: 'Audio chunk not found' })
  async remove(@Param('id') id: string): Promise<AudioChunkResponseDto> {
    return this.audioService.remove(id) as any;
  }

  @Delete('story/:storyId')
  @Auth()
  @ApiOperation({ summary: 'Delete all audio chunks for a story' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'Audio chunks deleted successfully' })
  async removeByStoryId(@Param('storyId') storyId: string): Promise<void> {
    return this.audioService.deleteAudioChunksByStoryId(storyId);
  }

  @Get('chunk/:storyId/:chunkIndex')
  @Auth()
  @ApiOperation({ summary: 'Get audio chunk by story ID and chunk index' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiParam({ name: 'chunkIndex', description: 'Chunk index' })
  @ApiResponse({ status: 200, description: 'Audio chunk retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Audio chunk not found' })
  async getAudioChunkByStoryIdAndIndex(
    @Param('storyId') storyId: string,
    @Param('chunkIndex') chunkIndex: number
  ): Promise<AudioChunkResponseDto> {
    return this.audioService.getAudioChunkByStoryIdAndIndex(storyId, chunkIndex) as any;
  }

  // @Get('voices')
  // @Auth()
  // @ApiOperation({ summary: 'Get available voice options' })
  // @ApiResponse({ status: 200, description: 'Voice options retrieved successfully', type: VoiceOptionsResponseDto })
  // async getVoiceOptions(): Promise<VoiceOptionsResponseDto> {
  //   return this.audioService.getVoiceOptions();
  // }
} 