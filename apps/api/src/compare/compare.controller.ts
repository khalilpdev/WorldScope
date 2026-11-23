import { Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CompareResponse } from '@worldscope/shared';
import { CompareService } from './compare.service';
import { CompareQueryDto } from './dto/compare-query.dto';

@ApiTags('compare')
@Controller('compare')
export class CompareController {
  constructor(private readonly compareService: CompareService) {}

  @Get()
  @ApiOperation({
    summary: 'Compare population, area, density and economic indicators for 2 to 4 countries',
  })
  @ApiOkResponse({ description: 'Comparable metrics. Each metric keeps a single unit.' })
  @ApiBadRequestResponse({ description: 'Invalid or duplicated country codes.' })
  @ApiNotFoundResponse({ description: 'Unknown ISO alpha-3 code.' })
  compare(@Query() query: CompareQueryDto): Promise<CompareResponse> {
    return this.compareService.compare(query.codes);
  }
}
