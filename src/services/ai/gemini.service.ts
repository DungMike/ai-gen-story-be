import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { aiConfig } from '@/config/ai.config';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenAI;
  private model: any;
  constructor() {
    this.genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  async generateStory(originalContent: string, customPrompt?: string): Promise<string> {
    try {
      const prompt = this.buildStoryPrompt(originalContent, customPrompt);
      
      this.logger.log('Generating story with Gemini AI...');
      
      const response = await this.genAI.models.generateContent({
        model: aiConfig.gemini.model,
        contents: prompt,
      });
      
      const generatedContent = response.text;
      
      this.logger.log('Story generated successfully');
      return generatedContent;
    } catch (error) {
      this.logger.error('Error generating story:', error);
      throw new Error(`Failed to generate story: ${error.message}`);
    }
  }

  async generateImage(prompt: string, size: string = '1024x1024'): Promise<string> {
    try {
      this.logger.log('Generating image with Gemini AI...');
      
      const response = await this.genAI.models.generateContent({
        model: aiConfig.gemini.model,
        contents: prompt,
      });
      
      // Note: Gemini 2.0 Flash doesn't support image generation directly
      // This would need to be implemented with a different model or service
      this.logger.warn('Image generation not supported with current model');
      throw new Error('Image generation not supported with gemini-2.0-flash-001');
      
    } catch (error) {
      this.logger.error('Error generating image:', error);
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  private buildStoryPrompt(originalContent: string, customPrompt?: string): string {
    const basePrompt = `
       You are a master storyteller. I will provide you with a story outline and a custom guide.
Your task is to rewrite the story based on the provided outline.
The new story should have the same plot , but with a new storytelling style as described in my guide.
Important: The new story should be  same length as the original story.
Here is the original story:
      ${originalContent}
      
      ${customPrompt ? `Special request: ${customPrompt}` : ''}
      
        Please follow these guidelines:
        - Keep the same plot
        - Change the storytelling style
        - Make the story more engaging
        - Use language appropriate for the target audience
        - The new story should be the same length as the original story
        
        Return only the story content, no title or comments, rewritten story content in English.
    `;
    
    return basePrompt;
  }
} 