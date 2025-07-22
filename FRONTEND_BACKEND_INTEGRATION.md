# Frontend-Backend Integration Guide

## 🔄 **Changes Made**

### **Backend Changes (Socket Architecture)**

#### **1. Removed Namespaces**
- ✅ Removed `namespace: '/stories'` from all gateways
- ✅ All gateways now use default namespace
- ✅ Simplified room management with `story-{storyId}` naming

#### **2. Enhanced SocketService**
- ✅ Added `waitForServerReady()` method
- ✅ Added `logServerStatus()` for debugging
- ✅ Improved error handling with retry mechanism
- ✅ Better server initialization with delay

#### **3. Updated StoryGateway**
- ✅ Added retry mechanism for room joining
- ✅ Enhanced error handling and logging
- ✅ Improved event emission with detailed data

### **Frontend Changes**

#### **1. Updated Socket Context (`socket-context.tsx`)**
```typescript
// OLD: Connected to namespace
const newSocket = io(`${API_BASE_URL}/stories`, {...})

// NEW: Connected to default namespace
const newSocket = io(API_BASE_URL, {...})
```

#### **2. Enhanced Event Handling**
```typescript
// NEW: Better event handling with step mapping
socket.on('story:processing:start', (data) => {
  callback({ 
    ...data, 
    event: 'story:processing:start',
    step: data.step || 'story_generation'
  })
})
```

#### **3. Updated Create Story Page (`index.tsx`)**
```typescript
// NEW: Better step handling
{processingStatus.step === 'story_generation' && 'Generating story with AI...'}
{processingStatus.step === 'ai_processing' && 'AI is processing your story...'}
```

## 🧪 **Testing**

### **Available Test Scripts**

#### **1. Basic Server Test**
```bash
node backend/test-server-status.js
```

#### **2. Full System Test**
```bash
node backend/test-full-system.js
```

#### **3. Frontend-Backend Integration Test**
```bash
node backend/test-frontend-integration.js
```

### **Expected Test Results**

#### **✅ Successful Integration**
```
🧪 Testing Frontend-Backend Integration...
✅ Connection Test: PASSED
🚪 Test 1: Joining story room...
  ✅ Room Join Test: PASSED
📡 Test 2: Simulating story processing...
  ✅ Story Processing Start: PASSED
  ✅ Progress Update: PASSED
  ✅ Story Completion: PASSED

📊 Integration Test Results:
  Connection: ✅ PASS
  Room Join: ✅ PASS
  Story Processing: ✅ PASS
  Progress Updates: ✅ PASS
  Completion: ✅ PASS

🎯 Summary: 5/5 tests passed
🎉 Frontend-Backend integration is working correctly!
```

## 🔧 **Event Flow**

### **Story Processing Events**

#### **1. Start Event**
```typescript
// Backend emits
this.socketService.emitToRoom(`story-${storyId}`, 'story:processing:start', {
  storyId,
  step: 'story_generation',
  progress: 0,
  estimatedTime: 30000
})

// Frontend receives
socket.on('story:processing:start', (data) => {
  // Handle start event
})
```

#### **2. Progress Event**
```typescript
// Backend emits
this.socketService.emitToRoom(`story-${storyId}`, 'story:processing:progress', {
  storyId,
  step: 'ai_processing',
  progress: 50,
  estimatedTimeRemaining: 15000
})

// Frontend receives
socket.on('story:processing:progress', (data) => {
  // Update progress bar
})
```

#### **3. Complete Event**
```typescript
// Backend emits
this.socketService.emitToRoom(`story-${storyId}`, 'story:processing:complete', {
  storyId,
  step: 'saving_file',
  progress: 100,
  success: true
})

// Frontend receives
socket.on('story:processing:complete', (data) => {
  // Navigate to story page
})
```

## 🚀 **Usage**

### **Frontend Implementation**

#### **1. Connect to Socket**
```typescript
const { isConnected, joinStoryRoom, onStoryProcessing } = useSocketContext()

useEffect(() => {
  if (isConnected && storyId) {
    joinStoryRoom(storyId)
    
    onStoryProcessing((data) => {
      if (data.event === 'story:processing:complete') {
        navigate(`/story/${data.storyId}`)
      }
    })
  }
}, [isConnected, storyId])
```

#### **2. Handle Progress Updates**
```typescript
onStoryProcessing((data) => {
  setProcessingStatus(data)
  
  if (data.event === 'story:processing:progress') {
    console.log(`Progress: ${data.progress}% - ${data.step}`)
  }
})
```

### **Backend Implementation**

#### **1. Emit Processing Events**
```typescript
// Start processing
this.emitStoryProcessingStart(storyId, {
  step: 'story_generation',
  progress: 0
})

// Update progress
this.emitStoryProcessingProgress(storyId, {
  step: 'ai_processing',
  progress: 50
})

// Complete processing
this.emitStoryProcessingComplete(storyId, {
  step: 'saving_file',
  progress: 100
})
```

## 🔍 **Debugging**

### **Server Status Logs**
```
[SocketService] === DETAILED SERVER STATUS ===
[SocketService] Server instance: true
[SocketService] Server sockets: true
[SocketService] Server sockets.sockets: true
[SocketService] Connected sockets count: 1
[SocketService] Server ready: true
[SocketService] ================================
```

### **Room Management Logs**
```
[StoryGateway] User 687a076b488ae663311c039f joined story room: test-123
[SocketService] Client ktTwPdFUYuWAR7xLAAAB joined room: story-test-123
```

### **Event Emission Logs**
```
[StoryGateway] Story processing started: test-123, Room: story-test-123, Clients: 1
[SocketService] Emitting to room: story-test-123, event: story:processing:start
```

## ⚠️ **Common Issues**

### **1. Server Not Ready**
```
[SocketService] SocketService: Server is not ready after waiting!
```
**Solution:** The retry mechanism should handle this automatically.

### **2. Connection Errors**
```
❌ Connection Error: xhr poll error
```
**Solution:** Check if server is running and token is valid.

### **3. Room Join Failures**
```
❌ Join room attempt 3 failed: Server is not ready
```
**Solution:** The retry mechanism with delay should resolve this.

## 🎯 **Next Steps**

1. **Test the integration** with the provided test scripts
2. **Monitor logs** for any remaining issues
3. **Update frontend** to handle new event structure
4. **Deploy changes** to production environment

The integration should now work seamlessly between frontend and backend! 🚀 