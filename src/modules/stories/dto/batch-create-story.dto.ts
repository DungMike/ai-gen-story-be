import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, IsBoolean, ValidateNested, IsObject, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AutoModeConfigDto {
  @ApiProperty({
    description: 'Enable auto mode for story generation',
    example: true,
    default: false
  })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({
    description: 'Generate images automatically',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  generateImages?: boolean;

  @ApiProperty({
    description: 'Generate audio automatically',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  generateAudio?: boolean;

  @ApiProperty({
    description: 'Merge audio files automatically',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  mergeAudio?: boolean;


  @ApiProperty({
    description: 'Audio generation voice',
    example: 'Achird',
    default: 'Achird'
  })
  @IsString()
  @IsOptional()
  audioVoice?: string;

  @ApiProperty({
    description: 'Word per chunk',
    example: 500,
    default: 500
  })
  @IsNumber()
  @IsOptional()
  wordPerChunkImage?: number;

  @ApiProperty({
    description: 'Word per chunk',
    example: 500,
    default: 500
  })
  @IsNumber()
  @IsOptional()
  wordPerChunkAudio?: number;

  @ApiProperty({
    description: 'Custom prompt for image generation',
    example: 'Write this story in a fantasy style with dragons and magic',
    required: false
  })
  @IsString()
  @IsOptional()
  customPromptImage?: string;

  @ApiProperty({
    description: 'Custom prompt for audio generation',
    example: 'Write this story in a fantasy style with dragons and magic',
    required: false
  })
  @IsString()
  @IsOptional()
  customPromptAudio?: string;

  @ApiProperty({
    description: 'Image generation style',
    example: 'realistic',
    default: 'realistic',
    enum: ['realistic', 'anime', 'comic', 'watercolor', 'oil-painting', 'digital-art']
  })
  @IsString()
  @IsOptional()
  imageStyle?: string;
}


export class StoryDto {
  @ApiProperty({
    description: 'Story title',
    example: 'The Adventure Begins',
    required: true
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Custom prompt for story generation',
    example: 'Write this story in a fantasy style with dragons and magic',
    required: false
  })
  @IsString()
  @IsOptional()
  customPrompt?: string;

  @ApiProperty({
    description: 'File URL',
    example: 'http://localhost:3001/uploads/original/story.txt',
    required: true
  })
  @IsString()
  @IsOptional()
  fileUrl?: string;
}

export class BatchCreateStoryDto {

  @ApiProperty({
    description: 'Array of stories',
    type: [StoryDto],
    required: true
  })
  @IsArray()
  @ValidateNested()
  @Type(() => StoryDto)
  stories: StoryDto[];


  @ApiProperty({
    description: 'Auto mode configuration',
    type: AutoModeConfigDto,
    required: false
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => AutoModeConfigDto)
  autoMode?: AutoModeConfigDto;
} 