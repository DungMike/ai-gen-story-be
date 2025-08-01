import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StoryDocument = Story & Document;

@Schema({ timestamps: true })
export class Story {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ required: true, maxlength: 2000000 })
  originalContent: string;

  @Prop({ maxlength: 2000000 })
  generatedContent?: string;

  @Prop({ maxlength: 2000 })
  customPrompt?: string;

  @Prop({
    type: {
      genre: {
        type: String,
        enum: ['fantasy', 'romance', 'action', 'mystery', 'sci-fi', 'horror', 'comedy', 'drama'],
        default: 'fantasy'
      },
      tone: {
        type: String,
        enum: ['dramatic', 'humorous', 'serious', 'romantic', 'mysterious', 'lighthearted'],
        default: 'dramatic'
      },
      length: {
        type: String,
        enum: ['short', 'medium', 'long'],
        default: 'medium'
      },
      targetAudience: {
        type: String,
        enum: ['children', 'teen', 'adult'],
        default: 'teen'
      }
    }
  })
  style: {
    genre: string;
    tone: string;
    length: string;
    targetAudience: string;
  };

  @Prop({
    type: {
      storyGenerated: { type: Boolean, default: false },
      audioGenerated: { type: Boolean, default: false },
      imagesGenerated: { type: Boolean, default: false }
    }
  })
  status: {
    storyGenerated: boolean;
    audioGenerated: boolean;
    imagesGenerated: boolean;
  };

  @Prop({
    type: {
      originalWordCount: { type: Number, default: 0 },
      generatedWordCount: { type: Number, default: 0 },
      processingTime: { type: Number, default: 0 },
      aiModel: { type: String, default: 'gemini' }
    }
  })
  metadata: {
    originalWordCount: number;
    generatedWordCount: number;
    processingTime: number;
    aiModel: string;
  };

  @Prop({
    type: {
      originalFile: { type: String, required: true },
      generatedFile: { type: String }
    }
  })
  files: {
    originalFile: string;
    generatedFile?: string;
  };
}

export const StorySchema = SchemaFactory.createForClass(Story); 