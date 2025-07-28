import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpStatus,
  HttpCode,
  Request,
  ParseFilePipe,
  MaxFileSizeValidator
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '@/services/file/file-upload.service';
import { Auth } from '@/common/decorators/auth.decorator';

@ApiTags('file-upload')
@Controller('file-upload')
@ApiBearerAuth()
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @Auth()
  @ApiOperation({ summary: 'Upload a single story file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Story file to upload (.txt, .doc, .docx)'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        fileUrl: {
          type: 'string',
          description: 'URL of the uploaded file'
        },
        fileName: {
          type: 'string',
          description: 'Name of the uploaded file'
        },
        fileSize: {
          type: 'number',
          description: 'Size of the uploaded file in bytes'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid file' 
  })
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
        fileIsRequired: true,
      }),
    ) file: Express.Multer.File,
    @Request() req,
  ) {
    // Manual file type validation
    const allowedExtensions = ['.txt', '.doc', '.docx'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`);
    }

    // Upload file
    const uploadedFilePath = await this.fileUploadService.uploadFile(file, 'uploads/original');
    
    // Generate file URL - now using static file serving
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    const fileUrl = `${baseUrl}/${uploadedFilePath}`;

    return {
      fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      filePath: uploadedFilePath
    };
  }

  @Post('batch-upload')
  @Auth()
  @ApiOperation({ summary: 'Upload multiple story files for batch processing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary'
          },
          description: 'Multiple story files to upload (.txt, .doc, .docx)'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Files uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fileUrl: { type: 'string' },
              fileName: { type: 'string' },
              fileSize: { type: 'number' },
              filePath: { type: 'string' }
            }
          }
        },
        totalFiles: { type: 'number' },
        totalSize: { type: 'number' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid files or too many files' 
  })
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('files', 10)) // Limit to 10 files
  async uploadMultipleFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB per file
        ],
        fileIsRequired: true,
      }),
    ) files: Express.Multer.File[],
    @Request() req,
  ) {
    // Validate number of files
    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }

    if (files.length > 10) {
      throw new Error('Maximum 10 files allowed per upload');
    }

    // Manual file type validation for all files
    const allowedExtensions = ['.txt', '.doc', '.docx'];
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    
    const uploadedFiles = [];
    let totalSize = 0;

    for (const file of files) {
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(`Invalid file type for ${file.originalname}. Allowed types: ${allowedExtensions.join(', ')}`);
      }

      // Upload file
      const uploadedFilePath = await this.fileUploadService.uploadFile(file, 'uploads/original');
      const fileUrl = `${baseUrl}/${uploadedFilePath}`;
      
      uploadedFiles.push({
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        filePath: uploadedFilePath
      });

      totalSize += file.size;
    }

    return {
      files: uploadedFiles,
      totalFiles: uploadedFiles.length,
      totalSize
    };
  }
} 