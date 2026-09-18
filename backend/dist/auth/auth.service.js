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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const users_service_1 = require("../users/users.service");
const audit_service_1 = require("../audit/audit.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, auditService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }
    async validateUser(email, pass) {
        const rawUser = await this.usersService.findByEmail(email.toLowerCase().trim());
        if (!rawUser) {
            throw new common_1.UnauthorizedException('Invalid email or password credentials');
        }
        if (!rawUser.isActive) {
            throw new common_1.UnauthorizedException('User account is deactivated. Contact campus administrator');
        }
        const isMatch = await bcrypt.compare(pass, rawUser.passwordHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Invalid email or password credentials');
        }
        const user = await this.usersService.findById(rawUser.id);
        return user;
    }
    async login(input) {
        const user = await this.validateUser(input.email, input.password);
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const accessToken = this.jwtService.sign(payload);
        await this.auditService.logAction(user.id, 'USER_LOGIN', 'USER', user.id, {
            email: user.email,
            role: user.role,
        });
        return {
            accessToken,
            user,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map