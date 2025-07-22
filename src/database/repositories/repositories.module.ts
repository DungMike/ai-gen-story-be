import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Story, StorySchema } from '../schemas/story.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { UserSession, UserSessionSchema } from '../schemas/user-session.schema';
import { ImageChunk, ImageChunkSchema } from '../schemas/image-chunk.schema';
import { AudioChunk, AudioChunkSchema } from '../schemas/audio-chunk.schema';
import { BatchJob, BatchJobSchema } from '../schemas/batch-job.schema';
import { StoryRepository } from './story.repository';
import { UserRepository } from './user.repository';
import { UserSessionRepository } from './user-session.repository';
import { ImageChunkRepository } from './image-chunk.repository';
import { AudioChunkRepository } from './audio-chunk.repository';
import { BatchJobRepository } from './batch-job.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Story.name, schema: StorySchema },
      { name: User.name, schema: UserSchema },
      { name: UserSession.name, schema: UserSessionSchema },
      { name: ImageChunk.name, schema: ImageChunkSchema },
      { name: AudioChunk.name, schema: AudioChunkSchema },
      { name: BatchJob.name, schema: BatchJobSchema },
    ]),
  ],
  providers: [
    StoryRepository,
    UserRepository,
    UserSessionRepository,
    ImageChunkRepository,
    AudioChunkRepository,
    BatchJobRepository,
  ],
  exports: [
    StoryRepository,
    UserRepository,
    UserSessionRepository,
    ImageChunkRepository,
    AudioChunkRepository,
    BatchJobRepository,
  ],
})
export class RepositoriesModule {} 