export interface ImageStyle {
  artStyle: 'realistic' | 'anime' | 'comic' | 'watercolor' | 'oil-painting' | 'digital-art';
  characterDescription?: string;
  backgroundDescription?: string;
}

export interface ImageMetadata {
  aiModel: 'gemini' | 'dalle-3' | 'midjourney';
  imageSize: '512x512' | '1024x1024' | '1024x768' | '768x1024';
  processingTime: number;
  quality: 'standard' | 'hd';
}

export interface ImageChunk {
  _id?: string;
  storyId: string;
  chunkIndex: number;
  content: string;
  imageFile: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  style: ImageStyle;
  metadata: ImageMetadata;
  createdAt: Date;
}

export interface CreateImageDto {
  storyId: string;
  artStyle?: string;
  imageSize?: string;
  quality?: 'standard' | 'hd';
}

export interface ImageResponseDto {
  _id: string;
  storyId: string;
  chunkIndex: number;
  content: string;
  imageFile: string;
  prompt: string;
  status: string;
  style: ImageStyle;
  metadata: ImageMetadata;
  createdAt: Date;
}

export interface ImageProcessingData {
  storyId: string;
  totalChunks: number;
  artStyle: string;
  imageSize: string;
  estimatedTime: number;
  timestamp: Date;
}

export interface ImageProgressData {
  storyId: string;
  progress: number;
  step: 'images';
  currentChunk: number;
  totalChunks: number;
  generatedImages: number;
  totalImages: number;
  estimatedTimeRemaining: number;
  timestamp: Date;
}

export interface ImageCompleteData {
  storyId: string;
  totalImages: number;
  processingTime: number;
  timestamp: Date;
}

export interface ImageErrorData {
  storyId: string;
  error: string;
  step: 'images';
  chunkIndex?: number;
  timestamp: Date;
} 