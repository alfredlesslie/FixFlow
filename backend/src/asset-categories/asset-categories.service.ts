import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AssetCategory } from './models/asset-category.model';
import { CreateAssetCategoryInput } from './dto/create-asset-category.input';
import { UpdateAssetCategoryInput } from './dto/update-asset-category.input';

@Injectable()
export class AssetCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(): Promise<AssetCategory[]> {
    return this.prisma.assetCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<AssetCategory> {
    const cat = await this.prisma.assetCategory.findUnique({
      where: { id },
    });
    if (!cat) {
      throw new NotFoundException(`Asset category with ID ${id} not found`);
    }
    return cat;
  }

  async findByCode(code: string): Promise<AssetCategory | null> {
    return this.prisma.assetCategory.findUnique({
      where: { code },
    });
  }

  async createCategory(
    input: CreateAssetCategoryInput,
    actorId?: string,
  ): Promise<AssetCategory> {
    const normalizedCode = input.code.toUpperCase().trim();
    const existingCode = await this.findByCode(normalizedCode);
    if (existingCode) {
      throw new ConflictException(`Category with code "${normalizedCode}" already exists`);
    }

    const existingName = await this.prisma.assetCategory.findUnique({
      where: { name: input.name.trim() },
    });
    if (existingName) {
      throw new ConflictException(`Category with name "${input.name.trim()}" already exists`);
    }

    const category = await this.prisma.assetCategory.create({
      data: {
        code: normalizedCode,
        name: input.name.trim(),
        description: input.description ? input.description.trim() : null,
        defaultMaintenanceIntervalDays: input.defaultMaintenanceIntervalDays || 90,
      },
    });

    await this.auditService.logAction(actorId || null, 'CATEGORY_CREATED', 'ASSET_CATEGORY', category.id, {
      code: category.code,
      name: category.name,
    });

    return category;
  }

  async updateCategory(
    id: string,
    input: UpdateAssetCategoryInput,
    actorId?: string,
  ): Promise<AssetCategory> {
    await this.findById(id);

    if (input.name) {
      const existingName = await this.prisma.assetCategory.findFirst({
        where: { name: input.name.trim(), NOT: { id } },
      });
      if (existingName) {
        throw new ConflictException(`Another category with name "${input.name.trim()}" already exists`);
      }
    }

    const updated = await this.prisma.assetCategory.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name.trim() : undefined,
        description: input.description !== undefined ? input.description.trim() : undefined,
        defaultMaintenanceIntervalDays:
          input.defaultMaintenanceIntervalDays !== undefined
            ? input.defaultMaintenanceIntervalDays
            : undefined,
      },
    });

    await this.auditService.logAction(actorId || null, 'CATEGORY_UPDATED', 'ASSET_CATEGORY', updated.id, {
      code: updated.code,
    });

    return updated;
  }
}
