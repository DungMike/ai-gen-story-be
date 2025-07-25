# AI Story Generator - System Design

## 🎯 Tổng quan hệ thống

Hệ thống cho phép người dùng đăng ký, đăng nhập và upload file truyện (.txt), tùy chỉnh prompt và tạo ra:
- Truyện mới với phong cách khác
- Audio từ text (Text-to-Speech)
- Hình ảnh minh họa (Text-to-Image)
- Chế độ tự động xử lý hàng loạt
- Quản lý người dùng và phiên làm việc
- Dashboard thống kê thời gian thực

## 🏗️ Kiến trúc hệ thống

### Frontend (React + Vite)
```
src/
├── components/
│   ├── Auth/
│   │   ├── LoginForm/
│   │   ├── RegisterForm/
│   │   └── ForgotPassword/
│   ├── User/
│   │   ├── Profile/
│   │   ├── Settings/
│   │   └── Sessions/
│   ├── FileUpload/
│   ├── StoryEditor/
│   ├── AudioPlayer/
│   ├── ImageGallery/
│   ├── AutoMode/
│   └── Dashboard/
├── pages/
│   ├── Auth/
│   ├── Home/
│   ├── StoryDetail/
│   ├── BatchProcessing/
│   ├── Dashboard/
│   └── User/
├── services/
│   ├── auth/
│   ├── api/
│   ├── socket/
│   └── ai/
└── types/
    └── index.ts
```

### Backend (NestJS)
```
src/
├── modules/
│   ├── users/
│   ├── stories/
│   ├── audio/
│   ├── images/
│   ├── batch/
│   └── dashboard/
├── services/
│   ├── gemini.service.ts
│   ├── tts.service.ts
│   └── image.service.ts
├── database/
│   └── schemas/
└── common/
    ├── guards/
    ├── decorators/
    └── interceptors/
```

## 📊 Thiết kế Database (MongoDB)

### 1. Collection: Users
```javascript
{
  _id: ObjectId,
  username: String,           // unique, 1-50 chars
  email: String,              // unique, valid format
  password: String,           // hashed with bcrypt
  fullName: String,           // 1-100 chars
  avatar: String,             // optional, URL
  role: String,               // "user", "premium", "admin"
  status: String,             // "active", "inactive", "banned"
  emailVerified: Boolean,     // default: false
  lastLoginAt: Date,          // optional
  loginCount: Number,         // default: 0
  preferences: {
    language: String,          // default: "vi-VN"
    theme: String,            // "light", "dark"
    notifications: {
      email: Boolean,         // default: true
      push: Boolean           // default: true
    }
  },
  subscription: {
    planType: String,         // "free", "basic", "premium"
    startDate: Date,          // optional
    endDate: Date,            // optional
    autoRenew: Boolean        // default: false
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Collection: UserSessions
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // reference to Users
  token: String,              // JWT access token
  refreshToken: String,       // JWT refresh token
  deviceInfo: {
    device: String,           // device type
    os: String,              // operating system
    browser: String,          // browser name
    version: String           // browser version
  },
  ipAddress: String,          // client IP
  userAgent: String,          // user agent string
  isActive: Boolean,          // default: true
  expiresAt: Date,           // token expiration
  createdAt: Date
}
```

