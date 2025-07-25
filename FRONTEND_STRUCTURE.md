# Frontend Structure - React + Vite + Authentication

## 📁 Cấu trúc thư mục

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── UserMenu.tsx
│   │   │   │   ├── NotificationBell.tsx
│   │   │   │   ├── Header.styles.ts
│   │   │   │   └── index.ts
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Navigation.tsx
│   │   │   │   ├── Sidebar.styles.ts
│   │   │   │   └── index.ts
│   │   │   ├── Loading/
│   │   │   │   ├── Loading.tsx
│   │   │   │   ├── Spinner.tsx
│   │   │   │   ├── Loading.styles.ts
│   │   │   │   └── index.ts
│   │   │   └── Modal/
│   │   │       ├── Modal.tsx
│   │   │       ├── ConfirmModal.tsx
│   │   │       ├── Modal.styles.ts
│   │   │       └── index.ts
│   │   ├── Auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   ├── Auth.styles.ts
│   │   │   └── index.ts
│   │   ├── User/
│   │   │   ├── Profile/
│   │   │   │   ├── Profile.tsx
│   │   │   │   ├── ProfileForm.tsx
│   │   │   │   ├── ChangePassword.tsx
│   │   │   │   ├── Profile.styles.ts
│   │   │   │   └── index.ts
│   │   │   ├── Settings/
│   │   │   │   ├── Settings.tsx
│   │   │   │   ├── Preferences.tsx
│   │   │   │   ├── Subscription.tsx
│   │   │   │   ├── Settings.styles.ts
│   │   │   │   └── index.ts
│   │   │   └── Sessions/
│   │   │       ├── Sessions.tsx
│   │   │       ├── SessionCard.tsx
│   │   │       ├── Sessions.styles.ts
│   │   │       └── index.ts
│   │   ├── FileUpload/
│   │   │   ├── FileUpload.tsx
│   │   │   ├── FileUpload.styles.ts
│   │   │   └── index.ts
│   │   ├── StoryEditor/
│   │   │   ├── StoryEditor.tsx
│   │   │   ├── PromptEditor.tsx
│   │   │   ├── StoryEditor.styles.ts
│   │   │   └── index.ts
│   │   ├── AudioPlayer/
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── AudioControls.tsx
│   │   │   ├── AudioProgress.tsx
│   │   │   ├── AudioPlayer.styles.ts
│   │   │   └── index.ts
│   │   ├── ImageGallery/
│   │   │   ├── ImageGallery.tsx
│   │   │   ├── ImageCard.tsx
│   │   │   ├── ImageModal.tsx
│   │   │   ├── ImageGallery.styles.ts
│   │   │   └── index.ts
│   │   ├── AutoMode/
│   │   │   ├── AutoMode.tsx
│   │   │   ├── BatchSettings.tsx
│   │   │   ├── ProcessingQueue.tsx
│   │   │   ├── AutoMode.styles.ts
│   │   │   └── index.ts
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── StatsCards.tsx
│   │   │   ├── Charts/
│   │   │   │   ├── ProcessingChart.tsx
│   │   │   │   ├── GenreChart.tsx
│   │   │   │   └── TimelineChart.tsx
│   │   │   ├── RecentStories.tsx
│   │   │   ├── Dashboard.styles.ts
│   │   │   └── index.ts
│   │   └── Realtime/
│   │       ├── ProcessingStatus.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── StatusIndicator.tsx
│   │       ├── Realtime.styles.ts
│   │       └── index.ts
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── Login/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Login.styles.ts
│   │   │   │   └── index.ts
│   │   │   ├── Register/
│   │   │   │   ├── Register.tsx
│   │   │   │   ├── Register.styles.ts
│   │   │   │   └── index.ts
│   │   │   └── ForgotPassword/
│   │   │       ├── ForgotPassword.tsx
│   │   │       ├── ForgotPassword.styles.ts
│   │   │       └── index.ts
│   │   ├── Home/
│   │   │   ├── Home.tsx
│   │   │   ├── Home.styles.ts
│   │   │   └── index.ts
│   │   ├── StoryDetail/
│   │   │   ├── StoryDetail.tsx
│   │   │   ├── StoryContent.tsx
│   │   │   ├── StoryDetail.styles.ts
│   │   │   └── index.ts
│   │   ├── BatchProcessing/
│   │   │   ├── BatchProcessing.tsx
│   │   │   ├── JobList.tsx
│   │   │   ├── JobDetail.tsx
│   │   │   ├── BatchProcessing.styles.ts
│   │   │   └── index.ts
│   │   ├── Dashboard/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── DashboardPage.styles.ts
│   │   │   └── index.ts
│   │   └── User/
│   │       ├── Profile/
│   │       │   ├── ProfilePage.tsx
│   │       │   ├── ProfilePage.styles.ts
│   │       │   └── index.ts
│   │       └── Settings/
│   │           ├── SettingsPage.tsx
│   │           ├── SettingsPage.styles.ts
│   │           └── index.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── auth.api.ts
│   │   │   ├── user.api.ts
│   │   │   ├── stories.api.ts
│   │   │   ├── audio.api.ts
│   │   │   ├── images.api.ts
│   │   │   ├── batch.api.ts
│   │   │   ├── dashboard.api.ts
│   │   │   └── index.ts
│   │   ├── socket/
│   │   │   ├── socket.service.ts
│   │   │   ├── socket.types.ts
│   │   │   └── index.ts
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   ├── auth.interceptor.ts
│   │   │   └── index.ts
│   │   ├── ai/
│   │   │   ├── ai.service.ts
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── file.utils.ts
│   │       ├── text.utils.ts
│   │       ├── date.utils.ts
│   │       └── index.ts
│   ├── store/
│   │   ├── auth.store.ts
│   │   ├── user.store.ts
│   │   ├── stories.store.ts
│   │   ├── audio.store.ts
│   │   ├── images.store.ts
│   │   ├── batch.store.ts
│   │   ├── dashboard.store.ts
│   │   ├── socket.store.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── story.types.ts
│   │   ├── audio.types.ts
│   │   ├── image.types.ts
│   │   ├── batch.types.ts
│   │   ├── dashboard.types.ts
│   │   ├── socket.types.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   ├── useSocket.ts
│   │   ├── useStories.ts
│   │   ├── useAudio.ts
│   │   ├── useImages.ts
│   │   ├── useBatch.ts
│   │   ├── useDashboard.ts
│   │   └── index.ts
│   ├── constants/
│   │   ├── api.constants.ts
│   │   ├── socket.constants.ts
│   │   ├── file.constants.ts
│   │   ├── auth.constants.ts
│   │   └── index.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 🔐 Authentication Components

