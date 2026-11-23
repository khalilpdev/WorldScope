import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { OverviewResponse } from '@worldscope/shared';
import { OverviewService } from './overview.service';

@ApiTags('overview')
@Controller('overview')
export class OverviewController {
  constructor(private readonly overview: OverviewService) {}

  @Get()
  @ApiOperation({
    summary: 'Global totals, regional distribution and highlighted countries for the dashboard',
  })
  @ApiOkResponse({ description: 'Aggregated figures derived from the country catalogue.' })
  getOverview(): Promise<OverviewResponse> {
    return this.overview.getOverview();
  }
}
