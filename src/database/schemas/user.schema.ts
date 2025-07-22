import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document & {
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true, maxlength: 50 })
  username: string;

  @Prop({ required: true, unique: true, trim: true, maxlength: 100 })
  email: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  fullName: string;

  @Prop({ trim: true, maxlength: 255 })
  avatar?: string;

  @Prop({
    type: String,
    enum: ['user', 'premium', 'admin'],
    default: 'user'
  })
  role: string;

  @Prop({
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  })
  status: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ default: 0, min: 0 })
  loginCount: number;

  @Prop({
    type: {
      language: { type: String, default: 'vi-VN' },
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true }
      }
    },
    default: {
      language: 'vi-VN',
      theme: 'light',
      notifications: {
        email: true,
        push: true
      }
    }
  })
  preferences: {
    language: string;
    theme: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };

  @Prop({
    type: {
      planType: {
        type: String,
        enum: ['free', 'basic', 'premium'],
        default: 'free'
      },
      startDate: { type: Date },
      endDate: { type: Date },
      autoRenew: { type: Boolean, default: false }
    },
    default: {
      planType: 'free',
      autoRenew: false
    }
  })
  subscription: {
    planType: string;
    startDate?: Date;
    endDate?: Date;
    autoRenew: boolean;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes - only add these if not already defined in @Prop
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLoginAt: -1 }); 