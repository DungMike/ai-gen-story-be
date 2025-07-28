import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AudioChunk, AudioChunkDocument } from '../schemas/audio-chunk.schema';
import { CreateAudioChunkDto } from '../dto/create-audio-chunk.dto';
import { UpdateAudioChunkDto } from '../dto/update-audio-chunk.dto';

@Injectable()
export class AudioChunkRepository {
  constructor(
    @InjectModel(AudioChunk.name) private audioChunkModel: Model<AudioChunkDocument>,
  ) {}

  async create(createAudioChunkDto: CreateAudioChunkDto): Promise<AudioChunk> {
    const createdAudioChunk = new this.audioChunkModel({
      ...createAudioChunkDto,
      storyId: new Types.ObjectId(createAudioChunkDto.storyId),
    });
    return createdAudioChunk.save();
  }

  async findAll(): Promise<AudioChunk[]> {
    return this.audioChunkModel.find().exec();
  }

  async findById(id: string): Promise<AudioChunk> {
    return this.audioChunkModel.findById(id).exec();
  }

  async findByStoryId(storyId: string): Promise<AudioChunk[]> {
    return this.audioChunkModel
      .find({ storyId: new Types.ObjectId(storyId) })
      .sort({ chunkIndex: 1 })
      .exec();
  }

  async findByStoryIdAndChunkIndex(storyId: string, chunkIndex: number): Promise<AudioChunk> {
    return this.audioChunkModel
      .findOne({
        storyId: new Types.ObjectId(storyId),
        chunkIndex: chunkIndex,
      })
      .exec();
  }

  async update(id: string, updateAudioChunkDto: UpdateAudioChunkDto): Promise<AudioChunk> {
    return this.audioChunkModel
      .findByIdAndUpdate(id, updateAudioChunkDto, { new: true })
      .exec();
  }

  async updateByStoryIdAndChunkIndex(
    storyId: string,
    chunkIndex: number,
    updateAudioChunkDto: UpdateAudioChunkDto,
  ): Promise<AudioChunk> {
    return this.audioChunkModel
      .findOneAndUpdate(
        {
          storyId: new Types.ObjectId(storyId),
          chunkIndex: chunkIndex,
        },
        updateAudioChunkDto,
        { new: true },
      )
      .exec();
  }

  async remove(id: string): Promise<AudioChunk> {
    return this.audioChunkModel.findByIdAndDelete(id).exec();
  }

  async removeByStoryId(storyId: string): Promise<any> {
    return this.audioChunkModel
      .deleteMany({ storyId: new Types.ObjectId(storyId) })
      .exec();
  }

  async countByStoryId(storyId: string): Promise<number> {
    return this.audioChunkModel
      .countDocuments({ storyId: new Types.ObjectId(storyId) })
      .exec();
  }

  async countByStoryIdAndStatus(storyId: string, status: string): Promise<number> {
    return this.audioChunkModel
      .countDocuments({
        storyId: new Types.ObjectId(storyId),
        status: status,
      })
      .exec();
  }

  async getStatusCountsByStoryId(storyId: string): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const [total, pending, processing, completed, failed] = await Promise.all([
      this.countByStoryId(storyId),
      this.countByStoryIdAndStatus(storyId, 'pending'),
      this.countByStoryIdAndStatus(storyId, 'processing'),
      this.countByStoryIdAndStatus(storyId, 'completed'),
      this.countByStoryIdAndStatus(storyId, 'failed'),
    ]);

