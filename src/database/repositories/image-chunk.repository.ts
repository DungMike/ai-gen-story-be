import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ImageChunk, ImageChunkDocument } from '../schemas/image-chunk.schema';
import { ImageResponseDto, ImageStyle, ImageMetadata } from '@/types/image.types';

@Injectable()
export class ImageChunkRepository {
  constructor(
    @InjectModel(ImageChunk.name) private imageChunkModel: Model<ImageChunkDocument>,
  ) {}

  async create(imageChunkData: Partial<ImageChunk>): Promise<ImageResponseDto> {
    const createdImageChunk = new this.imageChunkModel(imageChunkData);
    const savedImageChunk = await createdImageChunk.save();
    return this.toResponseDto(savedImageChunk);
  }

  async findByStoryId(storyId: string): Promise<ImageResponseDto[]> {
    const imageChunks = await this.imageChunkModel
      .find({ storyId })
      .sort({ chunkIndex: 1 })
      .exec();
    return imageChunks.map(chunk => this.toResponseDto(chunk));
  }

  async findById(id: string): Promise<ImageResponseDto | null> {
    const imageChunk = await this.imageChunkModel.findById(id).exec();
    return imageChunk ? this.toResponseDto(imageChunk) : null;
  }

  async update(id: string, updateData: Partial<ImageChunk>): Promise<ImageResponseDto | null> {
    const updatedImageChunk = await this.imageChunkModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    return updatedImageChunk ? this.toResponseDto(updatedImageChunk) : null;
  }

  async deleteByStoryId(storyId: string): Promise<boolean> {
    const result = await this.imageChunkModel.deleteMany({ storyId }).exec();
    return result.deletedCount > 0;
  }

  async countByStoryId(storyId: string): Promise<number> {
    return this.imageChunkModel.countDocuments({ storyId }).exec();
  }

  async findByStatus(status: string): Promise<ImageResponseDto[]> {
    const imageChunks = await this.imageChunkModel
      .find({ status })
      .sort({ createdAt: -1 })
      .exec();
    return imageChunks.map(chunk => this.toResponseDto(chunk));
  }

  async updateStatus(id: string, status: string): Promise<ImageResponseDto | null> {
    const updatedImageChunk = await this.imageChunkModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
    return updatedImageChunk ? this.toResponseDto(updatedImageChunk) : null;
  }

  async findByArtStyle(artStyle: string): Promise<ImageResponseDto[]> {
    const imageChunks = await this.imageChunkModel
      .find({ 'style.artStyle': artStyle })
      .sort({ createdAt: -1 })
      .exec();
    return imageChunks.map(chunk => this.toResponseDto(chunk));
  }

  private toResponseDto(imageChunk: any): ImageResponseDto {
    return {
      _id: imageChunk._id.toString(),
      storyId: imageChunk.storyId.toString(),
      chunkIndex: imageChunk.chunkIndex,
      content: imageChunk.content,
      imageFile: imageChunk.imageFile,
      prompt: imageChunk.prompt,
      status: imageChunk.status,
      style: imageChunk.style as ImageStyle,
      metadata: imageChunk.metadata as ImageMetadata,
      createdAt: imageChunk.createdAt,
    };
  }
} 