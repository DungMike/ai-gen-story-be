export interface StoryStyle {
  genre: 'fantasy' | 'romance' | 'action' | 'mystery' | 'sci-fi' | 'horror' | 'comedy' | 'drama';
  tone: 'dramatic' | 'humorous' | 'serious' | 'romantic' | 'mysterious' | 'lighthearted';
  length: 'short' | 'medium' | 'long';
  targetAudience: 'children' | 'teen' | 'adult';
}

export interface StoryStatus {
  storyGenerated: boolean;
  audioGenerated: boolean;
  imagesGenerated: boolean;
  lastGeneratedAt?: Date;
}

export interface StoryMetadata {
  originalWordCount: number;
  generatedWordCount: number;
  processingTime: number;
  aiModel: string;
  generationPrompt?: string;
}

export interface StoryFiles {
  originalFile: string;
  generatedFile?: string;
}

export interface Story {
  _id?: string;
  title: string;
  originalContent: string;
  generatedContent?: string;
  customPrompt?: string;
  style: StoryStyle;
  status: StoryStatus;
  metadata: StoryMetadata;
  files: StoryFiles;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStoryDto {
  title: string;
  originalContent: string;
  customPrompt?: string;
  style?: Partial<StoryStyle>;
}

export interface UpdateStoryDto {
  title?: string;
  generatedContent?: string;
  customPrompt?: string;
  style?: Partial<StoryStyle>;
  status?: Partial<StoryStatus>;
  metadata?: Partial<StoryMetadata>;
  files?: Partial<StoryFiles>;
}

export interface StoryResponseDto {
  _id: string;
  title: string;
  originalContent: string;
  generatedContent?: string;
  customPrompt?: string;
  style: StoryStyle;
  status: StoryStatus;
  metadata: StoryMetadata;
  files: StoryFiles;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
} 