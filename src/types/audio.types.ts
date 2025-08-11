import { VoiceModel } from '@/database/schemas/batch-job.schema';

export interface AudioVoiceSettings {
  speed: number;
  pitch: number;
}

export interface AudioMetadata {
  voiceModel: VoiceModel;
  language: string;
  processingTime: number;
  voiceSettings: AudioVoiceSettings;
}

export interface AudioChunk {
  _id?: string;
  storyId: string;
  chunkIndex: number;
  content: string;
  audioFile: string;
  duration: number;
  wordCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: AudioMetadata;
  createdAt: Date;
}

export interface CreateAudioDto {
  storyId: string;
  maxWordsPerChunk?: number;
  voiceModel?: VoiceModel;
  voiceSettings?: Partial<AudioVoiceSettings>;
}

export interface AudioResponseDto {
  _id: string;
  storyId: string;
  chunkIndex: number;
  content: string;
  audioFile: string;
  duration: number;
  wordCount: number;
  status: string;
  metadata: AudioMetadata;
  createdAt: Date;
}

export interface AudioProcessingData {
  storyId: string;
  totalChunks: number;
  maxWordsPerChunk: number;
  voiceModel: string;
  estimatedTime: number;
  timestamp: Date;
}

export interface AudioProgressData {
  storyId: string;
  progress: number;
  step: 'audio';
  currentChunk: number;
  totalChunks: number;
  generatedAudio: number;
  totalAudio: number;
  estimatedTimeRemaining: number;
  timestamp: Date;
}

export interface AudioCompleteData {
  storyId: string;
  totalAudioFiles: number;
  totalDuration: number;
  processingTime: number;
  timestamp: Date;
}

export interface AudioErrorData {
  storyId: string;
  error: string;
  step: 'audio';
  chunkIndex?: number;
  timestamp: Date;
} 