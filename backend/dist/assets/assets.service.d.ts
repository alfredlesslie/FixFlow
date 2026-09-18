import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Asset } from './models/asset.model';
import { AssetFilterInput } from './dto/asset-filter.input';
import { CreateAssetInput } from './dto/create-asset.input';
import { UpdateAssetInput } from './dto/update-asset.input';
import { AssetStatus } from '../common/enums';
export declare class AssetsService {
    private readonly prisma;
    private readonly auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    findAll(filter?: AssetFilterInput): Promise<Asset[]>;
    findById(id: string): Promise<Asset>;
    findByTag(assetTag: string): Promise<Asset>;
    createAsset(input: CreateAssetInput, actorId?: string): Promise<Asset>;
    updateAsset(id: string, input: UpdateAssetInput, actorId?: string): Promise<Asset>;
    updateAssetStatus(id: string, status: AssetStatus, actorId?: string): Promise<Asset>;
}
