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
