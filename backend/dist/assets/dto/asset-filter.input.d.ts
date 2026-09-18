import { AssetStatus, Criticality } from '../../common/enums';
export declare class AssetFilterInput {
    search?: string;
    categoryId?: string;
    locationId?: string;
    status?: AssetStatus;
    criticality?: Criticality;
}
