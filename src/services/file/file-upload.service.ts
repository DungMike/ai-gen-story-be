import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  async uploadFile(file: Express.Multer.File, destination: string): Promise<string> {
    try {
      // Validate file
      this.validateFile(file);
      
      // Create destination directory if it doesn't exist
      await this.ensureDirectoryExists(destination);
      
      // Generate unique filename
      const filename = this.generateUniqueFilename(file.originalname);
      const filePath = path.join(destination, filename);
      
      // Save file
      await this.saveFile(file, filePath);
      
      this.logger.log(`File uploaded successfully: ${filePath}`);
      return filePath;
    } catch (error) {
      this.logger.error('Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async uploadMultipleFiles(files: Express.Multer.File[], destination: string): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, destination));
      const filePaths = await Promise.all(uploadPromises);
      
      this.logger.log(`Multiple files uploaded successfully: ${filePaths.length} files`);
      return filePaths;
    } catch (error) {
      this.logger.error('Error uploading multiple files:', error);
      throw new Error(`Failed to upload multiple files: ${error.message}`);
    }
  }

  async readFileContent(filePath: string): Promise<string> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      this.logger.error('Error reading file content:', error);
      throw new Error(`Failed to read file content: ${error.message}`);
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      await fs.promises.unlink(filePath);
      this.logger.log(`File deleted successfully: ${filePath}`);
      return true;
    } catch (error) {
      this.logger.error('Error deleting file:', error);
      return false;
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedTypes = ['.txt', '.doc', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      throw new BadRequestException(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(`File size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
    }
  }

  private async ensureDirectoryExists(directory: string): Promise<void> {
    try {
      await fs.promises.mkdir(directory, { recursive: true });
    } catch (error) {
      this.logger.error('Error creating directory:', error);
      throw new Error(`Failed to create directory: ${error.message}`);
    }
  }

  private generateUniqueFilename(originalname: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(originalname);
    const nameWithoutExtension = path.basename(originalname, extension);
    
    return `${nameWithoutExtension}_${timestamp}_${randomString}${extension}`;
  }

  private async saveFile(file: Express.Multer.File, filePath: string): Promise<void> {
    try {
      await fs.promises.writeFile(filePath, file.buffer);
    } catch (error) {
      this.logger.error('Error saving file:', error);
      throw new Error(`Failed to save file: ${error.message}`);
    }
  }
} 