import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BatchJobDocument = BatchJob & Document;

@Schema({ timestamps: true })
export class BatchJob {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  })
  status: string;

  @Prop({ required: true, min: 1 })
  totalFiles: number;

  @Prop({ default: 0, min: 0 })
  processedFiles: number;

  @Prop({ default: 0, min: 0 })
  failedFiles: number;

  @Prop({
    type: {
      autoMode: { type: Boolean, default: true },
      generateAudio: { type: Boolean, default: true },
      generateImages: { type: Boolean, default: true },
      defaultPrompt: { type: String, maxlength: 2000 },
      customPromptImage: { type: String, maxlength: 20000 },
      customPromptAudio: { type: String, maxlength: 20000 },
      audioSettings: {
        maxWordsPerChunk: { type: Number, default: 100, min: 50, max: 2000 },
        voiceModel: {
          type: String,
          enum: ['google-tts', 'elevenlabs'],
          default: 'google-tts'
        }
      },
      imageSettings: {
        artStyle: {
          type: String,
          enum: ['realistic', 'anime', 'comic', 'watercolor'],
          default: 'realistic'
        },
        imageSize: {
          type: String,
          enum: ['512x512', '1024x1024'],
          default: '1024x1024'
        }
      }
    },
    default: {
      autoMode: true,
      generateAudio: true,
      generateImages: true,
      audioSettings: {
        maxWordsPerChunk: 100,
        voiceModel: 'google-tts'
      },
      imageSettings: {
        artStyle: 'realistic',
        imageSize: '1024x1024'
      }
    }
  })
  settings: {
    autoMode: boolean;
    generateAudio: boolean;
    generateImages: boolean;
    defaultPrompt?: string;
    customPromptImage?: string;
    customPromptAudio?: string;
    audioSettings?: {
      maxWordsPerChunk: number;
      audioVoice: string;
    };
    imageSettings?: {
      artStyle: string;
      imageSize: string;
      maxWordsPerChunk: number;
    };
  };

  @Prop({
    type: [{
      originalFile: { type: String, required: true },
      storyId: { type: Types.ObjectId, ref: 'Story' },
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
      },
      error: { type: String },
      processingTime: { type: Number, default: 0 }
    }],
    default: []
  })
  results: Array<{
    originalFile: string;
    storyId?: Types.ObjectId;
    status: string;
    error?: string;
    processingTime: number;
  }>;

  @Prop({
    type: {
      currentFile: { type: Number, default: 0 },
      currentStep: {
        type: String,
        enum: ['story', 'audio', 'images'],
        default: 'story'
      },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    },
    default: {
      currentFile: 0,
      currentStep: 'story',
      percentage: 0
    }
  })
  progress: {
    currentFile: number;
    currentStep: string;
    percentage: number;
  };

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;
}

export const BatchJobSchema = SchemaFactory.createForClass(BatchJob);

// Indexes
BatchJobSchema.index({ userId: 1, createdAt: -1 });
BatchJobSchema.index({ status: 1, createdAt: -1 }); 