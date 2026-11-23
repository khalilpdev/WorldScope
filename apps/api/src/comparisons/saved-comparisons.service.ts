import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { SavedComparisonRecord, SavedComparisonsResponse } from '@worldscope/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CountryCatalogProvider } from '../providers/country-catalog.provider';
import type { CreateComparisonDto } from './dto/create-comparison.dto';

interface SavedComparisonRow {
  id: string;
  name: string | null;
  countryCodes: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SavedComparisonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CountryCatalogProvider,
  ) {}

  async list(clientId: string): Promise<SavedComparisonsResponse> {
    const rows = await this.prisma.savedComparison.findMany({
      where: { clientId },
      orderBy: { updatedAt: 'desc' },
    });
    return { data: rows.map((row) => this.toRecord(row)) };
  }

  async create(clientId: string, dto: CreateComparisonDto): Promise<SavedComparisonRecord> {
    const codes = [...new Set(dto.codes)];
    if (codes.length < 2) {
      throw new BadRequestException('A saved comparison needs at least two distinct codes.');
    }

    const snapshot = await this.catalog.getSnapshot();
    const known = new Set(snapshot.countries.map((country) => country.code));
    const unknown = codes.filter((code) => !known.has(code));
    if (unknown.length > 0) {
      throw new NotFoundException(`Unknown country code(s): ${unknown.join(', ')}`);
    }

    const row = await this.prisma.savedComparison.create({
      data: { clientId, name: dto.name ?? null, countryCodes: codes },
    });
    return this.toRecord(row);
  }

  async remove(clientId: string, id: string): Promise<void> {
    await this.prisma.savedComparison.deleteMany({ where: { id, clientId } });
  }

  private toRecord(row: SavedComparisonRow): SavedComparisonRecord {
    return {
      id: row.id,
      name: row.name,
      countryCodes: row.countryCodes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
