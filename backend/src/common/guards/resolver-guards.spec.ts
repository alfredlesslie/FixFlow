import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlAuthGuard } from './gql-auth.guard';
import { AssetsResolver } from '../../assets/assets.resolver';
import { LocationsResolver } from '../../locations/locations.resolver';
import { AssetCategoriesResolver } from '../../asset-categories/asset-categories.resolver';

describe('Resolver Authentication Guards', () => {
  it('should have GqlAuthGuard applied to AssetsResolver queries', () => {
    const getAssetsGuards = Reflect.getMetadata('__guards__', AssetsResolver.prototype.getAssets);
    const getAssetGuards = Reflect.getMetadata('__guards__', AssetsResolver.prototype.getAsset);
    const getAssetByTagGuards = Reflect.getMetadata('__guards__', AssetsResolver.prototype.getAssetByTag);

    expect(getAssetsGuards).toBeDefined();
    expect(getAssetsGuards[0]).toBe(GqlAuthGuard);

    expect(getAssetGuards).toBeDefined();
    expect(getAssetGuards[0]).toBe(GqlAuthGuard);

    expect(getAssetByTagGuards).toBeDefined();
    expect(getAssetByTagGuards[0]).toBe(GqlAuthGuard);
  });

  it('should have GqlAuthGuard applied to LocationsResolver queries', () => {
    const getLocationsGuards = Reflect.getMetadata('__guards__', LocationsResolver.prototype.getLocations);
    const getLocationGuards = Reflect.getMetadata('__guards__', LocationsResolver.prototype.getLocation);

    expect(getLocationsGuards).toBeDefined();
    expect(getLocationsGuards[0]).toBe(GqlAuthGuard);

    expect(getLocationGuards).toBeDefined();
    expect(getLocationGuards[0]).toBe(GqlAuthGuard);
  });

  it('should have GqlAuthGuard applied to AssetCategoriesResolver queries', () => {
    const getCategoriesGuards = Reflect.getMetadata('__guards__', AssetCategoriesResolver.prototype.getCategories);
    const getCategoryGuards = Reflect.getMetadata('__guards__', AssetCategoriesResolver.prototype.getCategory);

    expect(getCategoriesGuards).toBeDefined();
    expect(getCategoriesGuards[0]).toBe(GqlAuthGuard);

    expect(getCategoryGuards).toBeDefined();
    expect(getCategoryGuards[0]).toBe(GqlAuthGuard);
  });

  it('GqlAuthGuard should throw UnauthorizedException when request context is missing', () => {
    const guard = new GqlAuthGuard();
    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      getArgs: () => [{}, {}, {}, {}], // no req in context
      getType: () => 'graphql',
    } as unknown as ExecutionContext;

    expect(() => guard.getRequest(mockContext)).toThrow(UnauthorizedException);
  });
});
