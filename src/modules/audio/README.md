# Audio Module

## Overview

The Audio Module provides comprehensive audio generation functionality for stories using Text-to-Speech (TTS) services. It supports multiple voice models, real-time progress tracking via WebSocket, and queue-based processing for scalability.

## Features

- **Multiple TTS Models**: Support for Google TTS and ElevenLabs
- **30+ Voice Options**: Rich selection of voice styles and characteristics
- **Queue-based Processing**: Scalable audio generation using Bull queues
- **Real-time Updates**: WebSocket-based progress tracking
- **Chunk-based Generation**: Split long content into manageable chunks
- **Error Handling**: Comprehensive error handling and retry mechanisms
- **File Management**: Automatic audio file storage and cleanup

## Architecture

### Components

1. **AudioController**: REST API endpoints for audio operations
2. **AudioService**: Business logic for audio generation and management
3. **AudioProcessor**: Queue processor for background audio generation
4. **AudioGateway**: WebSocket gateway for real-time communication
5. **AudioChunkRepository**: Data access layer for audio chunks

### Data Flow

```
Client Request → Controller → Service → Queue → Processor → TTS Service → File Storage
                ↓
            WebSocket Gateway ← Real-time Updates
```

## API Endpoints

### Audio Generation

- `POST /api/audio/generate/:storyId` - Queue audio generation for a story
- `GET /api/audio/status/:storyId` - Get audio generation status
- `GET /api/audio/story/:storyId` - Get all audio chunks for a story
- `GET /api/audio/chunk/:storyId/:chunkIndex` - Get specific audio chunk
- `GET /api/audio/voices` - Get available voice options
- `GET /api/audio/download/:storyId` - Download all audio files as ZIP
- `DELETE /api/audio/:id` - Delete specific audio chunk
- `DELETE /api/audio/story/:storyId` - Delete all audio chunks for a story

### WebSocket Events

#### Client to Server
- `join-audio-room` - Join audio room for a story
- `leave-audio-room` - Leave audio room for a story
- `get-audio-status` - Request audio generation status

#### Server to Client
- `audio-status-update` - Audio status update
- `audio-status-error` - Audio status error
- `audio-generation-progress` - Audio generation progress
- `audio-generation-completed` - Audio generation completed
- `audio-generation-failed` - Audio generation failed
- `audio-generation-status` - Overall audio generation status

## Voice Options

The module supports 30+ voice options with different characteristics:

### Bright Voices
- **Zephyr**: Energetic and bright
- **Autonoe**: Cheerful and bright

### Upbeat Voices
- **Puck**: Playful and upbeat
- **Laomedeia**: Enthusiastic and upbeat

### Informative Voices
- **Charon**: Authoritative and informative
- **Rasalgethi**: Educational and informative

### Firm Voices
- **Kore**: Assertive and firm
- **Orus**: Confident and firm
- **Alnilam**: Decisive and firm

### Specialized Voices
- **Fenrir**: Excitable and energetic
- **Leda**: Youthful and fresh
- **Aoede**: Breezy and light
- **Callirrhoe**: Easy-going and relaxed
- **Umbriel**: Easy-going and calm
- **Enceladus**: Breathy and whispered
- **Iapetus**: Clear and articulate
- **Erinome**: Clear and precise
- **Algieba**: Smooth and flowing
- **Despina**: Smooth and melodic
- **Algenib**: Gravelly and rough
- **Achernar**: Soft and gentle
- **Gacrux**: Mature and experienced
- **Pulcherrima**: Forward and direct
- **Achird**: Friendly and warm
- **Zubenelgenubi**: Casual and informal
- **Vindemiatrix**: Gentle and tender
- **Sadachbia**: Lively and vibrant
- **Sadaltager**: Knowledgeable and wise
- **Sulafat**: Warm and comforting
- **Schedar**: Even and balanced

## Usage Examples

### Generate Audio for a Story

```typescript
// Queue audio generation
const response = await fetch('/api/audio/generate/storyId', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  },
  body: JSON.stringify({
    voiceModel: 'google-tts',
    voiceStyle: 'zephyr'
  })
});

const { message, jobId } = await response.json();
```

### WebSocket Connection

```typescript
// Connect to audio WebSocket
const socket = io('/audio');

// Join audio room
socket.emit('join-audio-room', { storyId: 'storyId' });

// Listen for status updates
socket.on('audio-generation-progress', (data) => {
  console.log('Progress:', data.progress);
  console.log('Current chunk:', data.chunkIndex);
});

socket.on('audio-generation-completed', (data) => {
  console.log('Chunk completed:', data.chunkIndex);
  console.log('Audio file:', data.audioFilePath);
});
```

### Get Voice Options

```typescript
const response = await fetch('/api/audio/voices', {
  headers: {
    'Authorization': 'Bearer token'
  }
});

const { data: { voices } } = await response.json();
console.log('Available voices:', voices);
```

## Configuration

### Environment Variables

```env
# TTS Service Configuration
GOOGLE_TTS_API_KEY=your_google_tts_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Queue Configuration
REDIS_URL=redis://localhost:6379

# File Storage
AUDIO_UPLOAD_PATH=./uploads/audio
```

### Queue Configuration

The module uses Bull queues for background processing:

- **Queue Name**: `audio-generation`
- **Concurrency**: Configurable per processor
- **Retry Strategy**: Automatic retry with exponential backoff
- **Job Types**: 
  - `generate-audio`: Full story audio generation
  - `generate-audio-chunk`: Individual chunk processing

## Error Handling

### Common Error Scenarios

1. **Story Not Found**: 404 error when story doesn't exist
2. **Content Not Generated**: 400 error when story content is missing
3. **TTS Service Error**: 500 error when TTS service fails
4. **File Storage Error**: 500 error when file operations fail
5. **Queue Processing Error**: Automatic retry with exponential backoff

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Performance Considerations

### Optimization Strategies

1. **Chunk Size**: Configurable chunk size for optimal processing
2. **Concurrent Processing**: Multiple chunks processed simultaneously
3. **Caching**: Redis-based caching for frequently accessed data
4. **File Cleanup**: Automatic cleanup of temporary files
5. **Memory Management**: Efficient memory usage for large audio files

### Monitoring

- Queue metrics via Bull dashboard
- WebSocket connection monitoring
- File storage usage tracking
- Processing time analytics

## Testing

### Unit Tests

```bash
npm run test audio
```

### Integration Tests

```bash
npm run test:e2e audio
```

### Manual Testing

1. Create a story with content
2. Queue audio generation
3. Monitor WebSocket events
4. Verify audio file generation
5. Test download functionality

## Dependencies

- **@nestjs/bull**: Queue processing
- **@nestjs/websockets**: WebSocket functionality
- **socket.io**: Real-time communication
- **bull**: Job queue management
- **mongoose**: Database operations
- **class-validator**: Input validation
- **class-transformer**: Data transformation

## Contributing

When contributing to the Audio Module:

1. Follow the existing code structure
2. Add proper TypeScript types
3. Include comprehensive error handling
4. Add JSDoc comments for public methods
5. Update this README for new features
6. Add appropriate tests
7. Follow the established naming conventions 