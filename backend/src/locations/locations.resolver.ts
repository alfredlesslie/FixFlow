import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { Location } from './models/location.model';
import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { Role } from '../common/enums';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/models/user.model';

@Resolver(() => Location)
export class LocationsResolver {
  constructor(private readonly locationsService: LocationsService) {}

  @Query(() => [Location], {
    name: 'locations',
    description: 'Retrieve all campus facilities, buildings, and rooms',
  })
  async getLocations(): Promise<Location[]> {
    return this.locationsService.findAll();
  }

  @Query(() => Location, {
    name: 'location',
    description: 'Retrieve details of a specific campus location by ID',
  })
  async getLocation(@Args('id', { type: () => ID }) id: string): Promise<Location> {
    return this.locationsService.findById(id);
  }

  @Mutation(() => Location, {
    description: 'Create a new campus location (Facility Manager or Admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.FACILITY_MANAGER, Role.ADMIN)
  async createLocation(
    @Args('input') input: CreateLocationInput,
    @CurrentUser() user: User,
  ): Promise<Location> {
    return this.locationsService.createLocation(input, user.id);
  }

  @Mutation(() => Location, {
    description: 'Update campus location details (Facility Manager or Admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.FACILITY_MANAGER, Role.ADMIN)
  async updateLocation(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateLocationInput,
    @CurrentUser() user: User,
  ): Promise<Location> {
    return this.locationsService.updateLocation(id, input, user.id);
  }
}
