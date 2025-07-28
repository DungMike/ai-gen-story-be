import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as wav from 'wav';

export interface AudioMergeResult {
  outputPath: string;
  totalDuration: number;
  fileSize: number;
  chunkCount: number;
}

@Injectable()
export class AudioMergerService {
  private readonly logger = new Logger(AudioMergerService.name);

  /**
   * Merge multiple WAV files into a single file
   */
  async mergeAudioFiles(
    inputFiles: string[], 
    storyId: string
  ): Promise<AudioMergeResult> {
    this.logger.log(`Starting to merge ${inputFiles.length} audio files for story ${storyId}`);

    // Validate input files
    for (const filePath of inputFiles) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Audio file not found: ${filePath}`);
      }
    }

    // Create output directory
    const outputDir = path.join('uploads', 'audio', storyId, 'merged');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate output filename
    const timestamp = Date.now();
    const outputPath = path.join(outputDir, `story_${storyId}_complete_${timestamp}.wav`);

    // Merge files
    const result = await this.mergeWavFiles(inputFiles, outputPath);

    this.logger.log(`Audio merge completed: ${outputPath}`);
    return result;
  }

  /**
   * Merge WAV files using Node.js streams
   */
  private async mergeWavFiles(inputFiles: string[], outputPath: string): Promise<AudioMergeResult> {
    return new Promise((resolve, reject) => {
      let totalDuration = 0;
      let chunkCount = 0;
      let isFirstFile = true;
      let outputWriter: wav.FileWriter | null = null;

      const processNextFile = (fileIndex: number) => {
        if (fileIndex >= inputFiles.length) {
          // All files processed
          if (outputWriter) {
            outputWriter.end();
          }
          return;
        }

        const inputPath = inputFiles[fileIndex];
        this.logger.log(`Processing file ${fileIndex + 1}/${inputFiles.length}: ${inputPath}`);

        const reader = new wav.Reader();
        const inputStream = fs.createReadStream(inputPath);

        reader.on('format', (format) => {
          if (isFirstFile) {
            // Create output writer with the same format as first file
            outputWriter = new wav.FileWriter(outputPath, {
              channels: format.channels,
              sampleRate: format.sampleRate,
              bitDepth: format.bitDepth,
            });

            outputWriter.on('finish', () => {
              // Get file size
              const stats = fs.statSync(outputPath);
              const fileSize = stats.size;

              resolve({
                outputPath,
                totalDuration,
                fileSize,
                chunkCount
              });
            });

            outputWriter.on('error', reject);
            isFirstFile = false;
          }

          // Calculate duration for this chunk
          const fileStats = fs.statSync(inputPath);
          const duration = this.calculateWavDuration(fileStats.size, format);
          totalDuration += duration;
          chunkCount++;

          // Pipe audio data to output
          reader.pipe(outputWriter, { end: false });
        });

        reader.on('end', () => {
          // Process next file
          processNextFile(fileIndex + 1);
        });

        reader.on('error', reject);
        inputStream.pipe(reader);
      };

      // Start processing first file
      processNextFile(0);
    });
  }

  /**
   * Calculate WAV file duration based on file size and format
   */
  private calculateWavDuration(fileSize: number, format: any): number {
    // WAV header is typically 44 bytes
    const headerSize = 44;
    const dataSize = fileSize - headerSize;
    
    // Calculate duration: (dataSize) / (sampleRate * channels * bitsPerSample / 8)
    const bytesPerSample = format.bitDepth / 8;
    const bytesPerSecond = format.sampleRate * format.channels * bytesPerSample;
    
    return dataSize / bytesPerSecond;
  }

  /**
   * Clean up old merged files
   */
  async cleanupOldMergedFiles(storyId: string, maxAgeDays: number = 7): Promise<void> {
    const mergedDir = path.join('uploads', 'audio', storyId, 'merged');
    
    if (!fs.existsSync(mergedDir)) {
      return;
    }

    const files = fs.readdirSync(mergedDir);
    const now = Date.now();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(mergedDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAgeMs) {
        fs.unlinkSync(filePath);
        this.logger.log(`Cleaned up old merged file: ${filePath}`);
      }
    }
  }

  /**
   * Get merged file info
   */
  async getMergedFileInfo(filePath: string): Promise<{
    exists: boolean;
    fileSize: number;
    duration: number;
  }> {
    if (!fs.existsSync(filePath)) {
      return { exists: false, fileSize: 0, duration: 0 };
    }

    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Read WAV header to get duration
    const buffer = fs.readFileSync(filePath);
    const headerBuffer = buffer.subarray(0, 44);
    const sampleRate = headerBuffer.readUInt32LE(24);
    const channels = headerBuffer.readUInt16LE(22);
    const bitsPerSample = headerBuffer.readUInt16LE(34);
    
    const bytesPerSample = bitsPerSample / 8;
    const bytesPerSecond = sampleRate * channels * bytesPerSample;
    const dataSize = fileSize - 44;
    const duration = dataSize / bytesPerSecond;

    return {
      exists: true,
      fileSize,
      duration
    };
  }
} 