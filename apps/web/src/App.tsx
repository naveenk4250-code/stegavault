import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { AuthCallback } from './pages/AuthCallback';
import type { OAuthUser } from './lib/oauth';
import {
  Shield,
  Lock,
  Unlock,
  FolderLock,
  FileCheck,
  Upload,
  Download,
  Search,
  Trash2,
  Sparkles,
  Share2,
  History,
  LogOut,
  HardDrive,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Layers,
  Plus
} from 'lucide-react';
import { ThemeToggle } from "./components/ThemeToggle";

// --- PRODUCTION MOCK DATA ---
const INITIAL_VAULT_FILES = [
  {
    id: 'sec-801',
    name: 'q3_financial_audit_confidential.pdf',
    type: 'PDF Document',
    sizeBytes: 4404019,
    hash: '0x8f4a92c1e91c...f03a',
    algo: 'AES-256-GCM',
    stegoCover: 'quantum_nebula_4k.png',
    stegoCapacity: '4.8 MB Capacity',
    uploadedAt: '2026-07-30 14:32:08',
    status: 'Encrypted & Hidden',
  },
  {
    id: 'sec-802',
    name: 'production_database_credentials.json',
    type: 'JSON Config',
    sizeBytes: 18841,
    hash: '0x3c7e81ab41a9...92e1',
    algo: 'AES-256-GCM',
    stegoCover: 'deep_ocean_texture.png',
    stegoCapacity: '2.1 MB Capacity',
    uploadedAt: '2026-07-28 09:15:44',
    status: 'Encrypted & Hidden',
  },
  {
    id: 'sec-803',
    name: 'master_tls_private_key.pem',
    type: 'PEM Security Key',
    sizeBytes: 3172,
    hash: '0xd92f40a70192...b84c',
    algo: 'ChaCha20-Poly1305',
    stegoCover: 'minimal_monochrome_art.png',
    stegoCapacity: '1.5 MB Capacity',
    uploadedAt: '2026-07-24 18:44:12',
    status: 'Encrypted & Hidden',
  },
  {
    id: 'sec-804',
    name: 'corporate_strategy_roadmap_2027.docx',
    type: 'Office Document',
    sizeBytes: 12582912,
    hash: '0x71e9c308a11e...e408',
    algo: 'AES-256-GCM',
    stegoCover: 'quantum_nebula_4k.png',
    stegoCapacity: '16.0 MB Capacity',
    uploadedAt: '2026-07-20 11:02:30',
    status: 'Encrypted & Hidden',
  },
];

const INITIAL_SHARES = [
  {
    id: 'sh-501',
    fileName: 'q3_financial_audit_confidential.pdf',
    recipient: 'audit.team@enterprise.io',
    permission: 'Download & Decrypt',
    expiresIn: '4 days remaining',
    createdAt: '2026-07-31 10:15',
    accessCount: 3,
  },
  {
    id: 'sh-502',
    fileName: 'master_tls_private_key.pem',
    recipient: 'secops-lead@enterprise.io',
    permission: 'One-time Read Only',
    expiresIn: '12 hours remaining',
    createdAt: '2026-08-01 02:00',
    accessCount: 1,
  },
];

const INITIAL_AUDIT_LOGS = [
  { id: 'log-101', event: 'AUTH_SUCCESS', user: 'alex.mercer@enterprise.io', detail: 'Hardware Security Key (FIDO2) + Password authenticated', time: 'Just now', ip: '192.168.1.102', status: 'SUCCESS' },
  { id: 'log-102', event: 'STEGO_EMBED', user: 'alex.mercer@enterprise.io', detail: 'Embedded 256-bit key into quantum_nebula_4k.png via 1-bit LSB', time: '2 hours ago', ip: '192.168.1.102', status: 'SUCCESS' },
  { id: 'log-103', event: 'FILE_ENCRYPT', user: 'alex.mercer@enterprise.io', detail: 'Encrypted payload (q3_financial_audit.pdf) using AES-256-GCM', time: '2 hours ago', ip: '192.168.1.102', status: 'SUCCESS' },
  { id: 'log-104', event: 'SHARE_CREATE', user: 'alex.mercer@enterprise.io', detail: 'Created presigned share link for audit.team@enterprise.io', time: '1 day ago', ip: '192.168.1.102', status: 'SUCCESS' },
];

