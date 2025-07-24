import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { aiConfig } from '@/config/ai.config';
import { FileStorageService } from '../file/file-storage.service';
import { APIKeyManagerService } from '../api-key-manager/api-key-manager.service';

export interface ImageGenerationOptions {
  size?: string;
  quality?: string;
  model?: string;
  numberOfImages?: number;
  storyId?: string; // Add storyId for file saving
}

export interface ImageGenerationResult {
  images: Buffer[];
  totalImages: number;
  savedImagePaths?: string[]; // Add saved file paths
}

export interface PromptGenerationResult {
  masterPrompt: string;
  chunkPrompt: string;
  sanitizedPrompt?: string;
}

const MASTER_PROMPT_GENERATION_SYSTEM_INSTRUCTION = `
You are an expert literary analyst and AI prompt engineer.
Your task is to read an entire story provided by the user and extract the core elements needed to maintain visual consistency across a series of generated images.

From the entire story, identify:
1. **Main Characters:** List the primary characters. For each, describe their consistent physical appearance (hair, eyes, build), signature clothing, and any unique marks or accessories.
2. **Overall World/Setting:** Describe the key features of the world the story takes place in (e.g., futuristic cyberpunk city, high-fantasy medieval kingdom).
3. **Visual Style:** Determine the overall visual tone and style (photorealistic, cinematic, artistic, etc.)

Synthesize all this information into a single, concise "Master Prompt" in ENGLISH. This prompt will be appended to other, more specific prompts. It should act as a foundation for consistency.

Return ONLY the generated Master Prompt in English, with no other text, explanation, or quotation marks.
`;

const PROMPT_GENERATION_SYSTEM_INSTRUCTION = `
You are an expert at creating concise, structured prompts for an AI image generator from story segments. Your goal is to capture a key visual moment.

Based on the master prompt, create an image illustrating the following scene:
[CHUNK TEXT HERE]

Follow this exact format, keeping the output in English and not too long:
"A cinematic, ultra-detailed image. [Main Characters with descriptions in parentheses] [action/pose] [setting] — [broader environment]. [Key environmental details]. [Specific objects]. [Lighting/Atmosphere]. [Textures]. Shot on Arri Alexa LF, Zeiss Supreme Primes, natural light."

Key rules:
1. **Be Concise:** Use descriptive keywords and short phrases. Avoid long sentences. The final prompt should be impactful and not overly long.
2. **Structure:** Start with "A cinematic, ultra-detailed image." and end with "Shot on Arri Alexa LF, Zeiss Supreme Primes, natural light.". Use an em dash (—) to separate the immediate setting from the broader environment.
3. **Characters:** Describe 1-2 main characters, with their appearance (thin, serene, saffron robe) in parentheses.
4. **Focus:** Capture the most important visual elements from the text.
5. **Consistency:** Always maintain consistency with the master prompt for characters' faces, clothing, and environment.

Return ONLY the final prompt in English. Do not include any extra text, explanations, or quotes.
`;

const SANITIZE_PROMPT_SYSTEM_INSTRUCTION = `
You are an AI assistant that rephrases image generation prompts to make them compliant with safety policies. You will be given a prompt that was rejected by the image model.
Your task is to rewrite the prompt to be safe for generation while preserving the original intent, characters, and scene as much as possible.
Analyze the prompt for any content that could be interpreted as graphic violence, gore, hate speech, or sexually explicit material, and rephrase it to describe the scene in a non-violating way.
Focus on the narrative action and emotion. For example, instead of "a bloody sword fight", you might write "an intense duel, with sparks flying from clashing swords".
Return ONLY the safe, rewritten prompt in English, with no other text or explanations.
`;

@Injectable()
export class AIImageService {
  private readonly logger = new Logger(AIImageService.name);

  constructor(
    private readonly fileStorageService: FileStorageService,
    private readonly apiKeyManager: APIKeyManagerService
  ) {}

  private async getGeminiClient(): Promise<GoogleGenAI> {
    return await this.apiKeyManager.createGeminiClient();
  }

  /**
   * Generate master prompt from entire story content
   */
  async generateMasterPrompt(storyContent: string, customPrompt: string): Promise<string> {
    let currentApiKey: string;
    try {
      const prompt = `${MASTER_PROMPT_GENERATION_SYSTEM_INSTRUCTION}\n\nStory content:\n${storyContent}\n\nCustom prompt:\n${customPrompt}`;
      
      const genAI = await this.getGeminiClient();
      currentApiKey = await this.apiKeyManager.getNextAPIKey();
      
      const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: prompt,
      });
      
