import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  Request,
  Query
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth
} from '@nestjs/swagger';
import { StoriesService } from '@/modules/stories/stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { StoryResponseDto } from './dto/story-response.dto';
import { Auth } from '@/common/decorators/auth.decorator';
import { PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { GenerateStoryDto } from './dto/generate-story.dto';
import { PageOptionDto } from './dto/page-option.dto';
import { BatchCreateStoryDto } from './dto/batch-create-story.dto';

@ApiTags('stories')
@Controller('stories')
@ApiBearerAuth()
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Get all stories with pagination, filter, and search' })
  @ApiResponse({ 
    status: 200, 
    description: 'Paginated list of stories',
    type: PaginatedResponseDto<StoryResponseDto>
  })    
  async findAll(
    @Request() req,
    @Query() paginationDto: PageOptionDto,
  ): Promise<PaginatedResponseDto<StoryResponseDto>> {
    return this.storiesService.findAll(paginationDto);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get story by ID' })
  @ApiParam({ 
    name: 'id', 
    description: 'Story ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Story details',
    type: StoryResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Story not found' 
  })
  async findOne(@Param('id') id: string, @Request() req): Promise<StoryResponseDto> {
    // TODO: Check if user owns this story or has permission
    return this.storiesService.findById(id);
  }

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Create a new story with file URL' })
  @ApiResponse({ 
    status: 201, 
    description: 'Story created successfully',
    type: StoryResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid data' 
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createStoryDto: CreateStoryDto,
    @Request() req,
  ): Promise<StoryResponseDto> {
    // Pass user to service for userId validation
    return this.storiesService.create(createStoryDto, req.user);
  }

  @Post('batch-create')
  @Auth()
  @ApiOperation({ summary: 'Create multiple stories from multiple files with batch processing' })
  @ApiResponse({ 
    status: 201, 
    description: 'Batch story creation job queued successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Batch story creation queued successfully' },
        data: {
          type: 'object',
          properties: {
            batchId: { type: 'string', example: 'batch_123' },
            totalStories: { type: 'number', example: 5 },
            autoMode: { type: 'boolean', example: true },
            jobId: { type: 'string', example: 'job_456' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid data or too many files' 
  })
  @HttpCode(HttpStatus.CREATED)
  async batchCreate(
    @Body() batchCreateStoryDto: BatchCreateStoryDto,
    @Request() req,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      batchId: string;
      totalStories: number;
      autoMode: boolean;
      jobId: string;
    };
  }> {
    return this.storiesService.enqueueBatchStoryCreation(batchCreateStoryDto, req.user?.sub);
  }

  @Get('batch/:batchId/status')
  @Auth()
  @ApiOperation({ summary: 'Get batch processing status' })
  @ApiParam({ 
    name: 'batchId', 
    description: 'Batch ID',
    example: 'batch_123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Batch status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        batchId: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
        totalStories: { type: 'number' },
        completedStories: { type: 'number' },
        failedStories: { type: 'number' },
        progress: { type: 'number' },
        storyIds: { type: 'array', items: { type: 'string' } },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Batch not found' 
  })
  async getBatchStatus(
    @Param('batchId') batchId: string,
    @Request() req,
  ): Promise<{
    batchId: string;
    status: string;
    totalStories: number;
    completedStories: number;
    failedStories: number;
    progress: number;
    storyIds: string[];
    errors: string[];
  }> {
    return this.storiesService.getBatchStatus(batchId, req.user?.sub);
  }

  @Post(':id/generate')
  @Auth()
  @ApiOperation({ summary: 'Queue story generation with AI (with optional auto mode)' })
  @ApiParam({ 
    name: 'id', 
    description: 'Story ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Story generation job queued successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Story generation job has been queued successfully' },
        jobId: { type: 'string', example: '123' },
        autoMode: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Story not found' 
  })
  @ApiBody({
    type: GenerateStoryDto,
    description: 'Generate story with AI (auto mode will be added to this DTO)'
  })
  async generateStory(
    @Body() generateStoryDto: GenerateStoryDto,
    @Param('id') id: string,
    @Request() req,
  ): Promise<{ message: string; jobId: string; autoMode?: boolean }> {
    return this.storiesService.enqueueStoryGeneration(id, generateStoryDto, req.user?.sub);
  }
} 