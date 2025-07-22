import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ImageChunkDocument = ImageChunk & Document;

@Schema({ timestamps: true })
export class ImageChunk {
  @Prop({ type: Types.ObjectId, ref: 'Story', required: true, index: true })
  storyId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  chunkIndex: number;

  @Prop({ required: true, maxlength: 20000 })
  content: string;

  @Prop({ required: true })
  imageFile: string;

  @Prop({ required: true, maxlength: 10000 })
  prompt: string;

  @Prop({
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  })
  status: string;

  @Prop({
    type: {
      artStyle: {
        type: String,
        enum: ['realistic', 'anime', 'comic', 'watercolor', 'oil-painting', 'digital-art'],
        default: 'realistic'
      },
      characterDescription: {
        type: String,
        maxlength: 3000
      },
      backgroundDescription: {
        type: String,
        maxlength: 3000
      }
    },
    default: {
      artStyle: 'realistic'
    }
  })
  style: {
    artStyle: string;
    characterDescription?: string;
    backgroundDescription?: string;
  };

  @Prop({
    type: {
      aiModel: {
        type: String,
        enum: ['gemini', 'dalle-3', 'midjourney'],
        default: 'gemini'
      },
      imageSize: {
        type: String,
        enum: ['512x512', '1024x1024', '1024x768', '768x1024'],
        default: '1024x1024'
      },
      processingTime: {
        type: Number,
        default: 0
      },
      quality: {
        type: String,
        enum: ['standard', 'hd'],
        default: 'standard'
      }
    },
    default: {
      aiModel: 'gemini',
      imageSize: '1024x1024',
      processingTime: 0,
      quality: 'standard'
    }
  })
  metadata: {
    aiModel: string;
    imageSize: string;
    processingTime: number;
    quality: string;
  };
}

export const ImageChunkSchema = SchemaFactory.createForClass(ImageChunk);

// Indexes
ImageChunkSchema.index({ storyId: 1, chunkIndex: 1 });
ImageChunkSchema.index({ status: 1 }); 