import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, ValidateNested, IsObject } from "class-validator";
import { Type } from 'class-transformer';
import { AutoModeConfigDto } from './batch-create-story.dto';

export class GenerateStoryDto {
  @ApiProperty({
    description: 'Custom prompt for story generation',
    example: 'Write this story in a fantasy style with dragons and magic'
  })
  @IsString()
  @IsNotEmpty()
  customPrompt: string;

  @ApiProperty({
    description: 'Auto mode configuration for automatic image and audio generation',
    type: AutoModeConfigDto,
    required: false
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => AutoModeConfigDto)
  autoMode?: AutoModeConfigDto;
}