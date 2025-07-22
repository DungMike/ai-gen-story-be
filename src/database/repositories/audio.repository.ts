import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Audio } from '@/database/schemas/audio.schema';

@Injectable()
export class AudioRepository {
  constructor(
    @InjectModel(Audio.name) private readonly audioModel: Model<Audio>
  ) {}

  async count(): Promise<number> {
    return this.audioModel.countDocuments();
  }

  async countByDateRange(startDate: Date, endDate: Date): Promise<number> {
    return this.audioModel.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });
  }

  async findByStoryId(storyId: string): Promise<Audio[]> {
    return this.audioModel.find({ storyId }).exec();
  }

  async findWithPagination(params: {
    page: number;
    limit: number;
    storyId?: string;
    search?: string;
    dateRange?: { start: Date; end: Date };
  }): Promise<{
    audio: Audio[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const { page, limit, storyId, search, dateRange } = params;
    
    const filter: any = {};
    
    if (storyId) {
      filter.storyId = storyId;
    }
    
    if (search) {
      filter.$or = [
        { prompt: { $regex: search, $options: 'i' } },
        { storyTitle: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (dateRange) {
      filter.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
    }

    const total = await this.audioModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const audio = await this.audioModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      audio,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
} 