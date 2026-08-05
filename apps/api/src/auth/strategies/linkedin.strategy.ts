import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';

// LinkedIn uses passport-linkedin-oauth2 which we install separately
// Strategy name: 'linkedin'
@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor() {
    super({
      clientID: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL!,
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
