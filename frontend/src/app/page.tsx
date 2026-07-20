"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import {
  Search,
  MapPin,
  Calendar,
  Video,
  Star,
  Users,
  Award,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Clock,
  ThumbsUp,
  Activity,
  Heart,
  Sparkles,
  Stethoscope,
  Tag,
  User
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { toast } from "sonner";

// Static specialty fallbacks in case endpoint is empty
const STATIC_SPECIALTIES = [
  { name: "General Practitioner", icon: "🩺", desc: "For general health checkups" },
  { name: "Cardiologist", icon: "❤️", desc: "Heart & blood pressure care" },
  { name: "Dermatologist", icon: "✨", desc: "Skin, hair, & nail concerns" },
  { name: "Pediatrician", icon: "👶", desc: "Child health & vaccinations" },
  { name: "Psychiatrist", icon: "🧠", desc: "Mental health & counseling" },
  { name: "Orthopedician", icon: "🦴", desc: "Bone, joint, & muscle care" },
];

const TESTIMONIALS = [
  {
    quote: "MediBook changed how I connect with my cardiologist. The video consultation was crystal clear, and booking took less than two minutes.",
    author: "Robert Miller",
    role: "Heart Patient",
    rating: 5,
  },
  {
    quote: "As a busy mother, finding a pediatrician on short notice was always stressful. The AI symptom check helped me figure out what specialty I needed.",
    author: "Amanda Lewis",
    role: "Mother of 2",
    rating: 5,
  },
  {
    quote: "A seamless scheduling dashboard. I was able to upload my medical charts, and my doctor reviewed them before the consult started.",
    author: "Kenji Sato",
    role: "Regular Patient",
    rating: 5,
  },
];

const FAQS = [
  {
    q: "How does the AI Symptom Checker work?",
    a: "Our assistant takes your list of active symptoms, cross-references them against general medical guidelines, and suggests the correct physician specialty to consult.",
  },
  {
    q: "Is my personal healthcare data secure?",
    a: "Absolutely. We encrypt all consultation details, medical notes, and session credentials using state-of-the-art database security protocols.",
  },
  {
    q: "How do video appointments work?",
    a: "Once confirmed, you will receive a secure video consult link on your dashboard. Simply click 'Join Room' when the scheduled time arrives.",
  },
];

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  readingTime: number;
  authorName: string;
  publishedAt: string;
  status: string;
}

const FALLBACK_BLOGS: BlogPost[] = [
  {
    _id: "fb1",
    title: "10 Preventive Heart Health Tips for Adults",
    slug: "preventive-heart-health-tips",
    excerpt: "Understand the simple dietary adjustments and daily cardio schedules that reduce blood pressure and keep your heart healthy.",
    content: "",
    category: "Cardiology",
    tags: ["heart", "cardio"],
    readingTime: 5,
    authorName: "Dr. Arjun Mehta",
    publishedAt: "2026-07-15T00:00:00Z",
    status: "published",
  },
  {
    _id: "fb2",
    title: "Understanding Eczema: Causes & Treatment",
    slug: "understanding-eczema-causes-treatment",
    excerpt: "A comprehensive guide on managing seasonal skin flare-ups, triggers to avoid, and dermatologist-recommended daily moisturizers.",
    content: "",
    category: "Dermatology",
    tags: ["skin", "eczema"],
    readingTime: 4,
    authorName: "Dr. Priya Sharma",
    publishedAt: "2026-06-28T00:00:00Z",
    status: "published",
  },
  {
    _id: "fb3",
    title: "The Role of AI Triage in Modern Telehealth",
    slug: "role-ai-triage-telehealth",
    excerpt: "How automated symptom checking helps reduce clinical workloads and guides patients to the correct specialist faster.",
    content: "",
    category: "Health Tips",
    tags: ["ai", "telehealth"],
    readingTime: 6,
    authorName: "Dr. Sana Rashid",
    publishedAt: "2026-05-14T00:00:00Z",
    status: "published",
  },
];

interface Specialty {
  name: string;
  icon?: string;
  desc?: string;
}

interface DoctorUser {
  name: string;
}

interface DoctorInfo {
  _id: string;
  userId: string;
  specialty: string;
  bio?: string;
  avgRating: number;
  reviewCount: number;
  consultationFee: number;
  user: DoctorUser;
}

interface TopDoctorsResponse {
  doctors: DoctorInfo[];
}

