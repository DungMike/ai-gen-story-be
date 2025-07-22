import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class GenerateImagesDto {
  @IsString()
  @ApiProperty({
    description: 'Custom prompt for image generation',
    required: false,
    default: ''
  })
  @IsOptional()
  customPrompt?: string;

  @ApiProperty({
    description: 'Number of words per chunk',
    required: false,
    default: 500
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(100)
  @Max(5000)
  maxWordsPerChunk?: number;
}