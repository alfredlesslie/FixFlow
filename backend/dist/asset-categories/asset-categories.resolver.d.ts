import { AssetCategoriesService } from './asset-categories.service';
import { AssetCategory } from './models/asset-category.model';
import { CreateAssetCategoryInput } from './dto/create-asset-category.input';
import { UpdateAssetCategoryInput } from './dto/update-asset-category.input';
import { User } from '../users/models/user.model';
export declare class AssetCategoriesResolver {
    private readonly categoriesService;
    constructor(categoriesService: AssetCategoriesService);
    getCategories(): Promise<AssetCategory[]>;
    getCategory(id: string): Promise<AssetCategory>;
    createAssetCategory(input: CreateAssetCategoryInput, user: User): Promise<AssetCategory>;
    updateAssetCategory(id: string, input: UpdateAssetCategoryInput, user: User): Promise<AssetCategory>;
}
