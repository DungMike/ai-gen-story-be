import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AudioDocument = Audio & Document;

@Schema({ timestamps: true })
export class Audio {
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
  duration?: number;

  @Prop()
  metadata?: {
    format?: string;
    bitrate?: number;
    sampleRate?: number;
    channels?: number;
  };
}

export const AudioSchema = SchemaFactory.createForClass(Audio); 