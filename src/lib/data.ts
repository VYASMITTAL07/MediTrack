import {
  Activity,
  Ambulance,
  Brain,
  CalendarClock,
  FileCheck2,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users
} from "lucide-react";

export const portalNav = [
  { href: "/", label: "Home" },
  { href: "/patient/login", label: "Patient Login" },
  { href: "/doctor/login", label: "Doctor Login" },
  { href: "/admin/login", label: "Admin Login" },
  { href: "/appointments", label: "Book" },
  { href: "/ai-consult", label: "AI Consult" }
];

export const platformStats = [
  { label: "Patient records", value: "Lifetime", detail: "medical history in one place" },
  { label: "Appointments", value: "Live", detail: "slot holds and booking updates" },
  { label: "Report checks", value: "Fast", detail: "issuer and file review workflow" },
  { label: "Security", value: "PIN + RBAC", detail: "separate patient, doctor, admin access" }
];

export const featureCards = [
  {
    icon: Brain,
    title: "Symptom Review",
    description:
      "Patients can describe symptoms and get clear guidance on urgency, precautions, and the right specialist."
  },
  {
    icon: CalendarClock,
    title: "Live Booking",
    description:
      "Date-wise slots hold instantly across active sessions, reducing double-bookings and queue confusion."
  },
  {
    icon: FileCheck2,
    title: "Report Verification",
    description:
      "Upload reports, check issuer details, flag suspicious files, and keep verified documents attached to the record."
  },
  {
    icon: HeartPulse,
    title: "Lifetime Timeline",
    description:
      "Childhood vaccines, labs, scans, allergies, prescriptions, consults, and AI summaries in one view."
  },
  {
    icon: ShieldCheck,
    title: "Secure Identity",
    description:
      "PIN sign-in, email verification, document checks, role-based access, and audit-friendly architecture."
  },
  {
    icon: Ambulance,
    title: "Emergency Access",
    description:
      "SOS flows, nearby emergency-ready doctors, reminders, escalation prompts, and live alerts."
  }
];

export const doctors = [
  {
    id: "dr-ira",
    name: "Dr. Ira Mehta",
    specialty: "Cardiology",
    rating: 4.94,
    reviews: 428,
    distance: "1.8 km",
    experience: 14,
    fee: 1800,
    availability: "Live now",
    nextSlot: "Today, 4:30 PM",
    emergency: true,
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80",
    clinic: "MediTrack Precision Clinic"
  },
  {
    id: "dr-kabir",
    name: "Dr. Kabir Anand",
    specialty: "Neurology",
    rating: 4.88,
    reviews: 312,
    distance: "2.6 km",
    experience: 11,
    fee: 2200,
    availability: "3 slots left",
    nextSlot: "Tomorrow, 10:00 AM",
    emergency: false,
    image:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80",
    clinic: "NeuroVista Medical Hub"
  },
  {
    id: "dr-zoya",
    name: "Dr. Zoya Rahman",
    specialty: "Pulmonology",
    rating: 4.91,
    reviews: 286,
    distance: "3.1 km",
    experience: 9,
    fee: 1500,
    availability: "Available",
    nextSlot: "Fri, 1:15 PM",
    emergency: true,
    image:
      "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=600&q=80",
    clinic: "BreathWell Clinic"
  }
];

export const medicalTimeline = [
  {
    date: "2003-01-09",
    title: "Childhood immunization set",
    type: "Vaccination",
    summary: "DTP, MMR, Hepatitis B, and Polio vaccination schedule completed.",
    verified: true,
    aiSummary: "Foundational immunity record complete."
  },
  {
    date: "2016-07-22",
    title: "Allergy discovered",
    type: "Allergy",
    summary: "Mild Penicillin allergy after antibiotic exposure.",
    verified: true,
    aiSummary: "Flag Penicillin before every prescription."
  },
  {
    date: "2025-08-11",
    title: "Annual blood panel",
    type: "Lab report",
    summary: "Vitamin D mildly low; lipid markers normal.",
    verified: true,
    aiSummary: "Low-risk report. Repeat vitamin D after supplementation."
  },
  {
    date: "2026-01-24",
    title: "Cardiology preventive consult",
    type: "Consultation",
    summary: "Stress-related palpitations. ECG normal.",
    verified: true,
    aiSummary: "No acute abnormality. Monitor frequency and sleep quality."
  }
];