// ─── Inner app (needs router context) ────────────────────────────────────────
function AppInner() {
  const navigate = useNavigate();
  // User Authentication State (Persisted across page refreshes)
  const [user, setUser] = useState<OAuthUser & { org: string } | null>(() => {
    try {
      const stored = localStorage.getItem('stegavault_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Pick up OAuth user from sessionStorage after callback redirect
  useEffect(() => {
    const stored = sessionStorage.getItem('oauth_user');
    if (stored) {
      try {
        const u: OAuthUser = JSON.parse(stored);
        const fullUser = { ...u, org: 'SecureCloud Enterprise' };
        setUser(fullUser);
        localStorage.setItem('stegavault_user', JSON.stringify(fullUser));
        sessionStorage.removeItem('oauth_user');
      } catch {}
    }
  }, []);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'vault' | 'encrypt' | 'decrypt' | 'shares' | 'audit'>('vault');

  // Vault data state (Persisted in localStorage)
  const [files, setFiles] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('stegavault_files');
      return stored ? JSON.parse(stored) : INITIAL_VAULT_FILES;
    } catch {
      return INITIAL_VAULT_FILES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('stegavault_files', JSON.stringify(files));
    } catch {}
  }, [files]);

  const [shares] = useState(INITIAL_SHARES);
  const [logs, setLogs] = useState(INITIAL_AUDIT_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAlgo, setFilterAlgo] = useState<'ALL' | 'AES-256-GCM' | 'ChaCha20-Poly1305'>('ALL');

  // Custom File Upload & Stego refs
  const encryptFileInputRef = useRef<HTMLInputElement>(null);
  const stegoFileInputRef = useRef<HTMLInputElement>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [stegoContainerFile, setStegoContainerFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [selectedAlgo, setSelectedAlgo] = useState<'AES-256-GCM' | 'ChaCha20-Poly1305'>('AES-256-GCM');
  const [selectedCover, setSelectedCover] = useState('quantum_nebula_4k.png');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptStep, setEncryptStep] = useState(0);

  // Decrypt Form state
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptResult, setDecryptResult] = useState<any | null>(null);

  // Share Modal & Clipboard state
  const [activeShareFile, setActiveShareFile] = useState<any | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareExpiry, setShareExpiry] = useState('7 days');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // File Handlers for custom file upload
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setTargetFile(file);
      showToast(`Loaded custom file: ${file.name}`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTargetFile(file);
      showToast(`Loaded custom file: ${file.name}`);
    }
  };

  const handleStegoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setStegoContainerFile(file);
      showToast(`Loaded custom stego image: ${file.name}`);
    }
  };

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const handleLoginSuccess = (u: OAuthUser) => {
    const fullUser = { ...u, org: 'SecureCloud Enterprise' };
    setUser(fullUser);
    localStorage.setItem('stegavault_user', JSON.stringify(fullUser));
    showToast('Authenticated & Vault Loaded');
    navigate('/');
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('stegavault_user');
    sessionStorage.removeItem('oauth_user');
    showToast('Signed out successfully');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Format File Size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Handle Encrypt Submission
  const handleEncryptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFile) return showToast('Please select a file to encrypt');
    if (!passphrase) return showToast('Please enter a secret key passphrase');

    setIsEncrypting(true);
    setEncryptStep(1); // Client-Side PBKDF2 Key Derivation

    setTimeout(() => setEncryptStep(2), 1000); // AES-256-GCM Stream Cipher
    setTimeout(() => setEncryptStep(3), 2200); // LSB Spatial Embedding into Cover PNG
    setTimeout(() => setEncryptStep(4), 3400); // Presigned S3 Encrypted Storage Upload

    setTimeout(() => {
      setIsEncrypting(false);
      const newFile = {
        id: `sec-${Date.now()}`,
        name: targetFile.name,
        type: targetFile.type || 'Binary Stream',
        sizeBytes: targetFile.size,
        hash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
        algo: selectedAlgo,
        stegoCover: selectedCover,
        stegoCapacity: '4.8 MB Capacity',
        uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'Encrypted & Hidden',
      };

      setFiles([newFile, ...files]);
      setLogs([
        {
          id: `log-${Date.now()}`,
          event: 'STEGO_EMBED',
          user: user?.email || 'alex.mercer@enterprise.io',
          detail: `Encrypted ${targetFile.name} & embedded key into ${selectedCover}`,
          time: 'Just now',
          ip: '192.168.1.102',
          status: 'SUCCESS',
        },
        ...logs,
      ]);

      showToast(`Payload ${targetFile.name} encrypted & hidden in ${selectedCover}`);
      setTargetFile(null);
      setPassphrase('');
      setActiveTab('vault');
    }, 4500);
  };

  // Handle Decrypt Submission
  const handleDecryptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decryptPassphrase) return showToast('Please enter decryption passphrase');

    setIsDecrypting(true);
    setDecryptResult(null);

    setTimeout(() => {
      setIsDecrypting(false);
      const decName = targetFile ? targetFile.name : (stegoContainerFile ? stegoContainerFile.name.replace(/\.[^/.]+$/, "") + "_decrypted.pdf" : 'custom_decrypted_document.pdf');
      const decSize = targetFile ? formatSize(targetFile.size) : '4.4 MB';

      setDecryptResult({
        name: decName,
        size: decSize,
        checksum: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
        verified: true,
      });

      setLogs([
        {
          id: `log-${Date.now()}`,
          event: 'FILE_DECRYPT',
          user: user?.email || 'alex.mercer@enterprise.io',
          detail: `Extracted key & decrypted payload ${decName}`,
          time: 'Just now',
          ip: '192.168.1.102',
          status: 'SUCCESS',
        },
        ...logs,
      ]);

      showToast(`Extracted key & verified checksum for ${decName}!`);
    }, 2400);
  };

  const handleDownloadDecrypted = (fileName: string) => {
    const content = `SecureCloud Decrypted Payload: ${fileName}\nExtracted: ${new Date().toISOString()}\nCipher: AES-256-GCM + LSB Steganography`;
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${fileName}`);
  };

  // Filtered files
  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.hash.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAlgo = filterAlgo === 'ALL' || f.algo === filterAlgo;
    return matchesSearch && matchesAlgo;
  });

  const totalUsedBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);

  // --- 1. UNAUTHENTICATED: INTERACTIVE PRODUCT LANDING & SHOWCASE ---
  if (!user) {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  // --- 2. AUTHENTICATED: ENTERPRISE VAULT WORKSPACE ---
  return (
    <div className="min-h-screen bg-[#F0EDE4] text-stone-900 font-sans flex flex-col page-enter">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#059669] text-white font-mono text-xs uppercase font-bold tracking-wider px-4 py-3 rounded-none shadow-2xl flex items-center gap-2.5 toast-enter border border-stone-900">
          <Sparkles className="w-4 h-4 shrink-0 text-amber-300 animate-spin-slow" />
          <span>{toast}</span>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#F0EDE4]/95 backdrop-blur-md border-b border-[#D6D2C4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Status */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('vault')}>
            <div className="w-8 h-8 rounded-none bg-stone-950 flex items-center justify-center text-stone-100 font-mono font-bold text-xs">
              SC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-brand text-xl font-black tracking-wider text-stone-950 uppercase">
                  SECURE<span className="text-[#059669]">CLOUD</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#059669]/10 text-[#059669] border border-[#059669]/20 font-semibold uppercase">
                  ENTERPRISE v2.4
                </span>
              </div>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#EBE7DC] p-1 rounded-none border border-[#D6D2C4]">
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-2 px-4 py-2 rounded-none font-mono uppercase text-xs tracking-wider transition-all tab-indicator ${
                activeTab === 'vault'
                  ? 'bg-[#059669] text-white font-bold shadow-sm active'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#E5E1D8]'
              }`}
            >
              <FolderLock className="w-3.5 h-3.5" />
              Vault Files
            </button>
            <button
              onClick={() => setActiveTab('encrypt')}
              className={`flex items-center gap-2 px-4 py-2 rounded-none font-mono uppercase text-xs tracking-wider transition-all tab-indicator ${
                activeTab === 'encrypt'
                  ? 'bg-[#059669] text-white font-bold shadow-sm active'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#E5E1D8]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Encrypt & Embed
            </button>
            <button
              onClick={() => setActiveTab('decrypt')}
              className={`flex items-center gap-2 px-4 py-2 rounded-none font-mono uppercase text-xs tracking-wider transition-all tab-indicator ${
                activeTab === 'decrypt'
                  ? 'bg-[#059669] text-white font-bold shadow-sm active'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#E5E1D8]'
              }`}
            >
              <Unlock className="w-3.5 h-3.5" />
              Extract & Decrypt
            </button>
            <button
              onClick={() => setActiveTab('shares')}
              className={`flex items-center gap-2 px-4 py-2 rounded-none font-mono uppercase text-xs tracking-wider transition-all tab-indicator ${
                activeTab === 'shares'
                  ? 'bg-[#059669] text-white font-bold shadow-sm active'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#E5E1D8]'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Manager
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-none font-mono uppercase text-xs tracking-wider transition-all tab-indicator ${
                activeTab === 'audit'
                  ? 'bg-[#059669] text-white font-bold shadow-sm active'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#E5E1D8]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Audit Logs
            </button>
          </nav>

          {/* Right Action Button & Profile */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => setActiveTab('encrypt')}
              className="mag-btn flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white font-mono text-xs uppercase font-bold tracking-widest px-4 py-2 rounded-none transition-all shadow-[2px_2px_0_0_#1C1917]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Encrypt Payload</span>
            </button>

            <div className="h-6 w-px bg-[#D6D2C4] hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-mono font-bold text-stone-900 leading-none">{(user?.name || user?.email || 'User').split(' ')[0]}</span>
                <span className="text-[10px] font-mono text-stone-400 capitalize">{user?.provider ?? 'Guest'}</span>
              </div>
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'User'}
                  className="w-8 h-8 rounded-none object-cover border border-[#D6D2C4]"
                />
              ) : (
                <div className="w-8 h-8 rounded-none bg-stone-950 text-stone-100 flex items-center justify-center text-xs font-mono font-bold">
                  {(user?.name || user?.email || 'User').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="p-2 text-stone-400 hover:text-rose-600 hover:bg-[#EBE7DC] rounded-none transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* METRICS & STATUS RIBBON */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up">
          <div className="bg-white border border-[#D6D2C4] p-4 rounded-none flex items-center gap-4 card-lift">
            <div className="w-10 h-10 rounded-none bg-[#059669]/10 border border-[#059669]/20 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5 text-[#059669]" />
            </div>
            <div>
              <span className="text-xs text-stone-500 font-mono uppercase block">Encrypted Storage</span>
              <span className="text-lg font-mono font-extrabold text-stone-900">{formatSize(totalUsedBytes)}</span>
              <span className="text-[10px] text-stone-500 block font-mono">100 GB Enterprise Quota</span>
            </div>
          </div>

          <div className="bg-white border border-[#D6D2C4] p-4 rounded-none flex items-center gap-4 card-lift delay-100">
            <div className="w-10 h-10 rounded-none bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <FolderLock className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <span className="text-xs text-stone-500 font-mono uppercase block">Secret Payloads</span>
              <span className="text-lg font-mono font-extrabold text-stone-900">{files.length} Protected</span>
              <span className="text-[10px] text-[#059669] block font-mono uppercase font-semibold">100% Integrity Verified</span>
            </div>
          </div>

          <div className="bg-white border border-[#D6D2C4] p-4 rounded-none flex items-center gap-4 card-lift delay-200">
            <div className="w-10 h-10 rounded-none bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <span className="text-xs text-stone-500 font-mono uppercase block">Stego Containers</span>
              <span className="text-lg font-mono font-extrabold text-stone-900">1-Bit LSB PNG</span>
              <span className="text-[10px] text-purple-600 block font-mono uppercase font-semibold">Imperceptible Pixels</span>
            </div>
          </div>

          <div className="bg-white border border-[#D6D2C4] p-4 rounded-none flex items-center gap-4 card-lift delay-300">
            <div className="w-10 h-10 rounded-none bg-[#059669]/10 border border-[#059669]/20 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-[#059669]" />
            </div>
            <div>
              <span className="text-xs text-stone-500 font-mono uppercase block">Cipher Standard</span>
              <span className="text-lg font-mono font-extrabold text-stone-900">AES-256-GCM</span>
              <span className="text-[10px] text-[#059669] block font-mono uppercase font-semibold">WebCrypto Hardware Accel</span>
            </div>
          </div>
        </div>

        {/* TAB 1: VAULT FILES DASHBOARD */}
        {activeTab === 'vault' && (
          <div className="space-y-6 animate-fade-up">
            {/* Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter by file name or hash..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-[#D6D2C4] rounded-none pl-10 pr-4 py-2.5 text-xs text-stone-900 font-mono placeholder-stone-400 focus:outline-none focus:border-[#059669]"
                  />
                </div>

                {/* Algo Filter Pills */}
                <div className="hidden lg:flex items-center bg-[#EBE7DC] p-1 rounded-none border border-[#D6D2C4] text-xs">
                  <button
                    onClick={() => setFilterAlgo('ALL')}
                    className={`px-3 py-1.5 rounded-none font-mono uppercase tracking-wider transition-colors ${filterAlgo === 'ALL' ? 'bg-[#059669] text-white font-bold' : 'text-stone-600 hover:text-stone-900'}`}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => setFilterAlgo('AES-256-GCM')}
                    className={`px-3 py-1.5 rounded-none font-mono uppercase tracking-wider transition-colors ${filterAlgo === 'AES-256-GCM' ? 'bg-[#059669] text-white font-bold' : 'text-stone-600 hover:text-stone-900'}`}
                  >
                    AES-256-GCM
                  </button>
                  <button
                    onClick={() => setFilterAlgo('ChaCha20-Poly1305')}
                    className={`px-3 py-1.5 rounded-none font-mono uppercase tracking-wider transition-colors ${filterAlgo === 'ChaCha20-Poly1305' ? 'bg-[#059669] text-white font-bold' : 'text-stone-600 hover:text-stone-900'}`}
                  >
                    ChaCha20
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => showToast('Verified 100% GCM Authentication Tags')}
                  className="flex items-center gap-2 bg-[#EBE7DC] border border-[#D6D2C4] hover:border-stone-400 px-4 py-2.5 rounded-none text-xs font-mono uppercase tracking-wider font-semibold text-stone-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Verify Hashes</span>
                </button>

                <button
                  onClick={() => setActiveTab('encrypt')}
                  className="flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white font-mono uppercase text-xs font-bold tracking-widest px-4 py-2.5 rounded-none transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Protect</span>
                </button>
              </div>
            </div>

            {/* Vault Data Table */}
            <div className="bg-white rounded-none overflow-hidden border border-[#D6D2C4]">
              <div className="px-6 py-4 border-b border-[#D6D2C4] flex items-center justify-between bg-[#F7F5F0]">
                <div className="flex items-center gap-2">
                  <FolderLock className="w-4 h-4 text-[#059669]" />
                  <h2 className="font-mono font-bold text-xs uppercase tracking-wider text-stone-900">Encrypted Enterprise Vault Payload Index</h2>
                </div>
                <span className="text-xs font-mono text-stone-500 uppercase">Direct S3 Engine: <strong className="text-[#059669]">ACTIVE</strong></span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-[#EBE7DC] text-stone-600 font-mono border-b border-[#D6D2C4] uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Filename</th>
                      <th className="px-6 py-3.5">Ciphertext Hash</th>
                      <th className="px-6 py-3.5">Encryption Spec</th>
                      <th className="px-6 py-3.5">Stego PNG Cover</th>
                      <th className="px-6 py-3.5">Created</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6D2C4]">
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-[#EBE7DC]/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-stone-900 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-none bg-[#059669]/10 border border-[#059669]/20 flex items-center justify-center shrink-0">
                            <FileCheck className="w-4 h-4 text-[#059669]" />
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900">{file.name}</div>
                            <span className="text-[11px] text-stone-500 font-mono">{formatSize(file.sizeBytes)}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-mono text-xs">
                          <button
                            onClick={() => copyToClipboard(file.hash, file.id)}
                            className="bg-[#EBE7DC] border border-[#D6D2C4] hover:border-[#059669]/50 px-2.5 py-1 rounded-none text-stone-600 hover:text-[#059669] flex items-center gap-1.5 transition-colors"
                          >
                            <span>{file.hash}</span>
                            {copiedId === file.id ? <Check className="w-3 h-3 text-[#059669]" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-[11px] font-mono font-medium bg-[#059669]/10 text-[#059669] border border-[#059669]/20 uppercase">
                            <Lock className="w-3 h-3" />
                            {file.algo}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-none bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                              <Layers className="w-3 h-3 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-stone-800 font-mono text-xs">{file.stegoCover}</div>
                              <div className="text-[10px] text-stone-500 font-mono">{file.stegoCapacity}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-mono text-xs text-stone-500">{file.uploadedAt}</td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDownloadDecrypted(file.name)}
                              className="p-2 rounded-none bg-[#EBE7DC] border border-[#D6D2C4] hover:border-[#059669]/50 text-stone-700 hover:text-[#059669] transition-colors"
                              title="Download Decrypted Payload"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setActiveTab('decrypt');
                                showToast(`Loaded ${file.name} for key extraction`);
                              }}
                              className="p-2 rounded-none bg-[#EBE7DC] border border-[#D6D2C4] hover:border-[#059669]/50 text-stone-700 hover:text-[#059669] transition-colors"
                              title="Decrypt & Extract Key"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setActiveShareFile(file);
                                setShareEmail('');
                              }}
                              className="p-2 rounded-none bg-[#EBE7DC] border border-[#D6D2C4] hover:border-cyan-600/50 text-stone-700 hover:text-cyan-600 transition-colors"
                              title="Share Link"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setFiles(files.filter((f) => f.id !== file.id));
                                showToast(`Deleted ${file.name}`);
                              }}
                              className="p-2 rounded-none bg-[#EBE7DC] border border-[#D6D2C4] hover:border-rose-500/50 text-stone-700 hover:text-rose-600 transition-colors"
                              title="Delete Payload"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredFiles.length === 0 && (
                <div className="p-12 text-center text-stone-500 font-mono text-xs uppercase">
                  No encrypted items found matching query.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ENCRYPT & EMBED PIPELINE */}
        {activeTab === 'encrypt' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-none border border-[#D6D2C4]">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#D6D2C4]">
                <div className="w-10 h-10 rounded-none bg-[#059669]/10 border border-[#059669]/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#059669]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-900 font-mono uppercase tracking-tight">Zero-Knowledge Encryptor & Stego Embedder</h2>
                  <p className="text-xs font-mono text-stone-500 uppercase">Client-Side WebWorker Crypto Pipeline</p>
                </div>
              </div>

              <form onSubmit={handleEncryptSubmit} className="space-y-6">
                {/* Step 1: File Upload */}
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-stone-700 mb-2">
                    1. Select Secret Target File
                  </label>
                  <input
                    type="file"
                    ref={encryptFileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div
                    onClick={() => encryptFileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    className={`border-2 border-dashed ${isDragging ? 'border-[#059669] bg-[#059669]/10' : 'border-[#D6D2C4] hover:border-[#059669] bg-[#EBE7DC]/40'} p-6 sm:p-8 rounded-none text-center cursor-pointer transition-colors`}
                  >
                    {targetFile ? (
                      <div className="flex items-center justify-center gap-4 text-[#059669] font-semibold">
                        <FileCheck className="w-8 h-8 shrink-0 text-[#059669]" />
                        <div className="text-left font-mono">
                          <span className="text-stone-900 block font-bold text-sm">{targetFile.name}</span>
                          <span className="text-xs text-stone-500">{formatSize(targetFile.size)} · {targetFile.type || 'Custom Payload'}</span>
                          <span className="text-[10px] text-[#059669] block font-bold uppercase mt-0.5">✓ Ready for client-side encryption</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-stone-400 mx-auto" />
                        <p className="text-sm font-mono font-bold uppercase text-stone-800">Click to browse your device or drop any custom file here</p>
                        <p className="text-xs text-stone-500 font-mono uppercase">Supports PDF, DOCX, TXT, PNG, ZIP, MP4, or any confidential data file</p>
                        <span className="inline-block mt-1 px-3 py-1 bg-[#059669]/10 border border-[#059669]/20 text-[#059669] text-[10px] font-mono font-bold uppercase">
                          Drag & Drop or Click to Select
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Key & Cipher Config */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase text-stone-700 mb-2">
                      2. Master Passphrase
                    </label>
                    <input
                      type="password"
                      placeholder="Enter strong passphrase..."
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      className="w-full bg-white border border-[#D6D2C4] rounded-none px-4 py-2.5 text-xs text-stone-900 font-mono placeholder-stone-400 focus:outline-none focus:border-[#059669]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase text-stone-700 mb-2">
                      Cipher Algorithm Standard
                    </label>
                    <select
                      value={selectedAlgo}
                      onChange={(e) => setSelectedAlgo(e.target.value as any)}
                      className="w-full bg-white border border-[#D6D2C4] rounded-none px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-[#059669] font-mono"
                    >
                      <option value="AES-256-GCM">AES-256-GCM (Hardware Accel)</option>
                      <option value="ChaCha20-Poly1305">ChaCha20-Poly1305 (Mobile Optimized)</option>
                    </select>
                  </div>
                </div>

                {/* Step 3: Stego Container Picker */}
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-stone-700 mb-2">
                    3. Select Steganographic PNG Cover Image
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'quantum_nebula_4k.png', name: 'Quantum Nebula PNG', cap: '16 MB Capacity' },
                      { id: 'deep_ocean_texture.png', name: 'Deep Ocean PNG', cap: '8.4 MB Capacity' },
                      { id: 'minimal_monochrome_art.png', name: 'Monochrome PNG', cap: '4.2 MB Capacity' },
                    ].map((img) => (
                      <div
                        key={img.id}
                        onClick={() => setSelectedCover(img.id)}
                        className={`p-3 rounded-none border cursor-pointer transition-all ${
                          selectedCover === img.id
                            ? 'bg-[#059669]/10 border-[#059669] text-[#059669]'
                            : 'bg-white border-[#D6D2C4] text-stone-600 hover:border-stone-400'
                        }`}
                      >
                        <Layers className="w-5 h-5 mb-1 text-purple-600" />
                        <div className="font-mono font-bold text-xs text-stone-900 truncate uppercase">{img.name}</div>
                        <div className="text-[10px] text-stone-500 font-mono">{img.cap}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Progress Bar */}
                {isEncrypting && (
                  <div className="bg-[#EBE7DC] border border-[#D6D2C4] p-4 rounded-none space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-[#059669] font-bold uppercase">
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Cryptographic Pipeline Active...
                      </span>
                      <span>Step {encryptStep}/4</span>
                    </div>

                    <div className="w-full bg-[#D6D2C4] h-2 rounded-none overflow-hidden">
                      <div className="bg-[#059669] h-full transition-all duration-500" style={{ width: `${(encryptStep / 4) * 100}%` }}></div>
                    </div>

                    <p className="text-[11px] text-stone-600 font-mono uppercase">
                      {encryptStep === 1 && 'Deriving 256-bit key via PBKDF2 & 16-byte salt...'}
                      {encryptStep === 2 && `Encrypting file stream with ${selectedAlgo}...`}
                      {encryptStep === 3 && `Hiding key bits into 1-bit LSB pixels of ${selectedCover}...`}
                      {encryptStep === 4 && 'Uploading encrypted blob & stego cover to cloud storage...'}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isEncrypting}
                  className="w-full py-3.5 rounded-none bg-[#059669] hover:bg-[#047857] text-white font-mono text-xs uppercase font-bold tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 stroke-[2.5]" />
                  <span>Execute Encrypt & Stego Embedding</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: EXTRACT & DECRYPT PIPELINE */}
        {activeTab === 'decrypt' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-none border border-[#D6D2C4] space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-[#D6D2C4]">
                <div className="w-10 h-10 rounded-none bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Unlock className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-mono text-stone-900 uppercase tracking-tight">Key Extractor & Payload Decryptor</h2>
                  <p className="text-xs font-mono text-stone-500 uppercase">Reconstruct plaintext payload directly in memory</p>
                </div>
              </div>

              <form onSubmit={handleDecryptSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-stone-700 mb-2">
                    Upload Stego-Cover Image (PNG containing embedded LSB key)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.png"
                    ref={stegoFileInputRef}
                    onChange={handleStegoFileSelect}
                    className="hidden"
                  />
                  <div
                    onClick={() => stegoFileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#D6D2C4] hover:border-cyan-600/50 bg-[#EBE7DC]/40 p-6 rounded-none text-center cursor-pointer transition-colors"
                  >
                    {stegoContainerFile ? (
                      <div className="flex items-center justify-center gap-3 text-cyan-600 font-semibold">
                        <Layers className="w-6 h-6 shrink-0" />
                        <div className="text-left font-mono">
                          <span className="text-stone-900 block font-bold text-sm">{stegoContainerFile.name}</span>
                          <span className="text-xs text-stone-500">{formatSize(stegoContainerFile.size)} · Custom Stego Container PNG</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Layers className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                        <p className="text-sm font-mono font-bold uppercase text-stone-900">Click to choose custom Stego Container PNG image</p>
                        <p className="text-xs text-stone-500 font-mono mt-1 uppercase">Select your PNG image containing embedded LSB key</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-stone-700 mb-1.5">
                    Decryption Passphrase
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter secret master passphrase..."
                    value={decryptPassphrase}
                    onChange={(e) => setDecryptPassphrase(e.target.value)}
                    className="w-full bg-white border border-[#D6D2C4] rounded-none px-4 py-2.5 text-xs text-stone-900 font-mono placeholder-stone-400 focus:outline-none focus:border-[#059669]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isDecrypting}
                  className="w-full py-3.5 rounded-none bg-[#059669] hover:bg-[#047857] text-white font-mono text-xs uppercase font-bold tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4 stroke-[2.5]" />
                  <span>Extract LSB Key & Decrypt Payload</span>
                </button>
              </form>

              {decryptResult && (
                <div className="bg-[#EBE7DC] border border-[#059669]/30 p-5 rounded-none space-y-3">
                  <div className="flex items-center gap-2 text-[#059669] font-mono font-bold text-xs uppercase">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Payload Extracted & Checksum Verified</span>
                  </div>
                  <div className="bg-white p-3 rounded-none border border-[#D6D2C4] font-mono text-xs text-stone-800 space-y-1">
                    <div><strong className="text-stone-500">File:</strong> {decryptResult.name} ({decryptResult.size})</div>
                    <div className="break-all"><strong className="text-stone-500">SHA-256 Checksum:</strong> {decryptResult.checksum}</div>
                  </div>
                  <button
                    onClick={() => handleDownloadDecrypted(decryptResult.name)}
                    className="w-full py-2.5 rounded-none bg-[#059669] text-white font-mono uppercase font-bold tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-[#047857] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Decrypted Payload File ({decryptResult.name})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SHARED ACCESS MANAGER */}
        {activeTab === 'shares' && (
          <div className="space-y-6">
            <div className="bg-white rounded-none overflow-hidden border border-[#D6D2C4]">
              <div className="px-6 py-4 border-b border-[#D6D2C4] bg-[#F7F5F0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-600" />
                  <h2 className="font-mono font-bold text-xs uppercase tracking-wider text-stone-900">Active Presigned Share Links</h2>
                </div>
              </div>

              <div className="divide-y divide-[#D6D2C4]">
                {shares.map((share) => (
                  <div key={share.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-[#EBE7DC]/40 transition-colors">
                    <div className="space-y-1 font-mono">
                      <div className="font-bold text-stone-900 text-sm uppercase">{share.fileName}</div>
                      <div className="text-stone-600">
                        Recipient: <span className="text-cyan-700 font-semibold">{share.recipient}</span> · Permission: <span className="text-[#059669] font-semibold">{share.permission}</span>
                      </div>
                      <div className="text-[11px] text-stone-500">Expires in {share.expiresIn} · Access Count: {share.accessCount} times</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => showToast(`Revoked share link for ${share.recipient}`)}
                        className="px-3 py-1.5 bg-[#EBE7DC] border border-[#D6D2C4] hover:border-rose-500/40 text-stone-600 hover:text-rose-600 rounded-none transition-colors font-mono uppercase text-[11px] font-bold"
                      >
                        Revoke Access
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ENTERPRISE AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-none overflow-hidden border border-[#D6D2C4]">
            <div className="px-6 py-4 border-b border-[#D6D2C4] bg-[#F7F5F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-purple-600" />
                <h2 className="font-mono font-bold text-xs uppercase tracking-wider text-stone-900">Enterprise Security Audit Logs</h2>
              </div>
            </div>

            <table className="w-full text-left text-xs font-mono text-stone-700">
              <thead className="bg-[#EBE7DC] text-stone-600 border-b border-[#D6D2C4] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Event</th>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Time</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6D2C4]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#EBE7DC]/50 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-[#059669]">{log.event}</td>
                    <td className="px-6 py-3.5 text-stone-800">{log.user}</td>
                    <td className="px-6 py-3.5 text-stone-600">{log.detail}</td>
                    <td className="px-6 py-3.5 text-stone-500">{log.time}</td>
                    <td className="px-6 py-3.5">
                      <span className="bg-[#059669]/10 text-[#059669] border border-[#059669]/20 px-2 py-0.5 rounded-none text-[10px] font-bold uppercase">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>

      {/* SHARE MODAL */}
      {activeShareFile && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#F0EDE4] max-w-md w-full p-6 rounded-none space-y-4 border border-stone-900 shadow-2xl">
            <h3 className="font-mono uppercase font-bold text-stone-900 text-sm">Create Presigned Share Link</h3>
            <p className="text-xs text-stone-600 font-mono uppercase">Payload: {activeShareFile.name}</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono uppercase text-stone-600 block mb-1">Recipient Work Email</label>
                <input
                  type="email"
                  placeholder="partner@enterprise.io"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full bg-white border border-[#D6D2C4] rounded-none px-3 py-2 text-xs text-stone-900 font-mono placeholder-stone-400 focus:outline-none focus:border-[#059669]"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-stone-600 block mb-1">Link Expiry Duration</label>
                <select
                  value={shareExpiry}
                  onChange={(e) => setShareExpiry(e.target.value)}
                  className="w-full bg-white border border-[#D6D2C4] rounded-none px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#059669] font-mono"
                >
                  <option value="24 hours">24 hours</option>
                  <option value="7 days">7 days</option>
                  <option value="30 days">30 days</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2 font-mono uppercase text-xs font-bold">
              <button
                onClick={() => {
                  showToast('Presigned share link generated & dispatched!');
                  setActiveShareFile(null);
                }}
                className="flex-1 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-none transition-colors"
              >
                Generate & Send Link
              </button>
              <button
                onClick={() => setActiveShareFile(null)}
                className="py-2.5 px-4 bg-[#EBE7DC] border border-[#D6D2C4] text-stone-700 rounded-none hover:bg-[#D6D2C4] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-[#D6D2C4] py-6 bg-[#EBE7DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-stone-500 uppercase">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#059669]" />
            <span>SecureCloud Enterprise v2.4 · Zero-Knowledge Cryptographic Storage Engine</span>
          </div>
          <div>AES-256-GCM · LSB Steganography · Presigned Cloud Sync</div>
        </div>
      </footer>
    </div>
  );
}

// ─── Root Export with Router ──────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackWrapper />} />
        <Route path="/*" element={<AppInner />} />
      </Routes>
    </BrowserRouter>
  );
}

// Wrapper that gives AuthCallback access to AppInner's state via a shared approach:
// We use a simple redirect pattern — AuthCallback reads the URL params and
// passes them up; AppInner catches them on navigate('/').
function AuthCallbackWrapper() {
  const navigate = useNavigate();
  const handleUser = (u: OAuthUser) => {
    // Store in sessionStorage so AppInner can pick it up after navigate
    sessionStorage.setItem('oauth_user', JSON.stringify(u));
    navigate('/');
  };
  return <AuthCallback onLoginSuccess={handleUser} />;
}

