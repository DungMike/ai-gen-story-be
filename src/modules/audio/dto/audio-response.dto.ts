import { Types } from 'mongoose';

export class AudioStyleResponseDto {
  voiceModel: string;
  voiceStyle: string;
  voiceDescription?: string;
  toneDescription?: string;
  masterPrompt?: string;
  audioVariants?: string[];
}

export class AudioMetadataResponseDto {
  aiModel: string;
  audioFormat: string;
  processingTime: number;
  quality: string;
  duration: number;
  masterPromptGenerated?: boolean;
  error?: string;
  totalAudioGenerated?: number;
}

export class AudioChunkResponseDto {
  _id: any;
  storyId: any;
  chunkIndex: number;
  content: string;
  audioFile: string;
  text: string;
  status: string;
  style: AudioStyleResponseDto;
  metadata: AudioMetadataResponseDto;
  createdAt: any;
  updatedAt: any;
}

export class AudioGenerationResponseDto {
  success: boolean;
  message: string;
  data?: {
    audioChunks: AudioChunkResponseDto[];
    totalChunks: number;
    completedChunks: number;
    failedChunks: number;
  };
  error?: string;
}

export class AudioGenerationStatusResponseDto {
  success: boolean;
  message: string;
  data?: {
    storyId: string;
    totalChunks: number;
    completedChunks: number;
    failedChunks: number;
    pendingChunks: number;
    processingChunks: number;
    progress: number;
    estimatedTimeRemaining?: number;
  };
  error?: string;
}

export class AudioDownloadResponseDto {
  success: boolean;
  message: string;
  data?: {
    downloadUrl: string;
    fileName: string;
    fileSize: number;
    totalDuration: number;
  };
  error?: string;
}

export class VoiceOptionDto {
  voice: string;
  style: string;
  tone: string;
  description: string;
}

export class VoiceOptionsResponseDto {
  success: boolean;
  message: string;
  data: {
    voices: VoiceOptionDto[];
    totalVoices: number;
  };
} 