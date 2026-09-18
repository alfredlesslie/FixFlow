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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Asset = void 0;
const graphql_1 = require("@nestjs/graphql");
const enums_1 = require("../../common/enums");
const asset_category_model_1 = require("../../asset-categories/models/asset-category.model");
const location_model_1 = require("../../locations/models/location.model");
let Asset = class Asset {
};
exports.Asset = Asset;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], Asset.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Unique institutional asset tag, e.g. AST-AC-ENG-101' }),
    __metadata("design:type", String)
], Asset.prototype, "assetTag", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Descriptive asset name' }),
    __metadata("design:type", String)
], Asset.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true, description: 'Asset specifications and operational notes' }),
    __metadata("design:type", String)
], Asset.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], Asset.prototype, "categoryId", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], Asset.prototype, "locationId", void 0);
__decorate([
    (0, graphql_1.Field)(() => enums_1.AssetStatus, { description: 'Operational status: OPERATIONAL, UNDER_MAINTENANCE, OUT_OF_SERVICE, RETIRED' }),
    __metadata("design:type", String)
], Asset.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(() => enums_1.Criticality, { description: 'Institutional criticality: LOW, MEDIUM, HIGH, CRITICAL' }),
    __metadata("design:type", String)
], Asset.prototype, "criticality", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { description: 'Condition assessment rating from 1 (Critical/Failing) to 5 (Excellent)' }),
    __metadata("design:type", Number)
], Asset.prototype, "conditionRating", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "serialNumber", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "manufacturer", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "model", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { nullable: true }),
    __metadata("design:type", Date)
], Asset.prototype, "installationDate", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { nullable: true }),
    __metadata("design:type", Date)
], Asset.prototype, "warrantyExpiry", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Stable unique public/internal QR code target URI' }),
    __metadata("design:type", String)
], Asset.prototype, "qrIdentifier", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date),
    __metadata("design:type", Date)
], Asset.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date),
    __metadata("design:type", Date)
], Asset.prototype, "updatedAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => asset_category_model_1.AssetCategory, { description: 'Classified equipment category' }),
    __metadata("design:type", asset_category_model_1.AssetCategory)
], Asset.prototype, "category", void 0);
__decorate([
    (0, graphql_1.Field)(() => location_model_1.Location, { description: 'Physical campus housing location' }),
    __metadata("design:type", location_model_1.Location)
], Asset.prototype, "location", void 0);
exports.Asset = Asset = __decorate([
    (0, graphql_1.ObjectType)({ description: 'Institutional campus asset specification and operational lifecycle' })
], Asset);
//# sourceMappingURL=asset.model.js.map