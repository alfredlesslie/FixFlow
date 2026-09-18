import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsResolver } from './assets.resolver';
import { LocationsModule } from '../locations/locations.module';
import { AssetCategoriesModule } from '../asset-categories/asset-categories.module';

@Module({
  imports: [LocationsModule, AssetCategoriesModule],
  providers: [AssetsService, AssetsResolver],
  exports: [AssetsService],
})
export class AssetsModule {}
