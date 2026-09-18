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
exports.AssetFilterInput = void 0;
const graphql_1 = require("@nestjs/graphql");
const class_validator_1 = require("class-validator");
const enums_1 = require("../../common/enums");
let AssetFilterInput = class AssetFilterInput {
};
exports.AssetFilterInput = AssetFilterInput;
__decorate([
    (0, graphql_1.Field)(() => String, {
        nullable: true,
        description: 'Fuzzy search across name, assetTag, manufacturer, and serialNumber',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssetFilterInput.prototype, "search", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID, { nullable: true, description: 'Filter by category ID' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AssetFilterInput.prototype, "categoryId", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID, { nullable: true, description: 'Filter by campus location ID' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AssetFilterInput.prototype, "locationId", void 0);
__decorate([
    (0, graphql_1.Field)(() => enums_1.AssetStatus, { nullable: true, description: 'Filter by operational status' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AssetFilterInput.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(() => enums_1.Criticality, { nullable: true, description: 'Filter by criticality level' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AssetFilterInput.prototype, "criticality", void 0);
exports.AssetFilterInput = AssetFilterInput = __decorate([
    (0, graphql_1.InputType)({ description: 'Filter and search criteria for querying assets' })
], AssetFilterInput);
//# sourceMappingURL=asset-filter.input.js.map