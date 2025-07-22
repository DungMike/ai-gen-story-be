import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AudioChunkDocument = AudioChunk & Document;

@Schema({ timestamps: true })
export class AudioChunk {
  @Prop({ type: Types.ObjectId, ref: 'Story', required: true, index: true })
  storyId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  chunkIndex: number;

  @Prop({ required: true, maxlength: 5000 })
  content: string;

  @Prop({ required: true })
  audioFile: string;

  @Prop({ default: 0, min: 0 })
  duration: number;

  @Prop({ default: 0 })
  wordCount: number;

  @Prop({
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  })
  status: string;

  @Prop({
    type: {
      voiceModel: {
        type: String,
        enum: ['google-tts', 'elevenlabs'],
        default: 'google-tts'
      },
      language: {
        type: String,
        default: 'vi-VN'
      },
      processingTime: {
        type: Number,
        default: 0
      },
      voiceSettings: {
        speed: {
          type: Number,
          default: 1.0,
          min: 0.5,
          max: 2.0
        },
        pitch: {
          type: Number,
          default: 0,
          min: -20,
          max: 20
        }
      }
    },
    default: {
      voiceModel: 'google-tts',
      language: 'vi-VN',
      processingTime: 0,
      voiceSettings: {
        speed: 1.0,
        pitch: 0
      }
    }
  })
  metadata: {
    voiceModel: string;
    language: string;
    processingTime: number;
    voiceSettings: {
      speed: number;
      pitch: number;
    };
  };
}

export const AudioChunkSchema = SchemaFactory.createForClass(AudioChunk);

// Indexes
AudioChunkSchema.index({ storyId: 1, chunkIndex: 1 });
AudioChunkSchema.index({ status: 1 }); 