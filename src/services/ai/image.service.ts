import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
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
   * Simplify prompt by removing complex elements that might cause generation issues
   */
  async simplifyPrompt(originalPrompt: string): Promise<string> {
    let currentApiKey: string;
    try {
      const SIMPLIFY_PROMPT_SYSTEM_INSTRUCTION = `
You are an AI assistant that simplifies image generation prompts to make them more likely to generate successfully.
You will be given a prompt that failed to generate an image.
Your task is to create a simpler, more basic version that focuses on the core visual elements while removing complex details that might cause generation issues.

Guidelines:
1. Keep the main subject and action
2. Remove complex technical terms, camera specifications, or artistic jargon
3. Simplify lighting and atmosphere descriptions
4. Focus on basic visual elements: subject, action, setting
5. Use simple, clear language
6. Keep it under 100 words

Return ONLY the simplified prompt in English, with no other text or explanations.
`;

      const prompt = `${SIMPLIFY_PROMPT_SYSTEM_INSTRUCTION}\n\nOriginal prompt: ${originalPrompt}`;
      
      const genAI = await this.getGeminiClient();
      currentApiKey = await this.apiKeyManager.getNextAPIKey();
      
      const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: prompt,
      });
      
      const simplifiedPrompt = response.text.trim();
      
      this.logger.log(`Simplified prompt: ${simplifiedPrompt.substring(0, 100)}...`);
      return simplifiedPrompt;
    } catch (error) {
      this.logger.error('Error simplifying prompt:', error);
      
      // Mark API key as unhealthy if it's a rate limit or quota error
      if (currentApiKey && (
        error.message.includes('quota') || 
        error.message.includes('rate') ||
        error.message.includes('limit') ||
        error.message.includes('429')
      )) {
        this.apiKeyManager.markKeyAsUnhealthy(currentApiKey, `Simplify Prompt Error: ${error.message}`);
      }
      
      // If simplification fails, return a very basic version of the original prompt
      this.logger.warn('Prompt simplification failed, using fallback basic prompt');
      return this.createBasicFallbackPrompt(originalPrompt);
    }
  }

  /**
   * Create a basic fallback prompt when all AI-based prompt modifications fail
   */
  private createBasicFallbackPrompt(originalPrompt: string): string {
    // Extract basic elements from the original prompt
    const words = originalPrompt.split(' ');
    const basicWords = words.filter(word => 
      word.length > 2 && 
      !word.includes('(') && 
      !word.includes(')') && 
      !word.includes('—') &&
      !word.includes('Arri') &&
      !word.includes('Zeiss') &&
      !word.includes('Supreme') &&
      !word.includes('Primes')
    );
    
    // Take first 20 words and create a simple prompt
    const basicPrompt = basicWords.slice(0, 20).join(' ');
    return `A simple image of ${basicPrompt}`;
  }

  /**
   * Generate image with enhanced retry logic
   * Tries up to 3 times with different prompt strategies regardless of error message
   */
  async generateImage(prompt: string, options: ImageGenerationOptions = {}): Promise<Buffer> {
    const {
      size = '1024x1024',
      quality = 'standard',
      model = 'gemini',
      numberOfImages = 1
    } = options;

    const maxRetries = 3;
    let lastError: Error;

    // Strategy 1: Original prompt
    try {
      this.logger.log('Attempt 1: Using original prompt');
      const result = await this.generateImageWithGemini(prompt, options);
      return result.images[0]; // Return first image for backward compatibility
    } catch (error) {
      lastError = error;
      this.logger.warn(`Attempt 1 failed: ${error.message}`);
    }

    // Strategy 2: Sanitized prompt (for policy violations)
    try {
      this.logger.log('Attempt 2: Using sanitized prompt');
      const sanitizedPrompt = await this.sanitizePrompt(prompt);
      const result = await this.generateImageWithGemini(sanitizedPrompt, options);
      return result.images[0]; // Return first image for backward compatibility
    } catch (error) {
      lastError = error;
      this.logger.warn(`Attempt 2 failed: ${error.message}`);
    }

    // Strategy 3: Simplified prompt (remove complex elements)
    try {
      this.logger.log('Attempt 3: Using simplified prompt');
      const simplifiedPrompt = await this.simplifyPrompt(prompt);
      const result = await this.generateImageWithGemini(simplifiedPrompt, options);
      return result.images[0]; // Return first image for backward compatibility
    } catch (error) {
      lastError = error;
      this.logger.warn(`Attempt 3 failed: ${error.message}`);
    }

    // All attempts failed
    this.logger.error(`All ${maxRetries} attempts failed for prompt generation`);
    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Generate multiple images with enhanced retry logic
   * Tries up to 3 times with different prompt strategies regardless of error message
   */
  async generateImages(prompt: string, options: ImageGenerationOptions = {}): Promise<ImageGenerationResult> {
    const {
      size = '1024x1024',
      quality = 'standard',
      model = 'gemini',
      numberOfImages = 1
    } = options;

    const maxRetries = 3;
    let lastError: Error;

    // Strategy 1: Original prompt
    try {
      this.logger.log('Attempt 1: Using original prompt');
      return await this.generateImageWithGemini(prompt, options);
    } catch (error) {
      lastError = error;
      this.logger.warn(`Attempt 1 failed: ${error.message}`);
    }

    // Strategy 2: Sanitized prompt (for policy violations)
    try {
      this.logger.log('Attempt 2: Using sanitized prompt');
      const sanitizedPrompt = await this.sanitizePrompt(prompt);
      return await this.generateImageWithGemini(sanitizedPrompt, options);
    } catch (error) {
      lastError = error;
      this.logger.warn(`Attempt 2 failed: ${error.message}`);
    }

    // Strategy 3: Simplified prompt (remove complex elements)
    try {
      this.logger.log('Attempt 3: Using simplified prompt');
      const simplifiedPrompt = await this.simplifyPrompt(prompt);
      return await this.generateImageWithGemini(simplifiedPrompt, options);
    } catch (error) {
      lastError = error;
      this.logger.warn(`Attempt 3 failed: ${error.message}`);
    }

    // All attempts failed
    this.logger.error(`All ${maxRetries} attempts failed for prompt generation`);
    throw lastError || new Error('All retry attempts failed');
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