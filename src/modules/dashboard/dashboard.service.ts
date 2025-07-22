import { Injectable, Logger } from '@nestjs/common';
import { StoryRepository } from '@/database/repositories/story.repository';
import { UserRepository } from '@/database/repositories/user.repository';
import { ImageRepository } from '@/database/repositories/image.repository';
import { AudioRepository } from '@/database/repositories/audio.repository';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly userRepository: UserRepository,
    private readonly imageRepository: ImageRepository,
    private readonly audioRepository: AudioRepository,
  ) {}

  // Dashboard functionality temporarily disabled
  // Will be implemented when all required repository methods are available
} 