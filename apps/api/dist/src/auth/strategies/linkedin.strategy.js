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
exports.LinkedInStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_linkedin_oauth2_1 = require("passport-linkedin-oauth2");
let LinkedInStrategy = class LinkedInStrategy extends (0, passport_1.PassportStrategy)(passport_linkedin_oauth2_1.Strategy, 'linkedin') {
    config;
    constructor(config) {
        super({
            clientID: config.get('LINKEDIN_CLIENT_ID') || 'dummy-linkedin-client-id',
            clientSecret: config.get('LINKEDIN_CLIENT_SECRET') || 'dummy-linkedin-client-secret',
            callbackURL: config.get('LINKEDIN_CALLBACK_URL') || 'http://localhost:3000/auth/oauth/linkedin/callback',
            scope: ['openid', 'profile', 'email'],
        });
        this.config = config;
    }
    async validate(accessToken, refreshToken, profile, done) {
        const user = {
            email: profile.emails?.[0]?.value ?? '',
            name: profile.displayName ?? `${profile.name?.givenName} ${profile.name?.familyName}`,
            avatar: profile.photos?.[0]?.value ?? null,
            provider: 'linkedin',
            accessToken,
        };
        done(null, user);
    }
};
exports.LinkedInStrategy = LinkedInStrategy;
exports.LinkedInStrategy = LinkedInStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LinkedInStrategy);
//# sourceMappingURL=linkedin.strategy.js.map