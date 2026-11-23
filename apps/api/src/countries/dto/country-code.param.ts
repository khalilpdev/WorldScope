import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';

export const ISO3_PATTERN = /^[A-Z]{3}$/;

export class CountryCodeParamDto {
  @ApiProperty({ example: 'BRA', description: 'ISO 3166-1 alpha-3 country code.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(ISO3_PATTERN, {
    message: 'code must be a 3-letter ISO 3166-1 alpha-3 country code',
  })
  code!: string;
}
