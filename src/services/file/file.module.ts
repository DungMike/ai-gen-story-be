import { Module } from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { FileUploadService } from './file-upload.service';

@Module({
  providers: [FileStorageService, FileUploadService],
  exports: [FileStorageService, FileUploadService],
})
export class FileModule {} 