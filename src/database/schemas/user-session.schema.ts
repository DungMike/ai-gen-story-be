import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserSessionDocument = UserSession & Document;

@Schema({ timestamps: true })
export class UserSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, maxlength: 255 })
  token: string;

  @Prop({ required: true, unique: true, maxlength: 255 })
  refreshToken: string;

  @Prop({
    type: {
      device: { type: String, maxlength: 100 },
      os: { type: String, maxlength: 50 },
      browser: { type: String, maxlength: 50 },
      version: { type: String, maxlength: 20 }
    }
  })
  deviceInfo?: {
    device: string;
    os: string;
    browser: string;
    version: string;
  };

  @Prop({ maxlength: 45 })
  ipAddress?: string;

  @Prop({ maxlength: 500 })
  userAgent?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true, index: true })
  expiresAt: Date;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);

// Indexes - only add these if not already defined in @Prop
UserSessionSchema.index({ userId: 1, isActive: 1 });
UserSessionSchema.index({ createdAt: -1 }); 