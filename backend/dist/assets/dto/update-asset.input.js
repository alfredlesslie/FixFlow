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
exports.UpdateAssetInput = void 0;
const graphql_1 = require("@nestjs/graphql");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const enums_1 = require("../../common/enums");
let UpdateAssetInput = class UpdateAssetInput {
};
exports.UpdateAssetInput = UpdateAssetInput;
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAssetInput.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAssetInput.prototype, "categoryId", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAssetInput.prototype, "locationId", void 0);
__decorate([
    (0, graphql_1.Field)(() => enums_1.AssetStatus, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.AssetStatus, { message: 'Invalid asset status' }),
    __metadata("design:type", String)
], UpdateAssetInput.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(() => enums_1.Criticality, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.Criticality, { message: 'Invalid criticality level' }),
    __metadata("design:type", String)
], UpdateAssetInput.prototype, "criticality", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Condition rating must be an integer' }),
    (0, class_validator_1.Min)(1, { message: 'Condition rating must be between 1 and 5' }),
    (0, class_validator_1.Max)(5, { message: 'Condition rating must be between 1 and 5' }),
    __metadata("design:type", Number)
], UpdateAssetInput.prototype, "conditionRating", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAssetInput.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAssetInput.prototype, "serialNumber", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAssetInput.prototype, "manufacturer", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAssetInput.prototype, "model", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)({ message: 'Invalid installation date format' }),
    __metadata("design:type", Date)
], UpdateAssetInput.prototype, "installationDate", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)({ message: 'Invalid warranty expiry date format' }),
    __metadata("design:type", Date)
], UpdateAssetInput.prototype, "warrantyExpiry", void 0);
exports.UpdateAssetInput = UpdateAssetInput = __decorate([
    (0, graphql_1.InputType)({ description: 'Payload for updating an existing campus asset' })
], UpdateAssetInput);
//# sourceMappingURL=update-asset.input.js.map