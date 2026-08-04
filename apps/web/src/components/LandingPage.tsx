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
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Terminal,
  FileCheck
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
  const [heroStepIndex, setHeroStepIndex] = useState(0);
  const [inputPassphrase, setInputPassphrase] = useState('');

  const heroDemoSteps = [
    {
      stepNum: '01/04',
      stepLabel: '[STATUS: CLIENT_CRYPTO_ENGINE]',
      progress: 'AES-256 100%',
      waveformTitle: 'KEY DERIVATION FREQUENCY STREAM',
      waveformDetected: '256 BITS DERIVED',
      badgeText: '100% ZERO KNOWLEDGE',
      fileTypeIcon: 'AES',
      fileName: 'master_passphrase_hash.bin',
      fileSubtitle: 'PBKDF2 100,000 Iterations · 16-Byte Salt',
      field1Label: 'Target Secret Payload:',
      field1Value: 'q3_financial_audit.pdf (4.4 MB)',
      field2Label: 'Cipher Algorithm:',
      field2Value: 'AES-256-GCM + PBKDF2',
      field3Label: 'Key Salt Vector:',
      field3Value: '0x9f8a3c...e140 (Random)',
      tagText: 'GCM AUTH TAG CREATED',
      checksum: 'HASH #801SEC',
      terminalLog: 'Derived 256-bit AES key via PBKDF2 WebCrypto Worker',
      logTime: '0.2ms',
      barPattern: [90, 45, 80, 100, 60, 85, 30, 95, 70, 40, 90, 65, 80, 100, 50, 75, 95, 40, 85, 60, 90, 70, 100, 55]
    },
    {
      stepNum: '02/04',
      stepLabel: '[STATUS: ACTIVE_PIXEL_INSPECTOR]',
      progress: 'LSB 100%',
      waveformTitle: 'BITSTREAM WAVEFORM FREQUENCY',
      waveformDetected: '256 BITS EMBEDDED',
      badgeText: 'IMPERCEPTIBLE PIXELS',
      fileTypeIcon: 'PNG',
      fileName: 'quantum_nebula_cover.png',
      fileSubtitle: '1-Bit LSB Spatial Container · 4.8 MB Capacity',
      field1Label: 'Embedded Payload:',
      field1Value: 'q3_financial_audit.pdf',
      field2Label: 'Cipher Specification:',
      field2Value: 'AES-256-GCM + PBKDF2',
      field3Label: 'Pixel Color Change:',
      field3Value: 'Δ 0.00% (Imperceptible)',
      tagText: 'LSB SPATIAL EMBED COMPLETE',
      checksum: 'CHECKSUM #08F4A',
      terminalLog: 'Bit 183 embedded in Pixel (0,0) Red Channel',
      logTime: '0.4ms',
      barPattern: [40, 75, 25, 90, 60, 100, 45, 80, 30, 95, 70, 50, 85, 40, 65, 90, 55, 100, 35, 80, 60, 45, 95, 75]
    },
    {
      stepNum: '03/04',
      stepLabel: '[STATUS: AWS_S3_PRESIGNED_SYNC]',
      progress: 'SYNC 100%',
      waveformTitle: 'NETWORK TRANSFER BANDWIDTH',
      waveformDetected: 'DIRECT S3 PROTOCOL',
      badgeText: 'DIRECT S3 SYNC',
      fileTypeIcon: 'S3',
      fileName: 'vault-encrypted-blobs.s3',
      fileSubtitle: 'Direct Presigned Token · Short-Lived 15m TTL',
      field1Label: 'Target S3 Endpoint:',
      field1Value: 's3-us-east-1.amazonaws.com',
      field2Label: 'Server Memory Footprint:',
      field2Value: '0 Bytes Plaintext Stored',
      field3Label: 'Transfer Security:',
      field3Value: 'TLS 1.3 End-to-End Encrypted',
      tagText: 'PRESIGNED TOKEN VERIFIED',
      checksum: 'TOKEN #S3-801',
      terminalLog: 'Transferred ciphertext blob directly to S3 container',
      logTime: '12.4ms',
      barPattern: [60, 85, 100, 70, 95, 50, 80, 40, 90, 100, 65, 85, 45, 75, 95, 60, 85, 100, 70, 50, 90, 80, 60, 95]
    },
    {
      stepNum: '04/04',
      stepLabel: '[STATUS: GCM_AUTH_DECRYPTED]',
      progress: 'DECRYPT 100%',
      waveformTitle: 'AUTHENTICATION VERIFICATION',
      waveformDetected: 'TAG MATCH VERIFIED',
      badgeText: '100% AUTHENTICATED',
      fileTypeIcon: 'OUT',
      fileName: 'q3_financial_audit_decrypted.pdf',
      fileSubtitle: 'Authentic Plaintext Payload · Reconstructed',
      field1Label: 'Decrypted Checksum:',
      field1Value: '0xe3b0c44298fc1c149afb...',
      field2Label: 'Authentication Tag:',
      field2Value: '16-Byte GCM Tag Valid',
      field3Label: 'Integrity Verification:',
      field3Value: '100% Match (0 Bit Errors)',
      tagText: 'PLAINTEXT RECONSTRUCTED',
      checksum: 'VERIFIED #OK',
      terminalLog: 'Extracted key from PNG LSB & verified GCM auth tag',
      logTime: '0.8ms',
      barPattern: [100, 90, 85, 95, 100, 90, 85, 95, 100, 90, 85, 95, 100, 90, 85, 95, 100, 90, 85, 95, 100, 90, 85, 95]
    }
  ];

  const currentHeroStep = heroDemoSteps[heroStepIndex];

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

    setShowLoginModal(false);
    onLoginSuccess(loginEmail);
  };

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleOpenAuth();
  };

  const autofillDemoCreds = () => {
    setLoginEmail('alex.mercer@enterprise.io');
    setLoginPassword('MasterKey#2026!');
    setAuthError(null);
  };

  return (
    <div className="min-h-screen bg-[#F0EDE4] text-stone-900 font-sans selection:bg-[#059669]/20 selection:text-[#059669]">
      
      {/* TOP TAGLINE BAR WITH DASHES */}
      <div className="border-b border-[#D6D2C4] py-2 px-4 sm:px-8 text-center bg-[#EBE7DC]">
        <div className="max-w-[1600px] mx-auto flex items-center justify-center gap-3 text-[11px] font-mono tracking-[0.2em] text-stone-500 uppercase">
          <span className="h-px w-12 bg-[#059669]"></span>
          <span>ZERO-KNOWLEDGE CRYPTOGRAPHIC STEGANOGRAPHY PLATFORM</span>
          <span className="h-px w-12 bg-[#059669]"></span>
        </div>
      </div>

      {/* TOP NAVIGATION BAR */}
      <header className="border-b border-[#D6D2C4] bg-[#F0EDE4]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between border-l border-r border-[#D6D2C4]">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-stone-950 flex items-center justify-center text-stone-100 font-mono font-bold text-xs">
              SC
            </div>
            <span className="font-mono text-lg font-black tracking-tight text-stone-950 uppercase">
              SECURE<span className="text-[#059669]">CLOUD</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-10 text-xs font-mono tracking-wider text-stone-600 uppercase">
            <a href="#overview" className="hover:text-stone-950 transition-colors">Overview</a>
            <a href="#interactive-demo" className="hover:text-stone-950 transition-colors">Pixel Inspector</a>
            <a href="#architecture" className="hover:text-stone-950 transition-colors">Architecture</a>
            <a href="#security-spec" className="hover:text-stone-950 transition-colors">Security Spec</a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleOpenAuth}
              className="text-xs font-mono tracking-wider text-stone-700 hover:text-stone-950 uppercase px-2 py-1"
            >
              Sign In
            </button>
            <button
              onClick={handleOpenAuth}
              className="bg-[#059669] hover:bg-[#047857] text-white font-mono text-xs uppercase font-bold tracking-widest px-5 py-2.5 rounded-none transition-colors flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Launch Demo Vault</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION WITH VERTICAL GUIDE BORDERS */}
      <section id="overview" className="max-w-[1600px] mx-auto border-l border-r border-[#D6D2C4] px-4 sm:px-8 lg:px-12 pt-12 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* HERO LEFT COLUMN: TEXT CONTENT + INPUT + CTA */}
          <div className="lg:col-span-7 space-y-7">
            
            {/* Metadata Tag */}
            <div className="inline-block">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-stone-500 font-semibold bg-[#E7E3D7] px-3 py-1 border border-[#D6D2C4]">
                REPURPOSE ANY SECRET PAYLOAD OR FILE
              </span>
            </div>

            {/* Headline with Italic Serif Accent */}
            <h1 className="text-4xl sm:text-6xl lg:text-6xl font-black text-stone-950 tracking-tight leading-[1.08]">
              Hide your confidential data in <span className="font-serif-italic font-normal text-stone-900 underline decoration-[#059669] decoration-2 underline-offset-8">plain sight</span> inside pixels.
            </h1>

            {/* Accent Line Divider */}
            <div className="h-px w-24 bg-[#059669]" />

            {/* Descriptive Body Paragraph */}
            <p className="text-stone-700 text-base sm:text-lg leading-relaxed max-w-xl">
              SecureCloud encrypts payloads client-side with <strong className="font-semibold text-stone-950">AES-256-GCM</strong>, then embeds 256-bit keys <em className="font-serif-italic text-stone-900 font-medium">bit-by-bit</em> into cover PNG images. Cloud servers hold <em className="font-serif-italic text-stone-900 font-medium">zero</em> plaintext data.
            </p>

            {/* Feature Bullet Strip (Uppercase Monospace separated by dots) */}
            <div className="font-mono text-xs tracking-wider text-stone-500 uppercase flex flex-wrap items-center gap-2 pt-1 border-t border-b border-[#D6D2C4] py-3">
              <span>AES-256-GCM</span>
              <span className="text-[#059669] font-bold">·</span>
              <span>1-BIT LSB</span>
              <span className="text-[#059669] font-bold">·</span>
              <span>ZERO-KNOWLEDGE</span>
              <span className="text-[#059669] font-bold">·</span>
              <span>WEBCRYPTO</span>
              <span className="text-[#059669] font-bold">·</span>
              <span>AUDIT LOGS</span>
            </div>

            {/* Input Field + Button Combo */}
            <form onSubmit={handleHeroSubmit} className="pt-2">
              <div className="flex flex-col sm:flex-row items-stretch gap-0 max-w-xl border-2 border-stone-950 p-1 bg-white shadow-none">
                <input
                  type="text"
                  placeholder="Enter secret passphrase to test..."
                  value={inputPassphrase}
                  onChange={(e) => setInputPassphrase(e.target.value)}
                  className="flex-1 bg-transparent px-4 py-3 text-sm text-stone-950 font-mono focus:outline-none placeholder:text-stone-400 border-none"
                />
                <button
                  type="submit"
                  className="bg-[#059669] hover:bg-[#047857] text-white font-mono text-xs uppercase font-bold tracking-widest px-6 py-3.5 flex items-center justify-center gap-2 transition-colors shrink-0"
                >
                  <span>LAUNCH LIVE DEMO</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Disclaimer Text */}
              <p className="font-mono text-[11px] text-stone-500 mt-2.5 flex items-center gap-2">
                <span>NO REGISTRATION REQUIRED</span>
                <span className="text-[#059669]">·</span>
                <span>100% CLIENT-SIDE CRYPTO</span>
                <span className="text-[#059669]">·</span>
                <span>ZERO SERVER LOGS</span>
              </p>
            </form>

          </div>

          {/* HERO RIGHT COLUMN: DARK LIVE DEMO MOCKUP PANEL */}
          <div className="lg:col-span-5">
            <div className="bg-stone-950 text-stone-100 rounded-2xl border border-stone-800 p-6 sm:p-7 relative shadow-2xl space-y-6">
              
              {/* Terminal UI Top Status Bar */}
              <div className="flex items-center justify-between font-mono text-xs border-b border-stone-800 pb-4">
                <div className="flex items-center gap-2 text-[#059669] font-bold tracking-wider uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                  <span>{currentHeroStep.stepLabel}</span>
                </div>
                <div className="text-stone-400">
                  STEP {currentHeroStep.stepNum} · <span className="text-stone-200">{currentHeroStep.progress}</span>
                </div>
              </div>

              {/* Waveform / Bit Stream Bar Visualization */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px] text-stone-400">
                  <span>{currentHeroStep.waveformTitle}</span>
                  <span className="text-[#059669] font-bold">{currentHeroStep.waveformDetected}</span>
                </div>
                
                {/* Thin Accent-Colored Waveform Bars */}
                <div className="h-12 bg-stone-900 border border-stone-800 px-3 py-2 flex items-end gap-1.5 justify-between">
                  {currentHeroStep.barPattern.map((height, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-none transition-all duration-300 ${
                        i % 3 === 0 ? 'bg-[#059669]' : i % 2 === 0 ? 'bg-stone-400' : 'bg-stone-700'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Nested White/Light Card Showing Sample Output Content */}
              <div className="bg-stone-100 text-stone-950 p-4 rounded-xl border border-stone-300 relative shadow-sm space-y-3">
                
                {/* Small Rotated Stamp Badge */}
                <div className="absolute -top-3 right-3 bg-[#059669] text-white font-mono text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 -rotate-3 shadow-md">
                  {currentHeroStep.badgeText}
                </div>

                <div className="flex items-center gap-3 border-b border-stone-200 pb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                    {currentHeroStep.fileTypeIcon}
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold text-stone-950 uppercase">{currentHeroStep.fileName}</h4>
                    <span className="text-[10px] text-stone-500 font-mono">{currentHeroStep.fileSubtitle}</span>
                  </div>
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">{currentHeroStep.field1Label}</span>
                    <span className="font-bold text-stone-900">{currentHeroStep.field1Value}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">{currentHeroStep.field2Label}</span>
                    <span className="text-[#059669] font-bold">{currentHeroStep.field2Value}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">{currentHeroStep.field3Label}</span>
                    <span className="text-stone-900 font-bold">{currentHeroStep.field3Value}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px] font-mono text-stone-600">
                  <span className="flex items-center gap-1.5 text-[#059669] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {currentHeroStep.tagText}
                  </span>
                  <span className="text-stone-400">{currentHeroStep.checksum}</span>
                </div>
              </div>

              {/* Terminal Logs Footer inside Card */}
              <div className="bg-stone-900 p-3 rounded-lg border border-stone-800 font-mono text-[11px] text-stone-400 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <Terminal className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                  <span className="truncate">{currentHeroStep.terminalLog}</span>
                </div>
                <span className="text-stone-500 shrink-0 ml-2">{currentHeroStep.logTime}</span>
              </div>

              {/* Interactive Step Slide Dots & Controls */}
              <div className="flex items-center justify-between pt-1 font-mono text-xs text-stone-400">
                <button
                  type="button"
                  disabled={heroStepIndex === 0}
                  onClick={() => setHeroStepIndex((prev) => prev - 1)}
                  className={`px-2 py-1 bg-stone-900 border border-stone-800 text-[10px] uppercase font-bold transition-all ${
                    heroStepIndex === 0
                      ? 'opacity-30 cursor-not-allowed text-stone-600'
                      : 'hover:text-stone-200 text-stone-400'
                  }`}
                >
                  ‹ PREV STEP
                </button>

                {/* Dot Pagination Indicators */}
                <div className="flex items-center justify-center gap-2">
                  {heroDemoSteps.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setHeroStepIndex(idx)}
                      className={`transition-all ${
                        heroStepIndex === idx
                          ? 'w-3 h-3 rounded-full bg-[#059669] ring-2 ring-[#059669]/40'
                          : 'w-2.5 h-2.5 rounded-full bg-stone-700 hover:bg-stone-500'
                      }`}
                      title={`Step ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  disabled={heroStepIndex === heroDemoSteps.length - 1}
                  onClick={() => setHeroStepIndex((prev) => prev + 1)}
                  className={`px-2 py-1 bg-stone-900 border border-stone-800 text-[10px] uppercase font-bold transition-all ${
                    heroStepIndex === heroDemoSteps.length - 1
                      ? 'opacity-30 cursor-not-allowed text-stone-600'
                      : 'hover:text-[#059669] text-[#059669]'
                  }`}
                >
                  NEXT STEP ›
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* FEATURE METRICS & STATS STRIP */}
      <section className="border-t border-b border-[#D6D2C4] bg-[#EBE7DC] py-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 border-l border-r border-[#D6D2C4]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="border-r border-[#D6D2C4] last:border-none pr-4">
              <span className="font-mono text-3xl font-black text-stone-950 block">256-BIT</span>
              <span className="text-xs text-stone-600 font-mono uppercase mt-1 block">AES-GCM Authenticated Cipher</span>
            </div>
            <div className="border-r border-[#D6D2C4] last:border-none pr-4">
              <span className="font-mono text-3xl font-black text-[#059669] block">1-BIT LSB</span>
              <span className="text-xs text-stone-600 font-mono uppercase mt-1 block">Spatial Pixel Hiding</span>
            </div>
            <div className="border-r border-[#D6D2C4] last:border-none pr-4">
              <span className="font-mono text-3xl font-black text-stone-950 block">0 BYTES</span>
              <span className="text-xs text-stone-600 font-mono uppercase mt-1 block">Plaintext Stored On Cloud</span>
            </div>
            <div>
              <span className="font-mono text-3xl font-black text-[#059669] block">100%</span>
              <span className="text-xs text-stone-600 font-mono uppercase mt-1 block">GCM Tag Integrity Check</span>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEMO 1: LSB PIXEL STEGANOGRAPHY VISUALIZER */}
      <section id="interactive-demo" className="max-w-[1600px] mx-auto border-l border-r border-[#D6D2C4] px-4 sm:px-8 lg:px-12 py-20">
        <div className="border border-[#D6D2C4] bg-white p-8 sm:p-10 space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D6D2C4]">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono text-[#059669] font-bold uppercase tracking-widest mb-1">
                <Layers className="w-4 h-4" />
                <span>INTERACTIVE DEMO #01</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight">LSB Spatial Steganography Pixel Inspector</h2>
              <p className="text-xs text-stone-600 font-mono mt-1">See how secret key bits are hidden inside PNG pixel color channels without changing visual appearance.</p>
            </div>

            <button
              onClick={() => setStegoBitIndex((prev) => prev + 1)}
              className="bg-stone-950 hover:bg-stone-800 text-stone-100 px-5 py-3 text-xs font-mono uppercase tracking-widest font-bold flex items-center gap-2 self-start md:self-auto transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-[#059669]" />
              <span>Step Next Pixel Bit (Bit #{stegoBitIndex + 1})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Live Interactive Pixel Bit Comparison Card */}
            <div className="bg-stone-950 text-stone-100 p-6 rounded-none border border-stone-800 space-y-6">
              <div className="flex items-center justify-between font-mono text-xs text-stone-400 border-b border-stone-800 pb-3">
                <span>INSPECTING: <strong className="text-[#059669]">{currentBitInfo.pos}</strong></span>
                <span>TARGET CHANNEL: <strong className="text-stone-200">{currentBitInfo.channel}</strong></span>
              </div>

              {/* Bit Change Display */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-stone-900 p-4 border border-stone-800 text-center space-y-2">
                  <span className="text-[11px] text-stone-500 font-mono uppercase block">Original Color</span>
                  <div className="w-12 h-12 border border-stone-700 mx-auto" style={{ backgroundColor: 'rgb(182, 94, 40)' }} />
                  <div className="font-mono text-xs text-stone-300">{currentBitInfo.rgbOriginal}</div>
                  <div className="text-[10px] font-mono text-stone-500">LSB BIT: <strong className="text-stone-200">{currentBitInfo.originalBit}</strong></div>
                </div>

                <div className="bg-stone-900 p-4 border border-[#059669]/40 text-center space-y-2">
                  <span className="text-[11px] text-[#059669] font-mono uppercase font-bold block">Stego-Embedded</span>
                  <div className="w-12 h-12 border border-[#059669] mx-auto" style={{ backgroundColor: 'rgb(183, 94, 40)' }} />
                  <div className="font-mono text-xs text-[#059669] font-bold">{currentBitInfo.rgbStego}</div>
                  <div className="text-[10px] font-mono text-[#059669]">LSB BIT: <strong className="text-[#059669]">{currentBitInfo.stegoBit}</strong></div>
                </div>
              </div>

              <div className="p-3 bg-stone-900 border border-stone-800 font-mono text-xs text-stone-400 flex items-center justify-between">
                <span>Human Perception Delta:</span>
                <span className="text-[#059669] font-bold">0.0000% (Imperceptible)</span>
              </div>
            </div>

            {/* Interactive Passphrase Bit Distribution Simulator */}
            <div className="space-y-4">
              <label className="block text-xs font-mono text-stone-950 font-bold uppercase tracking-wider">
                Test Secret Key Passphrase Conversion:
              </label>
              <input
                type="text"
                value={demoSecretText}
                onChange={(e) => setDemoSecretText(e.target.value)}
                className="w-full bg-stone-100 border border-stone-300 px-4 py-3 text-xs text-stone-950 font-mono focus:outline-none focus:border-[#059669]"
              />

              <div className="bg-stone-950 text-stone-100 p-4 border border-stone-800 space-y-2 font-mono text-xs">
                <span className="text-stone-400 block text-[11px] uppercase">Converted 256-Bit Binary Stream:</span>
                <div className="p-3 bg-stone-900 text-[#059669] break-all text-[10px] leading-relaxed font-bold border border-stone-800">
                  {demoSecretText.split('').map((char) => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')}
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                Every character in your key is converted into 8 binary bits. These bits replace the lowest-bit values in pixel RGB channels sequentially across the cover PNG image.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* INTERACTIVE DEMO 2: 4-STEP ZERO-KNOWLEDGE ARCHITECTURE STEPPER */}
      <section id="architecture" className="max-w-[1600px] mx-auto border-l border-r border-[#D6D2C4] px-4 sm:px-8 lg:px-12 py-16">
        <div className="text-center mb-12 space-y-2">
          <span className="text-xs font-mono text-[#059669] font-bold uppercase tracking-widest">ARCHITECTURE WORKFLOW</span>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-950 tracking-tight">How SecureCloud Protects Your Data</h2>
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
                className={`p-6 cursor-pointer transition-all border ${
                  activeStepTab === idx ? 'bg-stone-950 text-white border-stone-950 shadow-lg' : 'bg-white text-stone-900 border-[#D6D2C4] hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`font-mono text-3xl font-black ${activeStepTab === idx ? 'text-stone-700' : 'text-stone-300'}`}>{item.step}</span>
                  <div className={`w-9 h-9 flex items-center justify-center ${activeStepTab === idx ? 'bg-stone-900 border border-stone-800' : 'bg-stone-100 border border-stone-300'}`}>
                    <Icon className={`w-4 h-4 ${activeStepTab === idx ? 'text-[#059669]' : 'text-stone-800'}`} />
                  </div>
                </div>
                <h3 className="font-bold text-sm mb-2 uppercase font-mono">{item.title}</h3>
                <p className={`text-xs leading-relaxed ${activeStepTab === idx ? 'text-stone-300' : 'text-stone-600'}`}>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECURITY SPEC ACCORDION */}
      <section id="security-spec" className="max-w-[1600px] mx-auto border-l border-r border-[#D6D2C4] px-4 sm:px-8 lg:px-12 py-16">
        <div className="border border-[#D6D2C4] bg-white p-8 sm:p-10 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#D6D2C4] pb-4">
            <Shield className="w-6 h-6 text-[#059669]" />
            <h2 className="text-xl font-bold text-stone-950 uppercase font-mono tracking-tight">Enterprise Cryptographic Specifications</h2>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="bg-stone-950 text-stone-100 p-5 border border-stone-800 space-y-1">
              <div className="text-[#059669] font-bold uppercase">1. AES-256-GCM Cipher Stream</div>
              <p className="text-stone-400 font-sans leading-relaxed">Symmetric authenticated encryption with 12-byte random Initialization Vector (IV) and 16-byte GCM Authentication Tag for tamper detection.</p>
            </div>

            <div className="bg-stone-950 text-stone-100 p-5 border border-stone-800 space-y-1">
              <div className="text-stone-200 font-bold uppercase">2. 1-Bit LSB Spatial Image Steganography</div>
              <p className="text-stone-400 font-sans leading-relaxed">Replaces only the lowest bit of RGB channels. Provides ~384 KB secret payload embedding capacity per 1080p cover PNG image.</p>
            </div>

            <div className="bg-stone-950 text-stone-100 p-5 border border-stone-800 space-y-1">
              <div className="text-[#059669] font-bold uppercase">3. Presigned Cloud Storage Token Model</div>
              <p className="text-stone-400 font-sans leading-relaxed">Clients fetch 15-minute presigned upload/download URLs directly from AWS S3, bypassing server memory entirely.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BOTTOM BAR */}
      <section className="max-w-[1600px] mx-auto border-l border-r border-[#D6D2C4] px-4 sm:px-8 lg:px-12 py-16 text-center">
        <div className="bg-stone-950 text-stone-100 p-10 sm:p-14 border border-stone-800 space-y-5">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Ready to Protect Your Confidential Files?</h2>
          <p className="text-xs text-stone-400 max-w-xl mx-auto font-mono">
            Experience zero-knowledge client-side encryption and spatial LSB steganography live in action.
          </p>
          <button
            onClick={handleOpenAuth}
            className="inline-flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white font-mono text-xs uppercase font-bold tracking-widest px-8 py-4 transition-colors"
          >
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>LAUNCH LIVE WORKSPACE NOW</span>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#D6D2C4] py-8 bg-[#EBE7DC]">
        <div className="max-w-[1600px] mx-auto border-l border-r border-[#D6D2C4] px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-stone-600">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#059669]" />
            <span>SECURECLOUD ENTERPRISE v2.4 PLATFORM</span>
          </div>
          <div>AES-256-GCM · LSB STEGANOGRAPHY · ZERO-KNOWLEDGE CORE</div>
        </div>
      </footer>

      {/* STRICT MANDATORY AUTHENTICATION MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-8 border-2 border-stone-950 relative space-y-6 shadow-2xl">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 text-stone-500 hover:text-stone-950 font-mono text-xs font-bold uppercase"
            >
              [ ✕ CLOSE ]
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-stone-950 text-white flex items-center justify-center mx-auto mb-3 font-mono font-bold text-sm">
                SC
              </div>
              <h3 className="font-mono font-black text-stone-950 text-xl uppercase tracking-tight">Authentication Required</h3>
              <p className="text-xs text-stone-600 font-mono">Enter Master Passphrase & Work Email</p>
            </div>

            {authError && (
              <div className="bg-rose-50 border border-rose-400 p-3 flex items-center gap-2 text-rose-700 text-xs font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-stone-800 uppercase mb-1">Work Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="user@enterprise.io"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-stone-100 border border-stone-300 px-4 py-2.5 text-xs text-stone-950 font-mono focus:outline-none focus:border-[#059669]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-stone-800 uppercase mb-1">Master Key Passphrase</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter master passphrase..."
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-stone-100 border border-stone-300 px-4 py-2.5 text-xs text-stone-950 font-mono focus:outline-none focus:border-[#059669]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-950"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono pt-1">
                <span>Min passphrase length: 6</span>
                <button
                  type="button"
                  onClick={autofillDemoCreds}
                  className="text-[#059669] font-bold hover:underline"
                >
                  Use Demo Creds
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#059669] hover:bg-[#047857] text-white font-mono text-xs uppercase font-bold tracking-widest flex items-center justify-center gap-2 transition-colors"
              >
                <Lock className="w-4 h-4 stroke-[2.5]" />
                <span>AUTHENTICATE & ACCESS WORKSPACE</span>
              </button>
            </form>

            <div className="pt-4 border-t border-stone-200 text-center text-[10px] text-stone-500 font-mono">
              Session is encrypted locally with PBKDF2 key derivation.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
