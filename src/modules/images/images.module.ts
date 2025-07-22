import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { ImageGenerationProcessor } from './images.processor';
import { ImageChunk, ImageChunkSchema } from './schemas/image-chunk.schema';
import { ImageChunkRepository } from './repositories/image-chunk.repository';
import { UsersModule } from '../users/users.module';
import { RepositoriesModule } from '../../database/repositories/repositories.module';
import { AiModule } from '../../services/ai/ai.module';
import { FileModule } from '../../services/file/file.module';
import { SocketModule } from '../socket/socket.module';
import { HelpersModule } from '../../helpers/helpers.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ImageChunk.name, schema: ImageChunkSchema }
    ]),
    BullModule.registerQueue({
      name: 'image-generation',
    }),
    UsersModule,
    RepositoriesModule,
    AiModule,
    FileModule,
    SocketModule,
    HelpersModule,
  ],
  controllers: [ImagesController],
  providers: [
    ImagesService,
    ImageGenerationProcessor,
    ImageChunkRepository,
  ],
  exports: [ImagesService]
})
export class ImagesModule {} 