    return {
      total,
      pending,
      processing,
      completed,
      failed,
    };
  }

  async findCompletedByStoryId(storyId: string): Promise<AudioChunk[]> {
    return this.audioChunkModel
      .find({
        storyId: new Types.ObjectId(storyId),
        status: 'completed',
      })
      .sort({ chunkIndex: 1 })
      .exec();
  }

  async findPendingByStoryId(storyId: string): Promise<AudioChunk[]> {
    return this.audioChunkModel
      .find({
        storyId: new Types.ObjectId(storyId),
        status: 'pending',
      })
      .sort({ chunkIndex: 1 })
      .exec();
  }

  async findFailedByStoryId(storyId: string): Promise<AudioChunk[]> {
    return this.audioChunkModel
      .find({
        storyId: new Types.ObjectId(storyId),
        status: 'failed',
      })
      .sort({ chunkIndex: 1 })
      .exec();
  }

  async updateStatusByStoryIdAndChunkIndex(
    storyId: string,
    chunkIndex: number,
    status: string,
  ): Promise<AudioChunk> {
    return this.audioChunkModel
      .findOneAndUpdate(
        {
          storyId: new Types.ObjectId(storyId),
          chunkIndex: chunkIndex,
        },
        { status: status },
        { new: true },
      )
      .exec();
  }

  async updateMetadataByStoryIdAndChunkIndex(
    storyId: string,
    chunkIndex: number,
    metadata: any,
  ): Promise<AudioChunk> {
    return this.audioChunkModel
      .findOneAndUpdate(
        {
          storyId: new Types.ObjectId(storyId),
          chunkIndex: chunkIndex,
        },
        { metadata: metadata },
        { new: true },
      )
      .exec();
  }

  async updateAudioFileByStoryIdAndChunkIndex(
    storyId: string,
    chunkIndex: number,
    audioFile: string,
  ): Promise<AudioChunk> {
    return this.audioChunkModel
      .findOneAndUpdate(
        {
          storyId: new Types.ObjectId(storyId),
          chunkIndex: chunkIndex,
        },
        { audioFile: audioFile },
        { new: true },
      )
      .exec();
  }

  /**
   * Update all fields of an audio chunk in a single operation
   * This replaces multiple separate update calls for better performance
   */
  async updateAudioChunkComplete(
    storyId: string,
    chunkIndex: number,
    updateData: {
      audioFile?: string;
      status?: string;
      metadata?: any;
      style?: any;
    },
  ): Promise<AudioChunk> {
    return this.audioChunkModel
      .findOneAndUpdate(
        {
          storyId: new Types.ObjectId(storyId),
          chunkIndex: chunkIndex,
        },
        { $set: updateData },
        { new: true },
      )
      .exec();
  }

  /**
   * Update merge metadata for a story
   */
  async updateMergeMetadata(
    storyId: string,
    mergeData: {
      mergedFilePath: string;
      totalDuration: number;
      fileSize: number;
      chunkCount: number;
      mergedAt: Date;
      jobId: string;
    },
  ): Promise<void> {
    // Create or update merge metadata in a separate collection or field
    // For now, we'll store it in the first chunk's metadata
    const firstChunk = await this.audioChunkModel
      .findOne({ storyId: new Types.ObjectId(storyId) })
      .sort({ chunkIndex: 1 })
      .exec();

    if (firstChunk) {
      await this.audioChunkModel
        .findByIdAndUpdate(
          firstChunk._id,
          {
            $set: {
              'metadata.mergeInfo': mergeData
            }
          }
        )
        .exec();
    }
  }

  /**
   * Get merge metadata for a story
   */
  async getMergeMetadata(storyId: string): Promise<{
    mergedFilePath?: string;
    totalDuration?: number;
    fileSize?: number;
    chunkCount?: number;
    mergedAt?: Date;
    jobId?: string;
  } | null> {
    const firstChunk = await this.audioChunkModel
      .findOne({ storyId: new Types.ObjectId(storyId) })
      .sort({ chunkIndex: 1 })
      .exec();

    return firstChunk?.metadata?.mergeInfo || null;
  }

  /**
   * Check if all chunks are ready for merging
   */
  async isReadyForMerge(storyId: string): Promise<{
    ready: boolean;
    completed: number;
    total: number;
    missingChunks: number[];
  }> {
    const statusCounts = await this.getStatusCountsByStoryId(storyId);
    const completedChunks = await this.findCompletedByStoryId(storyId);
    
    // Check if all chunks are completed
    const ready = statusCounts.completed === statusCounts.total && statusCounts.total > 0;
    
    // Find missing chunk indices
    const expectedIndices = Array.from({ length: statusCounts.total }, (_, i) => i);
    const actualIndices = completedChunks.map(chunk => chunk.chunkIndex);
    const missingChunks = expectedIndices.filter(index => !actualIndices.includes(index));
    
    return {
      ready,
      completed: statusCounts.completed,
      total: statusCounts.total,
      missingChunks
    };
  }
} 