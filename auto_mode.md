# Auto Mode - Kế hoạch triển khai

## 🎯 Tổng quan tính năng

Auto Mode cho phép người dùng:
- Tải lên nhiều file .txt cùng lúc
- Cài đặt cấu hình chung một lần cho tất cả file
- Tự động hóa toàn bộ quá trình: Story → Images → Audio
- Xử lý tuần tự các file với hàng đợi chịu tải cao

## 📁 Cấu trúc mở rộng

### 1. Backend - Auto Mode Module

```
backend/src/modules/auto-mode/
├── auto-mode.module.ts
├── auto-mode.controller.ts
├── auto-mode.service.ts
├── auto-mode.gateway.ts
├── dto/
│   ├── create-auto-job.dto.ts
│   ├── auto-settings.dto.ts
│   ├── auto-job-response.dto.ts
│   └── auto-progress.dto.ts
├── entities/
│   ├── auto-job.entity.ts
│   ├── auto-settings.entity.ts
│   └── auto-file.entity.ts
└── schemas/
    ├── auto-job.schema.ts
    ├── auto-settings.schema.ts
    └── auto-file.schema.ts
```

### 2. Frontend - Auto Mode Components

```
frontend/src/components/AutoMode/
├── AutoMode.tsx
├── AutoSettings.tsx
├── FileUpload.tsx
├── JobQueue.tsx
├── JobProgress.tsx
├── AutoMode.styles.ts
└── index.ts
```

## 🗄️ Database Schemas

### 1. AutoJob Schema

