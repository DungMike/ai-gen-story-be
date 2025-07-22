import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StoryStyleResponseDto {
  @ApiProperty({
    enum: ['fantasy', 'romance', 'action', 'mystery', 'sci-fi', 'horror', 'comedy', 'drama'],
    description: 'Genre of the story'
  })
  genre: string;

  @ApiProperty({
    enum: ['dramatic', 'humorous', 'serious', 'romantic', 'mysterious', 'lighthearted'],
    description: 'Tone of the story'
  })
  tone: string;

  @ApiProperty({
    enum: ['short', 'medium', 'long'],
    description: 'Length of the story'
  })
  length: string;

  @ApiProperty({
    enum: ['children', 'teen', 'adult'],
    description: 'Target audience'
  })
  targetAudience: string;
}

export class StoryStatusResponseDto {
  @ApiProperty({
    description: 'Whether the story has been generated'
  })
  storyGenerated: boolean;

  @ApiProperty({
    description: 'Whether audio has been generated'
  })
  audioGenerated: boolean;

  @ApiProperty({
    description: 'Whether images have been generated'
  })
  imagesGenerated: boolean;
}

export class StoryMetadataResponseDto {
  @ApiProperty({
    description: 'Original word count'
  })
  originalWordCount: number;

  @ApiPropertyOptional({
    description: 'Generated word count'
  })
  generatedWordCount?: number;

  @ApiPropertyOptional({
    description: 'Processing time in milliseconds'
  })
  processingTime?: number;

  @ApiProperty({
    description: 'AI model used'
  })
  aiModel: string;
}

export class StoryFilesResponseDto {
  @ApiProperty({
    description: 'URL to original file'
  })
  originalFileUrl: string;

  @ApiPropertyOptional({
    description: 'URL to generated file'
  })
  generatedFileUrl?: string;

  @ApiProperty({
    description: 'Path to original file (internal use)'
  })
  originalFile: string;

  @ApiPropertyOptional({
    description: 'Path to generated file (internal use)'
  })
  generatedFile?: string;
}

export class StoryResponseDto {
  @ApiProperty({
    description: 'Story ID',
    example: '507f1f77bcf86cd799439011'
  })
  _id: string;

  @ApiProperty({
    description: 'Story title',
    example: 'The Adventure Begins'
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Generated content by AI'
  })
  generatedContent?: string;

  @ApiPropertyOptional({
    description: 'Custom prompt used for generation'
  })
  customPrompt?: string;


  @ApiProperty({
    description: 'Story processing status',
    type: StoryStatusResponseDto
  })
  status: StoryStatusResponseDto;

  @ApiProperty({
    description: 'Story metadata',
    type: StoryMetadataResponseDto
  })
  metadata: StoryMetadataResponseDto;


  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  updatedAt: Date;
} 