export default function HomePage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");

  // Fetch Live Statistics
  const { data: stats } = useQuery({
    queryKey: ["stats-summary"],
    queryFn: () => apiFetch("/api/stats/summary"),
  });

  // Fetch Specialties
  const { data: specialties } = useQuery<Specialty[]>({
    queryKey: ["specialties"],
    queryFn: () => apiFetch("/api/specialties"),
  });

  // Fetch Top-Rated Doctors
  const { data: topDoctorsResponse } = useQuery<TopDoctorsResponse>({
    queryKey: ["top-doctors"],
    queryFn: () => apiFetch("/api/doctors?sort=rating&limit=6"),
  });

  const topDoctors = topDoctorsResponse?.doctors;

  // Fetch Latest Health Articles
  const { data: posts } = useQuery<BlogPost[]>({
    queryKey: ["blog-posts"],
    queryFn: () => apiFetch("/api/blog"),
  });

  const latestPosts = (posts && posts.length > 0) ? posts.slice(0, 3) : FALLBACK_BLOGS;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query && !city) {
      toast.warning("Please enter a specialty, doctor name, or city to filter.");
      return;
    }
    const params = new URLSearchParams();
    if (query) params.append("query", query);
    if (city) params.append("city", city);
    router.push(`/doctors?${params.toString()}`);
  };

  // Aggregated data for Recharts stats section
  const chartData = [
    { name: "Doctors", value: stats?.doctorsCount || 45 },
    { name: "Consultations", value: stats?.appointmentsCount || 180 },
    { name: "Avg Rating", value: (stats?.avgRating || 4.8) * 10 },
  ];

  return (
    <div className="flex flex-col w-full bg-slate-50 text-slate-800">
      
      {/* 1. Hero Section (60-70vh) */}
      <section className="relative min-h-[65vh] flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white px-4 py-16 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent opacity-60" />
        <div className="absolute top-10 left-10 h-32 w-32 rounded-full bg-teal-500/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col gap-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 self-center lg:self-start rounded-full bg-teal-500/10 border border-teal-500/20 px-3.5 py-1.5 text-xs font-bold text-teal-400 uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5" /> Next-Gen Doctor consultations
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
              Connect With Certified <br />
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
                Medical Professionals
              </span>
            </h1>
            <p className="max-w-xl text-base sm:text-lg text-slate-300 mx-auto lg:mx-0 leading-relaxed">
              Find verified specialists near you, check symptoms instantly using our AI Triage assistant, and book encrypted video consultations or clinic checkups.
            </p>

            {/* Embedded Search Form */}
            <form
              onSubmit={handleSearch}
              className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-3 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center max-w-2xl"
            >
              <div className="flex flex-1 items-center gap-2.5 px-3">
                <Search className="h-5 w-5 text-teal-400" />
                <input
                  type="text"
                  placeholder="Specialty (e.g. Cardiologist)..."
                  className="w-full bg-transparent py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="h-px bg-slate-800 sm:h-8 sm:w-px" />
              <div className="flex flex-1 items-center gap-2.5 px-3">
                <MapPin className="h-5 w-5 text-teal-400" />
                <input
                  type="text"
                  placeholder="City (e.g. New York)..."
                  className="w-full bg-transparent py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="cursor-pointer rounded-xl bg-teal-500 hover:bg-teal-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-md shadow-teal-500/25 transition-all text-center"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-2">
              <Link
                href="/doctors"
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-5 py-3 text-sm font-bold text-white transition-all"
              >
                Find a Doctor
              </Link>
              <Link
                href="/register?role=doctor"
                className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors"
              >
                Join as a Doctor
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Hero Illustration / Icon Card block */}
          <div className="lg:col-span-5 hidden lg:flex items-center justify-center">
            <div className="relative w-80 h-80 rounded-[40px] bg-gradient-to-tr from-teal-500 to-indigo-600 p-8 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="absolute inset-0.5 rounded-[38px] bg-slate-950/90 flex flex-col justify-between p-6">
                <div className="flex justify-between items-center">
                  <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-2 text-teal-400">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Live Doctor Agenda</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-2 w-24 rounded-full bg-slate-800" />
                  <div className="h-3 w-48 rounded-full bg-slate-700" />
                  <div className="h-3 w-36 rounded-full bg-slate-700/60" />
                </div>
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-800/80 p-3 rounded-2xl">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-sm">S</div>
                  <div className="flex-1">
                    <p className="text-xs font-bold">Dr. Sarah Jenkins</p>
                    <p className="text-[10px] text-teal-400 font-semibold">Cardiologist (Confirmed)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Search by Specialty Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl w-full">
        <div className="text-center flex flex-col gap-2 mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900">Search by Speciality</h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm">Click any category below to immediately browse certified specialists.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {(specialties || STATIC_SPECIALTIES).map((spec) => (
            <Link
              key={spec.name}
              href={`/doctors?specialty=${encodeURIComponent(spec.name)}`}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm hover:shadow-md hover:border-teal-500 transition-all hover:translate-y-[-2px] group"
            >
              <span className="text-4xl group-hover:scale-110 transition-transform duration-200">{spec.icon || "🩺"}</span>
              <div>
                <h4 className="font-bold text-slate-800 text-sm group-hover:text-teal-600 transition-colors">{spec.name}</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">{spec.desc || "Verified practitioner consultations."}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Top-Rated Doctors Grid/Carousel */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200/50 w-full">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900">Top-Rated Specialists</h2>
              <p className="text-slate-500 text-sm mt-1">Book consults with our highest-rated verified practitioners.</p>
            </div>
            <Link
              href="/doctors"
              className="cursor-pointer inline-flex items-center gap-1 text-sm font-bold text-teal-600 hover:text-teal-500 transition-colors"
            >
              Browse all doctors
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {!topDoctors || topDoctors.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-2xl border border-slate-100 bg-slate-50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topDoctors.map((doc: DoctorInfo) => (
                <div
                  key={doc._id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4 items-start">
                      <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-lg uppercase border border-teal-100 shrink-0">
                        {doc.user.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base hover:text-teal-600 transition-colors">
                          <Link href={`/doctors/${doc.userId}`}>{doc.user.name}</Link>
                        </h3>
                        <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                          {doc.specialty}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {doc.bio || "No biography provided by the practitioner."}
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {doc.avgRating > 0 ? `${doc.avgRating} (${doc.reviewCount})` : "New Profile"}
                    </span>
                    <span>Fee: **${doc.consultationFee}**</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. How Booking Works (3-step) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl w-full">
        <div className="text-center flex flex-col gap-2 mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900">How It Works</h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm">Consult with verified healthcare experts in three simple steps.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 text-lg font-bold">1</div>
            <h3 className="font-bold text-slate-800 text-base">Explore Specialists</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Search by medical specialty, location, availability schedule, or average rating scores.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 text-lg font-bold">2</div>
            <h3 className="font-bold text-slate-800 text-base">Book Appointment</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Choose between clinic visits or video consults, select a free slot, and send booking requests.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 text-lg font-bold">3</div>
            <h3 className="font-bold text-slate-800 text-base">Consult & Diagnose</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Attend the checkup, receive digital prescriptions, and leave reviews for the practitioner.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Video Consultation Highlight */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 flex flex-col gap-5">
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-teal-500/15 border border-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-400">
              <Video className="h-3.5 w-3.5" /> High Definition Encrypted Video Consultations
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              See Doctors From the <br />
              Comfort of Your Home
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
              Skip the waiting rooms. Connect directly via secure, low-latency, encrypted video calls. Perfect for consultations, follow-ups, skin assessments, and review of lab panels.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-teal-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">No software install required</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-teal-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">Fully compliant & secure data</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-3xl shadow-xl w-full max-w-sm flex flex-col gap-4">
              <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center text-slate-500 border border-slate-800 relative overflow-hidden">
                <Video className="h-8 w-8 text-slate-400" />
                <span className="absolute bottom-2 left-2 text-[9px] bg-slate-950/70 px-2 py-0.5 rounded text-teal-400 font-bold uppercase tracking-wider">Patient Camera Active</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Consultation Session #2839</span>
                <span className="text-emerald-400 flex items-center gap-1 font-bold animate-pulse">● Connected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Stats Section (Recharts) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Platform Growth Metrics</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            MediBook is onboarding hundreds of clinical providers and verifying customer consultation satisfaction. View platform summary statistics dynamically updated below.
          </p>
          <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-6">
            <div>
              <p className="text-3xl font-black text-teal-600">{stats?.doctorsCount || 45}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Specialists</p>
            </div>
            <div>
              <p className="text-3xl font-black text-indigo-600">{stats?.appointmentsCount || 180}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Completed</p>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-800">{stats?.avgRating || "4.8"}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Avg Rating</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-7 h-64 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorMetric)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 7. Patient Testimonials */}
      <section className="bg-slate-100/50 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200/50 w-full">
        <div className="mx-auto max-w-7xl">
          <div className="text-center flex flex-col gap-2 mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900">What Our Patients Say</h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm">Read verified feedback submitted post-consultation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((test, idx) => (
              <div key={idx} className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                <p className="text-xs italic text-slate-600 leading-relaxed font-medium">
                  &ldquo;{test.quote}&rdquo;
                </p>
                <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-6">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">{test.author}</h5>
                    <span className="text-[10px] text-slate-400">{test.role}</span>
                  </div>
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: test.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 mx-auto max-w-4xl w-full flex flex-col gap-10">
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-teal-600" />
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm">Find quick answers to common telehealth questions.</p>
        </div>
        <div className="flex flex-col gap-4">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <h4 className="font-bold text-slate-800 text-sm">{faq.q}</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Blog Preview / Health Tips */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200/50 w-full">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-teal-600" />
                Latest Health Articles
              </h2>
              <p className="text-slate-500 text-sm mt-1">Stay updated with professional tips from our verified physicians.</p>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm font-bold text-teal-600 hover:text-teal-500 transition-colors"
            >
              View All Articles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestPosts.map((blog) => {
              const date = new Date(blog.publishedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <div key={blog._id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                      <span>{date}</span>
                      <span>•</span>
                      <span>{blog.readingTime} min read</span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 text-teal-700 px-2 py-0.5 text-[10px] font-bold mb-3">
                      <Tag className="h-2.5 w-2.5" />
                      {blog.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm hover:text-teal-600 transition-colors leading-snug">
                      <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                    </h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">{blog.excerpt}</p>
                  </div>
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                      <User className="h-3 w-3 text-slate-400" />
                      <span>{blog.authorName}</span>
                    </div>
                    <Link href={`/blog/${blog.slug}`} className="text-xs font-bold text-teal-600 hover:text-teal-500 flex items-center gap-1">
                      Read Article
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
