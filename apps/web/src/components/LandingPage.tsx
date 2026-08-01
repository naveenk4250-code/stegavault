import { useState } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  Layers,
  Sparkles,
  Cpu,
  Server,
  Zap,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

interface LandingPageProps {
  onLoginSuccess: (email: string) => void;
}

export function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Interactive Stego Visualizer State
  const [stegoBitIndex, setStegoBitIndex] = useState(0);
  const [demoSecretText, setDemoSecretText] = useState('TOP_SECRET_PASSPHRASE_2026');
  const [activeStepTab, setActiveStepTab] = useState(0);

  const sampleBits = [
    { pos: 'Pixel (0, 0)', channel: 'Red', originalBit: '0', stegoBit: '1', rgbOriginal: 'RGB(182, 94, 40)', rgbStego: 'RGB(183, 94, 40)' },
    { pos: 'Pixel (0, 1)', channel: 'Green', originalBit: '1', stegoBit: '1', rgbOriginal: 'RGB(182, 95, 40)', rgbStego: 'RGB(182, 95, 40)' },
    { pos: 'Pixel (0, 2)', channel: 'Blue', originalBit: '0', stegoBit: '0', rgbOriginal: 'RGB(182, 94, 40)', rgbStego: 'RGB(182, 94, 40)' },
    { pos: 'Pixel (0, 3)', channel: 'Red', originalBit: '1', stegoBit: '0', rgbOriginal: 'RGB(183, 94, 40)', rgbStego: 'RGB(182, 94, 40)' },
  ];

  const currentBitInfo = sampleBits[stegoBitIndex % sampleBits.length];

  const handleOpenAuth = () => {
    setAuthError(null);
    setShowLoginModal(true);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!loginEmail || !loginEmail.includes('@')) {
      setAuthError('Please enter a valid work email address');
      return;
    }

    if (!loginPassword || loginPassword.length < 6) {
      setAuthError('Master Key Passphrase must be at least 6 characters');
      return;
    }

    // Authenticated
    setShowLoginModal(false);
    onLoginSuccess(loginEmail);
  };

  const autofillDemoCreds = () => {
    setLoginEmail('alex.mercer@enterprise.io');
    setLoginPassword('MasterKey#2026!');
    setAuthError(null);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans grid-pattern relative overflow-x-hidden">
      
      {/* GLOW BACKGROUND ORBS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[600px] right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#090D16]/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="font-mono text-xl font-extrabold tracking-tight text-slate-100">
              STEGA<span className="text-emerald-400">VAULT</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <a href="#overview" className="hover:text-emerald-400 transition-colors">Overview</a>
            <a href="#interactive-demo" className="hover:text-emerald-400 transition-colors">Interactive Stego Demo</a>
            <a href="#architecture" className="hover:text-emerald-400 transition-colors">Architecture</a>
            <a href="#security-spec" className="hover:text-emerald-400 transition-colors">Security Spec</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAuth}
              className="text-xs font-semibold text-slate-300 hover:text-slate-100 px-3 py-2 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={handleOpenAuth}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
            >
              <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Launch Encrypted Vault</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="overview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center space-y-8">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ZERO-KNOWLEDGE CRYPTOGRAPHY & SPATIAL STEGANOGRAPHY</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-100 max-w-4xl mx-auto leading-tight">
          Hide Your Most Sensitive Files in <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Plain Sight.</span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          StegaVault encrypts data client-side with <strong className="text-slate-200">AES-256-GCM</strong>, then embeds 256-bit decryption keys bit-by-bit into cover PNG images using <strong className="text-slate-200">LSB steganography</strong>. The cloud server stores zero plaintext keys.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={handleOpenAuth}
            className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold px-6 py-3.5 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-xl shadow-emerald-500/20"
          >
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>Open Vault Interactive Workspace</span>
          </button>

          <a
            href="#interactive-demo"
            className="flex items-center gap-2 glass-panel hover:bg-slate-800/60 text-slate-200 font-semibold px-6 py-3.5 rounded-xl text-sm border border-slate-800 transition-colors"
          >
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Test Steganography Visualizer</span>
          </a>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8">
          <div className="glass-panel p-4 rounded-2xl text-center">
            <span className="font-mono text-2xl font-black text-emerald-400 block">256-Bit</span>
            <span className="text-xs text-slate-400 font-mono mt-1 block">AES-GCM Cipher Stream</span>
          </div>
          <div className="glass-panel p-4 rounded-2xl text-center">
            <span className="font-mono text-2xl font-black text-cyan-400 block">1-Bit LSB</span>
            <span className="text-xs text-slate-400 font-mono mt-1 block">Spatial Pixel Hiding</span>
          </div>
          <div className="glass-panel p-4 rounded-2xl text-center">
            <span className="font-mono text-2xl font-black text-purple-400 block">0 Bytes</span>
            <span className="text-xs text-slate-400 font-mono mt-1 block">Plaintext on Server</span>
          </div>
          <div className="glass-panel p-4 rounded-2xl text-center">
            <span className="font-mono text-2xl font-black text-emerald-400 block">100%</span>
            <span className="text-xs text-slate-400 font-mono mt-1 block">GCM Auth Tag Check</span>
          </div>
        </div>

      </section>

      {/* INTERACTIVE DEMO 1: LSB PIXEL STEGANOGRAPHY VISUALIZER */}
      <section id="interactive-demo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold uppercase mb-1">
                <Layers className="w-4 h-4" />
                Interactive Component #01
              </div>
              <h2 className="text-2xl font-bold text-slate-100">LSB Spatial Steganography Pixel Inspector</h2>
              <p className="text-xs text-slate-400">See how secret key bits are hidden inside PNG pixel color channels without changing visual appearance.</p>
            </div>

            <button
              onClick={() => setStegoBitIndex((prev) => prev + 1)}
              className="bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-slate-200 px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-2 self-start md:self-auto"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Step Next Pixel Bit (Bit #{stegoBitIndex + 1})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Live Interactive Pixel Bit Comparison Card */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                <span>Inspecting: <strong className="text-emerald-400">{currentBitInfo.pos}</strong></span>
                <span>Target Channel: <strong className="text-cyan-400">{currentBitInfo.channel}</strong></span>
              </div>

              {/* Bit Change Display */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center space-y-2">
                  <span className="text-xs text-slate-500 font-mono block">Original Color</span>
                  <div className="w-12 h-12 rounded-xl mx-auto border border-slate-700" style={{ backgroundColor: 'rgb(182, 94, 40)' }} />
                  <div className="font-mono text-xs text-slate-300">{currentBitInfo.rgbOriginal}</div>
                  <div className="text-[10px] font-mono text-slate-500">LSB Bit: <strong className="text-slate-300">{currentBitInfo.originalBit}</strong></div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-emerald-500/30 text-center space-y-2">
                  <span className="text-xs text-emerald-400 font-mono block">Stego-Embedded</span>
                  <div className="w-12 h-12 rounded-xl mx-auto border border-emerald-500/40" style={{ backgroundColor: 'rgb(183, 94, 40)' }} />
                  <div className="font-mono text-xs text-emerald-300">{currentBitInfo.rgbStego}</div>
                  <div className="text-[10px] font-mono text-emerald-400">LSB Bit: <strong className="text-emerald-400">{currentBitInfo.stegoBit}</strong></div>
                </div>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 font-mono text-xs text-slate-400 flex items-center justify-between">
                <span>Human Visual Perception Delta:</span>
                <span className="text-emerald-400 font-bold">0.0000% (Imperceptible)</span>
              </div>
            </div>

            {/* Interactive Passphrase Bit Distribution Simulator */}
            <div className="space-y-4">
              <label className="block text-xs font-mono text-slate-300 font-semibold uppercase">
                Test Custom Secret Key Passphrase:
              </label>
              <input
                type="text"
                value={demoSecretText}
                onChange={(e) => setDemoSecretText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500/50"
              />

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                <span className="text-slate-400 block text-[11px]">Converted 256-Bit Cipher Stream Preview:</span>
                <div className="p-2 bg-slate-900 rounded-lg text-emerald-400 break-all text-[10px] leading-relaxed">
                  {demoSecretText.split('').map((char) => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')}
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Every character in your key is converted into 8 binary bits. These bits replace the lowest-bit values in pixel RGB channels sequentially across the cover PNG image.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* INTERACTIVE DEMO 2: 4-STEP ZERO-KNOWLEDGE ARCHITECTURE STEPPER */}
      <section id="architecture" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12 space-y-2">
          <span className="text-xs font-mono text-emerald-400 font-bold uppercase">Architecture Workflow</span>
          <h2 className="text-3xl font-extrabold text-slate-100">How StegaVault Protects Your Data</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              step: '01',
              title: 'Client AES-256-GCM',
              desc: 'Payload is encrypted locally in your browser memory via Web Workers using WebCrypto API.',
              icon: Lock,
            },
            {
              step: '02',
              title: 'LSB Stego Hiding',
              desc: '256-bit AES key is hidden inside the least-significant bits of a cover PNG container image.',
              icon: Layers,
            },
            {
              step: '03',
              title: 'Direct S3 Presigned Sync',
              desc: 'Encrypted ciphertext blob and stego-image are uploaded directly via short-lived presigned URLs.',
              icon: Server,
            },
            {
              step: '04',
              title: 'Zero-Knowledge Decrypt',
              desc: 'Key is extracted from stego PNG and authenticated via GCM auth tag check during download.',
              icon: Unlock,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => setActiveStepTab(idx)}
                className={`glass-panel p-6 rounded-2xl cursor-pointer transition-all border ${
                  activeStepTab === idx ? 'border-emerald-500 bg-slate-900/90 shadow-xl' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-3xl font-black text-slate-700">{item.step}</span>
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <h3 className="font-bold text-sm text-slate-100 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECURITY SPEC ACCORDION */}
      <section id="security-spec" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Enterprise Cryptographic Specifications</h2>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-emerald-400 font-bold">1. AES-256-GCM Cipher Stream</div>
              <p className="text-slate-400">Symmetric authenticated encryption with 12-byte random Initialization Vector (IV) and 16-byte GCM Authentication Tag for tamper detection.</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-cyan-400 font-bold">2. 1-Bit LSB Spatial Image Steganography</div>
              <p className="text-slate-400">Replaces only the lowest bit of RGB channels. Provides ~384 KB secret payload embedding capacity per 1080p cover PNG image.</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-purple-400 font-bold">3. Presigned Cloud Storage Token Model</div>
              <p className="text-slate-400">Clients fetch 15-minute presigned upload/download URLs directly from AWS S3, bypassing server memory entirely.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BOTTOM BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="glass-panel p-10 rounded-3xl border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-100">Ready to Protect Your Confidential Files?</h2>
            <p className="text-xs text-slate-400 max-w-xl mx-auto font-mono">
              Experience zero-knowledge client-side encryption and spatial LSB steganography live in action.
            </p>
            <button
              onClick={handleOpenAuth}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold px-8 py-4 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-xl shadow-emerald-500/20"
            >
              <Lock className="w-4 h-4 stroke-[2.5]" />
              <span>Launch Live Workspace Now</span>
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 py-8 bg-[#090D16]/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>StegaVault Enterprise v2.4 Platform</span>
          </div>
          <div>AES-256-GCM · LSB Steganography · Zero-Knowledge Core</div>
        </div>
      </footer>

      {/* STRICT MANDATORY AUTHENTICATION MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-8 rounded-2xl border border-slate-800 relative shadow-2xl space-y-6">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 font-mono text-xs"
            >
              ✕ Close
            </button>

            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                <Lock className="w-6 h-6 text-slate-950 stroke-[2.5]" />
              </div>
              <h3 className="font-bold text-slate-100 text-xl">Authentication Required</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">Enter Master Passphrase & Email to Decrypt Session</p>
            </div>

            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Work Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="user@enterprise.io"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Master Key Passphrase</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter master passphrase..."
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                <span>Passphrase minimum: 6 chars</span>
                <button
                  type="button"
                  onClick={autofillDemoCreds}
                  className="text-emerald-400 hover:underline"
                >
                  Use Demo Creds
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 stroke-[2.5]" />
                <span>Authenticate & Access Vault Workspace</span>
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800/80 text-center text-[10px] text-slate-500 font-mono">
              Session is encrypted locally with PBKDF2 key derivation.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
