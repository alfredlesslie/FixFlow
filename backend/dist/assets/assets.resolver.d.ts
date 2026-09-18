import { AssetsService } from './assets.service';
import { Asset } from './models/asset.model';
import { AssetFilterInput } from './dto/asset-filter.input';
import { CreateAssetInput } from './dto/create-asset.input';
import { UpdateAssetInput } from './dto/update-asset.input';
import { AssetStatus } from '../common/enums';
import { User } from '../users/models/user.model';
export declare class AssetsResolver {
    private readonly assetsService;
    constructor(assetsService: AssetsService);
    getAssets(filter?: AssetFilterInput): Promise<Asset[]>;
    getAsset(id: string): Promise<Asset>;
    getAssetByTag(assetTag: string): Promise<Asset>;
    createAsset(input: CreateAssetInput, user: User): Promise<Asset>;
    updateAsset(id: string, input: UpdateAssetInput, user: User): Promise<Asset>;
    updateAssetStatus(id: string, status: AssetStatus, user: User): Promise<Asset>;
}
