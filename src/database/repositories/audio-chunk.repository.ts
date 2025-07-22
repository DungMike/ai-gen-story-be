import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AudioChunk, AudioChunkDocument } from '../schemas/audio-chunk.schema';
import { AudioResponseDto, AudioMetadata } from '@/types/audio.types';

@Injectable()
export class AudioChunkRepository {
  constructor(
    @InjectModel(AudioChunk.name) private audioChunkModel: Model<AudioChunkDocument>,
  ) {}

  async create(audioChunkData: Partial<AudioChunk>): Promise<AudioResponseDto> {
    const createdAudioChunk = new this.audioChunkModel(audioChunkData);
    const savedAudioChunk = await createdAudioChunk.save();
    return this.toResponseDto(savedAudioChunk);
  }

  async findByStoryId(storyId: string): Promise<AudioResponseDto[]> {
    const audioChunks = await this.audioChunkModel
      .find({ storyId })
      .sort({ chunkIndex: 1 })
      .exec();
    return audioChunks.map(chunk => this.toResponseDto(chunk));
  }

  async findById(id: string): Promise<AudioResponseDto | null> {
    const audioChunk = await this.audioChunkModel.findById(id).exec();
    return audioChunk ? this.toResponseDto(audioChunk) : null;
  }

  async update(id: string, updateData: Partial<AudioChunk>): Promise<AudioResponseDto | null> {
    const updatedAudioChunk = await this.audioChunkModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    return updatedAudioChunk ? this.toResponseDto(updatedAudioChunk) : null;
  }

  async deleteByStoryId(storyId: string): Promise<boolean> {
    const result = await this.audioChunkModel.deleteMany({ storyId }).exec();
    return result.deletedCount > 0;
  }

  async countByStoryId(storyId: string): Promise<number> {
    return this.audioChunkModel.countDocuments({ storyId }).exec();
  }

  async findByStatus(status: string): Promise<AudioResponseDto[]> {
    const audioChunks = await this.audioChunkModel
      .find({ status })
      .sort({ createdAt: -1 })
      .exec();
    return audioChunks.map(chunk => this.toResponseDto(chunk));
  }

  async updateStatus(id: string, status: string): Promise<AudioResponseDto | null> {
    const updatedAudioChunk = await this.audioChunkModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
    return updatedAudioChunk ? this.toResponseDto(updatedAudioChunk) : null;
  }

  private toResponseDto(audioChunk: any): AudioResponseDto {
    return {
      _id: audioChunk._id.toString(),
      storyId: audioChunk.storyId.toString(),
      chunkIndex: audioChunk.chunkIndex,
      content: audioChunk.content,
      audioFile: audioChunk.audioFile,
      duration: audioChunk.duration,
      wordCount: audioChunk.wordCount,
      status: audioChunk.status,
      metadata: audioChunk.metadata as AudioMetadata,
      createdAt: audioChunk.createdAt,
    };
  }
} 