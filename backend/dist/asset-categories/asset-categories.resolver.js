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
exports.AssetCategoriesResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const asset_categories_service_1 = require("./asset-categories.service");
const asset_category_model_1 = require("./models/asset-category.model");
const create_asset_category_input_1 = require("./dto/create-asset-category.input");
const update_asset_category_input_1 = require("./dto/update-asset-category.input");
const enums_1 = require("../common/enums");
const gql_auth_guard_1 = require("../common/guards/gql-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const user_model_1 = require("../users/models/user.model");
let AssetCategoriesResolver = class AssetCategoriesResolver {
    constructor(categoriesService) {
        this.categoriesService = categoriesService;
    }
    async getCategories() {
        return this.categoriesService.findAll();
    }
    async getCategory(id) {
        return this.categoriesService.findById(id);
    }
    async createAssetCategory(input, user) {
        return this.categoriesService.createCategory(input, user.id);
    }
    async updateAssetCategory(id, input, user) {
        return this.categoriesService.updateCategory(id, input, user.id);
    }
};
exports.AssetCategoriesResolver = AssetCategoriesResolver;
__decorate([
    (0, graphql_1.Query)(() => [asset_category_model_1.AssetCategory], {
        name: 'assetCategories',
        description: 'Retrieve all asset classification categories',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AssetCategoriesResolver.prototype, "getCategories", null);
__decorate([
    (0, graphql_1.Query)(() => asset_category_model_1.AssetCategory, {
        name: 'assetCategory',
        description: 'Retrieve details of a single category by ID',
    }),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetCategoriesResolver.prototype, "getCategory", null);
__decorate([
    (0, graphql_1.Mutation)(() => asset_category_model_1.AssetCategory, {
        description: 'Create a new asset category (Facility Manager or Admin only)',
    }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.FACILITY_MANAGER, enums_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_asset_category_input_1.CreateAssetCategoryInput,
        user_model_1.User]),
    __metadata("design:returntype", Promise)
], AssetCategoriesResolver.prototype, "createAssetCategory", null);
__decorate([
    (0, graphql_1.Mutation)(() => asset_category_model_1.AssetCategory, {
        description: 'Update category details (Facility Manager or Admin only)',
    }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.FACILITY_MANAGER, enums_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __param(1, (0, graphql_1.Args)('input')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_asset_category_input_1.UpdateAssetCategoryInput,
        user_model_1.User]),
    __metadata("design:returntype", Promise)
], AssetCategoriesResolver.prototype, "updateAssetCategory", null);
exports.AssetCategoriesResolver = AssetCategoriesResolver = __decorate([
    (0, graphql_1.Resolver)(() => asset_category_model_1.AssetCategory),
    __metadata("design:paramtypes", [asset_categories_service_1.AssetCategoriesService])
], AssetCategoriesResolver);
//# sourceMappingURL=asset-categories.resolver.js.map