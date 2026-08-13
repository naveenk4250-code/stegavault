import { useEffect, useState } from 'react';
import { parseOAuthCallback, parseDiscordFragment, fetchDiscordUser, type OAuthUser } from '../lib/oauth';
import { Shield } from 'lucide-react';

interface AuthCallbackProps {
  onLoginSuccess: (user: OAuthUser) => void;
}

/**
 * Rendered at /auth/callback after any OAuth redirect.
 *
 * Handles two cases:
 *  1. Discord implicit flow  → token in URL hash (#access_token=...)
 *  2. Legacy backend redirect → user info in query params (?email=...&provider=...)
 */
export function AuthCallback({ onLoginSuccess }: AuthCallbackProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [user, setUser] = useState<OAuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      // ── Case 1: Discord implicit grant (token in URL fragment) ──────────
      const discordToken = parseDiscordFragment();
      if (discordToken) {
        try {
          const u = await fetchDiscordUser(discordToken);
          if (cancelled) return;
          setUser(u);
          setStatus('success');
          // Clear the hash so the token isn't visible in the URL
          window.history.replaceState(null, '', window.location.pathname);
          setTimeout(() => onLoginSuccess(u), 800);
        } catch {
          if (!cancelled) setStatus('error');
          setTimeout(() => window.location.replace('/'), 2000);
        }
        return;
      }

      // ── Case 2: Legacy backend redirect (query params) ──────────────────
      const u = parseOAuthCallback();
      if (u) {
        setUser(u);
        setStatus('success');
        setTimeout(() => onLoginSuccess(u), 800);
        return;
      }

      // ── Neither matched ─────────────────────────────────────────────────
      setStatus('error');
      setTimeout(() => window.location.replace('/'), 2000);
    }

    handleCallback();
    return () => { cancelled = true; };
  }, [onLoginSuccess]);

  return (
    <div className="min-h-screen bg-[#F0EDE4] flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        {/* Animated Logo */}
        <div className="w-14 h-14 bg-stone-950 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6 text-[#059669] animate-pulse" />
        </div>

        {status === 'loading' && (
          <>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-stone-500 font-bold">
              Authenticating...
            </p>
            <div className="w-48 h-0.5 bg-[#D6D2C4] mx-auto overflow-hidden">
              <div className="h-full bg-[#059669] animate-[loading_1.5s_ease-in-out_infinite]" />
            </div>
          </>
        )}

        {status === 'success' && user && (
          <>
            <div className="space-y-2">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#059669] font-bold">
                Authentication Successful
              </p>
              <h1 className="text-xl font-black text-stone-950 tracking-tight">
                Welcome, {user.name.split(' ')[0]}
              </h1>
              <p className="text-xs font-mono text-stone-500">{user.email}</p>
            </div>

            {/* Loading bar */}
            <div className="w-48 h-0.5 bg-[#D6D2C4] mx-auto overflow-hidden">
              <div className="h-full bg-[#059669] animate-[loading_0.8s_ease-in-out_forwards]" />
            </div>

            <p className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">
              Loading your secure vault...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-rose-500 font-bold">
              Authentication Failed
            </p>
            <p className="text-xs font-mono text-stone-500">
              Could not complete sign-in. Redirecting...
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes loading {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