### 3. Collection: Stories
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // reference to Users
  title: String,
  originalContent: String,
  generatedContent: String,
  customPrompt: String,
  style: {
    genre: String,        // "fantasy", "romance", "action"
    tone: String,         // "dramatic", "humorous", "serious"
    length: String,       // "short", "medium", "long"
    targetAudience: String // "children", "teen", "adult"
  },
  status: {
    storyGenerated: Boolean,
    audioGenerated: Boolean,
    imagesGenerated: Boolean
  },
  metadata: {
    originalWordCount: Number,
    generatedWordCount: Number,
    processingTime: Number
  },
  files: {
    originalFile: String,    // path to uploaded .txt
    generatedFile: String    // path to generated .txt
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Collection: AudioChunks
```javascript
{
  _id: ObjectId,
  storyId: ObjectId,        // reference to Stories
  chunkIndex: Number,       // order of chunk
  content: String,          // text content of this chunk
  audioFile: String,        // path to .wav file
  duration: Number,         // audio duration in seconds
  wordCount: Number,
  status: String,           // "pending", "processing", "completed", "failed"
  metadata: {
    voiceModel: String,     // "google-tts", "elevenlabs"
    language: String,
    processingTime: Number
  },
  createdAt: Date
}
```

### 5. Collection: ImageChunks
```javascript
{
  _id: ObjectId,
  storyId: ObjectId,        // reference to Stories
  chunkIndex: Number,       // order of chunk
  content: String,          // text content for image generation
  imageFile: String,        // path to generated image
  prompt: String,           // AI prompt used for generation
  status: String,           // "pending", "processing", "completed", "failed"
  style: {
    artStyle: String,       // "realistic", "anime", "comic", "watercolor"
    characterDescription: String,
    backgroundDescription: String
  },
  metadata: {
    aiModel: String,        // "gemini", "dalle-3"
    imageSize: String,      // "512x512", "1024x1024"
    processingTime: Number
  },
  createdAt: Date
}
```

### 6. Collection: BatchJobs
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // reference to Users
  status: String,           // "pending", "processing", "completed", "failed"
  totalFiles: Number,
  processedFiles: Number,
  failedFiles: Number,
  settings: {
    autoMode: Boolean,
    generateAudio: Boolean,
    generateImages: Boolean,
    defaultPrompt: String
  },
  results: [{
    originalFile: String,
    storyId: ObjectId,
    status: String
  }],
  createdAt: Date,
  completedAt: Date
}
```

## 🎨 Frontend Structure

### 1. Authentication Components

#### LoginForm Component
```typescript
interface LoginFormProps {
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
}

interface LoginFormData {
  username: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginFormState {
  isLoading: boolean;
  error: string | null;
  showPassword: boolean;
}
```

#### RegisterForm Component
```typescript
interface RegisterFormProps {
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
}

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  agreeToTerms: boolean;
}

interface RegisterFormState {
  isLoading: boolean;
  error: string | null;
  showPassword: boolean;
  showConfirmPassword: boolean;
}
```

### 2. User Management Components

#### Profile Component
```typescript
interface ProfileProps {
  user: User;
  onUpdate?: (user: User) => void;
}

interface ProfileFormData {
  fullName: string;
  email: string;
  avatar?: string;
  preferences: {
    language: string;
    theme: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
}

interface ProfileState {
  isLoading: boolean;
  error: string | null;
  isEditing: boolean;
}
```

#### Sessions Component
```typescript
interface SessionsProps {
  sessions: UserSession[];
  onRevoke?: (sessionId: string) => void;
  onRevokeAll?: () => void;
}

interface UserSession {
  _id: string;
  deviceInfo?: {
    device: string;
    os: string;
    browser: string;
    version: string;
  };
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date;
}
```

### 3. Processing Components

#### FileUpload Component
```typescript
interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  acceptedTypes?: string[];
}

interface UploadState {
  files: File[];
  isUploading: boolean;
  progress: number;
}
```

#### StoryEditor Component
```typescript
interface StoryEditorProps {
  story: Story;
  onSave: (story: Story) => void;
}

interface CustomPrompt {
  style: string;
  genre: string;
  tone: string;
  length: string;
  additionalInstructions: string;
}
```

#### AudioPlayer Component
```typescript
interface AudioPlayerProps {
  audioChunks: AudioChunk[];
  storyId: string;
}

interface AudioChunk {
  id: string;
  content: string;
  audioFile: string;
  duration: number;
  status: string;
}
```

#### ImageGallery Component
```typescript
interface ImageGalleryProps {
  imageChunks: ImageChunk[];
  storyId: string;
}

