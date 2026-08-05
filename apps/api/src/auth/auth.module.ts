import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { DiscordStrategy } from './strategies/discord.strategy';
import { LinkedInStrategy } from './strategies/linkedin.strategy';

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [GoogleStrategy, DiscordStrategy, LinkedInStrategy],
})
export class AuthModule {}
