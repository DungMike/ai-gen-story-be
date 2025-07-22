import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ImageChunk, ImageChunkDocument } from '../schemas/image-chunk.schema';
import { CreateImageChunkDto } from '../dto/create-image-chunk.dto';
import { UpdateImageChunkDto } from '../dto/update-image-chunk.dto';

@Injectable()
export class ImageChunkRepository {
  constructor(
    @InjectModel(ImageChunk.name)
    private imageChunkModel: Model<ImageChunkDocument>
  ) {}

  async create(createImageChunkDto: CreateImageChunkDto): Promise<ImageChunk> {
    const createdImageChunk = new this.imageChunkModel(createImageChunkDto);
    return createdImageChunk.save();
  }

  async findById(id: string): Promise<ImageChunk | null> {
    return this.imageChunkModel.findById(id).exec();
  }

  async findByStoryId(storyId: string): Promise<ImageChunk[]> {
    return this.imageChunkModel
      .find({
        $or: [
          { storyId: storyId },
          { storyId: new Types.ObjectId(storyId) }
        ]
      })
      .sort({ chunkIndex: 1 })
      .exec();
  }

  async findByStoryIdAndStatus(storyId: string, status: string): Promise<ImageChunk[]> {
    return this.imageChunkModel
      .find({ 
        $or: [
          { storyId: storyId },
          { storyId: new Types.ObjectId(storyId) }
        ],
        status 
      })
      .sort({ chunkIndex: 1 })
      .exec();
  }

  async findByChunkIndex(storyId: string, chunkIndex: number): Promise<ImageChunk | null> {
    return this.imageChunkModel
      .findOne({ 
        $or: [
          { storyId: storyId },
          { storyId: new Types.ObjectId(storyId) }
        ],
        chunkIndex 
      })
      .exec();
  }

  async update(id: string, updateImageChunkDto: UpdateImageChunkDto): Promise<ImageChunk | null> {
    return this.imageChunkModel
      .findByIdAndUpdate(id, updateImageChunkDto, { new: true })
      .exec();
  }

  async updateByStoryIdAndChunkIndex(
    storyId: string, 
    chunkIndex: number, 
    updateData: Partial<UpdateImageChunkDto>
  ): Promise<ImageChunk | null> {
    return this.imageChunkModel
      .findOneAndUpdate(
        { 
          $or: [
            { storyId: storyId },
            { storyId: new Types.ObjectId(storyId) }
          ],
          chunkIndex 
        },
        updateData,
        { new: true }
      )
      .exec();
  }

  async updateStatus(id: string, status: string): Promise<ImageChunk | null> {
    return this.imageChunkModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<ImageChunk | null> {
    return this.imageChunkModel.findByIdAndDelete(id).exec();
  }

  async deleteByStoryId(storyId: string): Promise<void> {
    await this.imageChunkModel
      .deleteMany({
        $or: [
          { storyId: storyId },
          { storyId: new Types.ObjectId(storyId) }
        ]
      })
      .exec();
  }

  async countByStoryId(storyId: string): Promise<number> {
    return this.imageChunkModel
      .countDocuments({
        $or: [
          { storyId: storyId },
          { storyId: new Types.ObjectId(storyId) }
        ]
      })
      .exec();
  }

  async countByStoryIdAndStatus(storyId: string, status: string): Promise<number> {
    return this.imageChunkModel
      .countDocuments({ 
        $or: [
          { storyId: storyId },
          { storyId: new Types.ObjectId(storyId) }
        ],
        status 
      })
      .exec();
  }

  async getProcessingStats(storyId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    processing: number;
    pending: number;
  }> {
    const stats = await this.imageChunkModel.aggregate([
      { 
        $match: { 
          $or: [
            { storyId: storyId },
            { storyId: new Types.ObjectId(storyId) }
          ]
        } 
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      total: 0,
      completed: 0,
      failed: 0,
      processing: 0,
      pending: 0
    };

    stats.forEach(stat => {
      result.total += stat.count;
      result[stat._id] = stat.count;
    });

    return result;
  }
} 