import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { APIKeyManagerService } from '../services/api-key-manager/api-key-manager.service';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('api-key-stats')
@Controller('api/admin/api-key-stats')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ApiKeyStatsController {
  constructor(
    private readonly apiKeyManager: APIKeyManagerService
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get API key usage statistics' })
  @ApiResponse({ status: 200, description: 'API key statistics retrieved successfully' })
  getKeyStats() {
    return {
      success: true,
      data: this.apiKeyManager.getKeyStats()
    };
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset API key statistics' })
  @ApiResponse({ status: 200, description: 'API key statistics reset successfully' })
  resetStats() {
    this.apiKeyManager.resetStats();
    return {
      success: true,
      message: 'API key statistics reset successfully'
    };
  }
} 