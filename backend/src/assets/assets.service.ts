import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Asset } from './models/asset.model';
import { AssetFilterInput } from './dto/asset-filter.input';
import { CreateAssetInput } from './dto/create-asset.input';
import { UpdateAssetInput } from './dto/update-asset.input';
import { AssetStatus } from '../common/enums';

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(filter?: AssetFilterInput): Promise<Asset[]> {
    const where: any = {};

    if (filter?.search) {
      const q = filter.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { assetTag: { contains: q, mode: 'insensitive' } },
        { serialNumber: { contains: q, mode: 'insensitive' } },
        { manufacturer: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (filter?.categoryId) {
      where.categoryId = filter.categoryId;
    }

    if (filter?.locationId) {
      where.locationId = filter.locationId;
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.criticality) {
      where.criticality = filter.criticality;
    }

    return this.prisma.asset.findMany({
      where,
      include: {
        category: true,
        location: true,
      },
      orderBy: { assetTag: 'asc' },
    }) as unknown as Promise<Asset[]>;
  }

  async findById(id: string): Promise<Asset> {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        location: true,
      },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    return asset as unknown as Asset;
  }

  async findByTag(assetTag: string): Promise<Asset> {
    const normalizedTag = assetTag.trim().toUpperCase();
    const asset = await this.prisma.asset.findUnique({
      where: { assetTag: normalizedTag },
      include: {
        category: true,
        location: true,
      },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with tag "${normalizedTag}" not found`);
    }

    return asset as unknown as Asset;
  }

  async createAsset(input: CreateAssetInput, actorId?: string): Promise<Asset> {
    const normalizedTag = input.assetTag.trim().toUpperCase();

    // 1. Verify category exists
    const category = await this.prisma.assetCategory.findUnique({
      where: { id: input.categoryId },
    });
    if (!category) {
      throw new BadRequestException(
        `Referenced asset category (ID: ${input.categoryId}) does not exist`,
      );
    }

    // 2. Verify location exists
    const location = await this.prisma.location.findUnique({
      where: { id: input.locationId },
    });
    if (!location) {
      throw new BadRequestException(
        `Referenced location (ID: ${input.locationId}) does not exist`,
      );
    }

    // 3. Verify unique assetTag
    const existingTag = await this.prisma.asset.findUnique({
      where: { assetTag: normalizedTag },
    });
    if (existingTag) {
      throw new ConflictException(`Asset with tag "${normalizedTag}" already exists`);
    }

    // 4. Generate & verify qrIdentifier
    const qrIdentifier =
      input.qrIdentifier?.trim() || `fixflow://assets/${normalizedTag}`;
    const existingQr = await this.prisma.asset.findUnique({
      where: { qrIdentifier },
    });
    if (existingQr) {
      throw new ConflictException(
        `Asset with QR identifier "${qrIdentifier}" already exists`,
      );
    }

    // 5. Create Asset
    const created = await this.prisma.asset.create({
      data: {
        assetTag: normalizedTag,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        categoryId: input.categoryId,
        locationId: input.locationId,
        status: input.status || AssetStatus.OPERATIONAL,
        criticality: input.criticality || undefined,
        conditionRating: input.conditionRating ?? 5,
        serialNumber: input.serialNumber?.trim() || null,
        manufacturer: input.manufacturer?.trim() || null,
        model: input.model?.trim() || null,
        installationDate: input.installationDate || null,
        warrantyExpiry: input.warrantyExpiry || null,
        qrIdentifier,
      },
      include: {
        category: true,
        location: true,
      },
    });

    // 6. Record Audit Log
    await this.auditService.logAction(actorId || null, 'ASSET_CREATED', 'ASSET', created.id, {
      assetTag: created.assetTag,
      name: created.name,
      status: created.status,
      criticality: created.criticality,
    });

    return created as unknown as Asset;
  }

  async updateAsset(
    id: string,
    input: UpdateAssetInput,
    actorId?: string,
  ): Promise<Asset> {
    const existing = await this.findById(id);

    if (input.categoryId && input.categoryId !== existing.categoryId) {
      const category = await this.prisma.assetCategory.findUnique({
        where: { id: input.categoryId },
      });
      if (!category) {
        throw new BadRequestException(
          `Referenced asset category (ID: ${input.categoryId}) does not exist`,
        );
      }
    }

    if (input.locationId && input.locationId !== existing.locationId) {
      const location = await this.prisma.location.findUnique({
        where: { id: input.locationId },
      });
      if (!location) {
        throw new BadRequestException(
          `Referenced location (ID: ${input.locationId}) does not exist`,
        );
      }
    }

    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name.trim() : undefined,
        description: input.description !== undefined ? input.description.trim() : undefined,
        categoryId: input.categoryId || undefined,
        locationId: input.locationId || undefined,
        status: input.status || undefined,
        criticality: input.criticality || undefined,
        conditionRating: input.conditionRating !== undefined ? input.conditionRating : undefined,
        serialNumber: input.serialNumber !== undefined ? input.serialNumber.trim() : undefined,
        manufacturer: input.manufacturer !== undefined ? input.manufacturer.trim() : undefined,
        model: input.model !== undefined ? input.model.trim() : undefined,
        installationDate: input.installationDate !== undefined ? input.installationDate : undefined,
        warrantyExpiry: input.warrantyExpiry !== undefined ? input.warrantyExpiry : undefined,
      },
      include: {
        category: true,
        location: true,
      },
    });

    await this.auditService.logAction(actorId || null, 'ASSET_UPDATED', 'ASSET', updated.id, {
      assetTag: updated.assetTag,
      changes: Object.keys(input),
    });

    return updated as unknown as Asset;
  }

  async updateAssetStatus(
    id: string,
    status: AssetStatus,
    actorId?: string,
  ): Promise<Asset> {
    const existing = await this.findById(id);

    const updated = await this.prisma.asset.update({
      where: { id },
      data: { status },
      include: {
        category: true,
        location: true,
      },
    });

    await this.auditService.logAction(actorId || null, 'ASSET_STATUS_CHANGED', 'ASSET', updated.id, {
      previousStatus: existing.status,
      newStatus: status,
    });

    return updated as unknown as Asset;
  }
}
