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
exports.CreateAssetCategoryInput = void 0;
const graphql_1 = require("@nestjs/graphql");
const class_validator_1 = require("class-validator");
let CreateAssetCategoryInput = class CreateAssetCategoryInput {
};
exports.CreateAssetCategoryInput = CreateAssetCategoryInput;
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Unique category identifier code, e.g. HVAC' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Category code is required' }),
    (0, class_validator_1.Matches)(/^[A-Z0-9_]+$/, {
        message: 'Category code must contain only uppercase letters, numbers, and underscores',
    }),
    __metadata("design:type", String)
], CreateAssetCategoryInput.prototype, "code", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Descriptive category name' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Category name is required' }),
    __metadata("design:type", String)
], CreateAssetCategoryInput.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAssetCategoryInput.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, {
        nullable: true,
        defaultValue: 90,
        description: 'Default preventive maintenance cycle in days',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Maintenance interval must be an integer' }),
    (0, class_validator_1.Min)(1, { message: 'Maintenance interval must be at least 1 day' }),
    __metadata("design:type", Number)
], CreateAssetCategoryInput.prototype, "defaultMaintenanceIntervalDays", void 0);
exports.CreateAssetCategoryInput = CreateAssetCategoryInput = __decorate([
    (0, graphql_1.InputType)({ description: 'Payload for creating a new asset classification category' })
], CreateAssetCategoryInput);
//# sourceMappingURL=create-asset-category.input.js.map