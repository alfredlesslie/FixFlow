import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Location } from './models/location.model';
import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';

@Injectable()
export class LocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private mapLocation(loc: any): Location | null {
    if (!loc) return null;
    return {
      ...loc,
      room: loc.roomNumber,
    };
  }

  async findAll(): Promise<Location[]> {
    const locations = await this.prisma.location.findMany({
      orderBy: [{ building: 'asc' }, { code: 'asc' }],
    });
    return locations.map((loc) => this.mapLocation(loc)!);
  }

  async findById(id: string): Promise<Location> {
    const location = await this.prisma.location.findUnique({
      where: { id },
    });
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return this.mapLocation(location)!;
  }

  async findByCode(code: string): Promise<Location | null> {
    const location = await this.prisma.location.findUnique({
      where: { code },
    });
    return this.mapLocation(location);
  }

  async createLocation(input: CreateLocationInput, actorId?: string): Promise<Location> {
    const normalizedCode = input.code.toUpperCase().trim();
    const existing = await this.findByCode(normalizedCode);
    if (existing) {
      throw new ConflictException(`Location with code "${normalizedCode}" already exists`);
    }

    const location = await this.prisma.location.create({
      data: {
        code: normalizedCode,
        name: input.name.trim(),
        building: input.building.trim(),
        floor: input.floor.trim(),
        roomNumber: input.roomNumber ? input.roomNumber.trim() : null,
        description: input.description ? input.description.trim() : null,
      },
    });

    await this.auditService.logAction(actorId || null, 'LOCATION_CREATED', 'LOCATION', location.id, {
      code: location.code,
      name: location.name,
    });

    return this.mapLocation(location)!;
  }

  async updateLocation(
    id: string,
    input: UpdateLocationInput,
    actorId?: string,
  ): Promise<Location> {
    await this.findById(id);

    const updated = await this.prisma.location.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name.trim() : undefined,
        building: input.building !== undefined ? input.building.trim() : undefined,
        floor: input.floor !== undefined ? input.floor.trim() : undefined,
        roomNumber: input.roomNumber !== undefined ? input.roomNumber.trim() : undefined,
        description: input.description !== undefined ? input.description.trim() : undefined,
      },
    });

    await this.auditService.logAction(actorId || null, 'LOCATION_UPDATED', 'LOCATION', updated.id, {
      code: updated.code,
    });

    return this.mapLocation(updated)!;
  }
}