### 1. Auth Components

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

#### ForgotPassword Component
```typescript
interface ForgotPasswordProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface ForgotPasswordFormData {
  email: string;
}

interface ForgotPasswordState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
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

#### ChangePassword Component
```typescript
interface ChangePasswordProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordState {
  isLoading: boolean;
  error: string | null;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
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

interface SessionsState {
  isLoading: boolean;
  error: string | null;
  selectedSession: string | null;
}
```

### 3. Settings Components

#### Settings Component
```typescript
interface SettingsProps {
  user: User;
  onUpdate?: (settings: any) => void;
}

interface SettingsState {
  activeTab: 'profile' | 'preferences' | 'subscription' | 'security';
  isLoading: boolean;
  error: string | null;
}
```

#### Preferences Component
```typescript
interface PreferencesProps {
  preferences: UserPreferences;
  onUpdate?: (preferences: UserPreferences) => void;
}

interface UserPreferences {
  language: string;
  theme: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
}

interface PreferencesState {
  isLoading: boolean;
  error: string | null;
  hasChanges: boolean;
}
```

#### Subscription Component
```typescript
interface SubscriptionProps {
  subscription: UserSubscription;
  onUpgrade?: (plan: string) => void;
  onCancel?: () => void;
}

interface UserSubscription {
  planType: 'free' | 'basic' | 'premium';
  startDate?: Date;
  endDate?: Date;
  autoRenew: boolean;
}

interface SubscriptionState {
  isLoading: boolean;
  error: string | null;
  showUpgradeModal: boolean;
}
```

## 🎨 Components Design

### 1. Realtime Components

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

#### ProgressBar Component
```typescript
interface ProgressBarProps {
  progress: number;
  step: string;
  total: number;
  current: number;
  showPercentage?: boolean;
  showCount?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}
```

#### StatusIndicator Component
```typescript
interface StatusIndicatorProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  animated?: boolean;
}
```

### 2. Dashboard Components

#### StatsCards Component
```typescript
interface StatsCardsProps {
  stats: DashboardStats;
}

