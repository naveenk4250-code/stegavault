// ─── OAuth Provider Config ─────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export type OAuthProvider = 'google' | 'discord' | 'linkedin';

/** Redirects the browser to the backend OAuth initiation URL for the given provider */
export function initiateOAuth(provider: OAuthProvider): void {
  const url = `${API_BASE}/auth/oauth/${provider}`;
  window.location.href = url;
}

// ─── Callback Parser ───────────────────────────────────────────────────────

export interface OAuthUser {
  email: string;
  name: string;
  avatar: string | null;
  provider: OAuthProvider | string;
}

/**
 * Parses user info from the query string on /auth/callback
 * The backend redirects to: /auth/callback?email=x&name=x&avatar=x&provider=x
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
