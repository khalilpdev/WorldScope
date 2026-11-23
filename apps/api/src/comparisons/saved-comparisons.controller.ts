import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { SavedComparisonRecord, SavedComparisonsResponse } from '@worldscope/shared';
import { CLIENT_ID_HEADER, ClientId } from '../common/decorators/client-id.decorator';
import { ComparisonIdParamDto } from './dto/comparison-id.param';
import { CreateComparisonDto } from './dto/create-comparison.dto';
import { SavedComparisonsService } from './saved-comparisons.service';

@ApiTags('comparisons')
@ApiHeader({
  name: CLIENT_ID_HEADER,
  required: true,
  description: 'Anonymous browser identifier (8-64 chars). Not authentication.',
})
@Controller('comparisons')
export class SavedComparisonsController {
  constructor(private readonly comparisons: SavedComparisonsService) {}

  @Get()
  @ApiOperation({ summary: 'List saved comparisons for the current anonymous client' })
  @ApiOkResponse({ description: 'Saved comparisons, most recently updated first.' })
  list(@ClientId() clientId: string): Promise<SavedComparisonsResponse> {
    return this.comparisons.list(clientId);
  }

  @Post()
  @ApiOperation({ summary: 'Save a comparison of 2 to 4 countries' })
  @ApiCreatedResponse({ description: 'The saved comparison.' })
  @ApiNotFoundResponse({ description: 'Unknown country code.' })
  @ApiBadRequestResponse({ description: 'Invalid payload.' })
  create(
    @ClientId() clientId: string,
    @Body() body: CreateComparisonDto,
  ): Promise<SavedComparisonRecord> {
    return this.comparisons.create(clientId, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a saved comparison' })
  @ApiNoContentResponse({ description: 'Deleted, or did not exist for this client.' })
  async remove(
    @ClientId() clientId: string,
    @Param() params: ComparisonIdParamDto,
  ): Promise<void> {
    await this.comparisons.remove(clientId, params.id);
  }
}
