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
exports.DiscordStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_discord_1 = require("passport-discord");
let DiscordStrategy = class DiscordStrategy extends (0, passport_1.PassportStrategy)(passport_discord_1.Strategy, 'discord') {
    config;
    constructor(config) {
        super({
            clientID: config.get('DISCORD_CLIENT_ID') || 'dummy-discord-client-id',
            clientSecret: config.get('DISCORD_CLIENT_SECRET') || 'dummy-discord-client-secret',
            callbackURL: config.get('DISCORD_CALLBACK_URL') || 'http://localhost:3000/auth/oauth/discord/callback',
            scope: ['identify', 'email'],
        });
        this.config = config;
    }
    async validate(accessToken, refreshToken, profile, done) {
        const user = {
            email: profile.email ?? '',
            name: profile.username ?? 'Discord User',
            avatar: profile.avatar
                ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                : null,
            provider: 'discord',
            accessToken,
        };
        done(null, user);
    }
};
exports.DiscordStrategy = DiscordStrategy;
exports.DiscordStrategy = DiscordStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DiscordStrategy);
//# sourceMappingURL=discord.strategy.js.map