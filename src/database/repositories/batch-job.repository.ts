import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BatchJob, BatchJobDocument } from '../schemas/batch-job.schema';
import { BatchResponseDto, BatchSettings, BatchResult, BatchProgress } from '@/types/batch.types';

@Injectable()
export class BatchJobRepository {
  constructor(
    @InjectModel(BatchJob.name) private batchJobModel: Model<BatchJobDocument>,
  ) {}

  async create(batchJobData: Partial<BatchJob>): Promise<BatchResponseDto> {
    const createdBatchJob = new this.batchJobModel(batchJobData);
    const savedBatchJob = await createdBatchJob.save();
    return this.toResponseDto(savedBatchJob);
  }

  async findById(id: string): Promise<BatchResponseDto | null> {
    const batchJob = await this.batchJobModel.findById(id).exec();
    return batchJob ? this.toResponseDto(batchJob) : null;
  }

  async findByUserId(userId: string): Promise<BatchResponseDto[]> {
    const batchJobs = await this.batchJobModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
    return batchJobs.map(job => this.toResponseDto(job));
  }

  async findByStatus(status: string): Promise<BatchResponseDto[]> {
    const batchJobs = await this.batchJobModel
      .find({ status })
      .sort({ createdAt: -1 })
      .exec();
    return batchJobs.map(job => this.toResponseDto(job));
  }

  async update(id: string, updateData: Partial<BatchJob>): Promise<BatchResponseDto | null> {
    const updatedBatchJob = await this.batchJobModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    return updatedBatchJob ? this.toResponseDto(updatedBatchJob) : null;
  }

  async updateProgress(id: string, progress: any): Promise<BatchResponseDto | null> {
    const updatedBatchJob = await this.batchJobModel
      .findByIdAndUpdate(id, { progress }, { new: true })
      .exec();
    return updatedBatchJob ? this.toResponseDto(updatedBatchJob) : null;
  }

  async updateResults(id: string, results: any[]): Promise<BatchResponseDto | null> {
    const updatedBatchJob = await this.batchJobModel
      .findByIdAndUpdate(id, { results }, { new: true })
      .exec();
    return updatedBatchJob ? this.toResponseDto(updatedBatchJob) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.batchJobModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async count(filter: any = {}): Promise<number> {
    return this.batchJobModel.countDocuments(filter).exec();
  }

  async findProcessingJobs(): Promise<BatchResponseDto[]> {
    const batchJobs = await this.batchJobModel
      .find({ status: 'processing' })
      .sort({ createdAt: -1 })
      .exec();
    return batchJobs.map(job => this.toResponseDto(job));
  }

  private toResponseDto(batchJob: any): BatchResponseDto {
    return {
      _id: batchJob._id.toString(),
      userId: batchJob.userId,
      status: batchJob.status,
      totalFiles: batchJob.totalFiles,
      processedFiles: batchJob.processedFiles,
      failedFiles: batchJob.failedFiles,
      settings: batchJob.settings as BatchSettings,
      results: batchJob.results.map(result => ({
        ...result,
        storyId: result.storyId?.toString(),
        status: result.status as BatchResult['status'],
      })),
      progress: batchJob.progress as BatchProgress,
      createdAt: batchJob.createdAt,
      startedAt: batchJob.startedAt,
      completedAt: batchJob.completedAt,
    };
  }
} 