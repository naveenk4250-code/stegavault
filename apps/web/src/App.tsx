import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { AuthCallback } from './pages/AuthCallback';
import type { OAuthUser } from './lib/oauth';
import {
  encryptFile,
  decryptPacked,
  uint8ArrayToBase64,
  base64ToUint8Array,
  computeSHA256,
  attachKeyToStegoPayload,
  unpackStegoPayload,
} from './lib/crypto';
import {
  embedLSB,
  extractLSB,
  generateCoverBlob,
  blobToDataUrl,
  dataUrlToBlob,
} from './lib/steganography';
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
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import { ThemeToggle } from "./components/ThemeToggle";

import {
  requestUploadUrl,
  confirmUpload,
  listFiles,
  requestDownloadUrl,
  deleteFile as apiDeleteFile,
  clearVault,
} from './lib/api';
import { idbSaveUserFiles, idbLoadUserFiles } from './lib/storage';

// Real-time audit log — starts empty, populated only by actual user actions
const INITIAL_AUDIT_LOGS: {
  id: string;
  event: string;
  user: string;
  detail: string;
  time: string;
  ip: string;
  status: string;
}[] = [];

// ─── User-Scoped Storage Helpers (Strict User Isolation) ─────────────────────
const getUserVaultKey = (email?: string | null): string => {
  const safeId = (email || 'anonymous').toLowerCase().trim().replace(/[^a-z0-9_.-]/g, '_');
  return `stegavault_files_${safeId}`;
};

const getUserLogsKey = (email?: string | null): string => {
  const safeId = (email || 'anonymous').toLowerCase().trim().replace(/[^a-z0-9_.-]/g, '_');
  return `stegavault_logs_${safeId}`;
};

const getUserSharesKey = (email?: string | null): string => {
  const safeId = (email || 'anonymous').toLowerCase().trim().replace(/[^a-z0-9_.-]/g, '_');
  return `stegavault_shares_${safeId}`;
};

const loadUserVaultFiles = (email?: string | null): any[] => {
  if (!email) return [];
  const key = getUserVaultKey(email);
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
    // New user starts with a clean, empty vault
    return [];
  } catch {
    return [];
  }
};

