import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Story, StoryDocument } from '../schemas/story.schema';
import { CreateStoryDto, UpdateStoryDto, StoryResponseDto, StoryStyle } from '@/types/story.types';
import { PageOptionDto } from '@/modules/stories/dto/page-option.dto';

@Injectable()
export class StoryRepository {
  constructor(
    @InjectModel(Story.name) private storyModel: Model<StoryDocument>,
  ) {}

  async create(createStoryDto: CreateStoryDto): Promise<StoryResponseDto> {
    const createdStory = new this.storyModel(createStoryDto);
    const savedStory = await createdStory.save();
    return this.toResponseDto(savedStory);
  }

  async findById(id: string): Promise<StoryResponseDto | null> {
    const story = await this.storyModel.findById(id).exec();
    return story ? this.toResponseDto(story) : null;
  }

  async findAll(pageOptionDto: PageOptionDto): Promise<{ stories: StoryResponseDto[]; total: number }> {
    const {page, limit, search, status, userId} = pageOptionDto;
    const filter = userId ? { userId: userId } : {};
    const skip = (page - 1) * limit;
    const matchCondition = {
      ...filter,
      ...(search ? { title: { $regex: search, $options: 'i' } } : {}),
      ...(status ? { status } : {}),
    }
    
    const [stories, total] = await Promise.all([
      this.storyModel.find(matchCondition)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.storyModel.countDocuments(filter).exec()
    ]);
    
    return {
      stories: stories.map(story => this.toResponseDto(story)),
      total
    };
  }

  async update(id: string, updateStoryDto: UpdateStoryDto): Promise<StoryResponseDto | null> {
    const updatedStory = await this.storyModel
      .findByIdAndUpdate(id, updateStoryDto, { new: true })
      .exec();
    return updatedStory ? this.toResponseDto(updatedStory) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.storyModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async count(filter: any = {}): Promise<number> {
    return this.storyModel.countDocuments(filter).exec();
  }

  async findByStatus(status: Partial<{ storyGenerated: boolean; audioGenerated: boolean; imagesGenerated: boolean }>): Promise<StoryResponseDto[]> {
    const stories = await this.storyModel.find({ status }).sort({ createdAt: -1 }).exec();
    return stories.map(story => this.toResponseDto(story));
  }

  async findByGenre(genre: string): Promise<StoryResponseDto[]> {
    const stories = await this.storyModel.find({ 'style.genre': genre }).sort({ createdAt: -1 }).exec();
    return stories.map(story => this.toResponseDto(story));
  }

  async searchByTitle(title: string): Promise<StoryResponseDto[]> {
    const stories = await this.storyModel
      .find({ $text: { $search: title } })
      .sort({ score: { $meta: 'textScore' } })
      .exec();
    return stories.map(story => this.toResponseDto(story));
  }

  private toResponseDto(story: any): StoryResponseDto {
    return {
      _id: story._id.toString(),
      title: story.title,
      originalContent: story.originalContent,
      generatedContent: story.generatedContent,
      customPrompt: story.customPrompt,
      style: story.style as StoryStyle,
      status: story.status?.toObject ? story.status.toObject() : story.status,
      metadata: story.metadata?.toObject ? story.metadata.toObject() : story.metadata,
      files: story.files?.toObject ? story.files.toObject() : story.files,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      userId: story.userId,
    };
  }
} 