import { VoiceModel } from '@/database/schemas/batch-job.schema';

export interface BatchSettings {
  autoMode: boolean;
  generateAudio: boolean;
  generateImages: boolean;
  defaultPrompt?: string;
  customPromptImage?: string;
  customPromptAudio?: string;
  audioSettings?: {
    maxWordsPerChunk: number;
    audioVoice?: string;
    modelVoice?: VoiceModel;
  };
  imageSettings?: {
    artStyle: 'realistic' | 'anime' | 'comic' | 'watercolor';
    imageSize: '512x512' | '1024x1024';
    maxWordsPerChunk: number;
  };
}

export interface BatchResult {
  originalFile: string;
  storyId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  processingTime: number;
}

export interface BatchProgress {
  currentFile: number;
  currentStep: 'story' | 'audio' | 'images';
  percentage: number;
}

export interface BatchJob {
  _id?: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  settings: BatchSettings;
  results: BatchResult[];
  progress: BatchProgress;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface CreateBatchDto {
  files: Express.Multer.File[];
  settings: BatchSettings;
}

export interface BatchResponseDto {
  _id: string;
  userId: string;
  status: string;
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  settings: BatchSettings;
  results: BatchResult[];
  progress: BatchProgress;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface BatchProcessingData {
  jobId: string;
  totalFiles: number;
  settings: BatchSettings;
  estimatedTime: number;
  timestamp: Date;
}

export interface BatchProgressData {
  jobId: string;
  progress: number;
  currentFile: number;
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  currentStep: 'story' | 'audio' | 'images';
  estimatedTimeRemaining: number;
  timestamp: Date;
}

export interface BatchCompleteData {
  jobId: string;
  totalProcessed: number;
  totalFailed: number;
  totalProcessingTime: number;
  timestamp: Date;
}

export interface BatchErrorData {
  jobId: string;
  error: string;
  fileIndex?: number;
  timestamp: Date;
} 