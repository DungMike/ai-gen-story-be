import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUrl } from 'class-validator';



export class CreateStoryDto {
  @ApiProperty({
    description: 'Title of the story',
    example: 'The Adventure Begins'
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Custom prompt for story generation',
    example: 'Write this story in a fantasy style with dragons and magic'
  })
  @IsOptional()
  @IsString()
  customPrompt?: string;

  @ApiProperty({
    description: 'URL of the uploaded story file',
    example: 'http://localhost:3001/api/files/uploads/original/story.txt'
  })
  @IsString()
  fileUrl: string;

} 