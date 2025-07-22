import { Injectable, Logger } from '@nestjs/common';
import { aiConfig } from '@/config/ai.config';
import { VoiceOption } from '@/modules/audio/constant/type';
import { GoogleGenAI } from '@google/genai';
import * as wav from 'wav';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TTSService {
  private readonly logger = new Logger(TTSService.name);
  private readonly ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  async generateAudio(text: string, voiceModel: VoiceOption): Promise<string> {
    try {
      this.logger.log(`Generating audio with ${voiceModel}...`);
        return this.generateGoogleTTS(text, voiceModel);
      
    } catch (error) {
      this.logger.error('Error generating audio:', error);
      throw new Error(`Failed to generate audio: ${error.message}`);
    }
  }

  private async generateGoogleTTS(text: string, voiceModel: VoiceOption): Promise<string> {
    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        throw new Error('Text input cannot be empty');
      }


      console.log("🚀 ~ TTSService ~ generateGoogleTTS ~ aiConfig.gemini.apiKey:", process.env.GEMINI_API_KEY)

      this.logger.log('Using Google Gemini TTS');
      this.logger.log('Generating audio ...');
    
      const selectedVoice = voiceModel

      const prompt = `
      You are a professional voice actor.
      You are given a text and you need to generate a voice audio for it.
      You need to generate a voice audio for the text. The tone must be natural, emotional tone.
      The voice should be professional and engaging.
      The voice should be clear and easy to understand.
      The voice should be natural and not robotic.
      The voice should be consistent and not vary in tone or pitch.
      This is the text: ${text}
        `
      // Call Google Gemini TTS API
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
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
      
      // Ensure uploads/audio directory exists
      const audioDir = path.join(process.cwd(), 'uploads', 'audio');
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const audioFilePath = path.join(audioDir, `temp_${timestamp}.wav`);
      
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

  async splitTextIntoChunks(text: string, maxWordsPerChunk: number = 100): Promise<string[]> {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += maxWordsPerChunk) {
      const chunk = words.slice(i, i + maxWordsPerChunk).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
    }
    
    return chunks;
  }

  async generateAudioFromChunks(text: string, voiceModel: VoiceOption): Promise<string[]> {
    try {
      this.logger.log(`Generating audio from chunks with ${voiceModel}...`);
      
      const chunks = await this.splitTextIntoChunks(text);
      const audioFiles: string[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        this.logger.log(`Processing chunk ${i + 1}/${chunks.length}`);
        const audioFile = await this.generateGoogleTTS(chunks[i], voiceModel);
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