# AI Story Generator Backend

Backend API cho ứng dụng AI Story Generator được xây dựng với NestJS, MongoDB và Socket.IO.

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js (v18+)
- MongoDB
- npm hoặc yarn

### Cài đặt dependencies
```bash
npm install
```

### Cấu hình môi trường
1. Copy file `env.example` thành `.env`:
```bash
cp env.example .env
```

2. Cập nhật các biến môi trường trong file `.env`:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ai-story-generator

# AI Services Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_TTS_API_KEY=your_google_tts_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# File Storage Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=.txt,.doc,.docx

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Socket.IO Configuration
SOCKET_CORS_ORIGIN=http://localhost:3000
SOCKET_CREDENTIALS=true

# Security Configuration
JWT_SECRET=your_jwt_secret_here
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Chạy ứng dụng

#### Development mode
```bash
npm run start:dev
```

#### Production mode
```bash
npm run build
npm run start:prod
```

## 📁 Cấu trúc dự án

```
src/
├── config/                 # Cấu hình ứng dụng
├── database/              # Database schemas và repositories
├── modules/               # Các module chính
│   ├── stories/          # Module quản lý truyện
│   ├── audio/            # Module xử lý audio
│   ├── images/           # Module xử lý hình ảnh
│   ├── batch/            # Module xử lý hàng loạt
│   └── dashboard/        # Module dashboard
├── services/             # Các service
│   ├── ai/              # AI services (Gemini, TTS, Image)
│   ├── file/            # File upload và storage
│   ├── processing/      # Processing services
│   └── socket/          # Socket.IO services
├── common/              # Common utilities
└── types/               # TypeScript types
```

## 🔌 API Endpoints

### Stories
- `GET /api/stories` - Lấy danh sách truyện
- `GET /api/stories/:id` - Lấy chi tiết truyện
- `POST /api/stories` - Tạo truyện mới
- `POST /api/stories/:id/generate` - Tạo truyện với AI

### Audio
- `POST /api/audio/:storyId/generate` - Tạo audio cho truyện
- `GET /api/audio/:storyId/chunks` - Lấy danh sách audio chunks

### Images
- `POST /api/images/:storyId/generate` - Tạo hình ảnh cho truyện
- `GET /api/images/:storyId/chunks` - Lấy danh sách image chunks

### Batch Processing
- `POST /api/batch/start` - Bắt đầu xử lý hàng loạt
- `GET /api/batch/jobs` - Lấy danh sách batch jobs
- `GET /api/batch/jobs/:id` - Lấy chi tiết batch job

### Dashboard
- `GET /api/dashboard/stats` - Lấy thống kê dashboard
- `GET /api/dashboard/charts` - Lấy dữ liệu biểu đồ

## 🔄 Socket.IO Events

### Story Processing
- `story:processing:start` - Bắt đầu xử lý truyện
- `story:processing:progress` - Tiến trình xử lý
- `story:processing:complete` - Hoàn thành xử lý
- `story:processing:error` - Lỗi xử lý

### Audio Processing
- `audio:processing:start` - Bắt đầu tạo audio
- `audio:processing:progress` - Tiến trình tạo audio
- `audio:processing:complete` - Hoàn thành tạo audio
- `audio:processing:error` - Lỗi tạo audio

### Image Processing
- `image:processing:start` - Bắt đầu tạo hình ảnh
- `image:processing:progress` - Tiến trình tạo hình ảnh
- `image:processing:complete` - Hoàn thành tạo hình ảnh
- `image:processing:error` - Lỗi tạo hình ảnh

## 🛠️ Development

### Linting
```bash
npm run lint
```

### Testing
```bash
npm run test
npm run test:watch
npm run test:cov
```

### Build
```bash
npm run build
```

## 📊 Database Collections

- `stories` - Lưu trữ thông tin truyện
- `audioChunks` - Lưu trữ audio chunks
- `imageChunks` - Lưu trữ image chunks
- `batchJobs` - Lưu trữ batch processing jobs

## 🔐 Security

- Helmet middleware cho bảo mật
- CORS configuration
- Rate limiting
- File upload validation
- Input validation với class-validator

## 📈 Performance

- Database indexing
- File streaming
- Async processing
- Socket.IO cho real-time updates 