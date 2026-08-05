import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

function buildRedirect(user: any): string {
  const params = new URLSearchParams({
    email: user.email ?? '',
    name: user.name ?? '',
    avatar: user.avatar ?? '',
    provider: user.provider ?? '',
  });
  return `${FRONTEND_URL}/auth/callback?${params.toString()}`;
}

@Controller('auth/oauth')
export class AuthController {
  // ─── Google ───────────────────────────────────────────────────────────────
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport redirects to Google automatically
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: any, @Res() res: Response) {
    res.redirect(buildRedirect(req.user));
  }

  // ─── Discord ──────────────────────────────────────────────────────────────
  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  discordLogin() {
    // Passport redirects to Discord automatically
  }

  @Get('discord/callback')
  @UseGuards(AuthGuard('discord'))
  discordCallback(@Req() req: any, @Res() res: Response) {
    res.redirect(buildRedirect(req.user));
  }

  // ─── LinkedIn ─────────────────────────────────────────────────────────────
  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  linkedinLogin() {
    // Passport redirects to LinkedIn automatically
  }

  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  linkedinCallback(@Req() req: any, @Res() res: Response) {
    res.redirect(buildRedirect(req.user));
  }
}
