import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { FavoriteCountryRecord, FavoritesResponse } from '@worldscope/shared';
import { CLIENT_ID_HEADER, ClientId } from '../common/decorators/client-id.decorator';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoriteCountryParamDto } from './dto/favorite-country.param';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@ApiHeader({
  name: CLIENT_ID_HEADER,
  required: true,
  description: 'Anonymous browser identifier (8-64 chars). Not authentication.',
})
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'List favourites for the current anonymous client' })
  @ApiOkResponse({ description: 'Favourite country codes, newest first.' })
  list(@ClientId() clientId: string): Promise<FavoritesResponse> {
    return this.favorites.list(clientId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a country to favourites (idempotent)' })
  @ApiOkResponse({ description: 'The existing or newly created favourite.' })
  @ApiNotFoundResponse({ description: 'Unknown country code.' })
  add(
    @ClientId() clientId: string,
    @Body() body: CreateFavoriteDto,
  ): Promise<FavoriteCountryRecord> {
    return this.favorites.add(clientId, body.countryCode);
  }

  @Delete(':countryCode')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a favourite' })
  @ApiNoContentResponse({ description: 'Removed, or did not exist.' })
  @ApiBadRequestResponse({ description: 'Invalid country code or client id.' })
  async remove(
    @ClientId() clientId: string,
    @Param() params: FavoriteCountryParamDto,
  ): Promise<void> {
    await this.favorites.remove(clientId, params.countryCode);
  }
}
