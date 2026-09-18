import { Module } from '@nestjs/common';
import { AssetCategoriesService } from './asset-categories.service';
import { AssetCategoriesResolver } from './asset-categories.resolver';

@Module({
  providers: [AssetCategoriesService, AssetCategoriesResolver],
  exports: [AssetCategoriesService],
})
export class AssetCategoriesModule {}
