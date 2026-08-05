import { useEffect } from 'react';
import { parseOAuthCallback, type OAuthUser } from '../lib/oauth';
import { Shield } from 'lucide-react';

interface AuthCallbackProps {
  onLoginSuccess: (user: OAuthUser) => void;
}

/**
 * Rendered at /auth/callback after the backend OAuth redirect.
 * Parses user info from URL query params and calls onLoginSuccess.
 */
export function AuthCallback({ onLoginSuccess }: AuthCallbackProps) {
  useEffect(() => {
    const user = parseOAuthCallback();

    if (user) {
      // Small delay so the user sees the "authenticated" screen
      const timer = setTimeout(() => {
        onLoginSuccess(user);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      // No valid params — redirect home after a moment
      const timer = setTimeout(() => {
        window.location.replace('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [onLoginSuccess]);

  const user = parseOAuthCallback();

  return (
    <div className="min-h-screen bg-[#F0EDE4] flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        {/* Animated Logo */}
        <div className="w-14 h-14 bg-stone-950 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6 text-[#059669] animate-pulse" />
        </div>

        {user ? (
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
        ) : (
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