```typescript
// autoJobs collection
{
  _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'Users',
    required: true,
    index: true
  },
  jobId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  settings: {
    storyPrompt: {
      type: String,
      required: true,
      maxlength: 2000
    },
    imageWordsPerChunk: {
      type: Number,
      required: true,
      min: 50,
      max: 500,
      default: 100
    },
    imagePrompt: {
      type: String,
      required: true,
      maxlength: 1000
    },
    audioWordsPerChunk: {
      type: Number,
      required: true,
      min: 50,
      max: 500,
      default: 100
    },
    audioVoice: {
      type: String,
      required: true,
      enum: ['male', 'female', 'child']
    }
  },
  files: [{
    originalName: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    storyId: {
      type: ObjectId,
      ref: 'Stories'
    },
    progress: {
      story: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      images: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      audio: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    },
    error: {
      type: String,
      maxlength: 1000
    },
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    }
  }],
  statistics: {
    totalFiles: {
      type: Number,
      default: 0
    },
    processedFiles: {
      type: Number,
      default: 0
    },
    failedFiles: {
      type: Number,
      default: 0
    },
    totalStories: {
      type: Number,
      default: 0
    },
    totalImages: {
      type: Number,
      default: 0
    },
    totalAudioChunks: {
      type: Number,
      default: 0
    },
    totalProcessingTime: {
      type: Number,
      default: 0
    }
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

### 2. AutoSettings Schema

```typescript
// autoSettings collection
{
  _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'Users',
    required: true,
    unique: true
  },
  defaultSettings: {
    storyPrompt: {
      type: String,
      required: true,
      maxlength: 2000,
      default: 'Tạo một câu chuyện hấp dẫn dựa trên nội dung sau:'
    },
    imageWordsPerChunk: {
      type: Number,
      required: true,
      min: 50,
      max: 500,
      default: 100
    },
    imagePrompt: {
      type: String,
      required: true,
      maxlength: 1000,
      default: 'Tạo hình ảnh minh họa cho đoạn văn này với phong cách anime, màu sắc tươi sáng'
    },
    audioWordsPerChunk: {
      type: Number,
      required: true,
      min: 50,
      max: 500,
      default: 100
    },
    audioVoice: {
      type: String,
      required: true,
      enum: ['male', 'female', 'child'],
      default: 'female'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

## 🔄 Luồng xử lý Auto Mode

### 1. Khởi tạo Auto Job

```typescript
// 1. User upload files và cài đặt
POST /api/auto-mode/jobs
{
  "files": [File1, File2, File3],
  "settings": {
    "storyPrompt": "Tạo truyện từ nội dung:",
    "imageWordsPerChunk": 100,
    "imagePrompt": "Tạo ảnh anime cho đoạn văn:",
    "audioWordsPerChunk": 100,
    "audioVoice": "female"
  }
}

// 2. Backend tạo AutoJob
{
  jobId: "auto_20241201_001",
  status: "pending",
  files: [
    {
      originalName: "story1.txt",
      fileName: "story1_20241201_001.txt",
      filePath: "/uploads/auto/story1_20241201_001.txt",
      status: "pending"
    }
  ]
}
```

### 2. Queue Processing System

```typescript
// Queue Manager
class AutoModeQueueManager {
  private queue: Queue<AutoJob>;
  private processingJobs: Map<string, AutoJob>;
  private maxConcurrentJobs: number = 3;

  async addJob(job: AutoJob): Promise<void> {
    await this.queue.add('process-auto-job', job, {
      priority: 1,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
  }

  async processJob(job: AutoJob): Promise<void> {
    // Xử lý từng file trong job
    for (const file of job.files) {
      await this.processFile(job, file);
    }
  }

  private async processFile(job: AutoJob, file: AutoFile): Promise<void> {
    try {
      // 1. Tạo Story
      await this.createStory(job, file);
      
      // 2. Tạo Images
      await this.createImages(job, file);
      
      // 3. Tạo Audio
      await this.createAudio(job, file);
      
      file.status = 'completed';
      file.completedAt = new Date();
      
    } catch (error) {
      file.status = 'failed';
      file.error = error.message;
    }
  }
}
```

### 3. Story Processing

```typescript
// Story Processor cho Auto Mode
class AutoStoryProcessor {
  async processStory(job: AutoJob, file: AutoFile): Promise<Story> {
    // 1. Đọc file content
    const content = await this.readFileContent(file.filePath);
    
    // 2. Tạo prompt với custom settings
    const prompt = `${job.settings.storyPrompt}\n\n${content}`;
    
    // 3. Gọi AI service
    const storyContent = await this.aiService.generateStory(prompt);
    
    // 4. Tạo Story entity
    const story = await this.storyService.create({
      userId: job.userId,
      title: this.generateTitle(file.originalName),
      originalContent: content,
      generatedContent: storyContent,
      source: 'auto-mode',
      autoJobId: job._id
    });
    
    // 5. Cập nhật file progress
    file.storyId = story._id;
    file.progress.story = 100;
    
    return story;
  }
}
```

### 4. Image Processing

```typescript
// Image Processor cho Auto Mode
class AutoImageProcessor {
  async processImages(job: AutoJob, file: AutoFile, story: Story): Promise<void> {
    // 1. Chia content thành chunks
    const chunks = this.splitContent(story.generatedContent, job.settings.imageWordsPerChunk);
    
    // 2. Xử lý từng chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // 3. Tạo prompt cho image
      const imagePrompt = `${job.settings.imagePrompt}\n\n${chunk}`;
      
      // 4. Gọi AI image service
      const imageUrl = await this.imageService.generateImage(imagePrompt);
      
      // 5. Tạo ImageChunk entity
      await this.imageService.create({
        storyId: story._id,
        chunkIndex: i,
        content: chunk,
        imageUrl: imageUrl,
        prompt: imagePrompt,
        source: 'auto-mode'
      });
      
      // 6. Cập nhật progress
      file.progress.images = ((i + 1) / chunks.length) * 100;
      
      // 7. Emit socket event
      this.socketService.emit('auto:image:progress', {
        jobId: job.jobId,
        fileId: file._id,
        progress: file.progress.images,
        currentChunk: i + 1,
        totalChunks: chunks.length
      });
    }
  }
}
```

### 5. Audio Processing

```typescript
// Audio Processor cho Auto Mode
class AutoAudioProcessor {
  async processAudio(job: AutoJob, file: AutoFile, story: Story): Promise<void> {
    // 1. Chia content thành chunks
    const chunks = this.splitContent(story.generatedContent, job.settings.audioWordsPerChunk);
    
    // 2. Xử lý từng chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // 3. Gọi TTS service
      const audioUrl = await this.ttsService.generateAudio(chunk, job.settings.audioVoice);
      
      // 4. Tạo AudioChunk entity
      await this.audioService.create({
        storyId: story._id,
        chunkIndex: i,
        content: chunk,
        audioUrl: audioUrl,
        voice: job.settings.audioVoice,
        source: 'auto-mode'
      });
      
      // 5. Cập nhật progress
      file.progress.audio = ((i + 1) / chunks.length) * 100;
      
      // 6. Emit socket event
      this.socketService.emit('auto:audio:progress', {
        jobId: job.jobId,
        fileId: file._id,
        progress: file.progress.audio,
        currentChunk: i + 1,
        totalChunks: chunks.length
      });
    }
  }
}
```

## 🔌 Socket Events

### 1. Auto Mode Events

```typescript
// Socket Events cho Auto Mode
enum AutoModeEvents {
  // Job Events
  AUTO_JOB_START = 'auto:job:start',
  AUTO_JOB_PROGRESS = 'auto:job:progress',
  AUTO_JOB_COMPLETE = 'auto:job:complete',
  AUTO_JOB_ERROR = 'auto:job:error',
  
  // File Events
  AUTO_FILE_START = 'auto:file:start',
  AUTO_FILE_PROGRESS = 'auto:file:progress',
  AUTO_FILE_COMPLETE = 'auto:file:complete',
  AUTO_FILE_ERROR = 'auto:file:error',
  
  // Story Events
  AUTO_STORY_START = 'auto:story:start',
  AUTO_STORY_COMPLETE = 'auto:story:complete',
  AUTO_STORY_ERROR = 'auto:story:error',
  
  // Image Events
  AUTO_IMAGE_START = 'auto:image:start',
  AUTO_IMAGE_PROGRESS = 'auto:image:progress',
  AUTO_IMAGE_COMPLETE = 'auto:image:complete',
  AUTO_IMAGE_ERROR = 'auto:image:error',
  
  // Audio Events
  AUTO_AUDIO_START = 'auto:audio:start',
  AUTO_AUDIO_PROGRESS = 'auto:audio:progress',
  AUTO_AUDIO_COMPLETE = 'auto:audio:complete',
  AUTO_AUDIO_ERROR = 'auto:audio:error'
}
```

### 2. Real-time Progress Updates

```typescript
// Progress Update Structure
interface AutoProgressUpdate {
  jobId: string;
  fileId: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    story: number;
    images: number;
    audio: number;
  };
  currentStep: 'story' | 'images' | 'audio';
  currentChunk: number;
  totalChunks: number;
  error?: string;
  estimatedTime?: number;
}
```

## 🎨 Frontend Components

### 1. AutoMode Component

```typescript
interface AutoModeProps {
  onJobCreated?: (job: AutoJob) => void;
  onJobCompleted?: (job: AutoJob) => void;
}

interface AutoModeState {
  isUploading: boolean;
  isProcessing: boolean;
  currentJob: AutoJob | null;
  jobQueue: AutoJob[];
  settings: AutoSettings;
  error: string | null;
}
```

### 2. AutoSettings Component

```typescript
interface AutoSettingsProps {
  settings: AutoSettings;
  onSave?: (settings: AutoSettings) => void;
  onReset?: () => void;
}

interface AutoSettingsForm {
  storyPrompt: string;
  imageWordsPerChunk: number;
  imagePrompt: string;
  audioWordsPerChunk: number;
  audioVoice: 'male' | 'female' | 'child';
}
```

### 3. JobQueue Component

```typescript
interface JobQueueProps {
  jobs: AutoJob[];
  onJobSelect?: (job: AutoJob) => void;
  onJobCancel?: (jobId: string) => void;
}

interface JobQueueState {
  selectedJob: string | null;
  expandedJobs: Set<string>;
}
```

### 4. JobProgress Component

```typescript
interface JobProgressProps {
  job: AutoJob;
  showDetails?: boolean;
}

interface JobProgressState {
  isExpanded: boolean;
  selectedFile: string | null;
}
```

## 🔧 API Endpoints

### 1. Auto Mode API

```typescript
// Auto Mode Controller
@Controller('auto-mode')
export class AutoModeController {
  
  // Tạo auto job mới
  @Post('jobs')
  @UseGuards(AuthGuard)
  async createAutoJob(
    @CurrentUser() user: User,
    @Body() createJobDto: CreateAutoJobDto
  ): Promise<AutoJobResponse> {
    return this.autoModeService.createJob(user._id, createJobDto);
  }
  
  // Lấy danh sách jobs
  @Get('jobs')
  @UseGuards(AuthGuard)
  async getAutoJobs(
    @CurrentUser() user: User,
    @Query() query: GetAutoJobsDto
  ): Promise<AutoJobResponse[]> {
    return this.autoModeService.getJobs(user._id, query);
  }
  
  // Lấy chi tiết job
  @Get('jobs/:jobId')
  @UseGuards(AuthGuard)
  async getAutoJob(
    @CurrentUser() user: User,
    @Param('jobId') jobId: string
  ): Promise<AutoJobResponse> {
    return this.autoModeService.getJob(user._id, jobId);
  }
  
  // Hủy job
  @Delete('jobs/:jobId')
  @UseGuards(AuthGuard)
  async cancelAutoJob(
    @CurrentUser() user: User,
    @Param('jobId') jobId: string
  ): Promise<void> {
    return this.autoModeService.cancelJob(user._id, jobId);
  }
  
  // Lấy settings
  @Get('settings')
  @UseGuards(AuthGuard)
  async getAutoSettings(
    @CurrentUser() user: User
  ): Promise<AutoSettingsResponse> {
    return this.autoModeService.getSettings(user._id);
  }
  
  // Cập nhật settings
  @Put('settings')
  @UseGuards(AuthGuard)
  async updateAutoSettings(
    @CurrentUser() user: User,
    @Body() updateSettingsDto: UpdateAutoSettingsDto
  ): Promise<AutoSettingsResponse> {
    return this.autoModeService.updateSettings(user._id, updateSettingsDto);
  }
}
```

## 🚀 Triển khai theo giai đoạn

### Giai đoạn 1: Core Infrastructure
1. Tạo Auto Mode module và schemas
2. Implement queue system với Bull/BullMQ
3. Tạo basic API endpoints
4. Setup socket events

### Giai đoạn 2: Processing Logic
1. Implement story processing cho auto mode
2. Implement image processing cho auto mode
3. Implement audio processing cho auto mode
4. Add error handling và retry logic

### Giai đoạn 3: Frontend Components
1. Tạo AutoMode component
2. Tạo AutoSettings component
3. Tạo JobQueue component
4. Tạo JobProgress component

### Giai đoạn 4: Real-time Features
1. Implement socket connections
2. Add real-time progress updates
3. Add live job status updates
4. Add notifications

### Giai đoạn 5: Optimization
1. Add job prioritization
2. Implement resource management
3. Add performance monitoring
4. Add analytics và reporting

## 🔒 Security & Performance

### 1. Security Measures
- File upload validation (size, type, content)
- Rate limiting cho API endpoints
- User authentication và authorization
- Input sanitization và validation
- CSRF protection

### 2. Performance Optimization
- Queue management với concurrency control
- File processing với streaming
- Memory management cho large files
- Caching strategies
- Database indexing

### 3. Error Handling
- Graceful error recovery
- Retry mechanisms với exponential backoff
- Error logging và monitoring
- User-friendly error messages
- Job recovery sau system restart

## 📊 Monitoring & Analytics

### 1. Job Metrics
- Total jobs processed
- Success/failure rates
- Average processing time
- Queue length monitoring
- Resource usage tracking

### 2. User Analytics
- Most used settings
- Popular file types
- Processing patterns
- User engagement metrics

### 3. System Health
- Queue performance
- Memory usage
- CPU utilization
- Disk space monitoring
- Network latency

## 🎯 Kết luận

Auto Mode sẽ cung cấp một giải pháp hoàn chỉnh cho việc xử lý hàng loạt file với:
- Cấu hình linh hoạt
- Xử lý tự động hoàn toàn
- Real-time progress tracking
- Queue management chịu tải cao
- Error handling robust
- Performance optimization

Tính năng này sẽ giúp người dùng tiết kiệm thời gian đáng kể khi cần xử lý nhiều file cùng lúc với cùng một cấu hình. 