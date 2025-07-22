import { IsOptional, IsString, IsDateString, IsNumber, IsEnum } from 'class-validator';

export enum DashboardFilterType {
  ALL = 'all',
  STORIES = 'stories',
  IMAGES = 'images',
  AUDIO = 'audio',
  USERS = 'users'
}

export enum TimeRange {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  CUSTOM = 'custom'
}

export class DashboardStatsDto {
  @IsOptional()
  @IsEnum(DashboardFilterType)
  filterType?: DashboardFilterType;

  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class StoryListDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class MediaListDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  type?: 'image' | 'audio';

  @IsOptional()
  @IsString()
  storyId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class TokenUsageDto {
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UserStatsDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
} 