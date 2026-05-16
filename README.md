# MediTrack Medical Record Management System

A production-ready full-stack starter for an AI-powered healthcare SaaS platform with separate patient, doctor, and admin portals, role-specific login/register pages, PIN sign-in, Aadhaar/face verification UI, real-time appointment booking, AI symptom analysis, medical history timelines, report verification, PostgreSQL models, Cloudinary-ready uploads, notifications, and Google Maps-ready doctor discovery.

## Stack

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, GSAP
- Backend: Next.js API routes plus optional custom Socket.io realtime server
- Database: PostgreSQL with Prisma
- Auth: JWT sessions, PIN sign-in, Aadhaar/face verification fields, Google OAuth-ready account linking
- AI: OpenAI SDK with safe local fallback responses when `OPENAI_API_KEY` is absent
- Storage: Cloudinary signed upload route
- Realtime: Socket.io slot holds, releases, bookings, and queue broadcasts
- Maps: Google Maps satellite mode plus Places search with demo fallback

## Quick Start

```bash
npm install
copy .env.example .env
docker compose up -d
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev:realtime
```

Open `http://localhost:3000`.

If Docker is not installed, point `DATABASE_URL` at any PostgreSQL database, then run the Prisma commands.

Seeded accounts all use `MediTrack@123`. Use **Send PIN** on the login screen to generate a fresh development PIN:

- `patient@meditrack.ai`
- `doctor@meditrack.ai`
- `admin@meditrack.ai`

## Role-Specific Access

- Patient login: `/patient/login`
- Doctor login: `/doctor/login`
- Admin login: `/admin/login`
- Patient registration: `/patient/register`
- Doctor registration: `/doctor/register`
- Admin registration: `/admin/register`

Registration requires either Aadhaar last-4 verification or face-scan consent, plus PIN. Production deployments should replace the development PIN and mock biometric fields with Aadhaar eKYC, DigiLocker, face liveness, or a compliant identity provider.

## Realtime Booking

Use `npm run dev:realtime` instead of `npm run dev` when you want Socket.io appointment updates. The server wraps Next.js and broadcasts:

- `slot:hold`
- `slot:released`
- `slot:booked`
- `slot:snapshot`

The database layer protects production bookings with slot capacity checks inside a Prisma transaction.

## AI Features

- `POST /api/ai/analyze`: disease/symptom analysis, urgency, health risk score, doctor recommendations, precautions
- `POST /api/ai/chat`: ChatGPT-style medical assistant with patient timeline context
- `POST /api/ai/verify-report`: OCR/authenticity-style verification response with suspicious upload flags

If `OPENAI_API_KEY` is empty, routes return deterministic local simulator responses so the product remains demo-ready.

## Production Environment

Set these values in `.env`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/meditrack?schema=public"
JWT_SECRET="replace-with-a-strong-32-byte-secret"
OPENAI_API_KEY="..."
OPENAI_MODEL="gpt-5.2"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_SOCKET_URL="https://your-domain.com"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_OAUTH_REDIRECT_URI="https://your-domain.com/api/auth/oauth/google/callback"
SMTP_HOST="..."
SMTP_USER="..."
SMTP_PASS="..."
SMS_PROVIDER_API_KEY="..."
```

## Main Routes

- `/`: cinematic landing page
- `/patient`: patient dashboard with AI consultation, disease analysis, timeline, reports, booking, doctors, maps, SOS
- `/doctor`: doctor dashboard with patient history, schedule, consultation form
- `/admin`: admin command center for verification, fraud monitoring, analytics
- `/appointments`: standalone real-time booking flow
- `/ai-consult`: AI assistant, symptom analysis, report verification, doctor matching
- `/login` and `/register`: role selection pages

## Security Notes

This starter includes the architecture and code paths for HIPAA-like safeguards, but real compliance requires legal, operational, infrastructure, and audit controls beyond code. Before production PHI use, add encryption-at-rest key management, audit logs, consent policies, access reviews, incident response, DPA/BAA workflows, and clinical safety review.
