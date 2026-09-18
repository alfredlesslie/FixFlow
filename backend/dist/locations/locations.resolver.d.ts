import { LocationsService } from './locations.service';
import { Location } from './models/location.model';
import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { User } from '../users/models/user.model';
export declare class LocationsResolver {
    private readonly locationsService;
    constructor(locationsService: LocationsService);
    getLocations(): Promise<Location[]>;
    getLocation(id: string): Promise<Location>;
    createLocation(input: CreateLocationInput, user: User): Promise<Location>;
    updateLocation(id: string, input: UpdateLocationInput, user: User): Promise<Location>;
}
