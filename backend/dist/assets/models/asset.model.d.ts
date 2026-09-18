import { AssetStatus, Criticality } from '../../common/enums';
import { AssetCategory } from '../../asset-categories/models/asset-category.model';
import { Location } from '../../locations/models/location.model';
export declare class Asset {
    id: string;
    assetTag: string;
    name: string;
    description?: string | null;
    categoryId: string;
    locationId: string;
    status: AssetStatus;
    criticality: Criticality;
    conditionRating: number;
    serialNumber?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    installationDate?: Date | null;
    warrantyExpiry?: Date | null;
    qrIdentifier: string;
    createdAt: Date;
    updatedAt: Date;
    category: AssetCategory;
    location: Location;
}
