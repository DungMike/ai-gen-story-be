import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AudioService } from './audio.service';
import { AudioChunkResponseDto, AudioGenerationStatusResponseDto, AudioDownloadResponseDto } from './dto/audio-response.dto';
import { AudioGenerateDto } from './dto/audio-generate.dto';
import { ZipHelper } from '../../helpers/zip.helper';

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

  @Get('download/:storyId')
  @Auth()
  @ApiOperation({ summary: 'Download all audio chunks as ZIP file for a story' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'Audio files downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  @ApiResponse({ status: 400, description: 'No audio files found' })
  async downloadAudioFiles(
    @Param('storyId') storyId: string,
    @CurrentUser() user: any
  ): Promise<AudioDownloadResponseDto> {
    return this.audioService.downloadAudioFiles(storyId);
  }

  @Get('merge/download/:storyId')
  @Auth()
  @ApiOperation({ summary: 'Download merged audio file for a story (auto-merge if needed)' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'Merged audio file downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  @ApiResponse({ status: 400, description: 'No audio chunks found or merge failed' })
  async downloadMergedAudio(
    @Param('storyId') storyId: string,
    @CurrentUser() user: any
  ): Promise<AudioDownloadResponseDto> {
    return this.audioService.downloadMergedAudio(storyId);
  }

  @Delete('merge/:storyId')
  @Auth()
  @ApiOperation({ summary: 'Delete merged audio file for a story' })
  @ApiParam({ name: 'storyId', description: 'Story ID' })
  @ApiResponse({ status: 200, description: 'Merged audio file deleted successfully' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  async deleteMergedAudio(
    @Param('storyId') storyId: string,
    @CurrentUser() user: any
  ): Promise<{ success: boolean; message: string }> {
    await this.audioService.deleteMergedAudio(storyId);
    return {
      success: true,
      message: 'Merged audio file deleted successfully'
    };
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