import { Controller } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // Dashboard functionality temporarily disabled
  // Will be implemented when all required repository methods are available
} 