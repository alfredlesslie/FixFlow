import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsResolver } from './requests.resolver';
import { LocationsModule } from '../locations/locations.module';
import { AssetsModule } from '../assets/assets.module';

@Module({
  imports: [LocationsModule, AssetsModule],
  providers: [RequestsService, RequestsResolver],
  exports: [RequestsService],
})
export class RequestsModule {}
