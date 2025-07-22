# Socket Architecture Documentation

## Tổng quan

Hệ thống socket đã được tái cấu trúc để hỗ trợ nhiều module khác nhau với authentication chung và quản lý room riêng biệt.

## Cấu trúc thư mục

```
src/modules/socket/
├── socket.module.ts      # Module chính quản lý tất cả socket
├── socket.gateway.ts     # Gateway chung xử lý authentication
├── socket.service.ts     # Service quản lý clients và rooms
├── story.gateway.ts      # Gateway xử lý story generation events
├── audio.gateway.ts      # Gateway xử lý audio generation events
└── image.gateway.ts      # Gateway xử lý image generation events
```

## Các Gateway

### 1. SocketGateway (socket.gateway.ts)
- **Namespace**: `/` (root)
- **Chức năng**: 
  - Xử lý authentication cho tất cả connections
  - Quản lý connection/disconnection
  - Cung cấp các events cơ bản (ping/pong, user-info)

### 2. StoryGateway (story.gateway.ts)
- **Namespace**: `/stories`
- **Chức năng**:
  - Xử lý story generation events
  - Room management cho từng story
  - Permission checking cho story access

### 3. AudioGateway (audio.gateway.ts)
- **Namespace**: `/audio`
- **Chức năng**:
  - Xử lý audio generation events
  - Room management cho audio processing
  - Progress tracking cho audio generation

### 4. ImageGateway (image.gateway.ts)
- **Namespace**: `/images`
- **Chức năng**:
  - Xử lý image generation events
  - Room management cho image processing
  - Progress tracking cho image generation

## SocketService

Service chung quản lý:
- Client registration/unregistration
- Room management
- Event emission methods
- User tracking

## Authentication Flow

1. Client kết nối với token trong query parameter
2. SocketGateway verify JWT token
3. Nếu valid, client được register với SocketService
4. Client có thể join các rooms khác nhau theo namespace

## Room Management

### Story Rooms
- **Pattern**: `story-{storyId}`
- **Permission**: Chỉ story owner mới được join
- **Events**: 
  - `story:processing:start`
  - `story:processing:progress`
  - `story:processing:complete`
  - `story:processing:error`

### Audio Rooms
- **Pattern**: `audio-{storyId}`
- **Permission**: Chỉ story owner mới được join
- **Events**:
  - `audio:processing:start`
  - `audio:processing:progress`
  - `audio:processing:complete`
  - `audio:processing:error`

### Image Rooms
- **Pattern**: `image-{storyId}`
- **Permission**: Chỉ story owner mới được join
- **Events**:
  - `image:processing:start`
  - `image:processing:progress`
  - `image:processing:complete`
  - `image:processing:error`

## Frontend Integration

### Kết nối
```javascript
// Kết nối chính
const socket = io('http://localhost:3001', {
  query: { token: 'your-jwt-token' }
});

// Kết nối story namespace
const storySocket = io('http://localhost:3001/stories', {
  query: { token: 'your-jwt-token' }
});

// Kết nối audio namespace
const audioSocket = io('http://localhost:3001/audio', {
  query: { token: 'your-jwt-token' }
});

// Kết nối image namespace
const imageSocket = io('http://localhost:3001/images', {
  query: { token: 'your-jwt-token' }
});
```

### Join Rooms
```javascript
// Join story room
storySocket.emit('join-story-room', { storyId: 'story-id' });

// Join audio room
audioSocket.emit('join-audio-room', { storyId: 'story-id' });

// Join image room
imageSocket.emit('join-image-room', { storyId: 'story-id' });
```

### Listen Events
```javascript
// Story events
storySocket.on('story:processing:start', (data) => {
  console.log('Story processing started:', data);
});

storySocket.on('story:processing:progress', (data) => {
  console.log('Story progress:', data.progress);
});

storySocket.on('story:processing:complete', (data) => {
  console.log('Story completed:', data);
});

// Audio events
audioSocket.on('audio:processing:start', (data) => {
  console.log('Audio processing started:', data);
});

// Image events
imageSocket.on('image:processing:start', (data) => {
  console.log('Image processing started:', data);
});
```

## Backend Usage

### Inject Gateways
```typescript
constructor(
  private readonly storyGateway: StoryGateway,
  private readonly audioGateway: AudioGateway,
  private readonly imageGateway: ImageGateway,
) {}
```

### Emit Events
```typescript
// Story events
this.storyGateway.emitStoryProcessingStart(storyId, data);
this.storyGateway.emitStoryProcessingProgress(storyId, data);
this.storyGateway.emitStoryProcessingComplete(storyId, data);
this.storyGateway.emitStoryProcessingError(storyId, data);

// Audio events
this.audioGateway.emitAudioProcessingStart(storyId, data);
this.audioGateway.emitAudioProcessingProgress(storyId, data);
this.audioGateway.emitAudioProcessingComplete(storyId, data);
this.audioGateway.emitAudioProcessingError(storyId, data);

// Image events
this.imageGateway.emitImageProcessingStart(storyId, data);
this.imageGateway.emitImageProcessingProgress(storyId, data);
this.imageGateway.emitImageProcessingComplete(storyId, data);
this.imageGateway.emitImageProcessingError(storyId, data);
```

## Security Features

1. **JWT Authentication**: Tất cả connections phải có valid JWT token
2. **Permission Checking**: Chỉ story owner mới được join rooms
3. **Room Isolation**: Mỗi story có room riêng biệt
4. **Namespace Separation**: Các chức năng khác nhau có namespace riêng

## Error Handling

- Invalid token: Connection bị disconnect
- Permission denied: Client nhận error message
- Room join failed: Client nhận error message
- Processing errors: Emit error events với details

## Monitoring

- Tất cả events được log với Logger
- Client connections được track
- Room joins/leaves được log
- Error events được log với stack trace 