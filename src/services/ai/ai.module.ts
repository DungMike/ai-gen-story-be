import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AIImageService } from './image.service';
import { TTSService } from './tts.service';
import { APIKeyManagerService } from '../api-key-manager/api-key-manager.service';
import { FileModule } from '../file/file.module';

@Module({
  imports: [FileModule],
  providers: [
    APIKeyManagerService,
    GeminiService, 
    AIImageService, 
    TTSService
  ],
  exports: [
    APIKeyManagerService,
    GeminiService, 
    AIImageService, 
    TTSService
  ],
})
export class AiModule {} 