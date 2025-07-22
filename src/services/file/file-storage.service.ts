import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileStorageService {
  private readonly uploadsDir = 'uploads';
  private readonly imagesDir = 'images';

  async saveImage(storyId: string, fileName: string, imageBuffer: Buffer): Promise<string> {
    try {
      const storyDir = path.join(this.uploadsDir, this.imagesDir, storyId);
      
      // Create directory if it doesn't exist
      await fs.mkdir(storyDir, { recursive: true });
      // create uuid for fileName
      const uuid = uuidv4();
      const filePath = path.join(storyDir, `${fileName}_${uuid}.png`);
      await fs.writeFile(filePath, imageBuffer);
      
      return filePath;
    } catch (error) {
      throw new Error(`Failed to save image: ${error.message}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, which is fine
      console.warn(`File not found for deletion: ${filePath}`);
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      throw new Error(`Failed to get file size: ${error.message}`);
    }
  }

  async readFile(filePath: string): Promise<Buffer> {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  async createZipArchive(storyId: string, filePaths: string[]): Promise<string> {
    // This would need to be implemented with a ZIP library
    // For now, return a placeholder
    throw new Error('ZIP creation not implemented yet');
  }

  async saveGeneratedStory(storyId: string, content: string): Promise<string> {
    try {
      const storyDir = path.join(this.uploadsDir, 'generated', storyId);
      
      // Create directory if it doesn't exist
      await fs.mkdir(storyDir, { recursive: true });
      
      const fileName = `generated_story_${Date.now()}.txt`;
      const filePath = path.join(storyDir, fileName);
      
      await fs.writeFile(filePath, content, 'utf-8');
      
      return filePath;
    } catch (error) {
      throw new Error(`Failed to save generated story: ${error.message}`);
    }
  }
} 