import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AssetCategoriesService } from './asset-categories.service';
import { AssetCategory } from './models/asset-category.model';
import { CreateAssetCategoryInput } from './dto/create-asset-category.input';
import { UpdateAssetCategoryInput } from './dto/update-asset-category.input';
import { Role } from '../common/enums';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/models/user.model';

@Resolver(() => AssetCategory)
export class AssetCategoriesResolver {
  constructor(private readonly categoriesService: AssetCategoriesService) {}

  @Query(() => [AssetCategory], {
    name: 'assetCategories',
    description: 'Retrieve all asset classification categories',
  })
  async getCategories(): Promise<AssetCategory[]> {
    return this.categoriesService.findAll();
  }

  @Query(() => AssetCategory, {
    name: 'assetCategory',
    description: 'Retrieve details of a single category by ID',
  })
  async getCategory(@Args('id', { type: () => ID }) id: string): Promise<AssetCategory> {
    return this.categoriesService.findById(id);
  }

  @Mutation(() => AssetCategory, {
    description: 'Create a new asset category (Facility Manager or Admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.FACILITY_MANAGER, Role.ADMIN)
  async createAssetCategory(
    @Args('input') input: CreateAssetCategoryInput,
    @CurrentUser() user: User,
  ): Promise<AssetCategory> {
    return this.categoriesService.createCategory(input, user.id);
  }

  @Mutation(() => AssetCategory, {
    description: 'Update category details (Facility Manager or Admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.FACILITY_MANAGER, Role.ADMIN)
  async updateAssetCategory(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateAssetCategoryInput,
    @CurrentUser() user: User,
  ): Promise<AssetCategory> {
    return this.categoriesService.updateCategory(id, input, user.id);
  }
}
