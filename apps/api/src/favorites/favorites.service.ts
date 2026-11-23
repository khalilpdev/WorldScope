import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { FavoriteCountryRecord, FavoritesResponse } from '@worldscope/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CountryCatalogProvider } from '../providers/country-catalog.provider';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CountryCatalogProvider,
  ) {}

  async list(clientId: string): Promise<FavoritesResponse> {
    const rows = await this.prisma.favoriteCountry.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: rows.map((row) => this.toRecord(row)) };
  }

  async add(clientId: string, countryCode: string): Promise<FavoriteCountryRecord> {
    const country = await this.catalog.getByCode(countryCode);
    if (!country) {
      throw new NotFoundException(`Country "${countryCode}" was not found`);
    }

    try {
      const row = await this.prisma.favoriteCountry.create({
        data: { clientId, countryCode: country.code },
      });
      return this.toRecord(row);
    } catch (error) {
      // Favourites are idempotent: a duplicate insert returns the existing row.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prisma.favoriteCountry.findUnique({
          where: { clientId_countryCode: { clientId, countryCode: country.code } },
        });
        if (existing) return this.toRecord(existing);
      }
      throw error;
    }
  }

  async remove(clientId: string, countryCode: string): Promise<void> {
    await this.prisma.favoriteCountry.deleteMany({
      where: { clientId, countryCode },
    });
  }

  private toRecord(row: {
    id: string;
    countryCode: string;
    createdAt: Date;
  }): FavoriteCountryRecord {
    return {
      id: row.id,
      countryCode: row.countryCode,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
