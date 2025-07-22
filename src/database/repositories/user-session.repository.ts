import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserSession, UserSessionDocument } from '../schemas/user-session.schema';

@Injectable()
export class UserSessionRepository {
  constructor(
    @InjectModel(UserSession.name)
    private userSessionModel: Model<UserSessionDocument>
  ) {}

  async create(createUserSessionDto: any): Promise<UserSession> {
    const createdUserSession = new this.userSessionModel(createUserSessionDto);
    return createdUserSession.save();
  }

  async findByToken(token: string): Promise<UserSession | null> {
    return this.userSessionModel.findOne({ token }).exec();
  }

  async findByRefreshToken(refreshToken: string): Promise<UserSession | null> {
    return this.userSessionModel.findOne({ refreshToken }).exec();
  }

  async findByUserId(userId: string): Promise<UserSession[]> {
    return this.userSessionModel
      .find({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  async findActiveByUserId(userId: string): Promise<UserSession[]> {
    return this.userSessionModel
      .find({ 
        userId: new Types.ObjectId(userId),
        isActive: true 
      })
      .exec();
  }

  async update(id: string, updateData: any): Promise<UserSession | null> {
    return this.userSessionModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async deactivateByToken(token: string): Promise<void> {
    await this.userSessionModel
      .updateOne({ token }, { isActive: false })
      .exec();
  }

  async deactivateAllByUserId(userId: string): Promise<void> {
    await this.userSessionModel
      .updateMany(
        { userId: new Types.ObjectId(userId) },
        { isActive: false }
      )
      .exec();
  }

  async deleteExpiredSessions(): Promise<void> {
    const now = new Date();
    await this.userSessionModel
      .deleteMany({ expiresAt: { $lt: now } })
      .exec();
  }

  async countActiveSessionsByUserId(userId: string): Promise<number> {
    return this.userSessionModel
      .countDocuments({ 
        userId: new Types.ObjectId(userId),
        isActive: true 
      })
      .exec();
  }
} 