      const masterPrompt = response.text.trim();
      
      this.logger.log(`Generated master prompt: ${masterPrompt.substring(0, 100)}...`);
      return masterPrompt;
    } catch (error) {
      this.logger.error('Error generating master prompt:', error);
      
      // Mark API key as unhealthy if it's a rate limit or quota error
      if (currentApiKey && (
        error.message.includes('quota') || 
        error.message.includes('rate') ||
        error.message.includes('limit') ||
        error.message.includes('429')
      )) {
        this.apiKeyManager.markKeyAsUnhealthy(currentApiKey, `Master Prompt Error: ${error.message}`);
      }
      
      throw new Error(`Failed to generate master prompt: ${error.message}`);
    }
  }

  /**
   * Generate chunk-specific prompt using master prompt
   */
  async generateChunkPrompt(chunkContent: string, masterPrompt: string): Promise<string> {
    let currentApiKey: string;
    try {
      const prompt = `${PROMPT_GENERATION_SYSTEM_INSTRUCTION}\n\nMaster Prompt: ${masterPrompt}\n\nChunk content:\n${chunkContent}`;
      
      const genAI = await this.getGeminiClient();
      currentApiKey = await this.apiKeyManager.getNextAPIKey();
      
      const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: prompt,
      });
      
      const chunkPrompt = response.text.trim();
      
      this.logger.log(`Generated chunk prompt: ${chunkPrompt.substring(0, 100)}...`);
      return chunkPrompt;
    } catch (error) {
      this.logger.error('Error generating chunk prompt:', error);
      
      // Mark API key as unhealthy if it's a rate limit or quota error
      if (currentApiKey && (
        error.message.includes('quota') || 
        error.message.includes('rate') ||
        error.message.includes('limit') ||
        error.message.includes('429')
      )) {
        this.apiKeyManager.markKeyAsUnhealthy(currentApiKey, `Chunk Prompt Error: ${error.message}`);
      }
      
      throw new Error(`Failed to generate chunk prompt: ${error.message}`);
    }
  }

  /**
   * Sanitize prompt if it violates safety policies
   */
  async sanitizePrompt(originalPrompt: string): Promise<string> {
    let currentApiKey: string;
    try {
      const prompt = `${SANITIZE_PROMPT_SYSTEM_INSTRUCTION}\n\nOriginal prompt: ${originalPrompt}`;
      
      const genAI = await this.getGeminiClient();
      currentApiKey = await this.apiKeyManager.getNextAPIKey();
      
      const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: prompt,
      });
      
      const sanitizedPrompt = response.text.trim();
      
      this.logger.log(`Sanitized prompt: ${sanitizedPrompt.substring(0, 100)}...`);
      return sanitizedPrompt;
    } catch (error) {
      this.logger.error('Error sanitizing prompt:', error);
      
      // Mark API key as unhealthy if it's a rate limit or quota error
      if (currentApiKey && (
        error.message.includes('quota') || 
        error.message.includes('rate') ||
        error.message.includes('limit') ||
        error.message.includes('429')
      )) {
        this.apiKeyManager.markKeyAsUnhealthy(currentApiKey, `Sanitize Prompt Error: ${error.message}`);
      }
      
      throw new Error(`Failed to sanitize prompt: ${error.message}`);
    }
  }

  /**
   * Generate image with retry logic for policy violations
   */
  async generateImage(prompt: string, options: ImageGenerationOptions = {}): Promise<Buffer> {
    const {
      size = '1024x1024',
      quality = 'standard',
      model = 'gemini',
      numberOfImages = 1
    } = options;

    try {
      // First attempt with original prompt
      const result = await this.generateImageWithGemini(prompt, options);
      return result.images[0]; // Return first image for backward compatibility
    } catch (error) {
      this.logger.warn(`Image generation failed with original prompt: ${error.message}`);
      
      // If it's a policy violation, try sanitizing the prompt
      if (error.message.includes('policy') || error.message.includes('safety') || error.message.includes('violation')) {
        try {
          const sanitizedPrompt = await this.sanitizePrompt(prompt);
          this.logger.log('Retrying with sanitized prompt');
          const result = await this.generateImageWithGemini(sanitizedPrompt, options);
          return result.images[0]; // Return first image for backward compatibility
        } catch (sanitizeError) {
          this.logger.error('Image generation failed even with sanitized prompt:', sanitizeError);
          throw sanitizeError;
        }
      }
      
      throw error;
    }
  }

  /**
   * Generate multiple images with retry logic for policy violations
   */
  async generateImages(prompt: string, options: ImageGenerationOptions = {}): Promise<ImageGenerationResult> {
    const {
      size = '1024x1024',
      quality = 'standard',
      model = 'gemini',
      numberOfImages = 1
    } = options;

    try {
      // First attempt with original prompt
      return await this.generateImageWithGemini(prompt, options);
    } catch (error) {
      this.logger.warn(`Image generation failed with original prompt: ${error.message}`);
      
      // If it's a policy violation, try sanitizing the prompt
      if (error.message.includes('policy') || error.message.includes('safety') || error.message.includes('violation')) {
        try {
          const sanitizedPrompt = await this.sanitizePrompt(prompt);
          this.logger.log('Retrying with sanitized prompt');
          return await this.generateImageWithGemini(sanitizedPrompt, options);
        } catch (sanitizeError) {
          this.logger.error('Image generation failed even with sanitized prompt:', sanitizeError);
          throw sanitizeError;
        }
      }
      
      throw error;
    }
  }

    async generateImageWithGemini(prompt: string, options: ImageGenerationOptions = {}): Promise<ImageGenerationResult> {
    let currentApiKey: string;
    try {
      const { size = '1024x1024', quality = 'standard', numberOfImages = 1, storyId } = options;
      
      const genAI = await this.getGeminiClient();
      currentApiKey = await this.apiKeyManager.getNextAPIKey();
      
      const response = await genAI.models.generateImages({
        model: 'imagen-4.0-generate-preview-06-06',
        prompt: prompt,
        config: {
            numberOfImages: numberOfImages,
            outputMimeType: 'image/jpeg',
            aspectRatio: "16:9"
        },
    });
    
    if (response.generatedImages && response.generatedImages.length > 0) {
      // Chuyển tất cả ảnh từ base64 sang Buffer
      const images: Buffer[] = [];
      
      for (const generatedImage of response.generatedImages) {
        if (generatedImage.image?.imageBytes) {
          const imageBuffer = Buffer.from(generatedImage.image.imageBytes, 'base64');
          images.push(imageBuffer);
        }
      }
      
      if (images.length > 0) {
        let savedImagePaths: string[] = [];
        
        // Save images if storyId is provided
        if (storyId) {
          this.logger.log(`Saving ${images.length} images for story ${storyId}...`);
          
          const saveImagePromises = images.map(async (imageBuffer, imgIndex) => {
            const imageFileName = `generated_variant_${imgIndex}`;
            
            try {
              const imagePath = await this.fileStorageService.saveImage(
                storyId,
                imageFileName,
                imageBuffer
              );
              this.logger.log(`✓ Saved image ${imgIndex + 1}/${images.length}: ${imagePath}`);
              return imagePath;
            } catch (saveError) {
              this.logger.error(`✗ Failed to save image ${imgIndex + 1}/${images.length}:`, saveError);
              throw new Error(`Failed to save image ${imgIndex + 1}: ${saveError.message}`);
            }
          });

          savedImagePaths = await Promise.all(saveImagePromises);
          this.logger.log(`✓ All ${savedImagePaths.length} images saved successfully for story ${storyId}`);
        }
        
        return {
          images,
          totalImages: images.length,
          savedImagePaths
        };
      }
    }
    
    throw new Error("No image was generated. The prompt might have been blocked.");

       
    } catch (error) {
      this.logger.error('Error generating image with Gemini:', error);
      
      // Mark API key as unhealthy if it's a rate limit or quota error
      if (currentApiKey && (
        error.message.includes('quota') || 
        error.message.includes('rate') ||
        error.message.includes('limit') ||
        error.message.includes('429')
      )) {
        this.apiKeyManager.markKeyAsUnhealthy(currentApiKey, `Image Generation Error: ${error.message}`);
      }
      
      throw new Error(`Gemini image generation failed: ${error.message}`);
    }
  }

  async generateImageWithDalle(prompt: string, options: ImageGenerationOptions = {}): Promise<Buffer> {
    // Implementation for DALL-E image generation
    throw new Error('DALL-E image generation not implemented yet');
  }

  async generateImageWithMidjourney(prompt: string, options: ImageGenerationOptions = {}): Promise<Buffer> {
    // Implementation for Midjourney image generation
    throw new Error('Midjourney image generation not implemented yet');
  }
} 