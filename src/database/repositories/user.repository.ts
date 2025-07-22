import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { UserResponseDto } from '@/modules/users/dto/auth.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: any): Promise<UserResponseDto> {
    const createdUser = new this.userModel(createUserDto);
    const savedUser = await createdUser.save();
    return this.toResponseDto(savedUser);
  }

  async findById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userModel.findById(id).exec();
    return user ? this.toResponseDto(user) : null;
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByUsernameOrEmail(usernameOrEmail: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ]
    }).exec();
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userModel.find().sort({ createdAt: -1 }).exec();
    return users.map(user => this.toResponseDto(user));
  }

  async update(id: string, updateUserDto: any): Promise<UserResponseDto | null> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
    return updatedUser ? this.toResponseDto(updatedUser) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      lastLoginAt: new Date(),
      $inc: { loginCount: 1 }
    }).exec();
  }

  async updateEmailVerification(id: string, verified: boolean): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      emailVerified: verified
    }).exec();
  }

  async updateSubscription(id: string, subscriptionData: any): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      subscription: subscriptionData
    }).exec();
  }

  async updatePreferences(id: string, preferences: any): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      preferences
    }).exec();
  }

  async count(filter = {}): Promise<number> {
    return this.userModel.countDocuments(filter).exec();
  }

  async findByRole(role: string): Promise<UserResponseDto[]> {
    const users = await this.userModel.find({ role }).sort({ createdAt: -1 }).exec();
    return users.map(user => this.toResponseDto(user));
  }

  async findByStatus(status: string): Promise<UserResponseDto[]> {
    const users = await this.userModel.find({ status }).sort({ createdAt: -1 }).exec();
    return users.map(user => this.toResponseDto(user));
  }

  private toResponseDto(user: UserDocument): UserResponseDto {
    return {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      loginCount: user.loginCount,
      preferences: user.preferences,
      subscription: user.subscription,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
} 