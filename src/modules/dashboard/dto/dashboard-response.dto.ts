export interface DashboardOverviewResponse {
  stats: {
    totalStories: number;
    totalImages: number;
    totalAudio: number;
    totalUsers: number;
    totalTokens: number;
    totalCost: number;
    storiesThisMonth: number;
    imagesThisMonth: number;
    audioThisMonth: number;
    activeUsers: number;
  };
  charts: {
    storiesByDay: Array<{ date: string; count: number }>;
    imagesByDay: Array<{ date: string; count: number }>;
    audioByDay: Array<{ date: string; count: number }>;
    tokenUsageByDay: Array<{ date: string; tokens: number; cost: number }>;
    genreDistribution: Array<{ genre: string; count: number; percentage: number }>;
    processingStatus: Array<{ status: string; count: number; percentage: number }>;
  };
  recentActivity: Array<{
    id: string;
    type: 'story' | 'image' | 'audio';
    action: 'created' | 'completed' | 'failed';
    title: string;
    userId: string;
    timestamp: Date;
  }>;
}

export interface StoryListResponse {
  stories: Array<{
    id: string;
    title: string;
    userId: string;
    userName: string;
    status: {
      storyGenerated: boolean;
      imagesGenerated: boolean;
      audioGenerated: boolean;
    };
    metadata: {
      originalWordCount: number;
      generatedWordCount: number;
      processingTime: number;
      tokensUsed: number;
    };
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface StoryDetailResponse {
  id: string;
  title: string;
  originalContent: string;
  generatedContent: string;
  customPrompt: string;
  style: {
    genre: string;
    tone: string;
    length: string;
    targetAudience: string;
  };
  status: {
    storyGenerated: boolean;
    imagesGenerated: boolean;
    audioGenerated: boolean;
    lastGeneratedAt?: Date;
  };
  metadata: {
    originalWordCount: number;
    generatedWordCount: number;
    processingTime: number;
    tokensUsed: number;
    aiModel: string;
    generationPrompt?: string;
  };
  files: {
    originalFileUrl: string;
    generatedFileUrl: string;
  };
  images: Array<{
    id: string;
    url: string;
    prompt: string;
    status: string;
    createdAt: Date;
  }>;
  audio: Array<{
    id: string;
    url: string;
    duration: number;
    status: string;
    createdAt: Date;
  }>;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaListResponse {
  media: Array<{
    id: string;
    type: 'image' | 'audio';
    url: string;
    storyId: string;
    storyTitle: string;
    userId: string;
    userName: string;
    status: string;
    metadata: {
      size: number;
      duration?: number;
      prompt?: string;
      tokensUsed?: number;
    };
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface TokenUsageResponse {
  summary: {
    totalTokens: number;
    totalCost: number;
    textTokens: number;
    imageTokens: number;
    audioTokens: number;
    averageTokensPerStory: number;
    averageCostPerStory: number;
  };
  dailyUsage: Array<{
    date: string;
    textTokens: number;
    imageTokens: number;
    audioTokens: number;
    totalTokens: number;
    cost: number;
  }>;
  monthlyUsage: Array<{
    month: string;
    textTokens: number;
    imageTokens: number;
    audioTokens: number;
    totalTokens: number;
    cost: number;
  }>;
  topStories: Array<{
    storyId: string;
    title: string;
    tokensUsed: number;
    cost: number;
    createdAt: Date;
  }>;
}

export interface UserStatsResponse {
  users: Array<{
    id: string;
    name: string;
    email: string;
    storiesCount: number;
    imagesCount: number;
    audioCount: number;
    totalTokens: number;
    totalCost: number;
    lastActive: Date;
    createdAt: Date;
    subscription?: {
      plan: string;
      status: string;
      expiresAt?: Date;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: {
    totalUsers: number;
    activeUsers: number;
    premiumUsers: number;
    averageStoriesPerUser: number;
    averageTokensPerUser: number;
  };
} 