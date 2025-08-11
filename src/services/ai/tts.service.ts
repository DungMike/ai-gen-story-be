import { Injectable, Logger } from '@nestjs/common';
import { VoiceOption } from '@/modules/audio/constant/type';
import { GoogleGenAI } from '@google/genai';
import { APIKeyManagerService } from '../api-key-manager/api-key-manager.service';
import * as wav from 'wav';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TTSService {
  private readonly logger = new Logger(TTSService.name);

  constructor(
    private readonly apiKeyManager: APIKeyManagerService
  ) {}

  private async getGeminiClient(): Promise<GoogleGenAI> {
    return await this.apiKeyManager.createGeminiClient();
  }

  async generateAudio(storyTitle: string, text: string, voiceStyle: VoiceOption, voiceModel: string, storyId: string, chunkIndex: number, customPrompt?: string): Promise<string> {
    try {
      this.logger.log(`Generating audio with ${voiceStyle}...`);
      return this.generateGoogleTTS(storyTitle, text, voiceStyle, voiceModel, storyId, chunkIndex, customPrompt);

    } catch (error) {
      this.logger.error('Error generating audio:', error);
      throw new Error(`Failed to generate audio: ${error.message}`);
    }
  }

  private async generateGoogleTTS(storyTitle: string, text: string, voiceStyle: VoiceOption, voiceModel: string, storyId: string, chunkIndex: number, customPrompt?: string): Promise<string> {
    console.log("🚀 ~ TTSService ~ generateGoogleTTS ~ voiceModel:", voiceModel)
    let currentApiKey: string;
    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        throw new Error('Text input cannot be empty');
      }

      this.logger.log('Using Google Gemini TTS');
      this.logger.log('Generating audio ...');
    
      const selectedVoice = voiceStyle
      const ai = await this.getGeminiClient();
      // Get the API key from the client for error handling
      currentApiKey = (ai as any).apiKey;

      // Use custom prompt if provided, otherwise use default
      const basePrompt = customPrompt ? 
        `${customPrompt}\n\nThis is the text: ${text}` :
        `You are a professional voice actor.
        You are given a text and you need to generate a voice audio for it.
        You need to generate a voice audio for the text. The tone must be natural, emotional tone.
        The voice should be professional and engaging.
        The voice should be clear and easy to understand.
        The voice should be natural and not robotic.
        The voice should be consistent and not vary in tone or pitch.
        The voice should be ${customPrompt}
        This is the text: ${text}`;

      const prompt = basePrompt;
        const response = await ai.models.generateContent({
          model: voiceModel || "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: prompt}] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice },
              },
            },
          },
        });
  
        this.logger.log('Audio generated successfully');
  
        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!data) {
          throw new Error('No audio data received from Google Gemini TTS');
        }
  
        const audioBuffer = Buffer.from(data, 'base64');
        
        // Ensure uploads/audio/storyId/ directory exists
        const audioDir = path.join('uploads', `${storyTitle}_${storyId}`, 'audio');
        if (!fs.existsSync(audioDir)) {
          fs.mkdirSync(audioDir, { recursive: true });
        }
        
        // Generate unique filename
        const timestamp = Date.now();
        const audioFilePath = path.join(audioDir, `chunk${chunkIndex}_${timestamp}.wav`);
        
        // Save the audio file
        await this.saveWaveFile(audioFilePath, audioBuffer);
        
        this.logger.log(`Audio generated successfully: ${audioFilePath}`);
        
        return audioFilePath;
      
      
      
      
    } catch (error) {
      this.logger.error('Error in Google Gemini TTS:', error);
      
      throw new Error(`Google Gemini TTS failed: ${error.message}`);
    }
     
  }

  private async saveWaveFile(
    filename: string,
    pcmData: Buffer,
    channels: number = 1,
    rate: number = 24000,
    sampleWidth: number = 2,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const writer = new wav.FileWriter(filename, {
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });

      writer.on('finish', resolve);
      writer.on('error', reject);

      writer.write(pcmData);
      writer.end();
    });
  }

  private async generateElevenLabsTTS(text: string): Promise<string> {
    // Implementation for ElevenLabs TTS
    // This would use ElevenLabs API
    // For now, we'll return a placeholder
    this.logger.log('Using ElevenLabs TTS');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In real implementation, you would:
    // 1. Call ElevenLabs API
    // 2. Save the audio file
    // 3. Return the file path
    const audioFilePath = `uploads/audio/temp_${Date.now()}.wav`;
    
    return audioFilePath;
  }

  async getAudioDuration(audioFilePath: string): Promise<number> {
    // In real implementation, you would analyze the audio file
    // For now, return a placeholder duration
    return 30; // seconds
  }

async splitTextIntoChunks(
  text: string,
  maxWordsPerChunk: number = 100
): Promise<string[]> {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let i = 0;

  while (i < words.length) {
    // Cắt chunk tạm thời
    let end = i + maxWordsPerChunk;
    if (end > words.length) end = words.length;

    let chunk = words.slice(i, end).join(" ");

    // Nếu từ cuối KHÔNG kết thúc bằng dấu câu thì nối thêm cho đến khi gặp dấu câu hoặc hết text
    while (
      end < words.length &&
      !/[.!?]$/.test(words[end - 1].replace(/["')\]]+$/, "")) // bỏ dấu ngoặc/ký tự đóng sau từ
    ) {
      chunk += " " + words[end];
      end++;
    }

    chunks.push(chunk.trim());
    i = end;
  }

  return chunks;
}


  async generateAudioFromChunks(storyTitle: string, text: string, voiceModel: VoiceOption, storyId: string): Promise<string[]> {
    try {
      this.logger.log(`Generating audio from chunks with ${voiceModel}...`);
      
      const chunks = await this.splitTextIntoChunks(text);
      const audioFiles: string[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        this.logger.log(`Processing chunk ${i + 1}/${chunks.length}`);
        const audioFile = await this.generateGoogleTTS(storyTitle, chunks[i], voiceModel, voiceModel, storyId, i);
        audioFiles.push(audioFile);
      }
      
      return audioFiles;
    } catch (error) {
      this.logger.error('Error generating audio from chunks:', error);
      throw new Error(`Failed to generate audio from chunks: ${error.message}`);
    }
  }

  getAvailableVoices(): string[] {
    // Currently Google Gemini TTS only supports 'Kore' voice
    return ['Kore'];
  }
} 