export const analyticsSeries = [
  { label: "Jan", health: 76, adherence: 68, risk: 32 },
  { label: "Feb", health: 79, adherence: 72, risk: 28 },
  { label: "Mar", health: 81, adherence: 75, risk: 24 },
  { label: "Apr", health: 84, adherence: 82, risk: 19 },
  { label: "May", health: 86, adherence: 85, risk: 16 },
  { label: "Jun", health: 88, adherence: 87, risk: 14 }
];

export const adminQueues = [
  { label: "Doctor verification", value: 12, icon: Stethoscope, tone: "text-cyan-300" },
  { label: "Suspicious reports", value: 7, icon: FileCheck2, tone: "text-amber-300" },
  { label: "Patient approvals", value: 28, icon: Users, tone: "text-emerald-300" },
  { label: "AI moderation", value: 4, icon: Sparkles, tone: "text-fuchsia-300" }
];

export const appointmentSlots = [
  { id: "slot-09", time: "09:00", available: true },
  { id: "slot-10", time: "10:30", available: true },
  { id: "slot-12", time: "12:00", available: false },
  { id: "slot-14", time: "14:00", available: true },
  { id: "slot-16", time: "16:30", available: true },
  { id: "slot-18", time: "18:00", available: false }
];

export const doctorTasks = [
  {
    patient: "Aarav Sharma",
    time: "09:30",
    reason: "Palpitations follow-up",
    risk: "Medium",
    record: "4 verified records"
  },
  {
    patient: "Mira Kapoor",
    time: "11:00",
    reason: "Blood pressure review",
    risk: "Low",
    record: "8 verified records"
  },
  {
    patient: "Rohan Iyer",
    time: "16:30",
    reason: "Chest discomfort",
    risk: "High",
    record: "Emergency flag"
  }
];

export const liveMetrics = [
  { label: "Appointments", value: "1,248", delta: "+18%" },
  { label: "Verified records", value: "92.4K", delta: "+31%" },
  { label: "AI consults", value: "18.7K", delta: "+24%" },
  { label: "Fraud blocked", value: "413", delta: "+11%" }
];

export const symptomSuggestions = [
  "Fever with cough for 3 days",
  "Chest pain during exercise",
  "Migraine and blurred vision",
  "Abdominal pain after meals"
];

export const emergencySignals = [
  "Severe chest pain",
  "Difficulty breathing",
  "Stroke symptoms",
  "Uncontrolled bleeding",
  "Loss of consciousness"
];

export const landingVisualBadges = [
  { icon: Activity, label: "Live vitals stream" },
  { icon: ShieldCheck, label: "Verified PHI vault" },
  { icon: Sparkles, label: "AI clinical copilot" }
];

export const nearbyCarePlaces = [
  {
    name: "Kokilaben Dhirubhai Ambani Hospital",
    type: "Hospital",
    specialty: "Multi-speciality",
    rating: 4.7,
    distance: "2.2 km",
    lat: 19.1312,
    lng: 72.8258
  },
  {
    name: "Lilavati Hospital and Research Centre",
    type: "Hospital",
    specialty: "Emergency and cardiac care",
    rating: 4.6,
    distance: "3.9 km",
    lat: 19.0502,
    lng: 72.8286
  },
  {
    name: "Nanavati Max Super Speciality Hospital",
    type: "Hospital",
    specialty: "Diagnostics and critical care",
    rating: 4.5,
    distance: "5.4 km",
    lat: 19.0958,
    lng: 72.8405
  },
  {
    name: "MediTrack Precision Clinic",
    type: "Clinic",
    specialty: "Preventive care",
    rating: 4.9,
    distance: "1.8 km",
    lat: 19.0691,
    lng: 72.8657
  }
];
