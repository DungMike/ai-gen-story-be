import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength, MaxLength, IsEnum } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Username or email',
    example: 'hivk15c3@gmail.com'
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({
    description: 'Password',
    example: 'password123'
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    description: 'Username',
    example: 'john_doe'
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password',
    example: 'password123'
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Full name',
    example: 'John Doe'
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg'
  })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token'
  })
  @IsString()
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Access token'
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token'
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer'
  })
  tokenType: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600
  })
  expiresIn: number;

  @ApiProperty({
    description: 'User information'
  })
  user: {
    _id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
    avatar?: string;
  };
}

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID'
  })
  _id: string;

  @ApiProperty({
    description: 'Username'
  })
  username: string;

  @ApiProperty({
    description: 'Email address'
  })
  email: string;

  @ApiProperty({
    description: 'Full name'
  })
  fullName: string;

  @ApiPropertyOptional({
    description: 'Avatar URL'
  })
  avatar?: string;

  @ApiProperty({
    description: 'User role',
    enum: ['user', 'premium', 'admin']
  })
  role: string;

  @ApiProperty({
    description: 'User status',
    enum: ['active', 'inactive', 'banned']
  })
  status: string;

  @ApiProperty({
    description: 'Email verification status'
  })
  emailVerified: boolean;

  @ApiPropertyOptional({
    description: 'Last login time'
  })
  lastLoginAt?: Date;

  @ApiProperty({
    description: 'Login count'
  })
  loginCount: number;

  @ApiProperty({
    description: 'User preferences'
  })
  preferences: {
    language: string;
    theme: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };

  @ApiProperty({
    description: 'Subscription information'
  })
  subscription: {
    planType: string;
    startDate?: Date;
    endDate?: Date;
    autoRenew: boolean;
  };

  @ApiProperty({
    description: 'Creation timestamp'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp'
  })
  updatedAt: Date;
} 