import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '@/database/repositories/user.repository';
import { UserSessionRepository } from '@/database/repositories/user-session.repository';
import { LoginDto, RegisterDto, RefreshTokenDto, AuthResponseDto, UserResponseDto } from './dto/auth.dto';
import { UserDocument } from '@/database/schemas/user.schema';

interface JwtPayload {
  sub: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private userSessionRepository: UserSessionRepository,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if username already exists
    const existingUsername = await this.userRepository.findByUsername(registerDto.username);
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await this.userRepository.findByEmail(registerDto.email);
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Create user
    const user = await this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user._id, user.role);

    // Create session
    await this.userSessionRepository.create({
      userId: user._id,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    });

    return {
      ...tokens,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user by username or email
    const user = await this.userRepository.findByUsernameOrEmail(loginDto.username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.userRepository.updateLastLogin(user._id.toString());

    // Generate tokens
    const tokens = await this.generateTokens(user._id.toString(), user.role);

    // Create session
    await this.userSessionRepository.create({
      userId: user._id,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    });

    return {
      ...tokens,
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshTokenDto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      });

      // Check if session exists and is active
      const session = await this.userSessionRepository.findByRefreshToken(refreshTokenDto.refreshToken);
      if (!session || !session.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get user
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user._id, user.role);

      // Update session
      await this.userSessionRepository.update((session as any)._id.toString(), tokens);

      return {
        ...tokens,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatar: user.avatar,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, token: string): Promise<void> {
    // Deactivate session
    await this.userSessionRepository.deactivateByToken(token);
  }

  async logoutAll(userId: string): Promise<void> {
    // Deactivate all sessions for user
    await this.userSessionRepository.deactivateAllByUserId(userId);
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, updateData: any): Promise<UserResponseDto> {
    // Don't allow updating sensitive fields
    const { password, role, status, email, ...safeUpdateData } = updateData;
    
    const updatedUser = await this.userRepository.update(userId, safeUpdateData);
    if (!updatedUser) {
      throw new UnauthorizedException('User not found');
    }
    return updatedUser;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Get user document for password verification
    const userDoc = await this.userRepository.findByUsername(user.username);
    if (!userDoc) {
      throw new UnauthorizedException('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, userDoc.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Invalid old password');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.userRepository.update(userId, { password: hashedNewPassword });

    // Logout all sessions
    await this.logoutAll(userId);
  }

  private async generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };
    
    // Calculate expiration times
    const accessTokenExpiresIn = '7d'; // 15 minutes
    const refreshTokenExpiresIn = '7d'; // 7 days
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: accessTokenExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        expiresIn: refreshTokenExpiresIn,
      }),
    ]);

    // Calculate expiration date for session (use refresh token expiration)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 15 * 60 * 100000, // 15 minutes in seconds
      expiresAt,
    };
  }
} 