interface DashboardStats {
  totalStories: number;
  totalAudioFiles: number;
  totalImages: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
}
```

#### ProcessingChart Component
```typescript
interface ProcessingChartProps {
  data: ProcessingChartData[];
  timeRange: 'day' | 'week' | 'month' | 'year';
}

interface ProcessingChartData {
  date: string;
  completed: number;
  failed: number;
  processing: number;
}
```

#### GenreChart Component
```typescript
interface GenreChartProps {
  data: GenreData[];
  chartType: 'pie' | 'bar' | 'doughnut';
}

interface GenreData {
  genre: string;
  count: number;
  percentage: number;
}
```

#### RecentStories Component
```typescript
interface RecentStoriesProps {
  stories: Story[];
  limit?: number;
  showActions?: boolean;
}
```

### 3. Auth Service

#### Auth Service
```typescript
class AuthService {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private user: User | null = null;

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<AuthResponse>;
  async register(userData: RegisterData): Promise<AuthResponse>;
  async logout(): Promise<void>;
  async refreshAccessToken(): Promise<string>;
  async forgotPassword(email: string): Promise<void>;
  async resetPassword(token: string, password: string): Promise<void>;

  // User management
  async getProfile(): Promise<User>;
  async updateProfile(data: Partial<User>): Promise<User>;
  async changePassword(data: ChangePasswordData): Promise<void>;
  async getSessions(): Promise<UserSession[]>;
  async revokeSession(sessionId: string): Promise<void>;
  async revokeAllSessions(): Promise<void>;

  // Token management
  setTokens(accessToken: string, refreshToken: string): void;
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  clearTokens(): void;
  isAuthenticated(): boolean;
  isTokenExpired(): boolean;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
```

### 4. Socket Service

#### Socket Service
```typescript
class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private authToken: string | null = null;

  connect(token?: string): void;
  disconnect(): void;
  subscribe(event: string, callback: Function): void;
  unsubscribe(event: string, callback: Function): void;
  emit(event: string, data: any): void;
  setAuthToken(token: string): void;
}

// Socket Events
enum SocketEvents {
  // Authentication
  AUTH_CONNECT = 'auth:connect',
  AUTH_DISCONNECT = 'auth:disconnect',

  // Story Processing
  STORY_PROCESSING_START = 'story:processing:start',
  STORY_PROCESSING_PROGRESS = 'story:processing:progress',
  STORY_PROCESSING_COMPLETE = 'story:processing:complete',
  STORY_PROCESSING_ERROR = 'story:processing:error',

  // Audio Processing
  AUDIO_PROCESSING_START = 'audio:processing:start',
  AUDIO_PROCESSING_PROGRESS = 'audio:processing:progress',
  AUDIO_PROCESSING_COMPLETE = 'audio:processing:complete',
  AUDIO_PROCESSING_ERROR = 'audio:processing:error',

  // Image Processing
  IMAGE_PROCESSING_START = 'image:processing:start',
  IMAGE_PROCESSING_PROGRESS = 'image:processing:progress',
  IMAGE_PROCESSING_COMPLETE = 'image:processing:complete',
  IMAGE_PROCESSING_ERROR = 'image:processing:error',

  // Batch Processing
  BATCH_PROCESSING_START = 'batch:processing:start',
  BATCH_PROCESSING_PROGRESS = 'batch:processing:progress',
  BATCH_PROCESSING_COMPLETE = 'batch:processing:complete',
  BATCH_PROCESSING_ERROR = 'batch:processing:error',

