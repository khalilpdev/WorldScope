import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { HealthResponse } from '@worldscope/shared';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Dependency health',
    description:
      'Reports database and cache status. Returns HTTP 200 with status "degraded" when a dependency is down, so probes can distinguish liveness from readiness.',
  })
  @ApiOkResponse({ description: 'Health snapshot. Contains no secrets.' })
  check(): Promise<HealthResponse> {
    return this.health.check();
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe that does not touch dependencies' })
  @ApiOkResponse({ description: 'Process is running.' })
  live(): { status: 'ok'; uptimeSeconds: number; timestamp: string } {
    return this.health.live();
  }
}
