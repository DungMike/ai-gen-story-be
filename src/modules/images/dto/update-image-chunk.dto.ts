import { PartialType } from '@nestjs/mapped-types';
import { CreateImageChunkDto } from './create-image-chunk.dto';

export class UpdateImageChunkDto extends PartialType(CreateImageChunkDto) {} 