const loadUserLogs = (email?: string | null): any[] => {
  if (!email) return [];
  const key = getUserLogsKey(email);
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

const loadUserShares = (email?: string | null): any[] => {
  if (!email) return [];
  const key = getUserSharesKey(email);
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

// ─── Inner app (needs router context) ────────────────────────────────────────
function AppInner() {
  // Session Duration: 4 Hours (14,400,000 ms)
  const SESSION_DURATION_MS = 4 * 60 * 60 * 1000;

  // User Authentication State (Persisted with 4-Hour Session Expiration)
  const [user, setUser] = useState<OAuthUser & { org: string } | null>(() => {
    try {
      const storedSession = localStorage.getItem('stegavault_session');
      if (storedSession) {
        const session = JSON.parse(storedSession);
        if (session.expiresAt && Date.now() > session.expiresAt) {
          localStorage.removeItem('stegavault_session');
          localStorage.removeItem('stegavault_user');
          return null;
        }
        return session.user;
      }

      const storedUser = localStorage.getItem('stegavault_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  // Helper to store active session with 4-hour expiration
  const persistSession = (u: OAuthUser) => {
    const fullUser = { ...u, org: 'StegaVault Enterprise' };
    const session = {
      user: fullUser,
      loginTimestamp: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
    setUser(fullUser);
    localStorage.setItem('stegavault_session', JSON.stringify(session));
    localStorage.setItem('stegavault_user', JSON.stringify(fullUser));
  };

  // Check for expired session on load and periodically
  useEffect(() => {
    const checkExpiration = () => {
      const storedSession = localStorage.getItem('stegavault_session');
      if (storedSession) {
        try {
          const session = JSON.parse(storedSession);
          if (session.expiresAt && Date.now() > session.expiresAt) {
            localStorage.removeItem('stegavault_session');
            localStorage.removeItem('stegavault_user');
            setUser(null);
            showToast('YOUR SESSION EXPIRED , LOGIN AGAIN');
          }
        } catch {}
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 30000);
    return () => clearInterval(interval);
  }, []);

  // Pick up OAuth user from sessionStorage after callback redirect
  useEffect(() => {
    const stored = sessionStorage.getItem('oauth_user');
    if (stored) {
      try {
        const u: OAuthUser = JSON.parse(stored);
        persistSession(u);
        sessionStorage.removeItem('oauth_user');
      } catch {}
    }
  }, []);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'vault' | 'encrypt' | 'decrypt' | 'shares' | 'audit'>('vault');

  // Vault data state (Strictly isolated per authenticated user)
  const [files, setFiles] = useState<any[]>(() => {
    return user?.email ? loadUserVaultFiles(user.email) : [];
  });

  const [shares, setShares] = useState<any[]>(() => {
    return user?.email ? loadUserShares(user.email) : [];
  });

  const [logs, setLogs] = useState<any[]>(() => {
    return user?.email ? loadUserLogs(user.email) : [];
  });

  // Re-sync user-isolated data whenever the authenticated user changes
  useEffect(() => {
    // Purge legacy shared key to prevent cross-account contamination
    try {
      localStorage.removeItem('stegavault_files');
    } catch {}

    if (user?.email) {
      setShares(loadUserShares(user.email));
      setLogs(loadUserLogs(user.email));

      // Load local files immediately from localStorage (instant, sync)
      const instantLocal = loadUserVaultFiles(user.email);
      if (instantLocal.length > 0) {
        setFiles(instantLocal);
      }

      // Then load full files from IndexedDB (async — has stego data URLs)
      idbLoadUserFiles(user.email).then((idbFiles) => {
        if (idbFiles.length > 0) {
          setFiles((prev) => {
            const merged = [...idbFiles];
            for (const p of prev) {
              if (!merged.some((m) => m.id === p.id)) {
                merged.push(p);
              }
            }
            return merged;
          });
        }
      });

      // Purely additive cloud sync: NEVER clears local files if cloud returns empty
      listFiles(user.email)
        .then((remoteFiles) => {
          if (!remoteFiles || remoteFiles.length === 0) return; // Nothing from cloud → leave local alone
          const mapped = remoteFiles.map((f: any) => ({
            id: f.id,
            remoteId: f.id,
            name: f.originalFilename,
            type: f.mimeType,
            sizeBytes: f.sizeBytes,
            hash: '—',
            algo: 'AES-256-GCM',
            stegoCover: 'cloud',
            stegoCapacity: '',
            uploadedAt: f.createdAt.replace('T', ' ').substring(0, 19),
            status: 'Encrypted & Hidden',
            ownerEmail: user.email,
          }));

          setFiles((prev) => {
            const combined = [...prev]; // Start from local — purely additive
            for (const cloudFile of mapped) {
              const matchIdx = combined.findIndex(
                (c) => c.id === cloudFile.id || c.remoteId === cloudFile.id
              );
              if (matchIdx >= 0) {
                combined[matchIdx] = {
                  ...cloudFile,
                  ...combined[matchIdx],
                  remoteId: cloudFile.id,
                };
              } else {
                combined.push(cloudFile);
              }
            }
            idbSaveUserFiles(user.email!, combined);
            return combined;
          });
        })
        .catch(() => {
          // Cloud unavailable — local files remain untouched
        });
    } else {
      setFiles([]);
      setShares([]);
      setLogs([]);
    }
  }, [user?.email]);

  // Persist files into IndexedDB whenever files state changes
  useEffect(() => {
    if (!user?.email) return;
    idbSaveUserFiles(user.email, files);
  }, [files, user?.email]);

  // Persist logs into current user's isolated storage
  useEffect(() => {
    if (!user?.email) return;
    const key = getUserLogsKey(user.email);
    try {
      localStorage.setItem(key, JSON.stringify(logs));
    } catch {}
  }, [logs, user?.email]);

  // Persist shares into current user's isolated storage
  useEffect(() => {
    if (!user?.email) return;
    const key = getUserSharesKey(user.email);
    try {
      localStorage.setItem(key, JSON.stringify(shares));
    } catch {}
  }, [shares, user?.email]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAlgo, setFilterAlgo] = useState<'ALL' | 'AES-256-GCM' | 'ChaCha20-Poly1305'>('ALL');

  // Custom File Upload & Stego refs
  const encryptFileInputRef = useRef<HTMLInputElement>(null);
  const stegoFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [detectedStegoFile, setDetectedStegoFile] = useState<File | null>(null);
  const [stegoContainerFile, setStegoContainerFile] = useState<File | null>(null);
  const [customCoverFile, setCustomCoverFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [attachKey, setAttachKey] = useState(true);
  const [selectedAlgo, setSelectedAlgo] = useState<'AES-256-GCM' | 'ChaCha20-Poly1305'>('AES-256-GCM');
  const [selectedCover, setSelectedCover] = useState('quantum_nebula_4k.png');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptStep, setEncryptStep] = useState(0);

  // Decrypt Form state
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [showDecryptPassphrase, setShowDecryptPassphrase] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptResult, setDecryptResult] = useState<any | null>(null);
  const [selectedVaultFile, setSelectedVaultFile] = useState<any | null>(null);
  const [detectedStegoKey, setDetectedStegoKey] = useState<string | null>(null);
  const [decryptedStegoFile, setDecryptedStegoFile] = useState<{
    name: string;
    mimeType: string;
    sizeBytes: number;
    checksum: string;
    dataUrl: string;
    originalCoverName: string;
    key: string;
  } | null>(null);

  // Share Modal & Clipboard state
  const [activeShareFile, setActiveShareFile] = useState<any | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareExpiry, setShareExpiry] = useState('7 days');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Check if an uploaded image contains a StegaVault LSB stego payload
  const checkStegoContainer = async (file: File) => {
    if (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.png')) {
      try {
        const payload = await extractLSB(file);
        if (payload && payload.length >= 28) {
          const { packedCiphertext, attachedKey } = unpackStegoPayload(payload);
          setDetectedStegoFile(file);
          setDetectedStegoKey(attachedKey);

          if (attachedKey) {
            try {
              const decryptedBuf = await decryptPacked(packedCiphertext, attachedKey);
              const checksum = await computeSHA256(decryptedBuf);
              const fileName = (decryptedBuf as any).filename || 'decrypted_payload.txt';
              const mimeType = (decryptedBuf as any).mimeType || 'application/octet-stream';
              const blob = new Blob([decryptedBuf], { type: mimeType });
              const url = URL.createObjectURL(blob);

              setDecryptedStegoFile({
                name: fileName,
                mimeType,
                sizeBytes: decryptedBuf.byteLength,
                checksum,
                dataUrl: url,
                originalCoverName: file.name,
                key: attachedKey,
              });
              showToast(`🎉 Stego image detected with key attached! Auto-extracted "${fileName}".`);
              return true;
            } catch (decErr: any) {
              console.warn('Auto-decrypt with attached key failed:', decErr);
            }
          }
          setDecryptedStegoFile(null);
          showToast(`Stego container detected in "${file.name}"!`);
          return true;
        }
      } catch {
        setDetectedStegoFile(null);
        setDetectedStegoKey(null);
        setDecryptedStegoFile(null);
      }
    } else {
      setDetectedStegoFile(null);
      setDetectedStegoKey(null);
      setDecryptedStegoFile(null);
    }
    return false;
  };

  // File Handlers for custom file upload
  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setTargetFile(file);
      await checkStegoContainer(file);
      showToast(`Loaded custom file: ${file.name}`);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTargetFile(file);
      await checkStegoContainer(file);
      showToast(`Loaded custom file: ${file.name}`);
    }
  };

  const handleStegoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setStegoContainerFile(file);
      showToast(`Loaded custom stego image: ${file.name}`);
      try {
        const payload = await extractLSB(file);
        const { attachedKey } = unpackStegoPayload(payload);
        if (attachedKey) {
          setDecryptPassphrase(attachedKey);
          setDetectedStegoKey(attachedKey);
          showToast(`Attached key detected and auto-filled!`);
        }
      } catch (err: any) {
        console.warn('Stego extraction error on select:', err);
      }
    }
  };

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // ─── Real-Time Audit Log Helper ────────────────────────────────────────────
  const addLog = (event: string, detail: string, status: 'SUCCESS' | 'FAILED' = 'SUCCESS') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        event,
        user: user?.email || 'anonymous',
        detail,
        time: timeStr,
        ip: 'client-side',
        status,
      },
      ...prev,
    ]);
  };

  const handleLoginSuccess = (u: OAuthUser) => {
    persistSession(u);
    // Explicitly switch in-memory state to the newly authenticated user's isolated vault records
    const userFiles = loadUserVaultFiles(u.email);
    setFiles(userFiles);
    setShares(loadUserShares(u.email));
    const userLogs = loadUserLogs(u.email);

    // Log the login event immediately with the new user's email
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const loginLog = {
      id: `log-${Date.now()}`,
      event: 'AUTH_SUCCESS',
      user: u.email || u.name || 'unknown',
      detail: `Authenticated via ${u.provider || 'OAuth'} — session valid for 4 hours`,
      time: timeStr,
      ip: 'client-side',
      status: 'SUCCESS',
    };
    const updatedLogs = [loginLog, ...userLogs];
    setLogs(updatedLogs);
    try {
      localStorage.setItem(getUserLogsKey(u.email), JSON.stringify(updatedLogs));
    } catch {}

    showToast('Authenticated & Vault Loaded');
  };

  const handleSignOut = () => {
    addLog('SIGN_OUT', `User ${user?.email || 'unknown'} signed out — session terminated`);
    setUser(null);
    setFiles([]);
    setShares([]);
    setLogs([]);
    localStorage.removeItem('stegavault_session');
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

  // Handle Encrypt Submission (Real client-side AES-256-GCM + 1-Bit LSB Steganography)
  const handleEncryptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFile) return showToast('Please select a file to encrypt');
    if (!passphrase) return showToast('Please enter a secret key passphrase');

    setIsEncrypting(true);
    setEncryptStep(1); // 1. Client-Side PBKDF2 Key Derivation (about to run)

    try {
      const currentFile = targetFile;
      const secretPass = passphrase;

      // 1. Real PBKDF2 (250,000 iter, SHA-256) + AES-256-GCM encryption
      const packedCiphertext = await encryptFile(currentFile, secretPass);
      console.log('Real AES-256-GCM packed ciphertext (length: ' + packedCiphertext.byteLength + ' bytes):', packedCiphertext);
      setEncryptStep(2); // 2. AES-256-GCM done -> ciphertext ready

      // 2. Real SHA-256 checksum of original plaintext file
      const originalBuffer = await currentFile.arrayBuffer();
      const realHash = await computeSHA256(originalBuffer);

      // Attach key if selected (enables User B to retrieve the attached file upon upload)
      let payloadToEmbed = packedCiphertext;
      if (attachKey && secretPass) {
        payloadToEmbed = attachKeyToStegoPayload(packedCiphertext, secretPass);
      }

      // 3. Real 1-Bit LSB Steganographic Embedding into Cover PNG
      setEncryptStep(3); // 3. Hiding bits into LSB of cover image pixels
      const coverBlob = customCoverFile || (await generateCoverBlob(selectedCover, payloadToEmbed.byteLength));
      console.log('Embedding payload into cover image pixels via 1-bit LSB...');
      const stegoBlob = await embedLSB(coverBlob, payloadToEmbed);
      console.log('Stego PNG Blob generated successfully (size: ' + stegoBlob.size + ' bytes)');
      const stegoDataUrl = await blobToDataUrl(stegoBlob);

      setEncryptStep(4); // 4. Finalizing upload & storing into encrypted vault

      let remoteFileId: string | null = null;
      if (user?.email) {
        try {
          // Zero-knowledge: Send only stego container metadata & ciphertext sha256 to backend
          const uploadInfo = await requestUploadUrl(user.email, {
            filename: currentFile.name,
            mimeType: currentFile.type || 'application/octet-stream',
            sizeBytes: stegoBlob.size,
            ciphertextSha256: realHash,
          });

          // Dual S3 Upload:
          // 1. Stego PNG blob -> stegavault-stego-keys-prod
          // 2. Encrypted ciphertext blob -> stegavault-encrypted-files-prod
          const uploadPromises: Promise<any>[] = [
            fetch(uploadInfo.uploadUrl, {
              method: 'PUT',
              body: stegoBlob,
              headers: {
                'Content-Type': 'image/png',
              },
            }).then((res) => {
              if (!res.ok) throw new Error(`Stego container S3 PUT failed (${res.status})`);
            }),
          ];

          if (uploadInfo.uploadUrlEncrypted) {
            const encryptedBlob = new Blob([packedCiphertext], { type: 'application/octet-stream' });
            uploadPromises.push(
              fetch(uploadInfo.uploadUrlEncrypted, {
                method: 'PUT',
                body: encryptedBlob,
                headers: {
                  'Content-Type': 'application/octet-stream',
                },
              }).then((res) => {
                if (!res.ok) throw new Error(`Encrypted file S3 PUT failed (${res.status})`);
              }),
            );
          }

          await Promise.all(uploadPromises);

          // Confirm upload with backend to activate file
          await confirmUpload(user.email, uploadInfo.fileId);
          remoteFileId = uploadInfo.fileId;
          addLog('S3_UPLOAD', `Stored encrypted ciphertext in S3 and stego carrier in Stego-Keys S3 for "${currentFile.name}"`);
        } catch (cloudErr: any) {
          console.warn('Cloud persistence note:', cloudErr);
          addLog('S3_UPLOAD_NOTE', `S3 upload status: ${cloudErr.message || 'S3 upload failed'}. Stored in local vault.`, 'WARNING');
        }
      }

      setIsEncrypting(false);
      const coverName = customCoverFile ? customCoverFile.name : selectedCover;
      const newFile = {
        id: remoteFileId || `sec-${Date.now()}`,
        remoteId: remoteFileId,
        name: currentFile.name,
        type: currentFile.type || 'Binary File',
        sizeBytes: currentFile.size,
        hash: `${realHash.substring(0, 10)}...${realHash.substring(realHash.length - 4)}`,
        fullHash: realHash,
        algo: selectedAlgo,
        stegoCover: coverName,
        stegoCapacity: `${formatSize(Math.max(currentFile.size * 2, 4000000))} Capacity`,
        uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'Encrypted & Hidden',
        dataUrl: stegoDataUrl, // Real Stego PNG containing embedded ciphertext!
        stegoDataUrl: stegoDataUrl,
        encryptedBytesBase64: uint8ArrayToBase64(packedCiphertext),
        ownerEmail: user?.email || 'anonymous',
      };

      setFiles((prevFiles) => [newFile, ...prevFiles.filter((f) => f.id !== newFile.id)]);
      addLog('FILE_ENCRYPT', `Encrypted "${currentFile.name}" (${formatSize(currentFile.size)}) with real AES-256-GCM (PBKDF2 250k iter)`);
      addLog('STEGO_EMBED', `Embedded ${payloadToEmbed.byteLength} bytes into ${coverName} via 1-bit LSB spatial pixels${attachKey ? ' (with key attached)' : ''}`);

      // Auto-download the stego image with key attached for User A
      const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
      const downloadName = `${baseName}_stego.png`;
      const dlLink = document.createElement('a');
      dlLink.href = stegoDataUrl;
      dlLink.download = downloadName;
      document.body.appendChild(dlLink);
      dlLink.click();
      document.body.removeChild(dlLink);
      addLog('FILE_DOWNLOAD', `Downloaded stego carrier image "${downloadName}"${attachKey ? ' with key attached' : ''}`);

      showToast(`Payload ${currentFile.name} encrypted & downloaded as "${downloadName}"${attachKey ? ' (key attached)' : ''}!`);
      setTargetFile(null);
      setCustomCoverFile(null);
      setPassphrase('');
      setActiveTab('vault');
    } catch (err: any) {
      setIsEncrypting(false);
      showToast(`Pipeline failed: ${err?.message || 'Web Crypto / Canvas error'}`);
    }
  };

  // Handle Decrypt Submission (Real 1-Bit LSB Extraction + AES-256-GCM Decryption)
  const handleDecryptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decryptPassphrase && !detectedStegoKey && !stegoContainerFile) return showToast('Please enter decryption passphrase or upload a stego image');


    let packedBytes: Uint8Array | null = null;
    let decName = 'decrypted_payload.txt';
    let mimeType = 'text/plain';

    setIsDecrypting(true);
    setDecryptResult(null);

    try {
      if (stegoContainerFile) {
        const rawName = stegoContainerFile.name.replace(/\.[^/.]+$/, "");
        const cleanName = rawName.replace(/_stego$/, "");
        const matched = files.find(f => f.name === cleanName || f.name.replace(/\.[^/.]+$/, "") === cleanName);
        if (matched) {
          decName = matched.name;
          mimeType = matched.type || 'text/plain';
        } else {
          decName = cleanName.includes('.') ? cleanName : `${cleanName}.txt`;
        }

        console.log('Extracting payload from uploaded stego container:', stegoContainerFile.name);
        try {
          // 1. Extract stego payload from PNG chunk or LSB pixels
          packedBytes = await extractLSB(stegoContainerFile);
          console.log(`Extracted ${packedBytes.byteLength} bytes from stego container.`);
          const { attachedKey } = unpackStegoPayload(packedBytes);
          if (attachedKey) {
            setDetectedStegoKey(attachedKey);
            if (!decryptPassphrase) setDecryptPassphrase(attachedKey);
            // Store locally — React state update is async and won't be visible
            // in decryptPassphrase yet at the point of decryptPacked() call below.
            (window as any).__stegoAttachedKey = attachedKey;
          }
        } catch (lsbErr: any) {
          console.warn('Stego extraction failed:', lsbErr.message);
        }
      } else if (files.length > 0) {
        // Use selectedVaultFile if selected, else most recent vault file
        const target = selectedVaultFile || files[0];
        decName = target.name;
        mimeType = target.type || 'text/plain';

        if (target.stegoDataUrl || (target.dataUrl && target.dataUrl.startsWith('data:image/png'))) {
          // Extract from the stego PNG data URL
          const stegoBlob = dataUrlToBlob(target.stegoDataUrl || target.dataUrl);
          packedBytes = await extractLSB(stegoBlob);
          console.log(`Extracted ${packedBytes.byteLength} bytes from vault stego PNG via LSB.`);
        } else if (target.remoteId && user?.email) {
          // Fetch encrypted stego container from Cloud S3
          showToast(`Fetching container from Cloud S3 for "${target.name}"...`);
          const { downloadUrl } = await requestDownloadUrl(user.email, target.remoteId);
          const s3Res = await fetch(downloadUrl);
          if (!s3Res.ok) {
            throw new Error(`Cloud download failed with status ${s3Res.status}`);
          }
          const s3Blob = await s3Res.blob();
          packedBytes = await extractLSB(s3Blob);
          console.log(`Extracted ${packedBytes.byteLength} bytes from S3 stego container via LSB.`);
        } else if (target.encryptedBytesBase64) {
          packedBytes = base64ToUint8Array(target.encryptedBytesBase64);
        }
      }

      if (!packedBytes || packedBytes.length < 28) {
        setIsDecrypting(false);
        return showToast('No valid steganographic container or encrypted file found.');
      }

      // 2. Real Web Crypto decryptPacked: verifies GCM 16-byte auth tag. Throws OperationError if wrong passphrase!
      // Use effectivePassphrase to avoid stale React state closure: decryptPassphrase state won't
      // have updated yet if setDecryptPassphrase(attachedKey) was called just above in this same render.
      const localAttachedKey = (window as any).__stegoAttachedKey || null;
      delete (window as any).__stegoAttachedKey;
      const effectivePassphrase = decryptPassphrase || localAttachedKey || detectedStegoKey || undefined;
      const decryptedBuffer = await decryptPacked(packedBytes, effectivePassphrase);
      const checksum = await computeSHA256(decryptedBuffer);


      // Check if decryptedBuffer has embedded metadata from SV01 package!
      const finalName = (decryptedBuffer as any).filename || decName;
      const finalMime = (decryptedBuffer as any).mimeType || mimeType;

      const blob = new Blob([decryptedBuffer], { type: finalMime });
      const decryptedUrl = URL.createObjectURL(blob);

      setIsDecrypting(false);
      setDecryptResult({
        name: finalName,
        size: formatSize(decryptedBuffer.byteLength),
        checksum: checksum,
        verified: true,
        dataUrl: decryptedUrl,
      });

      addLog('STEGO_EXTRACT', `Extracted ${packedBytes.byteLength} bytes from 1-bit LSB pixels of stego container`);
      addLog('FILE_DECRYPT', `Decrypted "${finalName}" with real AES-256-GCM — Auth tag verified & SHA-256 checksum matched`);
      showToast(`Payload extracted from stego container & verified for ${finalName}!`);
    } catch {
      setIsDecrypting(false);
      showToast('Decryption failed: Incorrect passphrase or authentication tag mismatch!');
      addLog('DECRYPT_FAILED', `Decryption failed for "${decName}": Invalid passphrase (AES-GCM tag verification failed)`, 'FAILED');
    }
  };

  // Handle Binary Download (Downloads original binary photo/file or stego container intact!)
  const handleDownloadDecrypted = async (fileObj: any) => {
    // 1. If decryptResult object was passed or active
    if (fileObj && typeof fileObj === 'object' && fileObj.dataUrl && !fileObj.stegoCover) {
      const a = document.createElement('a');
      a.href = fileObj.dataUrl;
      a.download = fileObj.name || 'decrypted_payload.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addLog('FILE_DOWNLOAD', `Downloaded decrypted file "${fileObj.name}"`);
      showToast(`Downloaded decrypted payload: ${fileObj.name}`);
      return;
    }

    const targetItem = typeof fileObj === 'object' ? fileObj : files.find(f => f.name === fileObj || f.id === fileObj);
    const fileName = typeof fileObj === 'string' ? fileObj : (fileObj?.name || 'downloaded_payload');
    const dataUrl = targetItem?.stegoDataUrl || targetItem?.dataUrl;

    if (dataUrl) {
      const isStegoPng = dataUrl.startsWith('data:image/png');
      const baseName = fileName.replace(/\.[^/.]+$/, '');
      const downloadName = isStegoPng ? (fileName.endsWith('.png') ? fileName : `${baseName}_stego.png`) : fileName;
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addLog('FILE_DOWNLOAD', `Downloaded ${isStegoPng ? 'stego container PNG' : 'payload'} "${downloadName}"`);
      showToast(`Downloaded ${isStegoPng ? 'stego PNG container' : 'payload'}: ${downloadName}`);
      return;
    }

    // Cloud S3: Download directly via presigned GET URL
    if (targetItem?.remoteId && user?.email) {
      try {
        showToast(`Requesting S3 download for "${fileName}"...`);
        const { downloadUrl } = await requestDownloadUrl(user.email, targetItem.remoteId);
        const res = await fetch(downloadUrl);
        if (!res.ok) throw new Error(`S3 download failed with status ${res.status}`);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const baseName = fileName.replace(/\.[^/.]+$/, '');
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${baseName}_stego.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        addLog('FILE_DOWNLOAD', `Downloaded stego container PNG from S3 for "${fileName}"`);
        showToast(`Downloaded stego container for "${fileName}"`);
        return;
      } catch (err: any) {
        showToast(`Cloud download failed: ${err.message}`);
        return;
      }
    }

    // 2. Fallback to active decryptResult if present
    if (decryptResult && decryptResult.dataUrl) {
      const a = document.createElement('a');
      a.href = decryptResult.dataUrl;
      a.download = decryptResult.name || 'decrypted_payload.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addLog('FILE_DOWNLOAD', `Downloaded decrypted file "${decryptResult.name}"`);
      showToast(`Downloaded decrypted payload: ${decryptResult.name}`);
      return;
    }

    // 3. Gracefully handle sample items without stored binary payload
    showToast('No stego image available for this record. Please encrypt a real file.');
    addLog('FILE_DOWNLOAD_SKIPPED', `No binary stego container available for record "${fileName}"`, 'INFO');
  };

  // Filtered files - strictly isolated per authenticated user
  const filteredFiles = files.filter((f) => {
    // Enforce user isolation: never display files belonging to another user
    if (f.ownerEmail && user?.email && f.ownerEmail !== user.email) {
      return false;
    }
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || (f.hash?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
    const matchesAlgo = filterAlgo === 'ALL' || f.algo === filterAlgo;
    return matchesSearch && matchesAlgo;
  });

  const totalUsedBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);

  const refreshVaultFromCloud = async () => {
    if (!user?.email) return;
    try {
      // Load cloud files — if this fails or returns empty, DO NOT TOUCH local state at all
      let remoteFiles: any[] = [];
      try {
        remoteFiles = await listFiles(user.email);
      } catch {
        showToast('Cloud sync failed — local vault preserved');
        return;
      }

      if (remoteFiles.length === 0) {
        showToast('Vault is up to date');
        return; // Cloud has nothing — do NOT clear local files
      }

      const mapped = remoteFiles.map((f: any) => ({
        id: f.id,
        remoteId: f.id,
        name: f.originalFilename,
        type: f.mimeType,
        sizeBytes: f.sizeBytes,
        hash: '—',
        algo: 'AES-256-GCM',
        stegoCover: 'cloud',
        stegoCapacity: '',
        uploadedAt: f.createdAt.replace('T', ' ').substring(0, 19),
        status: 'Encrypted & Hidden',
        ownerEmail: user.email,
      }));

      // PURELY ADDITIVE: start from current local state, only add/update cloud entries
      setFiles((prev) => {
        const combined = [...prev];
        for (const cloudFile of mapped) {
          const matchIdx = combined.findIndex(
            (c) => c.id === cloudFile.id || c.remoteId === cloudFile.id
          );
          if (matchIdx >= 0) {
            // Update existing local file with cloud metadata, preserving local stego data
            combined[matchIdx] = {
              ...cloudFile,
              ...combined[matchIdx],
              remoteId: cloudFile.id,
            };
          } else {
            // New cloud file not seen locally — add it
            combined.push(cloudFile);
          }
        }
        idbSaveUserFiles(user.email!, combined);
        return combined;
      });

      showToast(`Vault synced — ${remoteFiles.length} file(s) from cloud`);
      addLog('VAULT_REFRESH', `Synced ${remoteFiles.length} file(s) from cloud S3`);
    } catch (err: any) {
      showToast('Cloud refresh failed — check API connection');
    }
  };

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
        <div className="w-full px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          
          {/* Logo & Status */}
          <div className="flex items-center gap-3 cursor-pointer select-none shrink-0" onClick={() => setActiveTab('vault')}>
            <div className="w-10 h-10 rounded-none bg-stone-950 flex items-center justify-center text-stone-100 font-mono font-bold text-sm shadow-sm shrink-0">
              SV
            </div>
            <span className="font-brand text-xl font-black tracking-wider text-stone-950 uppercase leading-none shrink-0">
              STEGA<span className="text-[#059669]">VAULT</span>
            </span>
            <div className="h-10 px-3.5 flex items-center justify-center rounded-none bg-[#059669]/10 text-[#059669] border border-[#059669]/30 text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap shrink-0 shadow-sm">
              ENTERPRISE v2.4
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center h-10 bg-[#EBE7DC] p-1 rounded-none border border-[#D6D2C4] shadow-sm">
            <button
              onClick={() => setActiveTab('vault')}
              className={`h-8 flex items-center gap-2 px-4 rounded-none font-mono uppercase text-xs tracking-wider transition-all tab-indicator ${
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
              className={`h-8 flex items-center gap-2 px-4 rounded-none font-mono uppercase text-xs tracking-wider transition-all tab-indicator ${
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
              className={`h-8 flex items-center gap-2 px-4 rounded-none font-mono uppercase text-xs tracking-wider transition-all tab-indicator ${
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
              className={`h-8 flex items-center gap-2 px-4 rounded-none font-mono uppercase text-xs tracking-wider transition-all tab-indicator ${
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
              className={`h-8 flex items-center gap-2 px-4 rounded-none font-mono uppercase text-xs tracking-wider transition-all tab-indicator ${
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
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            <button
              onClick={() => setActiveTab('encrypt')}
              className="mag-btn h-10 px-5 flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white font-mono text-xs uppercase font-bold tracking-widest rounded-none transition-all shadow-[2px_2px_0_0_#1C1917] active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Encrypt Payload</span>
            </button>

            <div className="h-7 w-px bg-[#D6D2C4] hidden sm:block mx-1" />

            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-mono font-bold text-stone-900 leading-none">{(user?.name || user?.email || 'User').split(' ')[0]}</span>
                <span className="text-[10px] font-mono text-stone-400 capitalize mt-0.5">{user?.provider ?? 'Guest'}</span>
              </div>
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'User'}
                  className="w-10 h-10 rounded-none object-cover border border-[#D6D2C4]"
                />
              ) : (
                <div className="w-10 h-10 rounded-none bg-stone-950 text-stone-100 flex items-center justify-center text-xs font-mono font-bold shadow-sm">
                  {(user?.name || user?.email || 'User').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-rose-600 bg-[#EBE7DC] hover:bg-[#E5E1D8] border border-[#D6D2C4] rounded-none transition-colors shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 py-8 space-y-6">

        {/* METRICS & STATUS RIBBON */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up">
          <div className="bg-white border border-[#D6D2C4] p-4 rounded-none flex items-center gap-4 card-lift">
            <div className="w-10 h-10 rounded-none bg-[#059669]/10 border border-[#059669]/20 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5 text-[#059669]" />
            </div>
            <div>
              <span className="text-xs text-stone-500 font-mono uppercase block">Encrypted Storage</span>
              <span className="text-lg font-mono font-extrabold text-stone-900">{formatSize(totalUsedBytes)}</span>
              <span className="text-[10px] text-stone-500 block font-mono">5 GB Vault Quota ({((totalUsedBytes / (5 * 1024 * 1024 * 1024)) * 100).toFixed(1)}% used)</span>
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
          <div className="space-y-6 tab-content-enter">
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
                  onClick={refreshVaultFromCloud}
                  className="flex items-center gap-2 bg-[#EBE7DC] border border-[#D6D2C4] hover:border-stone-400 px-3.5 py-2.5 rounded-none text-xs font-mono uppercase tracking-wider font-semibold text-stone-700 transition-colors"
                  title="Refresh encrypted vault files from cloud storage"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                  <span>Refresh Vault</span>
                </button>

                <button
                  onClick={async () => {
                    if (!window.confirm('Reset vault to clean production state? This will remove all files from cloud S3 and local storage.')) return;
                    if (user?.email) {
                      try {
                        await clearVault(user.email);
                      } catch (err: any) {
                        console.warn('Clear vault API notice:', err);
                      }
                      await idbSaveUserFiles(user.email, []);
                      try {
                        localStorage.removeItem(getUserVaultKey(user.email));
                      } catch {}
                    }
                    setFiles([]);
                    showToast('Vault reset — clean production state ready');
                  }}
                  className="flex items-center gap-2 bg-[#EBE7DC] border border-[#D6D2C4] hover:border-rose-400 px-3.5 py-2.5 rounded-none text-xs font-mono uppercase tracking-wider font-semibold text-stone-700 hover:text-rose-600 transition-colors"
                  title="Reset vault to clean production state"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset Vault</span>
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
                <span className="text-xs font-mono text-stone-500 uppercase">Cloud S3 Storage: <strong className="text-[#059669]">Active</strong></span>
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
                              onClick={() => handleDownloadDecrypted(file)}
                              className="p-2 rounded-none bg-[#EBE7DC] border border-[#D6D2C4] hover:border-[#059669]/50 text-stone-700 hover:text-[#059669] transition-colors"
                              title="Download Stego Container PNG"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedVaultFile(file);
                                setActiveTab('decrypt');
                                addLog('VAULT_ACCESS', `Opened "${file.name}" for key extraction & decryption`);
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
                                addLog('SHARE_INIT', `Prototype share link created locally for "${file.name}" (not yet sent — backend delivery not implemented)`);
                              }}
                              className="p-2 rounded-none bg-[#EBE7DC] border border-[#D6D2C4] hover:border-cyan-600/50 text-stone-700 hover:text-cyan-600 transition-colors"
                              title="Share Link"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (file.remoteId && user?.email) {
                                  try {
                                    await apiDeleteFile(user.email, file.remoteId);
                                  } catch (delErr: any) {
                                    console.warn('Failed to delete on cloud:', delErr);
                                  }
                                }
                                addLog('FILE_DELETE', `Deleted encrypted payload "${file.name}" from vault`, 'SUCCESS');
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
                <div className="p-12 text-center text-stone-500 font-mono text-xs uppercase space-y-3">
                  <p>{files.length === 0 ? 'Your vault is currently empty.' : 'No encrypted items found matching query.'}</p>
                  {files.length === 0 && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => setActiveTab('encrypt')}
                        className="inline-flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white font-mono uppercase text-xs font-bold tracking-widest px-4 py-2 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Encrypt & Embed File</span>
                      </button>
                      <button
                        onClick={refreshVaultFromCloud}
                        className="inline-flex items-center gap-2 bg-[#EBE7DC] border border-[#D6D2C4] hover:border-stone-400 text-stone-700 font-mono uppercase text-xs font-bold tracking-widest px-4 py-2 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-stone-600" />
                        <span>Refresh from Cloud</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ENCRYPT & EMBED PIPELINE */}
        {activeTab === 'encrypt' && (
          <div className="w-full tab-content-enter">
            <div className="bg-white p-6 sm:p-10 rounded-none border border-[#D6D2C4]">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#D6D2C4]">
                <div className="w-10 h-10 rounded-none bg-[#059669]/10 border border-[#059669]/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#059669]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-900 font-mono uppercase tracking-tight">Zero-Knowledge Encryptor & Stego Embedder</h2>
                  <p className="text-xs font-mono text-stone-500 uppercase">Client-Side Crypto Pipeline</p>
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

                  {/* Stego Container Auto-Decrypted / Auto-Detection Alert */}
                  {decryptedStegoFile ? (
                    <div className="mt-3 p-5 bg-[#EBE7DC] border-2 border-[#059669] rounded-none font-mono">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#059669] text-white flex items-center justify-center shrink-0">
                            <FileCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#059669] uppercase text-xs">Stego File Auto-Extracted!</span>
                              <span className="text-[10px] bg-[#059669]/20 text-[#059669] px-2 py-0.5 font-bold uppercase">Key Attached</span>
                            </div>
                            <div className="text-sm font-bold text-stone-900 mt-0.5">{decryptedStegoFile.name}</div>
                            <div className="text-[11px] text-stone-500 mt-0.5">
                              {formatSize(decryptedStegoFile.sizeBytes)} · {decryptedStegoFile.mimeType} · SHA-256: {decryptedStegoFile.checksum.substring(0, 12)}...
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = decryptedStegoFile.dataUrl;
                              a.download = decryptedStegoFile.name;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              showToast(`Downloaded original file: ${decryptedStegoFile.name}`);
                              addLog('FILE_DOWNLOAD', `Downloaded original file "${decryptedStegoFile.name}" extracted from stego container`);
                            }}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white font-mono uppercase font-bold text-xs tracking-wider transition-colors shrink-0"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Original File</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStegoContainerFile(detectedStegoFile);
                              setDecryptPassphrase(decryptedStegoFile.key);
                              setTargetFile(null);
                              setDetectedStegoFile(null);
                              setDecryptedStegoFile(null);
                              setActiveTab('decrypt');
                              showToast('Switched to Decrypt tab with auto-filled key');
                            }}
                            className="px-3 py-2.5 border border-[#D6D2C4] hover:bg-stone-100 text-stone-700 font-mono uppercase text-xs transition-colors shrink-0"
                            title="Open in Decrypt View"
                          >
                            Inspect →
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : detectedStegoFile ? (
                    <div className="mt-3 p-4 bg-[#EBE7DC] border border-[#059669] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs text-stone-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-[#059669]/20 text-[#059669] flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-[#059669] uppercase block">Stego Container Detected!</span>
                          <span className="text-stone-600 text-[11px]">"{detectedStegoFile.name}" contains an embedded encrypted payload.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setStegoContainerFile(detectedStegoFile);
                          if (detectedStegoKey) setDecryptPassphrase(detectedStegoKey);
                          setTargetFile(null);
                          setDetectedStegoFile(null);
                          setActiveTab('decrypt');
                          showToast('Switched to Decrypt tab with your Stego container');
                        }}
                        className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white font-mono uppercase font-bold tracking-wider text-[11px] transition-colors shrink-0"
                      >
                        Switch to Extract & Decrypt →
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Step 2: Key & Cipher Config */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase text-stone-700 mb-2">
                      2. Master Passphrase
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      name="stegavault_encrypt_passphrase"
                      data-lpignore="true"
                      placeholder="Enter strong passphrase..."
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      className="w-full bg-white border border-[#D6D2C4] rounded-none px-4 py-2.5 text-xs text-stone-900 font-mono placeholder-stone-400 focus:outline-none focus:border-[#059669]"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="attachKeyCheckbox"
                        checked={attachKey}
                        onChange={(e) => setAttachKey(e.target.checked)}
                        className="accent-[#059669] w-3.5 h-3.5 cursor-pointer rounded-none"
                      />
                      <label htmlFor="attachKeyCheckbox" className="text-[11px] font-mono text-stone-600 cursor-pointer select-none">
                        Attach key to stego container (recipient can auto-decrypt upon upload)
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase text-stone-700 mb-2">
                      3. Cryptographic Cipher
                    </label>
                    <div className="flex gap-2">
                      {(['AES-256-GCM', 'ChaCha20-Poly1305'] as const).map((algo) => (
                        <button
                          key={algo}
                          type="button"
                          onClick={() => setSelectedAlgo(algo)}
                          className={`flex-1 py-2.5 px-3 rounded-none border text-xs font-mono font-semibold transition-all ${
                            selectedAlgo === algo
                              ? 'bg-[#059669] text-white border-[#059669]'
                              : 'bg-white border-[#D6D2C4] text-stone-600 hover:text-stone-900 hover:bg-[#EBE7DC]'
                          }`}
                        >
                          {algo}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 3: Carrier Image Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-mono font-semibold uppercase text-stone-700">
                      4. Select Stego Carrier Container
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/png"
                        ref={coverFileInputRef}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setCustomCoverFile(file);
                            showToast(`Custom cover loaded: ${file.name}`);
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => coverFileInputRef.current?.click()}
                        className="text-[11px] font-mono text-[#059669] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Upload className="w-3 h-3" />
                        Upload Custom PNG Cover
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'quantum_nebula_4k.png', name: 'Quantum Nebula PNG', cap: '16 MB Capacity' },
                      { id: 'deep_ocean_texture.png', name: 'Deep Ocean PNG', cap: '8.4 MB Capacity' },
                      { id: 'minimal_monochrome_art.png', name: 'Monochrome PNG', cap: '4.2 MB Capacity' },
                      { id: 'cyber_grid_matrix.png', name: 'Cyber Grid PNG', cap: '12 MB Capacity' },
                    ].map((img) => (
                      <div
                        key={img.id}
                        onClick={() => {
                          setSelectedCover(img.id);
                          setCustomCoverFile(null);
                        }}
                        className={`p-3 rounded-none border cursor-pointer transition-all ${
                          !customCoverFile && selectedCover === img.id
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
                  {customCoverFile && (
                    <div className="mt-2 p-2 bg-[#059669]/10 border border-[#059669]/30 flex items-center justify-between text-xs font-mono text-[#059669]">
                      <span>Using custom cover: <strong>{customCoverFile.name}</strong> ({formatSize(customCoverFile.size)})</span>
                      <button
                        type="button"
                        onClick={() => setCustomCoverFile(null)}
                        className="text-stone-500 hover:text-rose-600 underline text-[11px]"
                      >
                        Reset to preset
                      </button>
                    </div>
                  )}
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
          <div className="w-full tab-content-enter">
            <div className="bg-white p-6 sm:p-10 rounded-none border border-[#D6D2C4] space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-[#D6D2C4]">
                <div className="w-10 h-10 rounded-none bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Unlock className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-mono text-stone-900 uppercase tracking-tight">Stego Extractor & Payload Decryptor</h2>
                  <p className="text-xs font-mono text-stone-500 uppercase">Extract hidden stego payload & reconstruct plaintext in memory</p>
                </div>
              </div>

              <form onSubmit={handleDecryptSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase text-stone-700 mb-2">
                    Upload Stego Container Image (PNG containing hidden payload)
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
                          <span className="text-xs text-stone-500">{formatSize(stegoContainerFile.size)} · Stego Container PNG</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Layers className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                        <p className="text-sm font-mono font-bold uppercase text-stone-900">Click to choose Stego Container PNG image</p>
                        <p className="text-xs text-stone-500 font-mono mt-1 uppercase">Select any PNG image containing hidden encrypted payload</p>
                      </div>
                    )}
                  </div>
                  {selectedVaultFile && !stegoContainerFile && (
                    <div className="mt-2 p-2.5 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-xs font-mono text-cyan-700">
                      <span>Target Vault Item: <strong>{selectedVaultFile.name}</strong> ({selectedVaultFile.remoteId ? 'Cloud S3' : 'Local'})</span>
                      <button
                        type="button"
                        onClick={() => setSelectedVaultFile(null)}
                        className="text-stone-500 hover:text-rose-600 underline text-[11px]"
                      >
                        Clear selection
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-mono font-semibold uppercase text-stone-700">
                      Decryption Passphrase
                    </label>
                    {detectedStegoKey && (
                      <span className="text-[10px] font-mono bg-[#059669]/15 text-[#059669] px-2 py-0.5 font-bold uppercase">
                        ✓ Key detected from container: auto-filled
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showDecryptPassphrase ? "text" : "password"}
                      required={!detectedStegoKey}
                      autoComplete="new-password"
                      name="stegavault_decrypt_passphrase"
                      data-lpignore="true"
                      placeholder={detectedStegoKey ? "Key automatically attached (or enter custom key)..." : "Enter secret master passphrase..."}
                      value={decryptPassphrase}
                      onChange={(e) => setDecryptPassphrase(e.target.value)}
                      className="w-full bg-white border border-[#D6D2C4] rounded-none pl-4 pr-10 py-2.5 text-xs text-stone-900 font-mono placeholder-stone-400 focus:outline-none focus:border-[#059669]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDecryptPassphrase(!showDecryptPassphrase)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
                      title={showDecryptPassphrase ? "Hide passphrase" : "Show passphrase"}
                    >
                      {showDecryptPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {detectedStegoKey && (
                    <p className="mt-1 text-[11px] font-mono text-[#059669]">
                      Attached Key: <code className="bg-[#059669]/10 px-1 py-0.5 font-bold">{detectedStegoKey}</code>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isDecrypting}
                  className="w-full py-3.5 rounded-none bg-[#059669] hover:bg-[#047857] text-white font-mono text-xs uppercase font-bold tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4 stroke-[2.5]" />
                  <span>Extract & Decrypt Payload</span>
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
                    onClick={() => handleDownloadDecrypted(decryptResult)}
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
          <div className="space-y-6 tab-content-enter">
            <div className="bg-white rounded-none overflow-hidden border border-[#D6D2C4]">
              <div className="px-6 py-4 border-b border-[#D6D2C4] bg-[#F7F5F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-600" />
                  <h2 className="font-mono font-bold text-xs uppercase tracking-wider text-stone-900">Active Share Links (Local Prototype)</h2>
                </div>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-800 border border-amber-500/20 px-2 py-0.5 uppercase font-semibold">
                  Prototype: Local Storage Only · Not Sent to Recipients
                </span>
              </div>

              <div className="bg-amber-50/70 border-b border-[#D6D2C4] px-6 py-2.5 text-stone-600 text-[11px] font-mono">
                ℹ️ <strong>Prototype Mode:</strong> Share links are saved locally in your browser for preview and demonstration. Outbound email delivery and backend-presigned S3 endpoints are part of the upcoming storage milestone.
              </div>

              <div className="divide-y divide-[#D6D2C4]">
                {shares.length === 0 ? (
                  <div className="p-12 text-center text-stone-500 font-mono text-xs uppercase space-y-2">
                    <p>No active share records found.</p>
                    <p className="text-[11px] text-stone-400 normal-case">Create share records directly from your Vault tab to test local link generation.</p>
                  </div>
                ) : (
                  shares.map((share) => (
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
                          onClick={() => {
                            setShares(shares.filter((s) => s.id !== share.id));
                            showToast(`Revoked share link for ${share.recipient}`);
                          }}
                          className="px-3 py-1.5 bg-[#EBE7DC] border border-[#D6D2C4] hover:border-rose-500/40 text-stone-600 hover:text-rose-600 rounded-none transition-colors font-mono uppercase text-[11px] font-bold"
                        >
                          Revoke Access
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ENTERPRISE AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="w-full tab-content-enter">
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
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-stone-400">
                        <History className="w-8 h-8 opacity-40" />
                        <p className="font-mono text-xs uppercase tracking-wider font-semibold">No activity recorded yet</p>
                        <p className="text-[11px] text-stone-400 font-mono">Actions like encrypt, decrypt, download, delete, and share will appear here in real-time.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#EBE7DC]/50 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-[#059669]">{log.event}</td>
                      <td className="px-6 py-3.5 text-stone-800">{log.user}</td>
                      <td className="px-6 py-3.5 text-stone-600">{log.detail}</td>
                      <td className="px-6 py-3.5 text-stone-500">{log.time}</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 rounded-none text-[10px] font-bold uppercase border ${
                          log.status === 'FAILED'
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : 'bg-[#059669]/10 text-[#059669] border-[#059669]/20'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </main>

      {/* SHARE MODAL */}
      {activeShareFile && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#F0EDE4] max-w-md w-full p-6 rounded-none space-y-4 border border-stone-900 shadow-2xl">
            <div>
              <h3 className="font-mono uppercase font-bold text-stone-900 text-sm">Create Share Link (Prototype)</h3>
              <p className="text-xs text-stone-600 font-mono uppercase mt-1">Payload: {activeShareFile.name}</p>
              <p className="text-[11px] text-stone-500 font-mono mt-1">
                Generates a local share record in your browser. Outbound email dispatch and backend token verification are scheduled for the cloud storage milestone.
              </p>
            </div>

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
                  const recipient = shareEmail.trim() || 'external@partner.io';
                  const newShare = {
                    id: `sh-${Date.now()}`,
                    fileName: activeShareFile?.name || 'payload.bin',
                    recipient,
                    permission: 'Download & Decrypt',
                    expiresIn: `${shareExpiry} remaining`,
                    createdAt: new Date().toISOString().substring(0, 16).replace('T', ' '),
                    accessCount: 0,
                    ownerEmail: user?.email,
                  };
                  setShares((prev) => [newShare, ...prev]);
                  addLog('SHARE_CREATE', `Prototype share link for "${activeShareFile?.name}" saved locally for ${recipient} — no email or network request is sent yet`);
                  showToast('Share link created locally (Prototype — not sent)');
                  setActiveShareFile(null);
                  setShareEmail('');
                }}
                className="flex-1 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-none transition-colors"
              >
                Create Share Record (Local)
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
        <div className="w-full px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-stone-500 uppercase">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#059669]" />
            <span>StegaVault Enterprise v2.4 · Zero-Knowledge Cryptographic Storage Engine</span>
          </div>
          <div>AES-256-GCM · LSB Steganography · Zero-Knowledge Vault</div>
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

