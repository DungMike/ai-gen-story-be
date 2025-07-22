import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Story, StoryDocument } from '../schemas/story.schema';

@Injectable()
export class StoryRepository {
  constructor(
    @InjectModel(Story.name)
    private storyModel: Model<StoryDocument>
  ) {}

  async create(createStoryDto: any): Promise<Story> {
    const createdStory = new this.storyModel(createStoryDto);
    return createdStory.save();
  }

  async findById(id: string): Promise<Story | null> {
    return this.storyModel.findById(id).exec();
  }

  async findByUserId(userId: string): Promise<Story[]> {
    return this.storyModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, updateData: any): Promise<Story | null> {
    return this.storyModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<Story | null> {
    return this.storyModel.findByIdAndDelete(id).exec();
  }

  async countByUserId(userId: string): Promise<number> {
    return this.storyModel
      .countDocuments({ userId: new Types.ObjectId(userId) })
      .exec();
  }
} 