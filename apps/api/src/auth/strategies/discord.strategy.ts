import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(private readonly config: ConfigService) {
    super({
      clientID: config.get<string>('DISCORD_CLIENT_ID') || 'dummy-discord-client-id',
      clientSecret: config.get<string>('DISCORD_CLIENT_SECRET') || 'dummy-discord-client-secret',
      callbackURL: config.get<string>('DISCORD_CALLBACK_URL') || 'http://localhost:3000/auth/oauth/discord/callback',
      scope: ['identify', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
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
}
