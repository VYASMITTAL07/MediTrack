# 🏥 MediTrack — AI Powered Healthcare Management Platform

🚀 **Live Demo:** https://meditrack-six-psi.vercel.app/
⚡ Demo OTP for testing: 456321

MediTrack is a production-style full-stack healthcare SaaS platform built for patients, doctors, and healthcare administrators. The platform combines 🤖 AI-powered healthcare assistance, 📋 medical record management, ⚡ realtime appointment booking, 🧠 intelligent report verification, and 🔐 secure role-based authentication into one scalable ecosystem.

Designed with modern full-stack architecture using **Next.js 15, Prisma, PostgreSQL, Socket.io, Groq AI, and Vercel deployment infrastructure**.

---

# ✨ Key Features

## 👨‍⚕️ Patient Portal

* 🔐 Secure authentication system
* 🤖 AI-powered symptom analysis
* 🩺 AI healthcare consultation assistant
* 📅 Realtime appointment booking
* 🧾 Medical history timeline
* 📤 Report upload & verification
* 🔔 Live notifications & appointment tracking
* 🗺️ Doctor discovery with Maps integration
* 💾 Persistent healthcare records

---

## 🧑‍⚕️ Doctor Portal

* 📊 Dedicated doctor dashboard
* 📋 Patient medical history access
* 💊 Consultation & prescription management
* 📅 Appointment scheduling workflow
* ⚡ Realtime booking visibility
* 🧠 Patient monitoring architecture

---

## 🛡️ Admin Portal

* 📈 Platform analytics dashboard
* ✅ User verification workflows
* 🚨 Fraud/risk monitoring system
* 👥 Role-based administration
* 🏥 Healthcare ecosystem management

---

# 🤖 AI Features

* 🧠 AI Medical Consultation Assistant
* 📊 Symptom & disease analysis
* ⚠️ Urgency detection system
* 📄 AI report verification
* 💡 Patient-context-aware healthcare suggestions
* 🔍 Structured AI medical JSON responses
* ⚡ Groq-powered OpenAI-compatible AI integration

---

# ⚡ Realtime Infrastructure

* 📡 Live appointment booking updates
* 🔄 Slot synchronization
* 📢 Queue broadcasting
* ⚙️ Socket.io powered realtime events
* 👥 Multi-user booking consistency

---

# 🛠️ Tech Stack

## 🎨 Frontend

* Next.js 15
* React 19
* TypeScript
* Tailwind CSS
* Framer Motion
* GSAP
* Lucide Icons

---

## ⚙️ Backend

* Next.js API Routes
* Node.js
* Socket.io
* JWT Authentication
* RESTful APIs

---

## 🗄️ Database & ORM

* PostgreSQL
* Prisma ORM
* Transaction-safe booking engine

---

## 🤖 AI Integration

* Groq API
* OpenAI-compatible SDK
* Structured AI responses
* AI healthcare workflows

---

## ☁️ Cloud & Deployment

* Vercel
* Neon PostgreSQL
* Cloudinary-ready uploads
* Google Maps API integration

---

# 🧱 Architecture Highlights

## 🔒 Secure Authentication

* JWT session architecture
* Password authentication
* Optional email OTP support
* Role-based access control
* Protected API routes

---

## 📅 Scalable Booking System

* Prisma transaction locking
* Slot capacity protection
* Duplicate booking prevention
* Queue management
* Realtime synchronization

---

## 🧾 Medical Record Infrastructure

* Persistent medical history
* Timeline architecture
* Consultation records
* Prescription workflows
* Report verification pipeline

---

# 📂 Main Routes

| Route            | Description            |
| ---------------- | ---------------------- |
| `/`              | Landing page           |
| `/patient`       | Patient dashboard      |
| `/doctor`        | Doctor dashboard       |
| `/admin`         | Admin control center   |
| `/appointments`  | Realtime booking flow  |
| `/ai-consult`    | AI medical assistant   |
| `/patient/login` | Patient authentication |
| `/doctor/login`  | Doctor authentication  |
| `/admin/login`   | Admin authentication   |

---

# ⚙️ Environment Variables

```env
DATABASE_URL=

JWT_SECRET=

OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.3-70b-versatile

RESEND_API_KEY=
RESEND_FROM_EMAIL=

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

# 🚀 Local Development

## 📦 Install dependencies

```bash
npm install
```

## ⚙️ Setup environment variables

```bash
copy .env.example .env.local
```

## 🗄️ Run Prisma

```bash
npx prisma generate
npx prisma migrate dev
```

## ▶️ Start development server

```bash
npm run dev:realtime
```

Open:

```txt
http://localhost:3000
```

---

# 🌍 Production Deployment

🔗 Live Application:
https://meditrack-six-psi.vercel.app/

---

# 🧠 Engineering Highlights

✅ Full-stack production architecture
✅ AI-integrated healthcare workflows
✅ Realtime booking engine
✅ Persistent PostgreSQL-backed dashboards
✅ Modern responsive UI/UX
✅ Transaction-safe backend infrastructure
✅ Scalable API-driven design
✅ Cloud deployment ready

---

# 🔮 Future Improvements

* 📹 Video consultations
* 🪪 Aadhaar eKYC integration
* 🧠 Face liveness verification
* 📲 Push notifications
* 📊 Advanced analytics
* 🏥 Multi-hospital support
* 🔐 HIPAA-grade audit logging

---

# 👨‍💻 Developer

### Vyas Mittal

📧 Email: [vyas.mittal.12@gmail.com](mailto:vyas.mittal.12@gmail.com)
📱 Phone: +91 9027222011

---

# ⚠️ Disclaimer

This platform is developed for educational and portfolio purposes. AI-generated medical guidance should not be considered a replacement for licensed medical professionals or emergency healthcare services.
