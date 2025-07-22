import { 
  AudioProcessingData, 
  AudioProgressData, 
  AudioCompleteData, 
  AudioErrorData 
} from './audio.types';
import { 
  ImageProcessingData, 
  ImageProgressData, 
  ImageCompleteData, 
  ImageErrorData 
} from './image.types';
import { 
  BatchProcessingData, 
  BatchProgressData, 
  BatchCompleteData, 
  BatchErrorData 
} from './batch.types';
import { DashboardStats, ChartData, ActivityData } from './dashboard.types';

export interface StoryProcessingData {
  storyId: string;
  step: 'story_generation';
  timestamp: Date;
  estimatedTime?: number;
  totalSteps?: number;
}

export interface StoryProgressData {
  storyId: string;
  progress: number;
  step: 'reading_file' | 'ai_processing' | 'saving_file';
  message?: string;
  timestamp: Date;
  currentStep?: number;
  totalSteps?: number;
  estimatedTimeRemaining?: number;
}

export interface StoryCompleteData {
  storyId: string;
  generatedContent: string;
  generatedWordCount: number;
  processingTime: number;
  timestamp: Date;
  originalWordCount?: number;
  filePath?: string;
  success?: boolean;
  wordCount?: number;
  processingTimeMs?: number;
}

export interface StoryErrorData {
  storyId: string;
  error: string;
  step: 'story_generation' | 'reading_file' | 'ai_processing' | 'saving_file';
  timestamp: Date;
  processingTime?: number;
  retryable?: boolean;
  success?: boolean;
}

export interface SocketEvents {
  // Story Processing
  'story:processing:start': StoryProcessingData;
  'story:processing:progress': StoryProgressData;
  'story:processing:complete': StoryCompleteData;
  'story:processing:error': StoryErrorData;

  // Story Room Events
  'joined-story-room': {
    storyId: string;
    story: {
      id: string;
      title: string;
      status: any;
      createdAt: Date;
      updatedAt: Date;
    };
    timestamp: Date;
  };
  'left-story-room': {
    storyId: string;
    timestamp: Date;
  };
  'story-status': {
    storyId: string;
    status: any;
    progress: number;
    lastUpdated: Date;
    timestamp: Date;
  };

  // Error Events
  'error': {
    code: string;
    message: string;
    details?: string;
  };

  // Audio Processing
  'audio:processing:start': AudioProcessingData;
  'audio:processing:progress': AudioProgressData;
  'audio:processing:complete': AudioCompleteData;
  'audio:processing:error': AudioErrorData;

  // Image Processing
  'image:processing:start': ImageProcessingData;
  'image:processing:progress': ImageProgressData;
  'image:processing:complete': ImageCompleteData;
  'image:processing:error': ImageErrorData;

  // Batch Processing
  'batch:processing:start': BatchProcessingData;
  'batch:processing:progress': BatchProgressData;
  'batch:processing:complete': BatchCompleteData;
  'batch:processing:error': BatchErrorData;

  // Dashboard Updates
  'dashboard:stats:update': DashboardStats;
  'dashboard:chart:update': ChartData;
  'dashboard:activity:update': ActivityData;
}

export type SocketEventName = keyof SocketEvents;
export type SocketEventData<T extends SocketEventName> = SocketEvents[T]; 