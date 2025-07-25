# Backend Structure - NestJS + Socket.IO + Authentication

## 📁 Cấu trúc thư mục

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── modules/
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── dto/
│   │   │       └── auth.dto.ts
│   │   ├── stories/
│   │   │   ├── stories.module.ts
│   │   │   ├── stories.controller.ts
│   │   │   ├── stories.service.ts
│   │   │   ├── stories.gateway.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-story.dto.ts
│   │   │   │   ├── update-story.dto.ts
│   │   │   │   └── story-response.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── story.entity.ts
│   │   │   └── schemas/
│   │   │       └── story.schema.ts
│   │   ├── audio/
│   │   │   ├── audio.module.ts
│   │   │   ├── audio.controller.ts
│   │   │   ├── audio.service.ts
│   │   │   ├── audio.gateway.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-audio.dto.ts
│   │   │   │   └── audio-response.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── audio-chunk.entity.ts
│   │   │   └── schemas/
│   │   │       └── audio-chunk.schema.ts
│   │   ├── images/
│   │   │   ├── images.module.ts
│   │   │   ├── images.controller.ts
│   │   │   ├── images.service.ts
│   │   │   ├── images.gateway.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-image.dto.ts
│   │   │   │   └── image-response.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── image-chunk.entity.ts
│   │   │   └── schemas/
│   │   │       └── image-chunk.schema.ts
│   │   ├── batch/
│   │   │   ├── batch.module.ts
│   │   │   ├── batch.controller.ts
│   │   │   ├── batch.service.ts
│   │   │   ├── batch.gateway.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-batch.dto.ts
│   │   │   │   └── batch-response.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── batch-job.entity.ts
│   │   │   └── schemas/
│   │   │       └── batch-job.schema.ts
│   │   └── dashboard/
│   │       ├── dashboard.module.ts
│   │       ├── dashboard.controller.ts
│   │       ├── dashboard.service.ts
│   │       ├── dashboard.gateway.ts
│   │       ├── dto/
│   │       │   └── dashboard-response.dto.ts
│   │       └── entities/
│   │           └── dashboard-stats.entity.ts
│   ├── services/
│   │   ├── ai/
│   │   │   ├── gemini.service.ts
│   │   │   ├── tts.service.ts
│   │   │   ├── image.service.ts
│   │   │   └── index.ts
│   │   ├── file/
│   │   │   ├── file-upload.service.ts
│   │   │   ├── file-storage.service.ts
│   │   │   └── index.ts
│   │   ├── processing/
│   │   │   ├── story-processor.service.ts
│   │   │   ├── audio-processor.service.ts
│   │   │   ├── image-processor.service.ts
│   │   │   └── index.ts
│   │   └── socket/
│   │       ├── socket.service.ts
│   │       ├── socket.types.ts
│   │       └── index.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── schemas/
│   │   │   ├── user.schema.ts
│   │   │   ├── user-session.schema.ts
│   │   │   ├── story.schema.ts
│   │   │   ├── audio-chunk.schema.ts
│   │   │   ├── image-chunk.schema.ts
│   │   │   └── batch-job.schema.ts
│   │   └── repositories/
│   │       ├── user.repository.ts
│   │       ├── user-session.repository.ts
│   │       ├── story.repository.ts
│   │       ├── audio-chunk.repository.ts
│   │       ├── image-chunk.repository.ts
│   │       └── batch-job.repository.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── auth.decorator.ts
│   │   │   ├── api-response.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── utils/
│   │       ├── text.utils.ts
│   │       ├── file.utils.ts
│   │       └── date.utils.ts
│   ├── config/
│   │   ├── configuration.ts
│   │   ├── database.config.ts
│   │   ├── ai.config.ts
│   │   └── socket.config.ts
│   └── types/
│       ├── story.types.ts
│       ├── audio.types.ts
│       ├── image.types.ts
│       ├── batch.types.ts
│       ├── dashboard.types.ts
│       ├── socket.types.ts
│       └── index.ts
├── uploads/
│   ├── original/
│   ├── generated/
│   ├── audio/
│   └── images/
├── package.json
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── .env
├── .env.example
└── README.md
```

## 🔐 Authentication & Authorization

### 1. User Management Module

#### User Schema
```typescript
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
    }
  })
  subscription: {
    planType: string;
    startDate?: Date;
    endDate?: Date;
    autoRenew: boolean;
  };
}
```

#### User Session Schema
```typescript
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
```

### 2. Authentication Service

#### Auth Service Implementation
```typescript
@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private userSessionRepository: UserSessionRepository,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if username/email already exists
    const existingUsername = await this.userRepository.findByUsername(registerDto.username);
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

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
      await this.userSessionRepository.update(session._id.toString(), tokens);

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
    await this.userRepository.update(userId, { password: hashedNewPassword });
  }

  private async generateTokens(userId: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, role },
        { secret: process.env.JWT_SECRET || 'your-secret-key', expiresIn: '15m' }
      ),
      this.jwtService.signAsync(
        { sub: userId, role },
        { secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key', expiresIn: '7d' }
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
```

### 3. Authentication Guard

#### Global Auth Guard
```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private userSessionRepository: UserSessionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Access token required');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });

      // Check if session exists and is active
      const session = await this.userSessionRepository.findByToken(token);
      if (!session || !session.isActive) {
        throw new UnauthorizedException('Invalid session');
      }

      // Attach user to request
      request['user'] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### 4. Authentication Decorator

#### Auth Decorator
```typescript
export const Auth = (...roles: string[]) => {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard),
    ApiBearerAuth(),
  );
};
```

## 🔌 Socket.IO Implementation

### 1. Socket Gateway Structure

#### Stories Gateway
```typescript
@WebSocketGateway({
  namespace: 'stories',
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
})
export class StoriesGateway {
  @WebSocketServer()
  server: Server;

  // Story Processing Events
  emitStoryProcessingStart(storyId: string, data: StoryProcessingData): void;
  emitStoryProcessingProgress(storyId: string, data: StoryProgressData): void;
  emitStoryProcessingComplete(storyId: string, data: StoryCompleteData): void;
  emitStoryProcessingError(storyId: string, data: StoryErrorData): void;
}
```

#### Audio Gateway
```typescript
@WebSocketGateway({
  namespace: 'audio',
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
})
export class AudioGateway {
  @WebSocketServer()
  server: Server;

  // Audio Processing Events
  emitAudioProcessingStart(storyId: string, data: AudioProcessingData): void;
  emitAudioProcessingProgress(storyId: string, data: AudioProgressData): void;
  emitAudioProcessingComplete(storyId: string, data: AudioCompleteData): void;
  emitAudioProcessingError(storyId: string, data: AudioErrorData): void;
}
```

#### Images Gateway
```typescript
@WebSocketGateway({
  namespace: 'images',
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
})
export class ImagesGateway {
  @WebSocketServer()
  server: Server;

  // Image Processing Events
  emitImageProcessingStart(storyId: string, data: ImageProcessingData): void;
  emitImageProcessingProgress(storyId: string, data: ImageProgressData): void;
  emitImageProcessingComplete(storyId: string, data: ImageCompleteData): void;
  emitImageProcessingError(storyId: string, data: ImageErrorData): void;
}
```

#### Batch Gateway
```typescript
@WebSocketGateway({
  namespace: 'batch',
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
})
export class BatchGateway {
  @WebSocketServer()
  server: Server;

  // Batch Processing Events
  emitBatchProcessingStart(jobId: string, data: BatchProcessingData): void;
  emitBatchProcessingProgress(jobId: string, data: BatchProgressData): void;
  emitBatchProcessingComplete(jobId: string, data: BatchCompleteData): void;
  emitBatchProcessingError(jobId: string, data: BatchErrorData): void;
}
```

#### Dashboard Gateway
```typescript
@WebSocketGateway({
  namespace: 'dashboard',
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
})
export class DashboardGateway {
  @WebSocketServer()
  server: Server;

  // Dashboard Updates
  emitStatsUpdate(data: DashboardStats): void;
  emitChartUpdate(chartType: string, data: ChartData): void;
  emitActivityUpdate(data: ActivityData): void;
}
```

### 2. Socket Event Types

#### Story Processing Events
```typescript
interface StoryProcessingData {
  storyId: string;
  title: string;
  originalWordCount: number;
  estimatedTime: number;
  timestamp: Date;
}

interface StoryProgressData {
  storyId: string;
  progress: number;
  step: 'story';
  currentChunk: number;
  totalChunks: number;
  estimatedTimeRemaining: number;
  timestamp: Date;
}

interface StoryCompleteData {
  storyId: string;
  generatedContent: string;
  generatedWordCount: number;
  processingTime: number;
  timestamp: Date;
}

interface StoryErrorData {
  storyId: string;
  error: string;
  step: 'story';
  timestamp: Date;
}
```

#### Audio Processing Events
```typescript
interface AudioProcessingData {
  storyId: string;
  totalChunks: number;
  maxWordsPerChunk: number;
  voiceModel: string;
  estimatedTime: number;
  timestamp: Date;
}

interface AudioProgressData {
  storyId: string;
  progress: number;
  step: 'audio';
  currentChunk: number;
  totalChunks: number;
  generatedAudio: number;
  totalAudio: number;
  estimatedTimeRemaining: number;
  timestamp: Date;
}

interface AudioCompleteData {
  storyId: string;
  totalAudioFiles: number;
  totalDuration: number;
  processingTime: number;
  timestamp: Date;
}

interface AudioErrorData {
  storyId: string;
  error: string;
  step: 'audio';
  chunkIndex?: number;
  timestamp: Date;
}
```

#### Image Processing Events
```typescript
interface ImageProcessingData {
  storyId: string;
  totalChunks: number;
  artStyle: string;
  imageSize: string;
  estimatedTime: number;
  timestamp: Date;
}

interface ImageProgressData {
  storyId: string;
  progress: number;
  step: 'images';
  currentChunk: number;
  totalChunks: number;
  generatedImages: number;
  totalImages: number;
  estimatedTimeRemaining: number;
  timestamp: Date;
}

interface ImageCompleteData {
  storyId: string;
  totalImages: number;
  processingTime: number;
  timestamp: Date;
}

interface ImageErrorData {
  storyId: string;
  error: string;
  step: 'images';
  chunkIndex?: number;
  timestamp: Date;
}
```

#### Batch Processing Events
```typescript
interface BatchProcessingData {
  jobId: string;
  totalFiles: number;
  settings: BatchSettings;
  estimatedTime: number;
  timestamp: Date;
}

interface BatchProgressData {
  jobId: string;
  progress: number;
  currentFile: number;
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  currentStep: 'story' | 'audio' | 'images';
  estimatedTimeRemaining: number;
  timestamp: Date;
}

interface BatchCompleteData {
  jobId: string;
  totalProcessed: number;
  totalFailed: number;
  totalProcessingTime: number;
  timestamp: Date;
}

interface BatchErrorData {
  jobId: string;
  error: string;
  fileIndex?: number;
  timestamp: Date;
}
```

### 3. Processing Services with Socket Integration

#### Story Processor Service
```typescript
@Injectable()
export class StoryProcessorService {
  constructor(
    private readonly storiesGateway: StoriesGateway,
    private readonly geminiService: GeminiService,
    private readonly storyRepository: StoryRepository
  ) {}

  async processStory(storyId: string, customPrompt: string): Promise<Story> {
    try {
      // Emit start event
      this.storiesGateway.emitStoryProcessingStart(storyId, {
        storyId,
        title: 'Processing...',
        originalWordCount: 0,
        estimatedTime: 30,
        timestamp: new Date()
      });

      // Get story from database
      const story = await this.storyRepository.findById(storyId);
      
      // Emit progress event
      this.storiesGateway.emitStoryProcessingProgress(storyId, {
        storyId,
        progress: 25,
        step: 'story',
        currentChunk: 1,
        totalChunks: 1,
        estimatedTimeRemaining: 20,
        timestamp: new Date()
      });

      // Process with Gemini AI
      const generatedContent = await this.geminiService.generateStory(
        story.originalContent,
        customPrompt
      );

      // Update story in database
      const updatedStory = await this.storyRepository.update(storyId, {
        generatedContent,
        status: { storyGenerated: true },
        metadata: {
          generatedWordCount: generatedContent.split(' ').length,
          processingTime: Date.now() - story.createdAt.getTime()
        }
      });

      // Emit complete event
      this.storiesGateway.emitStoryProcessingComplete(storyId, {
        storyId,
        generatedContent,
        generatedWordCount: updatedStory.metadata.generatedWordCount,
        processingTime: updatedStory.metadata.processingTime,
        timestamp: new Date()
      });

      return updatedStory;
    } catch (error) {
      // Emit error event
      this.storiesGateway.emitStoryProcessingError(storyId, {
        storyId,
        error: error.message,
        step: 'story',
        timestamp: new Date()
      });
      throw error;
    }
  }
}
```

#### Audio Processor Service
```typescript
@Injectable()
export class AudioProcessorService {
  constructor(
    private readonly audioGateway: AudioGateway,
    private readonly ttsService: TTSService,
    private readonly audioChunkRepository: AudioChunkRepository
  ) {}

  async processAudio(storyId: string, maxWordsPerChunk: number = 100): Promise<AudioChunk[]> {
    try {
      // Get story content
      const story = await this.storyRepository.findById(storyId);
      const chunks = this.splitContentIntoChunks(story.generatedContent, maxWordsPerChunk);

      // Emit start event
      this.audioGateway.emitAudioProcessingStart(storyId, {
        storyId,
        totalChunks: chunks.length,
        maxWordsPerChunk,
        voiceModel: 'google-tts',
        estimatedTime: chunks.length * 5,
        timestamp: new Date()
      });

      const audioChunks: AudioChunk[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Emit progress event
        this.audioGateway.emitAudioProcessingProgress(storyId, {
          storyId,
          progress: (i / chunks.length) * 100,
          step: 'audio',
          currentChunk: i + 1,
          totalChunks: chunks.length,
          generatedAudio: i,
          totalAudio: chunks.length,
          estimatedTimeRemaining: (chunks.length - i) * 5,
          timestamp: new Date()
        });

        // Generate audio for chunk
        const audioFile = await this.ttsService.generateAudio(chunk);
        
        // Save audio chunk to database
        const audioChunk = await this.audioChunkRepository.create({
          storyId,
          chunkIndex: i,
          content: chunk,
          audioFile,
          wordCount: chunk.split(' ').length,
          status: 'completed'
        });

        audioChunks.push(audioChunk);
      }

      // Emit complete event
      this.audioGateway.emitAudioProcessingComplete(storyId, {
        storyId,
        totalAudioFiles: audioChunks.length,
        totalDuration: audioChunks.reduce((sum, chunk) => sum + chunk.duration, 0),
        processingTime: Date.now() - startTime,
        timestamp: new Date()
      });

      return audioChunks;
    } catch (error) {
      this.audioGateway.emitAudioProcessingError(storyId, {
        storyId,
        error: error.message,
        step: 'audio',
        timestamp: new Date()
      });
      throw error;
    }
  }
}
```

#### Image Processor Service
```typescript
@Injectable()
export class ImageProcessorService {
  constructor(
    private readonly imagesGateway: ImagesGateway,
    private readonly imageService: ImageService,
    private readonly imageChunkRepository: ImageChunkRepository
  ) {}

  async processImages(storyId: string, artStyle: string = 'realistic'): Promise<ImageChunk[]> {
    try {
      // Get story content
      const story = await this.storyRepository.findById(storyId);
      const chunks = this.splitContentIntoChunks(story.generatedContent, 200);

      // Emit start event
      this.imagesGateway.emitImageProcessingStart(storyId, {
        storyId,
        totalChunks: chunks.length,
        artStyle,
        imageSize: '1024x1024',
        estimatedTime: chunks.length * 10,
        timestamp: new Date()
      });

      const imageChunks: ImageChunk[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Emit progress event
        this.imagesGateway.emitImageProcessingProgress(storyId, {
          storyId,
          progress: (i / chunks.length) * 100,
          step: 'images',
          currentChunk: i + 1,
          totalChunks: chunks.length,
          generatedImages: i,
          totalImages: chunks.length,
          estimatedTimeRemaining: (chunks.length - i) * 10,
          timestamp: new Date()
        });

        // Generate image prompt
        const prompt = this.createImagePrompt(chunk, artStyle);
        
        // Generate image
        const imageFile = await this.imageService.generateImage(prompt);
        
        // Save image chunk to database
        const imageChunk = await this.imageChunkRepository.create({
          storyId,
          chunkIndex: i,
          content: chunk,
          imageFile,
          prompt,
          status: 'completed',
          style: { artStyle }
        });

        imageChunks.push(imageChunk);
      }

      // Emit complete event
      this.imagesGateway.emitImageProcessingComplete(storyId, {
        storyId,
        totalImages: imageChunks.length,
        processingTime: Date.now() - startTime,
        timestamp: new Date()
      });

      return imageChunks;
    } catch (error) {
      this.imagesGateway.emitImageProcessingError(storyId, {
        storyId,
        error: error.message,
        step: 'images',
        timestamp: new Date()
      });
      throw error;
    }
  }
}
```

### 4. Dashboard Service with Real-time Updates

#### Dashboard Service
```typescript
@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboardGateway: DashboardGateway,
    private readonly storyRepository: StoryRepository,
    private readonly batchJobRepository: BatchJobRepository
  ) {}

  async getStats(timeRange: string = 'week'): Promise<DashboardStats> {
    const stats = await this.calculateStats(timeRange);
    
    // Emit real-time stats update
    this.dashboardGateway.emitStatsUpdate(stats);
    
    return stats;
  }

  async getProcessingChartData(timeRange: string): Promise<ProcessingChartData[]> {
    const data = await this.calculateProcessingChartData(timeRange);
    
    // Emit real-time chart update
    this.dashboardGateway.emitChartUpdate('processing', data);
    
    return data;
  }

  async getGenreChartData(): Promise<GenreChartData[]> {
    const data = await this.calculateGenreChartData();
    
    // Emit real-time chart update
    this.dashboardGateway.emitChartUpdate('genre', data);
    
    return data;
  }

  private async calculateStats(timeRange: string): Promise<DashboardStats> {
    const startDate = this.getStartDate(timeRange);
    
    const [
      totalStories,
      totalAudioFiles,
      totalImages,
      processingJobs,
      completedJobs,
      failedJobs
    ] = await Promise.all([
      this.storyRepository.count({ createdAt: { $gte: startDate } }),
      this.audioChunkRepository.count({ createdAt: { $gte: startDate } }),
      this.imageChunkRepository.count({ createdAt: { $gte: startDate } }),
      this.batchJobRepository.count({ status: 'processing', createdAt: { $gte: startDate } }),
      this.batchJobRepository.count({ status: 'completed', createdAt: { $gte: startDate } }),
      this.batchJobRepository.count({ status: 'failed', createdAt: { $gte: startDate } })
    ]);

    return {
      totalStories,
      totalAudioFiles,
      totalImages,
      processingJobs,
      completedJobs,
      failedJobs,
      totalProcessingTime: 0, // Calculate from completed jobs
      averageProcessingTime: 0 // Calculate average
    };
  }
}
```

## 🔄 Real-time Processing Workflow

### 1. Story Processing Flow
```
1. User uploads file → POST /api/stories/upload (with auth)
2. Backend creates story record → Emit STORY_PROCESSING_START
3. Process with Gemini AI → Emit STORY_PROCESSING_PROGRESS (25%, 50%, 75%)
4. Save generated content → Emit STORY_PROCESSING_COMPLETE
5. If auto mode → Start audio processing
```

### 2. Audio Processing Flow
```
1. Story completed → Emit AUDIO_PROCESSING_START
2. Split content into chunks → Calculate total chunks
3. For each chunk:
   - Emit AUDIO_PROCESSING_PROGRESS with current progress
   - Call TTS API
   - Save audio file
   - Update database
4. All chunks completed → Emit AUDIO_PROCESSING_COMPLETE
5. If auto mode → Start image processing
```

### 3. Image Processing Flow
```
1. Audio completed → Emit IMAGE_PROCESSING_START
2. Split content into chunks → Calculate total chunks
3. For each chunk:
   - Emit IMAGE_PROCESSING_PROGRESS with current progress
   - Create image prompt
   - Call Image AI API
   - Save image file
   - Update database
4. All images completed → Emit IMAGE_PROCESSING_COMPLETE
```

### 4. Batch Processing Flow
```
1. User starts batch → POST /api/batch/start (with auth)
2. Backend creates batch job → Emit BATCH_PROCESSING_START
3. For each file:
   - Emit BATCH_PROCESSING_PROGRESS with file progress
   - Process story → audio → images
   - Update job progress
4. All files completed → Emit BATCH_PROCESSING_COMPLETE
```

## 📊 Dashboard Real-time Features

### 1. Live Statistics Updates
- Total stories count updates in real-time
- Processing jobs count updates
- Success/failure rates updates
- Processing time averages updates

### 2. Live Chart Updates
- Processing timeline chart updates
- Genre distribution chart updates
- Performance metrics updates
- Trend analysis updates

### 3. Live Activity Feed
- Recent stories updates
- Recent jobs updates
- Error notifications
- Success confirmations

### 4. Real-time Notifications
- Processing start notifications
- Progress updates
- Completion notifications
- Error alerts

## 🔐 Security Features

### 1. Authentication & Authorization
- JWT-based authentication
- Role-based access control (user, premium, admin)
- Session management with refresh tokens
- Secure password hashing with bcrypt
- Account status management (active, inactive, banned)

### 2. Session Management
- Multiple device session support
- Session tracking with device info
- IP address and user agent logging
- Session expiration handling
- Force logout capabilities

### 3. API Security
- Global authentication guard
- Protected routes with @Auth() decorator
- Rate limiting protection
- CORS configuration
- Input validation and sanitization

### 4. User Management
- User registration with validation
- Email and username uniqueness
- Password strength requirements
- User profile management
- Subscription plan management
- User preferences and settings 