# Room Management System - Simplified

## Tổng quan

Hệ thống đã được đơn giản hóa để sử dụng một server instance duy nhất, không cần namespace. Tất cả rooms được quản lý theo storyId với prefix tương ứng.

## Cấu trúc Room

### Room Naming Convention
```
story-{storyId}    - Story processing rooms
audio-{storyId}    - Audio processing rooms  
image-{storyId}    - Image processing rooms
```

### Ví dụ
```
story-123          - Room cho story có ID 123
audio-456          - Room cho audio của story 456
image-789          - Room cho image của story 789
```

## SocketService Methods

### Room Management
```typescript
// Join room
await socketService.joinRoom(clientId, 'story-123');

// Leave room
await socketService.leaveRoom(clientId, 'story-123');

// Emit to room
socketService.emitToRoom('story-123', 'event-name', data);
```

### Room Information
```typescript
// Get all rooms
const allRooms = socketService.getRoomsWithClientCount();

// Get specific room info
const roomInfo = socketService.getRoomInfo('story-123');

// Get rooms by type
const storyRooms = socketService.getStoryRooms();
const audioRooms = socketService.getAudioRooms();
const imageRooms = socketService.getImageRooms();

// Check if room exists
const exists = socketService.roomExists('story-123');

// Get clients in room
const clients = socketService.getClientsInRoom('story-123');
```

## Gateway Usage

### StoryGateway
```typescript
// Join story room
await this.socketService.joinRoom(client.id, `story-${storyId}`);

// Emit story events
this.socketService.emitToRoom(`story-${storyId}`, 'story:processing:start', data);

// Get story rooms
const storyRooms = this.getStoryRooms();
```

### AudioGateway
```typescript
// Join audio room
await this.socketService.joinRoom(client.id, `audio-${storyId}`);

// Emit audio events
this.socketService.emitToRoom(`audio-${storyId}`, 'audio:processing:start', data);

// Get audio rooms
const audioRooms = this.socketService.getAudioRooms();
```

### ImageGateway
```typescript
// Join image room
await this.socketService.joinRoom(client.id, `image-${storyId}`);

// Emit image events
this.socketService.emitToRoom(`image-${storyId}`, 'image:processing:start', data);

// Get image rooms
const imageRooms = this.socketService.getImageRooms();
```

## Frontend Connection

### Connect to Socket
```javascript
const socket = io('http://localhost:3001', {
  query: { token: 'your-jwt-token' },
  withCredentials: true,
  transports: ['websocket', 'polling']
});
```

### Join Rooms
```javascript
// Join story room
socket.emit('join-story-room', { storyId: '123' });

// Join audio room
socket.emit('join-audio-room', { storyId: '123' });

// Join image room
socket.emit('join-image-room', { storyId: '123' });
```

### Listen Events
```javascript
// Story events
socket.on('story:processing:start', (data) => {
  console.log('Story processing started:', data);
});

socket.on('story:processing:progress', (data) => {
  console.log('Story progress:', data.progress);
});

// Audio events
socket.on('audio:processing:start', (data) => {
  console.log('Audio processing started:', data);
});

// Image events
socket.on('image:processing:start', (data) => {
  console.log('Image processing started:', data);
});
```

## Debug Methods

### Log Room Information
```typescript
// In StoryGateway
this.logRoomInfo();

// In SocketService
const allRooms = this.getRoomsWithClientCount();
console.log('All rooms:', allRooms);
```

### Get Room Statistics
```typescript
// Get all rooms with counts
const rooms = socketService.getRoomsWithClientCount();
console.log('Total rooms:', rooms.length);

// Get rooms by type
const storyRooms = socketService.getStoryRooms();
const audioRooms = socketService.getAudioRooms();
const imageRooms = socketService.getImageRooms();

console.log('Story rooms:', storyRooms.length);
console.log('Audio rooms:', audioRooms.length);
console.log('Image rooms:', imageRooms.length);
```

## Testing

### Test Script
```bash
# Run test script
node backend/test-rooms.js
```

### Manual Testing
```javascript
// Connect and join room
const socket = io('http://localhost:3001', {
  query: { token: 'your-token' }
});

socket.emit('join-story-room', { storyId: 'test-123' });

// Listen for events
socket.on('joined-story-room', (data) => {
  console.log('Joined room:', data);
});
```

## Benefits of Simplified Structure

1. **Đơn giản hơn** - Không cần quản lý namespace
2. **Dễ debug** - Tất cả rooms trong một server
3. **Hiệu quả hơn** - Ít overhead
4. **Dễ maintain** - Code đơn giản hơn
5. **Tương thích tốt** - Hoạt động với tất cả clients

## Migration Notes

- Đã loại bỏ namespace parameters
- Tất cả gateways sử dụng cùng một server instance
- Room naming convention được chuẩn hóa
- Debug methods được đơn giản hóa 