import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AudioFormat } from '../constant/type';

export type AudioChunkDocument = AudioChunk & Document;

@Schema({ timestamps: true })
export class AudioChunk {
  @Prop({ type: Types.ObjectId, ref: 'Story', required: true, index: true })
  storyId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  chunkIndex: number;

  @Prop({ required: true, maxlength: 20000 })
  content: string;

  @Prop({ required: true })
  audioFile: string;

  @Prop({
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  })
  status: string;


  @Prop({
    type: {
      aiModel: {
        type: String,
        enum: ['google-tts', 'elevenlabs'],
        default: 'google-tts'
      },
      audioFormat: {
        type: String,
        enum: AudioFormat,
        default: 'wav'
      },
      processingTime: {
        type: Number,
        default: 0
      },
      quality: {
        type: String,
        enum: ['standard', 'hd'],
        default: 'standard'
      },
      duration: {
        type: Number,
        default: 0
      },
      mergeInfo: {
        type: {
          mergedFilePath: String,
          totalDuration: Number,
          fileSize: Number,
          chunkCount: Number,
          mergedAt: Date,
          jobId: String
        },
        required: false
      }
    }
  })
  metadata: {
    aiModel: string;
    audioFormat: string;
    processingTime: number;
    quality: string;
    duration: number;
    mergeInfo?: {
      mergedFilePath: string;
      totalDuration: number;
      fileSize: number;
      chunkCount: number;
      mergedAt: Date;
      jobId: string;
    };
  };
}

export const AudioChunkSchema = SchemaFactory.createForClass(AudioChunk); 