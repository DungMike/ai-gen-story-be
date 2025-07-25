# Secure WebSocket Implementation

## **Overview**
This document describes the improved WebSocket implementation with authentication, authorization, and room-based event distribution.

## **Security Features**

### **1. Authentication**
- **JWT Token Verification**: All connections require valid JWT token
- **User Identity Tracking**: User info stored in socket.data
- **Connection Validation**: Invalid tokens result in immediate disconnect

### **2. Authorization**
- **Story Ownership Check**: Only story owners can join story rooms
- **Permission Validation**: Database-level permission verification
- **Room Access Control**: Events only sent to authorized users

### **3. Room Management**
- **Isolated Events**: Events only sent to specific story rooms
- **Dynamic Room Joining**: Users can join/leave story rooms
- **Permission-based Access**: Automatic permission checking

## **Implementation Details**

### **Backend Changes**

#### **1. StoriesGateway**
```typescript
// Authentication on connection
async handleConnection(client: AuthenticatedSocket) {
  const token = client.handshake.query.token;
  const payload = this.jwtService.verify(token);
  client.data.user = payload;
}

// Room management
@SubscribeMessage('join-story-room')
async handleJoinStoryRoom(client: AuthenticatedSocket, data: { storyId: string }) {
  const hasPermission = await this.checkStoryPermission(user, storyId);
  if (hasPermission) {
    await client.join(`story-${storyId}`);
  }
}

// Room-based events
emitStoryProcessingStart(storyId: string, data: StoryProcessingData): void {
  this.server.to(`story-${storyId}`).emit('story:processing:start', data);
}
```

#### **2. Permission Check**
```typescript
private async checkStoryPermission(user: any, storyId: string): Promise<boolean> {
  const story = await this.storyRepository.findById(storyId);
  return story.userId.toString() === user.sub;
}
```

### **Frontend Changes**

#### **1. Socket Context**
```typescript
// Token-based connection
const newSocket = io(`${API_BASE_URL}/stories`, {
  query: { token: accessToken },
  withCredentials: true
});

// Room management methods
const joinStoryRoom = (storyId: string) => {
  socket.emit('join-story-room', { storyId });
};
```

#### **2. Usage Example**
```typescript
// Join room when viewing story
useEffect(() => {
  if (storyId && isConnected) {
    joinStoryRoom(storyId);
  }
}, [storyId, isConnected]);

// Listen for room events
onStoryProcessing((data) => {
  // Only receives events for joined rooms
  console.log('Story event:', data);
});
```

## **Flow Diagram**

```
1. Client connects with JWT token
   ↓
2. Gateway verifies token & stores user
   ↓
3. Client joins story room
   ↓
4. Gateway checks story ownership
   ↓
5. If authorized, client joins room
   ↓
6. Story processing events sent to room only
   ↓
7. Only room members receive events
```

## **Security Benefits**

### **✅ Authentication**
- JWT token verification on connection
- User identity tracking
- Automatic disconnect for invalid tokens

### **✅ Authorization**
- Story ownership verification
- Database-level permission checks
- Room-based access control

### **✅ Isolation**
- Events only sent to authorized users
- No data leakage to unauthorized users
- Story-specific room isolation

### **✅ Scalability**
- Efficient room-based event distribution
- Reduced network traffic
- Better resource utilization

## **Testing**

### **1. Authentication Test**
```javascript
// Valid token
const socket = io('http://localhost:3001/stories', {
  query: { token: 'valid-jwt-token' }
});

// Invalid token
const socket = io('http://localhost:3001/stories', {
  query: { token: 'invalid-token' }
}); // Should disconnect
```

### **2. Authorization Test**
```javascript
// Join room for owned story
socket.emit('join-story-room', { storyId: 'owned-story-id' });
// Should succeed

// Join room for other user's story
socket.emit('join-story-room', { storyId: 'other-user-story-id' });
// Should fail with permission error
```

### **3. Event Isolation Test**
```javascript
// User A joins story room
socketA.emit('join-story-room', { storyId: 'story-1' });

// User B joins different story room
socketB.emit('join-story-room', { storyId: 'story-2' });

// Story 1 processing events
// Only User A should receive events
// User B should not receive any events
```

## **Error Handling**

### **Connection Errors**
- Invalid token → Immediate disconnect
- Missing token → Connection rejected
- Expired token → Connection rejected

### **Room Errors**
- Invalid story ID → Error message
- No permission → Error message
- Database errors → Error message

### **Event Errors**
- Room not found → Event ignored
- User not in room → Event ignored
- Permission denied → Event ignored

## **Monitoring**

### **Backend Logs**
```bash
# Connection logs
[StoriesGateway] Client connected: socket-id, User: user-id

# Room logs
[StoriesGateway] User user-id joined story room: story-id
[StoriesGateway] User user-id left story room: story-id

# Event logs
[StoriesGateway] Story processing started: story-id
[StoriesGateway] Story processing progress: story-id - 50%
```

### **Frontend Logs**
```javascript
// Connection status
console.log('Connected to stories namespace');

// Room events
console.log('Joined story room:', storyId);
console.log('Left story room:', storyId);

// Processing events
console.log('Story processing started:', data);
console.log('Progress:', data.progress + '%');
```

## **Best Practices**

### **1. Token Management**
- Always include valid JWT token
- Handle token expiration
- Refresh tokens when needed

### **2. Room Management**
- Join rooms only when needed
- Leave rooms when done
- Handle room join/leave errors

### **3. Event Handling**
- Listen for specific story events
- Handle connection errors
- Implement reconnection logic

### **4. Security**
- Never expose tokens in logs
- Validate all inputs
- Handle permission errors gracefully 