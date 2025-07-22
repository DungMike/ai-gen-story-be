import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Image } from '@/database/schemas/image.schema';

@Injectable()
export class ImageRepository {
  constructor(
    @InjectModel(Image.name) private readonly imageModel: Model<Image>
  ) {}

  async count(): Promise<number> {
    return this.imageModel.countDocuments();
  }

  async countByDateRange(startDate: Date, endDate: Date): Promise<number> {
    return this.imageModel.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });
  }

  async findByStoryId(storyId: string): Promise<Image[]> {
    return this.imageModel.find({ storyId }).exec();
  }

  async findWithPagination(params: {
    page: number;
    limit: number;
    storyId?: string;
    search?: string;
    dateRange?: { start: Date; end: Date };
  }): Promise<{
    images: Image[];
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

    const total = await this.imageModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const images = await this.imageModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      images,
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