interface ImageChunk {
  id: string;
  content: string;
  imageFile: string;
  prompt: string;
  status: string;
}
```

### 4. Real-time Components

#### ProcessingStatus Component
```typescript
interface ProcessingStatusProps {
  storyId: string;
  jobId?: string;
  showDetails?: boolean;
}

interface ProcessingData {
  storyId: string;
  jobId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  step: 'story' | 'audio' | 'images';
  progress: number;
  totalImages: number;
  generatedImages: number;
  totalAudio: number;
  generatedAudio: number;
  currentChunk: number;
  totalChunks: number;
  error?: string;
  estimatedTime?: number;
}
```

### 5. Pages Structure

#### Auth Pages
- Login Page - Đăng nhập với username/email và password
- Register Page - Đăng ký tài khoản mới
- ForgotPassword Page - Quên mật khẩu

#### User Pages
- Profile Page - Quản lý thông tin cá nhân
- Settings Page - Cài đặt tài khoản và tùy chọn
- Sessions Page - Quản lý phiên làm việc

#### Main Pages
- Home Page - Trang chủ với upload và danh sách truyện
- StoryDetail Page - Chi tiết truyện với audio và hình ảnh
- BatchProcessing Page - Xử lý hàng loạt
- Dashboard Page - Thống kê và biểu đồ

### 6. API Services

#### Auth API
```typescript
interface AuthAPI {
  // Authentication
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(userData: RegisterData): Promise<AuthResponse>;
  logout(): Promise<void>;
  refreshToken(refreshToken: string): Promise<AuthResponse>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, password: string): Promise<void>;

  // User management
  getProfile(): Promise<User>;
  updateProfile(data: Partial<User>): Promise<User>;
  changePassword(data: ChangePasswordData): Promise<void>;
  getSessions(): Promise<UserSession[]>;
  revokeSession(sessionId: string): Promise<void>;
  revokeAllSessions(): Promise<void>;
}
```

#### Stories API
```typescript
interface StoriesAPI {
  uploadFiles(files: File[], prompt?: CustomPrompt): Promise<Story[]>;
  generateStory(storyId: string, prompt: CustomPrompt): Promise<Story>;
  getStory(storyId: string): Promise<Story>;
  updateStory(storyId: string, updates: Partial<Story>): Promise<Story>;
  getUserStories(): Promise<Story[]>;
}
```

#### Audio API
```typescript
interface AudioAPI {
  generateAudio(storyId: string, maxWordsPerChunk: number): Promise<AudioChunk[]>;
  getAudioChunks(storyId: string): Promise<AudioChunk[]>;
  downloadAudio(storyId: string): Promise<Blob>;
}
```

#### Images API
```typescript
interface ImagesAPI {
  generateImages(storyId: string, config: ImageConfig): Promise<ImageChunk[]>;
  getImageChunks(storyId: string): Promise<ImageChunk[]>;
  downloadImages(storyId: string): Promise<Blob>;
}
```

#### Batch API
```typescript
interface BatchAPI {
  createBatchJob(files: File[], settings: BatchSettings): Promise<BatchJob>;
  getBatchJob(jobId: string): Promise<BatchJob>;
  getUserBatchJobs(): Promise<BatchJob[]>;
}
```

#### Dashboard API
```typescript
interface DashboardAPI {
  // Statistics
  getStats(timeRange?: string): Promise<DashboardStats>;
  getProcessingStats(timeRange?: string): Promise<ProcessingStats>;
  getGenreStats(): Promise<GenreStats>;
  getTimelineStats(timeRange?: string): Promise<TimelineStats>;

  // Charts Data
  getProcessingChartData(timeRange?: string): Promise<ProcessingChartData[]>;
  getGenreChartData(): Promise<GenreChartData[]>;
  getTimelineChartData(timeRange?: string): Promise<TimelineChartData[]>;

