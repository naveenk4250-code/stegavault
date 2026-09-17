import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { fetchGoogleUser, initiateDiscordOAuth, type OAuthUser } from '../lib/oauth';
import { AnimatedOAuthButton } from './AnimatedOAuthButton';

interface AuthModalProps {
  onClose: () => void;
  onOAuthSuccess?: (user: OAuthUser) => void;
}


// ─── Brand SVG Icons ────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true" fill="#5865F2">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}


// ─── Main Component ──────────────────────────────────────────────────────────

export function AuthModal({ onClose, onOAuthSuccess }: AuthModalProps) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);

  // ─── Google OAuth (client-side, no backend required) ─────────────────────
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setOauthLoading(true);
        setAuthError(null);
        const user = await fetchGoogleUser(tokenResponse.access_token);
        if (onOAuthSuccess) onOAuthSuccess(user);
        onClose();
      } catch {
        setAuthError('Google sign-in failed. Please try again.');
      } finally {
        setOauthLoading(false);
      }
    },
    onError: () => {
      setAuthError('Google sign-in was cancelled or failed.');
    },
  });

  const handleOAuth = (provider: 'google' | 'discord') => {
    if (provider === 'google') {
      loginWithGoogle();
    } else if (provider === 'discord') {
      initiateDiscordOAuth();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-stone-950/75 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="neo-modal my-auto max-w-sm w-full">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-950 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-[#D6D2C4]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-950 flex items-center justify-center text-stone-100 font-mono font-bold text-xs">
              SV
            </div>
            <div>
              <div className="font-mono font-black text-stone-950 text-sm uppercase tracking-wider">
                STEGA<span className="text-[#059669]">VAULT</span>
              </div>
              <div className="text-[10px] font-mono text-stone-500 tracking-widest uppercase">
                Zero-Knowledge Authentication
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-4">
          <p className="text-xs font-mono text-stone-600 uppercase tracking-wider">
            Sign in with verified OAuth provider
          </p>

          {/* Error */}
          {authError && (
            <div className="bg-rose-50 border border-rose-300 p-3 flex items-center gap-2 text-rose-700 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 pt-1">
            <AnimatedOAuthButton
              provider="google"
              onClick={() => handleOAuth('google')}
              className={`w-full text-xs font-mono font-bold uppercase tracking-wider ${oauthLoading ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <GoogleIcon />
              <span>{oauthLoading ? 'Signing in...' : 'Continue with Google'}</span>
            </AnimatedOAuthButton>

            <AnimatedOAuthButton
              provider="discord"
              onClick={() => handleOAuth('discord')}
              className="w-full text-xs font-mono font-bold uppercase tracking-wider"
            >
              <DiscordIcon />
              <span>Continue with Discord</span>
            </AnimatedOAuthButton>
          </div>

          <div className="text-[11px] font-mono text-stone-500 pt-3 text-center border-t border-[#D6D2C4]/60">
            Real identity verification via Google & Discord OAuth 2.0
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-[#D6D2C4] bg-[#EBE7DC] text-center text-[10px] text-stone-500 font-mono">
          End-to-end encrypted · Zero server plaintext · AES-256-GCM
        </div>
      </div>
    </div>,
    document.body
  );
}
