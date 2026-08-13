import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getApiStatus() {
    return {
      name: 'SecureCloud Enterprise API',
      version: '2.4.0',
      status: 'ONLINE',
      timestamp: new Date().toISOString(),
      endpoints: {
        oauthGoogle: '/auth/oauth/google',
        oauthDiscord: '/auth/oauth/discord',
        oauthLinkedIn: '/auth/oauth/linkedin',
      },
    };
  }
}
