import { Injectable, Logger } from '@nestjs/common';
import * as archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';

export interface ZipFileItem {
  path: string;
  name: string;
}

export interface ZipMetadata {
  storyId: string;
  storyTitle: string;
  totalChunks: number;
  completedImages: number;
  failedImages: number;
  images: Array<{
    chunkIndex: number;
    status: string;
    prompt: string;
    imageFile: string;
    createdAt: Date;
  }>;
  generatedAt: string;
}

@Injectable()
export class ZipHelper {
  private readonly logger = new Logger(ZipHelper.name);

  /**
   * Create a ZIP file with the provided files and metadata
   * @param files Array of files to include in the ZIP
   * @param metadata Optional metadata to include as JSON file
   * @param zipFilename Name of the ZIP file
   * @returns Promise with zipPath and filename
   */
  async createZipFile(
    files: ZipFileItem[],
    zipFilename?: string
  ): Promise<{ zipPath: string; filename: string }> {
    try {
      // Create temp directory for ZIP file
      const tempDir = path.join(process.cwd(),'uploads', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Create ZIP file with timestamp if no filename provided
      if (!zipFilename) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        zipFilename = `archive_${timestamp}.zip`;
      }

      const zipPath = path.join(tempDir, zipFilename);
      
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level
      });

      // Listen for all archive data to be written
      output.on('close', () => {
        this.logger.log(`Archive created successfully: ${archive.pointer()} total bytes`);
      });

      // Good practice to catch warnings (ie stat failures and other non-blocking errors)
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          this.logger.warn('Archive warning:', err);
        } else {
          throw err;
        }
      });

      // Good practice to catch this error explicitly
      archive.on('error', (err) => {
        throw err;
      });

      // Pipe archive data to the file
      archive.pipe(output);

      // Add files to the ZIP
      let addedFiles = 0;
      for (const file of files) {
        if (fs.existsSync(file.path)) {
          archive.file(file.path, { name: file.name });
          addedFiles++;
        } else {
          this.logger.warn(`File not found: ${file.path}`);
        }
      }

      // Finalize the archive
      await archive.finalize();

      this.logger.log(`ZIP file created with ${addedFiles} files: ${zipFilename}`);
      
      return { zipPath, filename: zipFilename };
    } catch (error) {
      this.logger.error('Error creating ZIP file:', error);
      throw error;
    }
  }

  /**
   * Create a ZIP file specifically for story images
   * @param storyId Story ID
   * @param storyTitle Story title
   * @param imageChunks Array of image chunks
   * @returns Promise with zipPath and filename
   */
  async createStoryImagesZip(
    storyId: string,
    storyTitle: string,
    imageChunks: any[]
  ): Promise<{ zipPath: string; filename: string }> {
    try {
      // Prepare files for ZIP
      const files: ZipFileItem[] = [];
      for (const chunk of imageChunks) {
        if (chunk.imageFile && chunk.status === 'completed') {
          const imagePath = path.join(process.cwd(), chunk.imageFile);
          const fileName = `chunk_${chunk.chunkIndex}_image.png`;
          files.push({ path: imagePath, name: fileName });
        }
      }

      if (files.length === 0) {
        throw new Error('No completed images found for this story');
      }

      

      // Create ZIP filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const zipFilename = `story_${storyId}_images_${timestamp}.zip`;

      return this.createZipFile(files, zipFilename);
    } catch (error) {
      this.logger.error('Error creating story images ZIP:', error);
      throw error;
    }
  }

  /**
   * Clean up temporary ZIP file
   * @param zipPath Path to the ZIP file to delete
   */
  async cleanupZipFile(zipPath: string): Promise<void> {
    try {
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
        this.logger.log(`Cleaned up temporary ZIP file: ${zipPath}`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up ZIP file:', error);
    }
  }
} 