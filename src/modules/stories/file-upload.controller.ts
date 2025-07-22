import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile,
  HttpStatus,
  HttpCode,
  Request,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiConsumes,
  ApiBody,
  ApiBearerAuth
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '@/services/file/file-upload.service';
import { Auth } from '@/common/decorators/auth.decorator';

@ApiTags('file-upload')
@Controller('file-upload')
@ApiBearerAuth()
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @Auth()
  @ApiOperation({ summary: 'Upload a story file' })
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
    
    // Generate file URL
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    const fileUrl = `${baseUrl}/api/files/${uploadedFilePath}`;

    return {
      fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      filePath: uploadedFilePath
    };
  }
} 