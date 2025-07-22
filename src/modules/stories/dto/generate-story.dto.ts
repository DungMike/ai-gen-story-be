import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from "class-validator";

export class GenerateStoryDto {
  @ApiProperty({
    description: 'Custom prompt for story generation',
    example: 'Write this story in a fantasy style with dragons and magic'
  })
  @IsString()
  @IsNotEmpty()
  customPrompt: string;
}