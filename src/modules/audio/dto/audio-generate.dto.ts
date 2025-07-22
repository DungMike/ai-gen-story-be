import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber } from 'class-validator';
import { VoiceOption } from '../constant/type';



export class AudioGenerateDto {

  @ApiProperty({
    description: 'The voice style to use for audio generation',
    enum: VoiceOption,
    default: VoiceOption.Achird
  })
  @IsOptional()
  @IsEnum(VoiceOption)
  voiceStyle?: VoiceOption;

  @ApiProperty({
    description: 'The number of words per chunk',
    default: 500
  })
  @IsOptional()
  @IsNumber()
  wordPerChunk?: number;
}