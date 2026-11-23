import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type {
  CountryDetailResponse,
  CountryIndicatorsResponse,
  PaginatedCountries,
  WeatherResponse,
} from '@worldscope/shared';
import { CountriesService } from './countries.service';
import { CountryCodeParamDto } from './dto/country-code.param';
import { IndicatorsQueryDto } from './dto/indicators-query.dto';
import { QueryCountriesDto } from './dto/query-countries.dto';

@ApiTags('countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countries: CountriesService) {}

  @Get()
  @ApiOperation({ summary: 'List countries with search, filters, sorting and pagination' })
  @ApiOkResponse({ description: 'Paginated country summaries with filter facets.' })
  @ApiBadRequestResponse({ description: 'Invalid query parameters.' })
  list(@Query() query: QueryCountriesDto): Promise<PaginatedCountries> {
    return this.countries.list(query);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get one country, including sources and update timestamps' })
  @ApiParam({ name: 'code', example: 'BRA' })
  @ApiOkResponse({ description: 'Country detail.' })
  @ApiNotFoundResponse({ description: 'Unknown ISO alpha-3 code.' })
  detail(@Param() params: CountryCodeParamDto): Promise<CountryDetailResponse> {
    return this.countries.getDetail(params.code);
  }

  @Get(':code/indicators')
  @ApiOperation({ summary: 'Historical World Bank indicators for one country' })
  @ApiParam({ name: 'code', example: 'BRA' })
  @ApiOkResponse({ description: 'Indicator series, newest year first.' })
  @ApiNotFoundResponse({ description: 'Unknown ISO alpha-3 code.' })
  indicators(
    @Param() params: CountryCodeParamDto,
    @Query() query: IndicatorsQueryDto,
  ): Promise<CountryIndicatorsResponse> {
    return this.countries.getIndicators(params.code, query);
  }

  @Get(':code/weather')
  @ApiOperation({ summary: 'Current weather and seven-day forecast for the capital' })
  @ApiParam({ name: 'code', example: 'BRA' })
  @ApiOkResponse({
    description:
      'Weather data, or a response with null weather and an unavailableReason when coordinates are missing.',
  })
  @ApiNotFoundResponse({ description: 'Unknown ISO alpha-3 code.' })
  weather(@Param() params: CountryCodeParamDto): Promise<WeatherResponse> {
    return this.countries.getWeather(params.code);
  }
}
