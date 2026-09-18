"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetCategoriesModule = void 0;
const common_1 = require("@nestjs/common");
const asset_categories_service_1 = require("./asset-categories.service");
const asset_categories_resolver_1 = require("./asset-categories.resolver");
let AssetCategoriesModule = class AssetCategoriesModule {
};
exports.AssetCategoriesModule = AssetCategoriesModule;
exports.AssetCategoriesModule = AssetCategoriesModule = __decorate([
    (0, common_1.Module)({
        providers: [asset_categories_service_1.AssetCategoriesService, asset_categories_resolver_1.AssetCategoriesResolver],
        exports: [asset_categories_service_1.AssetCategoriesService],
    })
], AssetCategoriesModule);
//# sourceMappingURL=asset-categories.module.js.map