  // Recent Data
  getRecentStories(limit?: number): Promise<Story[]>;
  getRecentJobs(limit?: number): Promise<BatchJob[]>;
  getTopStories(limit?: number): Promise<Story[]>;
}
```

## 🔄 Workflow Processing

### 1. Authentication Workflow
```
User Registration → Validate Data → Hash Password → Create User → Generate Tokens → Create Session → Return Auth Response
User Login → Validate Credentials → Check Status → Update Last Login → Generate Tokens → Create Session → Return Auth Response
Token Refresh → Validate Refresh Token → Check Session → Generate New Tokens → Update Session → Return Auth Response
```

### 2. Story Generation Workflow
```
Upload File → Parse Content → Apply Custom Prompt → 
Call Gemini API → Save Generated Story → Emit Real-time Updates → Return to Frontend
```

### 3. Audio Generation Workflow
```
Story Content → Split into Chunks → For each chunk:
Call TTS API → Save Audio File → Update Database → Emit Real-time Progress → 
Return Audio URLs to Frontend
```

### 4. Image Generation Workflow
```
Story Content → Split into Chunks → For each chunk:
Create Image Prompt → Call Image AI → Save Image → 
Update Database → Emit Real-time Progress → Return Image URLs to Frontend
```

### 5. Auto Mode Workflow
```
Multiple Files → For each file:
Generate Story → Generate Audio → Generate Images → 
Save All Results → Emit Real-time Updates → Return Complete Package
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Tailwind CSS + Headless UI
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Socket Client**: Socket.IO Client
- **File Handling**: File API
- **Authentication**: JWT + Local Storage

### Backend
- **Framework**: NestJS + TypeScript
- **Database**: MongoDB + Mongoose
- **File Storage**: Local filesystem
- **Authentication**: JWT + bcrypt
- **Session Management**: Custom session tracking
- **AI Services**: 
  - Google Gemini API (text + image)
  - Google TTS / ElevenLabs (audio)
- **Real-time**: Socket.IO
- **Validation**: Joi
- **Documentation**: Swagger

### Development Tools
- **Package Manager**: npm/yarn
- **Linting**: ESLint + Prettier
- **Testing**: Jest + React Testing Library
- **Git Hooks**: Husky

## 📁 File Storage Structure

```
uploads/
├── avatars/
│   └── {userId}/
│       └── avatar.jpg
├── original/
│   └── {storyId}/
│       └── original.txt
├── generated/
│   └── {storyId}/
│       └── generated.txt
├── audio/
│   └── {storyId}/
│       ├── chunk_0.wav
│       ├── chunk_1.wav
│       └── ...
└── images/
    └── {storyId}/
        ├── chunk_0.png
        ├── chunk_1.png
        └── ...
```

## 🔐 Security Considerations

1. **Authentication Security**
   - JWT token-based authentication
   - Secure password hashing with bcrypt (12 rounds)
   - Session management with device tracking
   - Token refresh mechanism
   - Account status management

2. **API Security**
   - Global authentication guard
   - Role-based access control
   - Rate limiting per user
   - Input validation and sanitization
   - CORS configuration

3. **Data Protection**
   - User-specific data isolation
   - Sensitive data encryption
   - Secure file storage
   - User data privacy controls
   - Session revocation capabilities

4. **Real-time Security**
   - Socket authentication with JWT
   - User-specific socket rooms
   - Real-time data validation
   - Connection monitoring

## 📈 Performance Optimization

1. **Frontend**
   - Lazy loading components
   - Virtual scrolling for large lists
   - Image optimization and caching
   - Token-based API caching
   - Debounced real-time updates

2. **Backend**
   - Database indexing optimization
   - Caching strategies (Redis)
   - Async processing queues
   - File streaming for large files
   - Connection pooling

3. **Real-time Processing**
   - WebSocket connection pooling
   - Event batching and throttling
   - Progress tracking optimization
   - Error handling and recovery
   - Memory management for large files

4. **User Experience**
   - Progressive loading
   - Skeleton screens
   - Optimistic updates
   - Offline capability
   - Mobile-first responsive design 