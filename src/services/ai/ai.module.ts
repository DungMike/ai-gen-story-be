import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AIImageService } from './image.service';
import { TTSService } from './tts.service';
import { FileModule } from '../file/file.module';

@Module({
  imports: [FileModule],
  providers: [GeminiService, AIImageService, TTSService],
  exports: [GeminiService, AIImageService, TTSService],
})
export class AiModule {} 