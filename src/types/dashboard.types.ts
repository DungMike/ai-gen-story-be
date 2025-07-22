export interface DashboardStats {
  totalStories: number;
  totalAudioFiles: number;
  totalImages: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
}

export interface ProcessingChartData {
  date: string;
  completed: number;
  failed: number;
  processing: number;
}

export interface GenreChartData {
  genre: string;
  count: number;
  percentage: number;
}

export interface TimelineChartData {
  date: string;
  stories: number;
  audio: number;
  images: number;
}

export interface DashboardResponseDto {
  stats: DashboardStats;
  processingChart: ProcessingChartData[];
  genreChart: GenreChartData[];
  timelineChart: TimelineChartData[];
}

export interface ChartData {
  type: string;
  data: any[];
}

export interface ActivityData {
  type: 'story' | 'audio' | 'image' | 'batch';
  action: 'created' | 'completed' | 'failed';
  itemId: string;
  title: string;
  timestamp: Date;
} 