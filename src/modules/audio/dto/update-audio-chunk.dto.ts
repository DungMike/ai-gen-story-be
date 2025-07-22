import { PartialType } from '@nestjs/mapped-types';
import { CreateAudioChunkDto } from './create-audio-chunk.dto';

export class UpdateAudioChunkDto extends PartialType(CreateAudioChunkDto) {} 