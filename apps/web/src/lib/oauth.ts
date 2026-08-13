// ─── OAuth Provider Config ─────────────────────────────────────────────────

export type OAuthProvider = 'google' | 'discord' | 'linkedin';

export interface OAuthUser {
  email: string;
  name: string;
  avatar: string | null;
  provider: OAuthProvider | string;
}

// ─── Google Client-side OAuth ──────────────────────────────────────────────

/**
 * Called by @react-oauth/google after a successful login.
 * Fetches user profile from Google's userinfo endpoint with the access token.
 */
export async function fetchGoogleUser(accessToken: string): Promise<OAuthUser> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error('Failed to fetch Google user info');

  const data = await res.json();

  return {
    email: data.email ?? '',
    name: data.name ?? data.email ?? '',
    avatar: data.picture ?? null,
    provider: 'google',
  };
}

// ─── Discord Client-side OAuth (Implicit Grant Flow) ───────────────────────

const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID as string;

// Must match exactly what is registered in Discord Developer Portal
const DISCORD_REDIRECT_URI = `${window.location.origin}/auth/callback`;

/**
 * Redirects the browser to Discord's OAuth2 authorization page.
 * Uses the implicit grant (response_type=token) — no backend required.
 * Discord will redirect back to /auth/callback#access_token=...
 */
export function initiateDiscordOAuth(): void {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'token',
    scope: 'identify email',
  });
  window.location.href = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

/**
 * Parses the Discord access token from the URL hash fragment.
 * Called on /auth/callback after Discord redirects back.
 * Returns null if no Discord token is present in the fragment.
 */
export function parseDiscordFragment(): string | null {
  const hash = window.location.hash.substring(1); // remove leading '#'
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  return params.get('access_token');
}

/**
 * Fetches Discord user profile using the access token from the implicit grant.
 */
export async function fetchDiscordUser(accessToken: string): Promise<OAuthUser> {
  const res = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error('Failed to fetch Discord user info');

  const data = await res.json();

  const avatar = data.avatar
    ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
    : null;

  return {
    email: data.email ?? '',
    name: data.global_name ?? data.username ?? '',
    avatar,
    provider: 'discord',
  };
}

// ─── Callback Parser (legacy – kept for future backend flows) ──────────────

/**
 * Parses user info from the query string on /auth/callback
 * Used when a backend redirects to: /auth/callback?email=x&name=x&avatar=x&provider=x
 */
export function parseOAuthCallback(): OAuthUser | null {
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email');
  const name = params.get('name');
  const provider = params.get('provider');

  if (!email || !provider) return null;

  return {
    email,
    name: name ?? email,
    avatar: params.get('avatar') || null,
    provider,
  };
}
