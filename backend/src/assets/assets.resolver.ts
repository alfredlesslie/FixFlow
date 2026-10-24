import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { Asset } from './models/asset.model';
import { AssetFilterInput } from './dto/asset-filter.input';
import { CreateAssetInput } from './dto/create-asset.input';
import { UpdateAssetInput } from './dto/update-asset.input';
import { Role, AssetStatus } from '../common/enums';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/models/user.model';

@Resolver(() => Asset)
export class AssetsResolver {
  constructor(private readonly assetsService: AssetsService) {}

  @Query(() => [Asset], {
    name: 'assets',
    description: 'Retrieve campus assets with multi-criteria filtering and text search',
  })
  @UseGuards(GqlAuthGuard)
  async getAssets(
    @Args('filter', { type: () => AssetFilterInput, nullable: true })
    filter?: AssetFilterInput,
  ): Promise<Asset[]> {
    return this.assetsService.findAll(filter);
  }

  @Query(() => Asset, {
    name: 'asset',
    description: 'Retrieve complete asset details by unique ID',
  })
  @UseGuards(GqlAuthGuard)
  async getAsset(@Args('id', { type: () => ID }) id: string): Promise<Asset> {
    return this.assetsService.findById(id);
  }

  @Query(() => Asset, {
    name: 'assetByTag',
    description: 'Lookup an asset by its institutional asset tag (supports QR destination)',
  })
  @UseGuards(GqlAuthGuard)
  async getAssetByTag(
    @Args('assetTag', { type: () => String }) assetTag: string,
  ): Promise<Asset> {
    return this.assetsService.findByTag(assetTag);
  }

  @Mutation(() => Asset, {
    description: 'Register a new institutional asset (Facility Manager or Admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.FACILITY_MANAGER, Role.ADMIN)
  async createAsset(
    @Args('input') input: CreateAssetInput,
    @CurrentUser() user: User,
  ): Promise<Asset> {
    return this.assetsService.createAsset(input, user.id);
  }

  @Mutation(() => Asset, {
    description: 'Update asset specifications or location (Facility Manager or Admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.FACILITY_MANAGER, Role.ADMIN)
  async updateAsset(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateAssetInput,
    @CurrentUser() user: User,
  ): Promise<Asset> {
    return this.assetsService.updateAsset(id, input, user.id);
  }

  @Mutation(() => Asset, {
    description: 'Update the operational lifecycle status of an asset',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.FACILITY_MANAGER, Role.TECHNICIAN, Role.ADMIN)
  async updateAssetStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('status', { type: () => AssetStatus }) status: AssetStatus,
    @CurrentUser() user: User,
  ): Promise<Asset> {
    return this.assetsService.updateAssetStatus(id, status, user.id);
  }
}
