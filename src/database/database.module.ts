import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { databaseConfig } from '@/config/database.config';
import { Story, StorySchema } from './schemas/story.schema';
import { AudioChunk, AudioChunkSchema } from './schemas/audio-chunk.schema';
import { ImageChunk, ImageChunkSchema } from './schemas/image-chunk.schema';
import { BatchJob, BatchJobSchema } from './schemas/batch-job.schema';
import { User, UserSchema } from './schemas/user.schema';
import { UserSession, UserSessionSchema } from './schemas/user-session.schema';

@Module({
  imports: [
    MongooseModule.forRoot(databaseConfig.uri),
    MongooseModule.forFeature([
      { name: Story.name, schema: StorySchema },
      { name: AudioChunk.name, schema: AudioChunkSchema },
      { name: ImageChunk.name, schema: ImageChunkSchema },
      { name: BatchJob.name, schema: BatchJobSchema },
      { name: User.name, schema: UserSchema },
      { name: UserSession.name, schema: UserSessionSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {} 