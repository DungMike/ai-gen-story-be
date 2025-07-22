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
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { StoriesService } from '@/modules/stories/stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { StoryResponseDto } from './dto/story-response.dto';
import { Auth } from '@/common/decorators/auth.decorator';
import { User } from '@/database/schemas/user.schema';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { GenerateStoryDto } from './dto/generate-story.dto';
import { PageOptionDto } from './dto/page-option.dto';

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

  @Post(':id/generate')
  @Auth()
  @ApiOperation({ summary: 'Queue story generation with AI' })
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
        jobId: { type: 'string', example: '123' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Story not found' 
  })
  @ApiBody({
    type: GenerateStoryDto,
    description: 'Generate story with AI'
  })
  async generateStory(
    @Body() generateStoryDto: GenerateStoryDto,
    @Param('id') id: string,
    @Request() req,
  ): Promise<{ message: string; jobId: string }> {
    return this.storiesService.enqueueStoryGeneration(id, generateStoryDto, req.user?.sub);
  }
} 