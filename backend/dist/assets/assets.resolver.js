"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const assets_service_1 = require("./assets.service");
const asset_model_1 = require("./models/asset.model");
const asset_filter_input_1 = require("./dto/asset-filter.input");
const create_asset_input_1 = require("./dto/create-asset.input");
const update_asset_input_1 = require("./dto/update-asset.input");
const enums_1 = require("../common/enums");
const gql_auth_guard_1 = require("../common/guards/gql-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const user_model_1 = require("../users/models/user.model");
let AssetsResolver = class AssetsResolver {
    constructor(assetsService) {
        this.assetsService = assetsService;
    }
    async getAssets(filter) {
        return this.assetsService.findAll(filter);
    }
    async getAsset(id) {
        return this.assetsService.findById(id);
    }
    async getAssetByTag(assetTag) {
        return this.assetsService.findByTag(assetTag);
    }
    async createAsset(input, user) {
        return this.assetsService.createAsset(input, user.id);
    }
    async updateAsset(id, input, user) {
        return this.assetsService.updateAsset(id, input, user.id);
    }
    async updateAssetStatus(id, status, user) {
        return this.assetsService.updateAssetStatus(id, status, user.id);
    }
};
exports.AssetsResolver = AssetsResolver;
__decorate([
    (0, graphql_1.Query)(() => [asset_model_1.Asset], {
        name: 'assets',
        description: 'Retrieve campus assets with multi-criteria filtering and text search',
    }),
    __param(0, (0, graphql_1.Args)('filter', { type: () => asset_filter_input_1.AssetFilterInput, nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [asset_filter_input_1.AssetFilterInput]),
    __metadata("design:returntype", Promise)
], AssetsResolver.prototype, "getAssets", null);
__decorate([
    (0, graphql_1.Query)(() => asset_model_1.Asset, {
        name: 'asset',
        description: 'Retrieve complete asset details by unique ID',
    }),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsResolver.prototype, "getAsset", null);
__decorate([
    (0, graphql_1.Query)(() => asset_model_1.Asset, {
        name: 'assetByTag',
        description: 'Lookup an asset by its institutional asset tag (supports QR destination)',
    }),
    __param(0, (0, graphql_1.Args)('assetTag', { type: () => String })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsResolver.prototype, "getAssetByTag", null);
__decorate([
    (0, graphql_1.Mutation)(() => asset_model_1.Asset, {
        description: 'Register a new institutional asset (Facility Manager or Admin only)',
    }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.FACILITY_MANAGER, enums_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_asset_input_1.CreateAssetInput,
        user_model_1.User]),
    __metadata("design:returntype", Promise)
], AssetsResolver.prototype, "createAsset", null);
__decorate([
    (0, graphql_1.Mutation)(() => asset_model_1.Asset, {
        description: 'Update asset specifications or location (Facility Manager or Admin only)',
    }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.FACILITY_MANAGER, enums_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __param(1, (0, graphql_1.Args)('input')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_asset_input_1.UpdateAssetInput,
        user_model_1.User]),
    __metadata("design:returntype", Promise)
], AssetsResolver.prototype, "updateAsset", null);
__decorate([
    (0, graphql_1.Mutation)(() => asset_model_1.Asset, {
        description: 'Update the operational lifecycle status of an asset',
    }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.FACILITY_MANAGER, enums_1.Role.TECHNICIAN, enums_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __param(1, (0, graphql_1.Args)('status', { type: () => enums_1.AssetStatus })),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, user_model_1.User]),
    __metadata("design:returntype", Promise)
], AssetsResolver.prototype, "updateAssetStatus", null);
exports.AssetsResolver = AssetsResolver = __decorate([
    (0, graphql_1.Resolver)(() => asset_model_1.Asset),
    __metadata("design:paramtypes", [assets_service_1.AssetsService])
], AssetsResolver);
//# sourceMappingURL=assets.resolver.js.map