# Images Module

This module handles image generation for stories using AI services like Gemini, DALL-E, and Midjourney.

## Features

- **Real-time Image Generation**: Generate images from story content with real-time progress updates
- **Multiple AI Models**: Support for Gemini, DALL-E, and Midjourney
- **Art Style Options**: Realistic, anime, comic, watercolor, oil-painting, digital-art
- **Image Size Options**: 512x512, 1024x1024, 1024x768, 768x1024
- **Quality Settings**: Standard and HD quality options
- **Chunk Processing**: Split story content into manageable chunks for image generation
- **Error Handling**: Retry failed images and comprehensive error reporting
- **WebSocket Integration**: Real-time progress updates via Socket.IO

## API Endpoints

### Generate Images
```http
POST /api/images/generate/:storyId
Authorization: Bearer <token>
Content-Type: application/json

{
  "artStyle": "realistic",
  "imageSize": "1024x1024",
  "maxWordsPerChunk": 200,
  "aiModel": "gemini",
  "quality": "standard"
}
```

### Get Image Chunks
```http
GET /api/images/story/:storyId
Authorization: Bearer <token>
```

### Get Processing Status
```http
GET /api/images/status/:storyId
Authorization: Bearer <token>
```

### Retry Failed Images
```http
POST /api/images/retry/:storyId
Authorization: Bearer <token>
```

### Delete Image Chunk
```http
DELETE /api/images/chunk/:id
Authorization: Bearer <token>
```

### Delete All Images
```http
DELETE /api/images/story/:storyId
Authorization: Bearer <token>
```

## WebSocket Events

### Join Story Room
```javascript
socket.emit('join-story-room', { storyId: 'storyId' });
```

### Image Processing Events
- `image:processing:start` - Image generation started
- `image:processing:progress` - Progress update
- `image:processing:complete` - Generation completed
- `image:processing:error` - Error occurred

## Database Schema

### ImageChunk Collection
```javascript
{
  _id: ObjectId,
  storyId: ObjectId,        // Reference to Story
  chunkIndex: Number,       // Order of chunk
  content: String,          // Text content for image
  imageFile: String,        // Path to generated image
  prompt: String,           // AI prompt used
  status: String,           // pending, processing, completed, failed
  style: {
    artStyle: String,       // realistic, anime, comic, etc.
    characterDescription: String,
    backgroundDescription: String
  },
  metadata: {
    aiModel: String,        // gemini, dalle-3, midjourney
    imageSize: String,      // 512x512, 1024x1024, etc.
    processingTime: Number,
    quality: String         // standard, hd
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Configuration Options

### Art Styles
- `realistic` - Photorealistic style
- `anime` - Japanese animation style
- `comic` - Comic book style
- `watercolor` - Watercolor painting style
- `oil-painting` - Oil painting style
- `digital-art` - Digital art style

### Image Sizes
- `512x512` - Small square
- `1024x1024` - Large square
- `1024x768` - Landscape
- `768x1024` - Portrait

### AI Models
- `gemini` - Google Gemini
- `dalle-3` - OpenAI DALL-E 3
- `midjourney` - Midjourney

### Quality Settings
- `standard` - Standard quality
- `hd` - High definition

## Usage Example

```typescript
// Generate images for a story
const result = await imagesService.generateImages(storyId, {
  artStyle: 'realistic',
  imageSize: '1024x1024',
  maxWordsPerChunk: 200,
  aiModel: 'gemini',
  quality: 'standard'
});

// Get processing status
const status = await imagesService.getProcessingStatus(storyId);

// Retry failed images
const retryResult = await imagesService.retryFailedImages(storyId);
```

## Error Handling

The module includes comprehensive error handling:

- **Story Not Found**: Returns 404 if story doesn't exist
- **Content Not Generated**: Returns 400 if story content isn't generated yet
- **AI Service Errors**: Handles API failures gracefully
- **File System Errors**: Manages file storage issues
- **WebSocket Errors**: Handles connection issues

## File Storage

Images are stored in the following structure:
```
uploads/
└── images/
    └── {storyId}/
        ├── chunk_0.png
        ├── chunk_1.png
        └── ...
```

## Dependencies

- `@nestjs/mongoose` - MongoDB integration
- `@nestjs/websockets` - WebSocket support
- `socket.io` - Real-time communication
- `class-validator` - Input validation
- `class-transformer` - Response transformation 