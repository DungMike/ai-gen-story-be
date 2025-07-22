# Google Gemini TTS Integration

This document describes the integration of Google Gemini Text-to-Speech (TTS) functionality into the AI Story Generator backend.

## Overview

The TTS service has been updated to use Google Gemini's TTS API, which provides high-quality text-to-speech conversion with natural-sounding voices.

## Features

- **Google Gemini TTS**: Uses the `gemini-2.5-flash-preview-tts` model
- **Voice Support**: Currently supports the 'Kore' voice (more voices may be available in the future)
- **Audio Format**: Generates WAV files with 24kHz sample rate
- **Text Chunking**: Automatically splits long texts into manageable chunks
- **Error Handling**: Comprehensive error handling and validation

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### API Key Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add the API key to your environment variables

## Usage

### Basic Usage

```typescript
import { TTSService } from '@/services/ai/tts.service';

const ttsService = new TTSService();

// Generate audio from text
const audioFilePath = await ttsService.generateAudio(
  'Hello, this is a test message.',
  VoiceOption.KORE
);
```

### Chunked Audio Generation

For long texts, use the chunked generation method:

```typescript
// Generate audio from chunks
const audioFiles = await ttsService.generateAudioFromChunks(
  'Very long text that needs to be split into chunks...',
  VoiceOption.KORE
);
```

### Available Methods

- `generateAudio(text, voiceModel)`: Generate audio from text
- `generateAudioFromChunks(text, voiceModel)`: Generate audio from text split into chunks
- `splitTextIntoChunks(text, maxWordsPerChunk)`: Split text into chunks
- `getAvailableVoices()`: Get list of available voices
- `getAudioDuration(audioFilePath)`: Get audio duration (placeholder)

## Voice Options

The service maps all `VoiceOption` enum values to the available Google Gemini voice. Currently, all voices map to 'Kore', but this can be updated when more voices become available.

## File Structure

Generated audio files are saved to:
```
uploads/audio/temp_{timestamp}.wav
```

## Testing

Run the test script to verify the integration:

```bash
cd backend
node test-tts.js
```

Make sure to set the `GEMINI_API_KEY` environment variable before running the test.

## Error Handling

The service includes comprehensive error handling for:

- Missing API key
- Empty text input
- API errors
- File system errors
- Invalid voice options

## Dependencies

- `@google/genai`: Google Gemini API client
- `wav`: WAV file handling
- `fs`: File system operations
- `path`: Path utilities

## Limitations

1. **Voice Variety**: Currently only supports the 'Kore' voice
2. **Text Length**: Very long texts should be split into chunks
3. **API Rate Limits**: Subject to Google Gemini API rate limits
4. **Audio Format**: Only supports WAV format output

## Future Enhancements

1. **Multiple Voices**: Add support for additional Google Gemini voices
2. **Audio Formats**: Support for MP3 and other formats
3. **Voice Customization**: Add support for voice parameters
4. **Caching**: Implement audio caching for repeated requests
5. **Streaming**: Add support for streaming audio generation 