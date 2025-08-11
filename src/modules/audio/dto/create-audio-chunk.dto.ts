import { IsString, IsNumber, IsOptional, IsEnum, IsObject, ValidateNested, Min, MaxLength, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { AudioFormat, VoiceOption } from '../constant/type';
import { VoiceModel } from '@/database/schemas/batch-job.schema';

export class AudioStyleDto {

  @IsEnum(VoiceOption)
  voiceStyle: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  voiceDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  toneDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  masterPrompt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  audioVariants?: string[];
}

export class AudioMetadataDto {
  @IsEnum(VoiceModel)
  aiModel: string;

  @IsEnum(AudioFormat)
  audioFormat: string;

  @IsOptional()
  @IsNumber()
  processingTime?: number;

  @IsEnum(['standard', 'hd'])
  quality: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  masterPromptGenerated?: boolean;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsNumber()
  totalAudioGenerated?: number;
}

export class CreateAudioChunkDto {
  @IsString()
  storyId: string;

  @IsNumber()
  @Min(0)
  chunkIndex: number;

  @IsString()
  @MaxLength(2000)
  content: string;

  @IsString()
  audioFile: string;


  @IsOptional()
  @IsEnum(['pending', 'processing', 'completed', 'failed'])
  status?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AudioStyleDto)
  style?: AudioStyleDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AudioMetadataDto)
  metadata?: AudioMetadataDto;
} 