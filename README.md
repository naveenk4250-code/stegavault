# 🔐 StegaVault Enterprise

> **Zero-knowledge cryptographic steganography platform** — hide encrypted secrets inside ordinary images.

🌐 **Live Demo:** https://stegavault-web.vercel.app?_vercel_share=OrfbTR3SdKqhlP0OqIUhbRfNrqEteWov


💻 **Source Code:** [https://github.com/naveenk4250-code/stegavault](https://github.com/naveenk4250-code/stegavault)

---

## 🚀 What is StegaVault?

StegaVault is a full-stack security-focused application demonstrating zero-knowledge client-side encryption and steganography, backed by a production-shaped NestJS architecture ready for scalable cloud storage. It combines two core security layers:

- **Cryptography** — Encrypts your secret files in-browser using authenticated AES-256-GCM via the Web Crypto API (`crypto.subtle`) with keys derived via PBKDF2 (250,000 iterations, SHA-256).
- **Steganography** — Embeds the ciphertext into innocent-looking PNG images using real 1-bit spatial LSB (Least Significant Bit) pixel manipulation via the Canvas API.

The result? An image that looks visually indistinguishable from the original cover photo, but secretly carries encrypted binary data — tamper-evident and impossible to extract without the master passphrase.

---

## 🎯 Current Scope vs. Architecture Roadmap

| Component | Status | Implementation Details |
|-----------|--------|------------------------|
| **Client-Side AES-256-GCM** | ✅ **Fully Implemented** | Native Web Crypto API, per-file 16-byte random salt, 12-byte random IV, 16-byte GCM authentication tag. |
| **1-Bit LSB Pixel Embedding** | ✅ **Fully Implemented** | HTML5 Canvas API, 3-channel (RGB) spatial LSB encoding, 32-bit length header, lossless PNG output. |
| **Passphrase Key Derivation** | ✅ **Fully Implemented** | PBKDF2 with 250,000 iterations, SHA-256 hash, per-session random salt. |
| **Integrity & Checksum Verification** | ✅ **Fully Implemented** | SHA-256 cryptographic digests computed on raw plaintext and verified upon decryption. |
| **Local Vault & Audit Trail** | ✅ **Fully Implemented** | User-isolated client vault state, detailed event logging with cryptographic status tags. |
| **Multi-Device Cloud Persistence** | 🚧 **Architecture Scaffolded** | NestJS backend with Prisma ORM schema ready (`apps/api/prisma/schema.prisma`), designed for AWS S3 / Supabase storage. |
| **Authentication Architecture** | 🔄 **Evolved / Superseded** | Graphical password authentication (used in the SecureCloud predecessor) was superseded by industry-standard OAuth 2.0 (Google, Discord) and client-side session management for stronger enterprise security. The schema field (`graphical_password_hash`) is preserved for potential future multi-factor evaluation. |
| **Multi-Factor Authentication (MFA)** | 🚧 **Architecture Scaffolded** | TOTP-based multi-factor authentication (database schema already supports it via `mfaTotpSecret` / `mfaEnabled`) — planned for implementation once backend authentication is connected. |
| **Role-Based Access Control (RBAC)** | 🚧 **Architecture Scaffolded** | Admin and user role hierarchy already modeled in Prisma schema (`Role` enum: `user` / `admin`) — designed for future enterprise multi-tenant and administrative team deployments. |




---

## ✨ Features

| Feature | Status | Description |
|---------|--------|-------------|
| 🔒 **AES-256-GCM Encryption** | **Implemented** | Hardware-accelerated, authenticated encryption via browser WebCrypto API |
| 🖼️ **1-Bit LSB Steganography** | **Implemented** | Embeds ciphertext bits into least significant pixel bits of PNG cover images |
| 🔑 **PBKDF2 Key Derivation** | **Implemented** | 256-bit key derived from user passphrase (250,000 iterations, SHA-256) |
| 🧠 **Zero-Knowledge Pipeline** | **Implemented** | All cryptographic operations execute entirely in the browser; keys never leave client memory |
| 📂 **Isolated Vault Storage** | **Implemented** | Per-user encrypted vault payload index with live SHA-256 hash tracking |
| 📋 **Security Audit Trail** | **Implemented** | Full event log capturing encryption, embedding, decryption, and access failures |
| 🌐 **Multi-Device S3 Storage** | **Next Milestone** | Schema and NestJS backend scaffolded for S3 presigned encrypted container sync |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT / BROWSER                              │
│                                                                         │
│  ┌──────────────┐     ┌────────────────┐     ┌───────────────────────┐  │
│  │ Target File  │────▶│ PBKDF2 (250k)  │────▶│ AES-256-GCM Cipher    │  │
│  └──────────────┘     │ Key Derivation │     │ [Salt][IV][Ciphertext]│  │
│                       └────────────────┘     └───────────┬───────────┘  │
│                                                          │              │
│                       ┌────────────────┐                 ▼              │
│                       │ Cover PNG      │────▶┌───────────────────────┐  │
│                       │ (RGB Channels) │     │ 1-Bit LSB Embedding   │  │
│                       └────────────────┘     │ (Canvas API)          │  │
│                                              └───────────┬───────────┘  │
│                                                          │              │
│                                                          ▼              │
│                                              ┌───────────────────────┐  │
│                                              │ Stego PNG Container   │  │
│                                              │ (Indistinguishable)   │  │
│                                              └───────────────────────┘  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ (Roadmap: Next Milestone)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PERSISTENCE & STORAGE BACKEND                        │
│                                                                         │
│   ┌────────────────────┐    ┌──────────────────┐   ┌────────────────┐   │
│   │ NestJS Backend API │───▶│ Prisma ORM       │──▶│ PostgreSQL     │   │
│   │ (OAuth & Auth)     │    │ (File Metadata)  │   │ (Supabase)     │   │
│   └─────────┬──────────┘    └──────────────────┘   └────────────────┘   │
│             │                                                           │
│             ▼                                                           │
│   ┌────────────────────┐                                                │
│   │ AWS S3 / Supabase  │                                                │
│   │ (Stego Containers) │                                                │
│   └────────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- **Node.js** v18+ (v20+ recommended)
- **npm** v9+

### 1. Clone the repository

```bash
git clone https://github.com/naveenk4250-code/stegavault.git
cd stegavault
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the frontend

```bash
npm run dev --workspace=apps/web
```
Open **http://localhost:5173** in your browser.

---

## 🔐 Testing the Application

1. **Log in**: Sign in using Google OAuth, Discord OAuth, or any test email via the login modal.
2. **Encrypt & Embed**: Go to the **Encrypt & Embed** tab, choose any secret file (e.g. text, PDF, image), enter a passphrase, and execute encryption.
3. **Download Stego Container**: From the Vault tab, download the generated Stego PNG file. The file looks like a normal image but contains your encrypted payload in its pixels.
4. **Extract & Decrypt**: Go to the **Extract & Decrypt** tab, select the stego container, enter your passphrase, and verify that the exact original file is restored. Try an incorrect passphrase to confirm that AES-GCM tag verification rejects it!

---

## 🌐 Deployment

### Frontend — Vercel (Live)
The frontend is deployed and hosted at:
**[https://stegavault-5l5qa68w1-naveen-k1.vercel.app](https://stegavault-5l5qa68w1-naveen-k1.vercel.app)**

Every push to the `main` branch automatically triggers a new Vercel deployment.

### Backend — Docker Compose
Run the NestJS API and PostgreSQL database locally or on any cloud VM:

```bash
docker-compose up --build -d
```

---

## 📸 Screenshots

| Landing Page | Vault Dashboard |
|---|---|
| Interactive feature showcase with LSB pixel inspector | Enterprise file vault with hash verification |

| Encrypt Pipeline | Audit Logs |
|---|---|
| 4-step zero-knowledge cryptographic pipeline | Tamper-evident full event audit trail |

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push -u origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Naveen K**
- GitHub: [@naveenk4250-code](https://github.com/naveenk4250-code)

  
- Live Project: [stegavault-5l5qa68w1-naveen-k1.vercel.app](https://stegavault-web.vercel.app?_vercel_share=OrfbTR3SdKqhlP0OqIUhbRfNrqEteWov)

---

<div align="center">
  <strong>⭐ If you found this project useful, please give it a star!</strong>
</div>
