import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
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

export default function App() {
  // User Authentication State
  const [user, setUser] = useState<{ email: string; name: string; org: string } | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'vault' | 'encrypt' | 'decrypt' | 'shares' | 'audit'>('vault');

  // Vault data state
  const [files, setFiles] = useState(INITIAL_VAULT_FILES);
  const [shares] = useState(INITIAL_SHARES);
  const [logs, setLogs] = useState(INITIAL_AUDIT_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAlgo, setFilterAlgo] = useState<'ALL' | 'AES-256-GCM' | 'ChaCha20-Poly1305'>('ALL');

  // Encrypt Form state
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [selectedAlgo, setSelectedAlgo] = useState<'AES-256-GCM' | 'ChaCha20-Poly1305'>('AES-256-GCM');
  const [selectedCover, setSelectedCover] = useState('quantum_nebula_4k.png');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptStep, setEncryptStep] = useState(0);

  // Decrypt Form state
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptResult, setDecryptResult] = useState<any | null>(null);

  // Share Modal state
  const [activeShareFile, setActiveShareFile] = useState<any | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareExpiry, setShareExpiry] = useState('7 days');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
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
      setDecryptResult({
        name: 'q3_financial_audit_confidential.pdf',
        size: '4.4 MB',
        checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        verified: true,
      });

      setLogs([
        {
          id: `log-${Date.now()}`,
          event: 'FILE_DECRYPT',
          user: user?.email || 'alex.mercer@enterprise.io',
          detail: `Extracted key & decrypted payload checksum verified`,
          time: 'Just now',
          ip: '192.168.1.102',
          status: 'SUCCESS',
        },
        ...logs,
      ]);

      showToast('Key extracted & plaintext checksum verified!');
    }, 2400);
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
    return (
      <LandingPage
        onLoginSuccess={(email) => {
          setUser({ email: email || 'alex.mercer@enterprise.io', name: 'Alex Mercer', org: 'CyberSec Enterprise' });
          showToast('Authenticated & Loaded Workspace Session');
        }}
      />
    );
  }

  // --- 2. AUTHENTICATED: ENTERPRISE VAULT WORKSPACE ---
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans flex flex-col grid-pattern">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-5 h-5 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#090D16]/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Status */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('vault')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-extrabold tracking-tight text-slate-100">
                  STEGA<span className="text-emerald-400">VAULT</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase">
                  ENTERPRISE v2.4
                </span>
              </div>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800/90">
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
                activeTab === 'vault'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FolderLock className="w-4 h-4" />
              Vault Files
            </button>
            <button
              onClick={() => setActiveTab('encrypt')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
                activeTab === 'encrypt'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Lock className="w-4 h-4" />
              Encrypt & Embed
            </button>
            <button
              onClick={() => setActiveTab('decrypt')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
                activeTab === 'decrypt'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Unlock className="w-4 h-4" />
              Extract & Decrypt
            </button>
            <button
              onClick={() => setActiveTab('shares')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
                activeTab === 'shares'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Share Manager
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
                activeTab === 'audit'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <History className="w-4 h-4" />
              Audit Logs
            </button>
          </nav>

          {/* Right Action Button & Profile */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('encrypt')}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Encrypt Payload</span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setUser(null)}
                className="text-xs text-slate-400 hover:text-slate-200 font-mono px-2 py-1"
              >
                Exit Demo
              </button>
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-emerald-400">
                AM
              </div>
              <button
                onClick={() => setUser(null)}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <HardDrive className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-mono block">Encrypted Storage</span>
              <span className="text-lg font-mono font-extrabold text-slate-100">{formatSize(totalUsedBytes)}</span>
              <span className="text-[10px] text-slate-500 block font-mono">100 GB Enterprise Quota</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <FolderLock className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-mono block">Secret Payloads</span>
              <span className="text-lg font-mono font-extrabold text-slate-100">{files.length} Protected</span>
              <span className="text-[10px] text-emerald-400 block font-mono">100% Integrity Verified</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-mono block">Stego Containers</span>
              <span className="text-lg font-mono font-extrabold text-slate-100">1-Bit LSB PNG</span>
              <span className="text-[10px] text-purple-400 block font-mono">Imperceptible Pixels</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-mono block">Cipher Standard</span>
              <span className="text-lg font-mono font-extrabold text-slate-100">AES-256-GCM</span>
              <span className="text-[10px] text-emerald-400 block font-mono">WebCrypto Hardware Accel</span>
            </div>
          </div>
        </div>

        {/* TAB 1: VAULT FILES DASHBOARD */}
        {activeTab === 'vault' && (
          <div className="space-y-6">
            {/* Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter by file name or hash..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Algo Filter Pills */}
                <div className="hidden lg:flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setFilterAlgo('ALL')}
                    className={`px-3 py-1.5 rounded-lg font-mono transition-colors ${filterAlgo === 'ALL' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'}`}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => setFilterAlgo('AES-256-GCM')}
                    className={`px-3 py-1.5 rounded-lg font-mono transition-colors ${filterAlgo === 'AES-256-GCM' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'}`}
                  >
                    AES-256-GCM
                  </button>
                  <button
                    onClick={() => setFilterAlgo('ChaCha20-Poly1305')}
                    className={`px-3 py-1.5 rounded-lg font-mono transition-colors ${filterAlgo === 'ChaCha20-Poly1305' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'}`}
                  >
                    ChaCha20
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => showToast('Verified 100% GCM Authentication Tags')}
                  className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verify Hashes</span>
                </button>

                <button
                  onClick={() => setActiveTab('encrypt')}
                  className="flex items-center gap-2 bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-emerald-400 transition-colors shadow-md"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Protect</span>
                </button>
              </div>
            </div>

            {/* Vault Data Table */}
            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderLock className="w-4 h-4 text-emerald-400" />
                  <h2 className="font-semibold text-sm text-slate-100">Encrypted Enterprise Vault Payload Index</h2>
                </div>
                <span className="text-xs font-mono text-slate-400">Direct S3 Presigned URL Engine: <strong className="text-emerald-400">ACTIVE</strong></span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 text-slate-400 font-mono border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Filename</th>
                      <th className="px-6 py-3.5">Ciphertext Hash</th>
                      <th className="px-6 py-3.5">Encryption Spec</th>
                      <th className="px-6 py-3.5">Stego PNG Cover</th>
                      <th className="px-6 py-3.5">Created</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-200 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <FileCheck className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200">{file.name}</div>
                            <span className="text-[11px] text-slate-500 font-mono">{formatSize(file.sizeBytes)}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-mono text-xs">
                          <button
                            onClick={() => copyToClipboard(file.hash, file.id)}
                            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 px-2.5 py-1 rounded text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
                          >
                            <span>{file.hash}</span>
                            {copiedId === file.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Lock className="w-3 h-3" />
                            {file.algo}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                              <Layers className="w-3 h-3 text-purple-400" />
                            </div>
                            <div>
                              <div className="text-slate-300 font-mono text-xs">{file.stegoCover}</div>
                              <div className="text-[10px] text-slate-500">{file.stegoCapacity}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{file.uploadedAt}</td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setActiveTab('decrypt');
                                showToast(`Loaded ${file.name} for key extraction`);
                              }}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 transition-colors"
                              title="Decrypt & Extract Key"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setActiveShareFile(file);
                                setShareEmail('');
                              }}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-400 transition-colors"
                              title="Share Link"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setFiles(files.filter((f) => f.id !== file.id));
                                showToast(`Deleted ${file.name}`);
                              }}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 transition-colors"
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
                <div className="p-12 text-center text-slate-500 font-mono text-xs">
                  No encrypted items found matching query.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ENCRYPT & EMBED PIPELINE */}
        {activeTab === 'encrypt' && (
          <div className="max-w-3xl mx-auto">
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Zero-Knowledge Encryptor & Stego Embedder</h2>
                  <p className="text-xs font-mono text-slate-400">Client-Side WebWorker Crypto Pipeline</p>
                </div>
              </div>

              <form onSubmit={handleEncryptSubmit} className="space-y-6">
                {/* Step 1: File Upload */}
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2">
                    1. Select Secret Target File
                  </label>
                  <div
                    onClick={() => {
                      const dummy = new File(['Confidential Enterprise Financial Audit 2026'], 'q3_financial_audit_confidential.pdf', { type: 'application/pdf' });
                      setTargetFile(dummy);
                    }}
                    className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-900/60 p-6 rounded-2xl text-center cursor-pointer transition-colors"
                  >
                    {targetFile ? (
                      <div className="flex items-center justify-center gap-3 text-emerald-400 font-semibold">
                        <FileCheck className="w-6 h-6" />
                        <div className="text-left">
                          <span className="text-slate-100 block">{targetFile.name}</span>
                          <span className="text-xs font-mono text-slate-400">{formatSize(targetFile.size)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                        <p className="text-sm font-semibold text-slate-200">Click to select or drop secret payload file</p>
                        <p className="text-xs text-slate-500 font-mono">Payload is encrypted inside browser memory prior to any transmission</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Key & Cipher Config */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2">
                      2. Master Passphrase
                    </label>
                    <input
                      type="password"
                      placeholder="Enter strong passphrase..."
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2">
                      Cipher Algorithm Standard
                    </label>
                    <select
                      value={selectedAlgo}
                      onChange={(e) => setSelectedAlgo(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                    >
                      <option value="AES-256-GCM">AES-256-GCM (Hardware Accel)</option>
                      <option value="ChaCha20-Poly1305">ChaCha20-Poly1305 (Mobile Optimized)</option>
                    </select>
                  </div>
                </div>

                {/* Step 3: Stego Container Picker */}
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2">
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
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedCover === img.id
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Layers className="w-5 h-5 mb-1 text-emerald-400" />
                        <div className="font-semibold text-xs text-slate-200 truncate">{img.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{img.cap}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Progress Bar */}
                {isEncrypting && (
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Cryptographic Pipeline Active...
                      </span>
                      <span>Step {encryptStep}/4</span>
                    </div>

                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full transition-all duration-500" style={{ width: `${(encryptStep / 4) * 100}%` }}></div>
                    </div>

                    <p className="text-[11px] text-slate-400">
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
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
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
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Unlock className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Key Extractor & Payload Decryptor</h2>
                  <p className="text-xs font-mono text-slate-400">Reconstruct plaintext payload directly in memory</p>
                </div>
              </div>

              <form onSubmit={handleDecryptSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2">
                    Upload Stego-Cover Image (PNG containing embedded LSB key)
                  </label>
                  <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 bg-slate-900/60 p-6 rounded-2xl text-center cursor-pointer">
                    <Layers className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-200">Select Stego Container PNG</p>
                    <p className="text-xs text-slate-500 font-mono mt-1">Default loaded: quantum_nebula_4k.png</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-1.5">
                    Decryption Passphrase
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter secret master passphrase..."
                    value={decryptPassphrase}
                    onChange={(e) => setDecryptPassphrase(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isDecrypting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4 stroke-[2.5]" />
                  <span>Extract LSB Key & Decrypt Payload</span>
                </button>
              </form>

              {decryptResult && (
                <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Payload Extracted & Checksum Verified</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                    <div><strong className="text-slate-400">File:</strong> {decryptResult.name} ({decryptResult.size})</div>
                    <div className="break-all"><strong className="text-slate-400">SHA-256 Checksum:</strong> {decryptResult.checksum}</div>
                  </div>
                  <button
                    onClick={() => showToast('Triggered client-side Blob download for decrypted payload')}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Decrypted Payload File</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SHARED ACCESS MANAGER */}
        {activeTab === 'shares' && (
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <h2 className="font-semibold text-sm text-slate-100">Active Presigned Share Links</h2>
                </div>
              </div>

              <div className="divide-y divide-slate-800/60">
                {shares.map((share) => (
                  <div key={share.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-200 text-sm">{share.fileName}</div>
                      <div className="text-slate-400 font-mono">
                        Recipient: <span className="text-cyan-400">{share.recipient}</span> · Permission: <span className="text-emerald-400">{share.permission}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">Expires in {share.expiresIn} · Access Count: {share.accessCount} times</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => showToast(`Revoked share link for ${share.recipient}`)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 rounded-lg transition-colors font-mono"
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
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                <h2 className="font-semibold text-sm text-slate-100">Enterprise Security Audit Logs</h2>
              </div>
            </div>

            <table className="w-full text-left text-xs font-mono text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Event</th>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Time</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-3.5 font-bold text-emerald-400">{log.event}</td>
                    <td className="px-6 py-3.5 text-slate-300">{log.user}</td>
                    <td className="px-6 py-3.5 text-slate-400">{log.detail}</td>
                    <td className="px-6 py-3.5 text-slate-500">{log.time}</td>
                    <td className="px-6 py-3.5">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl space-y-4 border border-slate-800">
            <h3 className="font-bold text-slate-100 text-sm">Create Presigned Share Link</h3>
            <p className="text-xs text-slate-400 font-mono">Payload: {activeShareFile.name}</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Recipient Work Email</label>
                <input
                  type="email"
                  placeholder="partner@enterprise.io"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Link Expiry Duration</label>
                <select
                  value={shareExpiry}
                  onChange={(e) => setShareExpiry(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                >
                  <option value="24 hours">24 hours</option>
                  <option value="7 days">7 days</option>
                  <option value="30 days">30 days</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  showToast('Presigned share link generated & dispatched!');
                  setActiveShareFile(null);
                }}
                className="flex-1 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition-colors"
              >
                Generate & Send Link
              </button>
              <button
                onClick={() => setActiveShareFile(null)}
                className="py-2.5 px-4 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 py-6 bg-[#090D16]/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>StegaVault Enterprise v2.4 · Zero-Knowledge Cryptographic Storage Engine</span>
          </div>
          <div>AES-256-GCM · LSB Steganography · Presigned Cloud Sync</div>
        </div>
      </footer>
    </div>
  );
}