  // Dashboard Updates
  DASHBOARD_STATS_UPDATE = 'dashboard:stats:update',
  DASHBOARD_CHART_UPDATE = 'dashboard:chart:update'
}
```

### 5. Auth API

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

### 6. Dashboard API

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

## 🔄 Realtime Workflow

### 1. Authentication Flow
```
1. User enters credentials → Login API call
2. Backend validates → Returns JWT tokens
3. Frontend stores tokens → Sets auth state
4. Socket connects with token → Real-time updates
5. Token expires → Auto refresh or redirect to login
```

### 2. Story Processing Realtime
```
1. User uploads file → Socket emits STORY_PROCESSING_START
2. Backend processes → Socket emits STORY_PROCESSING_PROGRESS with:
   - progress: 0-100%
   - step: 'story'
   - currentChunk: 1
   - totalChunks: 1
3. Backend completes → Socket emits STORY_PROCESSING_COMPLETE
4. Frontend updates UI in real-time
```

### 3. Audio Processing Realtime
```
1. Story completed → Socket emits AUDIO_PROCESSING_START
2. Backend splits content → Socket emits AUDIO_PROCESSING_PROGRESS with:
   - progress: 0-100%
   - step: 'audio'
   - currentChunk: 1
   - totalChunks: 10
   - generatedAudio: 3
   - totalAudio: 10
3. Each chunk completed → Socket emits AUDIO_PROCESSING_PROGRESS
4. All audio completed → Socket emits AUDIO_PROCESSING_COMPLETE
```

### 4. Image Processing Realtime
```
1. Audio completed → Socket emits IMAGE_PROCESSING_START
2. Backend processes chunks → Socket emits IMAGE_PROCESSING_PROGRESS with:
   - progress: 0-100%
   - step: 'images'
   - currentChunk: 1
   - totalChunks: 10
   - generatedImages: 3
   - totalImages: 10
3. Each image completed → Socket emits IMAGE_PROCESSING_PROGRESS
4. All images completed → Socket emits IMAGE_PROCESSING_COMPLETE
```

### 5. Batch Processing Realtime
```
1. User starts batch → Socket emits BATCH_PROCESSING_START
2. Backend processes files → Socket emits BATCH_PROCESSING_PROGRESS with:
   - progress: 0-100%
   - currentFile: 1
   - totalFiles: 5
   - processedFiles: 2
   - failedFiles: 0
3. Each file completed → Socket emits BATCH_PROCESSING_PROGRESS
4. All files completed → Socket emits BATCH_PROCESSING_COMPLETE
```

## 📊 Dashboard Features

### 1. Statistics Cards
- Total Stories Created
- Total Audio Files Generated
- Total Images Generated
- Active Processing Jobs
- Average Processing Time
- Success Rate

### 2. Charts
- Processing Timeline Chart (daily/weekly/monthly)
- Genre Distribution Chart
- Processing Success/Failure Chart
- Processing Time Distribution Chart

### 3. Recent Activities
- Recent Stories List
- Recent Processing Jobs
- Top Performing Stories
- Failed Jobs List

### 4. Real-time Updates
- Live Statistics Updates
- Live Chart Updates
- Live Activity Feed
- Live Processing Status

## 🔐 Authentication Features

### 1. User Authentication
- Login with username/email and password
- Registration with validation
- Password reset functionality
- Remember me option
- Auto-logout on token expiration

### 2. Session Management
- Multiple device session support
- Session tracking and management
- Force logout from all devices
- Session expiration handling
- Device information display

### 3. User Profile Management
- Profile information editing
- Avatar upload and management
- Password change functionality
- User preferences settings
- Subscription plan management

### 4. Security Features
- JWT token-based authentication
- Secure password hashing
- CSRF protection
- Rate limiting
- Input validation and sanitization

## 🎯 Key Features

### 1. Real-time Processing Status
- Live progress bars for each step
- Real-time chunk counters
- Estimated time remaining
- Error notifications
- Success confirmations

### 2. Dashboard Analytics
- Comprehensive statistics
- Interactive charts
- Performance metrics
- Trend analysis
- Export capabilities

### 3. User Management
- Complete user profile management
- Session tracking and control
- Subscription plan management
- User preferences and settings
- Security and privacy controls

### 4. Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop enhancement
- Touch-friendly controls

### 5. Performance Optimization
- Lazy loading components
- Virtual scrolling
- Image optimization
- Caching strategies
- Debounced updates 