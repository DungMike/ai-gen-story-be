import { IsString, IsNumber, IsOptional, IsEnum, IsObject, ValidateNested, Min, MaxLength, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class ImageStyleDto {
  @IsEnum(['realistic', 'anime', 'comic', 'watercolor', 'oil-painting', 'digital-art'])
  artStyle: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  characterDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  backgroundDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  masterPrompt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageVariants?: string[];
}

export class ImageMetadataDto {
  @IsEnum(['gemini', 'dalle-3', 'midjourney'])
  aiModel: string;

  @IsEnum(['512x512', '1024x1024', '1024x768', '768x1024'])
  imageSize: string;

  @IsOptional()
  @IsNumber()
  processingTime?: number;

  @IsEnum(['standard', 'hd'])
  quality: string;

  @IsOptional()
  @IsString()
  masterPromptGenerated?: boolean;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsNumber()
  totalImagesGenerated?: number;
}

export class CreateImageChunkDto {
  @IsString()
  storyId: string;

  @IsNumber()
  @Min(0)
  chunkIndex: number;

  @IsString()
  @MaxLength(2000)
  content: string;

  @IsString()
  imageFile: string;

  @IsString()
  @MaxLength(1000)
  prompt: string;

  @IsOptional()
  @IsEnum(['pending', 'processing', 'completed', 'failed'])
  status?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ImageStyleDto)
  style?: ImageStyleDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ImageMetadataDto)
  metadata?: ImageMetadataDto;
} 