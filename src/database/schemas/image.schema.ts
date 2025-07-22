import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ImageDocument = Image & Document;

@Schema({ timestamps: true })
export class Image {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Story' })
  storyId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  prompt: string;

  @Prop({ required: true })
  filePath: string;

  @Prop()
  fileSize?: number;

  @Prop({ default: 'pending' })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Prop()
  tokensUsed?: number;

  @Prop()
  storyTitle?: string;

  @Prop()
  userName?: string;

  @Prop()
  error?: string;

  @Prop()
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    quality?: number;
  };
}

export const ImageSchema = SchemaFactory.createForClass(Image); 