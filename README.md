# MediBook: Telehealth, AI Triage & Doctor Scheduling Platform

> **🔗 Live Demo:** [https://medibook-six-hazel-q55sq2y5bh.vercel.app/](https://medibook-six-hazel-q55sq2y5bh.vercel.app/)

MediBook is a premium modern healthcare application designed to streamline virtual medical triage and scheduling. It features an AI-powered Symptom Checker assistant to direct patients to the correct specialty, a comprehensive doctor search directory with availability slots booking, dual patient/doctor dashboards, and an AI-Assisted Blog Generator for verified healthcare providers.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org) with TypeScript
- **Styling**: Vanilla CSS with modern flex/grid layouts and CSS variables
- **State & Data Fetching**: [TanStack React Query (v5)](https://tanstack.com/query) for optimized server state cache and synchronization
- **Authentication**: [Better Auth (Client)](https://www.better-auth.com/)
- **Icons & Visuals**: [Lucide React](https://lucide.dev)
- **Charts & Reports**: [Recharts](https://recharts.org) for interactive administrative metrics

### Backend
- **Runtime & Server**: Node.js with [Express](https://expressjs.com) (TypeScript configured via `tsx` compiler)
- **Database**: [MongoDB](https://www.mongodb.com/) (using native Node driver with indexes configured for optimized lookup)
- **Authentication**: [Better Auth (Server)](https://www.better-auth.com/) with MongoDB adapter
- **AI Integrations**: [OpenAI API](https://openai.com/) & [Groq API](https://groq.com/) (Llama-3.3-70b/GPT-4o-mini fallback models)

---

## 📂 Project Architecture

The repository is structured as a split monorepo split into two primary components:

```bash
shakil218/medibook
├── backend/            # Express REST API & Database Models
│   ├── api/            # Vercel Serverless Function entrypoints
│   ├── src/
│   │   ├── config/     # DB connections and Better Auth settings
│   │   ├── routes/     # Express route controllers (Appointments, AI, Blog, etc.)
│   │   ├── middlewares/# Auth checks & role requirements middlewares
│   │   ├── seed.ts     # Database seed automation script
│   │   └── server.ts   # Local development server entrypoint
│   └── tsconfig.json
│
└── frontend/           # Next.js Application Client
    ├── src/
    │   ├── app/        # Pages, layouts, and route handlings
    │   ├── components/ # Reusable UI components (Navbar, Assistant Widget)
    │   ├── lib/        # API client helpers & auth-client instance
    │   └── styles/
    └── tsconfig.json
```

---

## ⚙️ Configuration & Environment Variables

You need to create a `.env` file in both the `/backend` and `/frontend` folders to run the application.

### Backend Environment Variables (`/backend/.env`)
Create `/backend/.env` with:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
BETTER_AUTH_SECRET=your_better_auth_secret_key
BETTER_AUTH_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# AI Provider Keys
GROQ_API_KEY=your_groq_key             # Used as standard AI triage provider
OPENAI_API_KEY=your_openai_key         # Fallback AI triage provider

# Social Provider Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Frontend Environment Variables (`/frontend/.env`)
Create `/frontend/.env` with:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_IMGBB_API_KEY=your_imgbb_api_key  # For doctor/patient avatar uploads
```

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org) (v20+ recommended) and a running instance of [MongoDB](https://www.mongodb.com/) (local or MongoDB Atlas).

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Seed the database with sample doctors, profile templates, and schedules:
   ```bash
   npm run seed
   ```
4. Start the Express development server:
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:5000`.

### 3. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to explore the dashboard.

---

## ☁️ Production Deployment

### 🌟 Cross-Origin Cookies & CORS Configuration
To allow authentication and requests to work across split production URLs (e.g. frontend on Vercel, backend API on a server or Vercel Serverless Functions):

1. **Better Auth configuration** (`/backend/src/config/auth.ts`) is set up to automatically strip trailing slashes and normalize URLs.
2. In production (`NODE_ENV === 'production'`), Better Auth will set session cookies using **`SameSite=None`** and **`Secure=true`**, enabling cross-site authentication checks.
3. CORS middleware allows credentials and validates incoming origins against `FRONTEND_URL`. Make sure to **never** use trailing slashes on environment variables like `FRONTEND_URL` and `BETTER_AUTH_URL` on your hosting provider platform (Vercel/Render/etc.) to avoid CORS blocks.
