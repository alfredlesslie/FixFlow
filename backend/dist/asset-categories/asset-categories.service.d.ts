import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AssetCategory } from './models/asset-category.model';
import { CreateAssetCategoryInput } from './dto/create-asset-category.input';
import { UpdateAssetCategoryInput } from './dto/update-asset-category.input';
export declare class AssetCategoriesService {
    private readonly prisma;
    private readonly auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    findAll(): Promise<AssetCategory[]>;
    findById(id: string): Promise<AssetCategory>;
    findByCode(code: string): Promise<AssetCategory | null>;
    createCategory(input: CreateAssetCategoryInput, actorId?: string): Promise<AssetCategory>;
    updateCategory(id: string, input: UpdateAssetCategoryInput, actorId?: string): Promise<AssetCategory>;
}
