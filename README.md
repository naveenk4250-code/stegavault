# 🔐 StegaVault Enterprise

> **Zero-knowledge cryptographic steganography platform** — hide encrypted secrets inside ordinary images.

🌐 **Live Demo:** [https://stegavault-5l5qa68w1-naveen-k1.vercel.app](https://stegavault-web.vercel.app?_vercel_share=OrfbTR3SdKqhlP0OqIUhbRfNrqEteWov)


💻 **Source Code:** [https://github.com/naveenk4250-code/stegavault](https://github.com/naveenk4250-code/stegavault)

---

## 🚀 What is StegaVault?

StegaVault is a **production-ready, enterprise-grade web application** that combines two powerful security techniques:

- **Cryptography** — Encrypts your secret files using military-grade AES-256-GCM or ChaCha20-Poly1305 ciphers.
- **Steganography** — Hides the encrypted data inside innocent-looking PNG images using 1-bit LSB (Least Significant Bit) pixel manipulation.

The result? A file that looks like a normal image but secretly carries encrypted, hidden data — invisible to the naked eye.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔒 **AES-256-GCM Encryption** | Hardware-accelerated, authenticated encryption via WebCrypto API |
| 🌊 **ChaCha20-Poly1305** | Mobile-optimized stream cipher for high-performance encryption |
| 🖼️ **1-Bit LSB Steganography** | Hides encrypted key bits in the least significant pixels of PNG cover images — imperceptible to human vision |
| 🧠 **Zero-Knowledge Pipeline** | All encryption/decryption happens entirely in your browser — no data ever leaves your device unencrypted |
| 🔑 **PBKDF2 Key Derivation** | 256-bit key derived from your passphrase using PBKDF2 with a 16-byte random salt |
| 📂 **Enterprise Vault** | Browse, filter, and manage all encrypted payloads with hash verification |
| 📤 **Secure File Sharing** | Generate time-limited presigned share links for encrypted payloads |
| 📋 **Audit Logs** | Full tamper-evident log of every encryption, decryption, and access event |
| 🌙 **Dark Mode UI** | Premium enterprise-grade dark theme with glassmorphism and micro-animations |

---

## 🛠️ Tech Stack

### Frontend (`apps/web`)
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19 | UI component framework |
| **Vite** | 8 | Lightning-fast build tool & dev server |
| **TypeScript** | 6 | Type-safe JavaScript |
| **Tailwind CSS** | v4 | Utility-first styling |
| **Lucide React** | latest | Icon library |
| **Zustand** | 5 | Lightweight state management |
| **React Router DOM** | 7 | Client-side routing |
| **React Hook Form** | 7 | Form handling & validation |
| **Zod** | 4 | Schema validation |

### Backend (`apps/api`)
| Technology | Version | Purpose |
|-----------|---------|---------|
| **NestJS** | latest | Scalable Node.js server framework |
| **Prisma ORM** | 7 | Type-safe database ORM |
| **PostgreSQL** | 15 | Production relational database |
| **Docker Compose** | — | Containerized local development |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                    │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │  File Input  │───▶│  PBKDF2 Key  │                  │
│  └──────────────┘    │  Derivation  │                  │
│                       └──────┬───────┘                  │
│                              │                          │
│                    ┌─────────▼────────┐                 │
│                    │  AES-256-GCM /   │                 │
│                    │  ChaCha20 Cipher │                 │
│                    └─────────┬────────┘                 │
│                              │                          │
│                    ┌─────────▼────────┐                 │
│                    │  1-bit LSB PNG   │                 │
│                    │  Steganography   │                 │
│                    └─────────┬────────┘                 │
│                              │                          │
│                    ┌─────────▼────────┐                 │
│                    │  Encrypted Blob  │                 │
│                    │  (Safe to share) │                 │
│                    └──────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
PHASE2_PROJECT/
├── apps/
│   ├── web/                    # React + Vite Frontend
│   │   ├── src/
│   │   │   ├── App.tsx         # Main authenticated workspace
│   │   │   ├── components/
│   │   │   │   └── LandingPage.tsx  # Interactive landing & auth
│   │   │   ├── index.css       # Global styles (Tailwind v4)
│   │   │   └── main.tsx        # React entry point
│   │   ├── vercel.json         # Vercel deployment config
│   │   ├── vite.config.ts      # Vite configuration
│   │   └── package.json
│   │
│   └── api/                    # NestJS Backend
│       ├── src/
│       │   ├── app.module.ts
│       │   ├── app.controller.ts
│       │   └── main.ts
│       ├── prisma/
│       │   └── schema.prisma   # Database schema
│       └── package.json
│
├── docker-compose.yml          # PostgreSQL + API local dev
├── vercel.json                 # Root Vercel config
└── package.json                # Monorepo workspace config
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- **Node.js** v18+ (v25 recommended)
- **npm** v9+
- **Docker Desktop** (for the PostgreSQL database)

### 1. Clone the repository

```bash
git clone https://github.com/naveenk4250-code/stegavault.git
cd stegavault
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the database

```bash
docker-compose up -d
```

### 4. Run database migrations

```bash
npm run db:migrate
```

### 5. Start the development servers

```bash
# Start both frontend and backend together
npm run dev

# Or start individually:
npm run web:dev    # Frontend only → http://localhost:5173
npm run api:dev    # Backend only  → http://localhost:3000
```

### 6. Open in browser

```
http://localhost:5173
```

---

## 🔐 Demo Credentials

Use these to log into the live demo:

| Field | Value |
|-------|-------|
| **Email** | `alex.mercer@enterprise.io` |
| **Master Key Passphrase** | `StegaVault@Enterprise2026` |

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

  
- Live Project: [stegavault-5l5qa68w1-naveen-k1.vercel.app](https://stegavault-5l5qa68w1-naveen-k1.vercel.app)

---

<div align="center">
  <strong>⭐ If you found this project useful, please give it a star!</strong>
</div>
