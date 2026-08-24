import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor(private readonly config: ConfigService) {
    super({
      clientID: config.get<string>('LINKEDIN_CLIENT_ID') || 'dummy-linkedin-client-id',
      clientSecret: config.get<string>('LINKEDIN_CLIENT_SECRET') || 'dummy-linkedin-client-secret',
      callbackURL: config.get<string>('LINKEDIN_CALLBACK_URL') || 'http://localhost:3000/auth/oauth/linkedin/callback',
      scope: ['openid', 'profile', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    const user = {
      email: profile.emails?.[0]?.value ?? '',
      name: profile.displayName ?? `${profile.name?.givenName} ${profile.name?.familyName}`,
      avatar: profile.photos?.[0]?.value ?? null,
      provider: 'linkedin',
      accessToken,
    };
    done(null, user);
  }
}
