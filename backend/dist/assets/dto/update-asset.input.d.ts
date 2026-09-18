import { AssetStatus, Criticality } from '../../common/enums';
export declare class UpdateAssetInput {
    name?: string;
    categoryId?: string;
    locationId?: string;
    status?: AssetStatus;
    criticality?: Criticality;
    conditionRating?: number;
    description?: string;
    serialNumber?: string;
    manufacturer?: string;
    model?: string;
    installationDate?: Date;
    warrantyExpiry?: Date;
}
