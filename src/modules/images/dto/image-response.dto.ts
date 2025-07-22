import { Exclude, Expose, Type } from 'class-transformer';

export class ImageStyleResponseDto {
  @Expose()
  artStyle: string;

  @Expose()
  characterDescription?: string;

  @Expose()
  backgroundDescription?: string;
}

export class ImageMetadataResponseDto {
  @Expose()
  aiModel: string;

  @Expose()
  imageSize: string;

  @Expose()
  processingTime: number;

  @Expose()
  quality: string;
}

export class ImageChunkResponseDto {
  @Expose()
  _id: string;

  @Expose()
  storyId: string;

  @Expose()
  chunkIndex: number;


  @Expose()
  imageFile: string;


  @Expose()
  status: string;

  @Expose()
  @Type(() => ImageStyleResponseDto)
  style: ImageStyleResponseDto;

  @Expose()
  @Type(() => ImageMetadataResponseDto)
  metadata: ImageMetadataResponseDto;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

export class ImageProcessingResponseDto {
  @Expose()
  storyId: string;

  @Expose()
  totalImages: number;

  @Expose()
  completedImages: number;

  @Expose()
  failedImages: number;

  @Expose()
  processingImages: number;

  @Expose()
  pendingImages: number;

  @Expose()
  progress: number;

  @Expose()
  estimatedTimeRemaining?: number;

  @Expose()
  @Type(() => ImageChunkResponseDto)
  images: ImageChunkResponseDto[];
} 