import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PageOptionDto {

  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: true,
    default: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page: number = 1;

  @ApiProperty({
    description: 'Limit number',
    example: 10,
    required: true,
    default: 10,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  limit: number = 10;

  @ApiProperty({
    description: 'Search string',
    example: 'story',
    required: false,
  })
  @IsString()
  @IsOptional()
  search: string;

  @ApiProperty({
    description: 'Status string',
    example: 'draft',
    required: false,
  })
  @IsString()
  @IsOptional()
  status: string;

  @ApiProperty({
    description: 'userId',
    example: '123',
    required: false,
  })
  @IsString()
  @IsOptional()
  userId: string;
}