import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';

export class FavoriteCountryParamDto {
  @ApiProperty({ example: 'BRA' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(/^[A-Z]{3}$/, { message: 'countryCode must be a 3-letter ISO alpha-3 code' })
  countryCode!: string;
}
