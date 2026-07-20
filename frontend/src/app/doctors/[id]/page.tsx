"use client";

import { useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  Award,
  MapPin,
  DollarSign,
  Star,
  Languages,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  BookOpen,
  MessageSquare,
  Users,
  CheckCircle,
  XCircle,
  BadgeCheck,
  Stethoscope,
  ArrowLeft,
  Phone,
  Video,
  Building2,
  ThumbsUp,
  Quote,
  Sparkles,
  CalendarCheck,
  UserCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewData {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  patient: { name: string; image?: string };
}

interface RelatedDoctorData {
  _id: string;
  userId: string;
  specialty: string;
  experienceYears: number;
  consultationFee: number;
  city: string;
  avgRating: number;
  reviewCount: number;
  imageUrl?: string;
  user: { name: string };
}

interface AvailabilitySlot {
  timeSlot: string;
  available: boolean;
}

interface DoctorDetails {
  _id?: string;
  userId: string;
  specialty: string;
  qualifications: string[];
  experienceYears: number;
  bio: string;
  consultationFee: number;
  city: string;
  languages: string[];
  avgRating: number;
  reviewCount: number;
  imageUrl?: string;
  verified?: boolean;
  user: { name: string; email: string; image?: string };
  availability: { day: string; startTime: string; endTime: string; slotDurationMins: number }[];
  consultationTypes?: string[];
}

type TabId = "overview" | "slots" | "reviews";

const getLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function RatingStars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const rounded = Math.round(rating * 2) / 2;
  const sizes = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" };
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const val = i + 1;
        const full = rounded >= val;
        const half = !full && rounded >= val - 0.5;
        return (
          <Star
            key={i}
            className={`${sizes[size]} ${
              full ? "fill-amber-400 text-amber-400"
              : half ? "fill-amber-200 text-amber-400"
              : "fill-slate-100 text-slate-200"
            }`}
          />
        );
      })}
    </div>
  );
}

function Avatar({ name, imageUrl, size = "md" }: { name: string; imageUrl?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const classes = {
    sm: "h-10 w-10 rounded-xl text-sm font-bold",
    md: "h-14 w-14 rounded-2xl text-base font-bold",
    lg: "h-24 w-24 md:h-32 md:w-32 rounded-3xl text-2xl font-black",
    xl: "h-28 w-28 md:h-36 md:w-36 rounded-3xl text-3xl font-black",
  }[size];
  const initials = name
    .split(" ")
    .filter((n) => !["dr.", "dr"].includes(n.toLowerCase()))
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden shrink-0 shadow-xl ring-4 ring-white border-2 border-white ${classes}`}>
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xl ring-4 ring-white ${classes}`}>
      {initials}
    </div>
  );
}

function ConsultTypeIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  if (t.includes("video")) return <Video className="h-3 w-3" />;
  if (t.includes("in") || t.includes("clinic")) return <Building2 className="h-3 w-3" />;
  if (t.includes("phone") || t.includes("call")) return <Phone className="h-3 w-3" />;
  return <Stethoscope className="h-3 w-3" />;
}

function SectionHeading({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
      <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">{icon}</div>
      <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex-1">{title}</h2>
      {badge}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full animate-pulse">
      <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="h-40 bg-gradient-to-r from-slate-200 to-slate-100" />
        <div className="px-6 pb-8 flex flex-col md:flex-row gap-6 items-start -mt-14 md:-mt-16">
          <div className="h-32 w-32 rounded-3xl bg-slate-200 shrink-0 ring-4 ring-white shadow-xl" />
          <div className="flex-1 pt-14 w-full flex flex-col gap-3">
            <div className="h-8 bg-slate-200 rounded-xl w-64" />
            <div className="h-4 bg-slate-100 rounded-lg w-40" />
            <div className="grid grid-cols-4 gap-4 mt-2 border-t border-slate-100 pt-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="h-48 bg-slate-100 rounded-3xl" />
          <div className="h-64 bg-slate-100 rounded-3xl" />
        </div>
        <div className="h-64 bg-slate-100 rounded-3xl" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const doctorId = resolvedParams.id;
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [dateOffset, setDateOffset] = useState(0);

  const { data: doctor, isLoading: isDoctorLoading, error: doctorError } = useQuery<DoctorDetails>({
    queryKey: ["doctor-profile", doctorId],
    queryFn: () => apiFetch(`/api/doctors/${doctorId}`),
  });

  const dateStr = selectedDate ? getLocalDateString(selectedDate) : "";
  const { data: availabilitySlots, isLoading: isSlotsLoading } = useQuery<AvailabilitySlot[]>({
    queryKey: ["doctor-availability", doctorId, dateStr],
    queryFn: () => apiFetch(`/api/doctors/${doctorId}/availability?date=${dateStr}`),
    enabled: !!dateStr,
    staleTime: 30_000,
  });

  const { data: reviews, isLoading: isReviewsLoading } = useQuery<ReviewData[]>({
    queryKey: ["doctor-reviews", doctorId],
    queryFn: () => apiFetch(`/api/doctors/${doctorId}/reviews`),
    staleTime: 60_000,
  });

  const { data: relatedDoctors, isLoading: isRelatedLoading } = useQuery<RelatedDoctorData[]>({
    queryKey: ["doctor-related", doctorId],
    queryFn: () => apiFetch(`/api/doctors/${doctorId}/related`),
    staleTime: 120_000,
  });

  const allDays: Date[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
  const visibleDays = allDays.slice(dateOffset, dateOffset + 7);

  const handleBookRedirect = () => {
    if (!doctor) return;
    const dateParam = selectedDate ? `&date=${getLocalDateString(selectedDate)}` : "";
    const slotParam = selectedSlot ? `&slot=${encodeURIComponent(selectedSlot)}` : "";
    const targetUrl = `/appointments/add?doctorId=${doctor.userId}${dateParam}${slotParam}`;
    if (!session?.user) {
      router.push(`/login?redirect=${encodeURIComponent(targetUrl)}`);
    } else {
      router.push(targetUrl);
    }
  };

  if (isDoctorLoading) return <SkeletonLoader />;

  if (doctorError || !doctor) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center flex-1 flex flex-col justify-center">
        <div className="rounded-3xl border border-red-100 bg-red-50 p-12 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Doctor Not Found</h2>
          <p className="text-sm mt-2 text-slate-500">This profile doesn&apos;t exist or may have been removed.</p>
          <Link href="/doctors" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white hover:bg-teal-500 transition-all shadow-md shadow-teal-600/20">
            <ArrowLeft className="h-4 w-4" /> Back to Doctors
          </Link>
        </div>
      </div>
    );
  }

  const isDoctor = session?.user?.role === "doctor";
  const availableCount = availabilitySlots?.filter((s) => s.available).length ?? 0;
  const bookedCount = availabilitySlots?.filter((s) => !s.available).length ?? 0;

  const TABS: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "overview", label: "Overview", icon: <BookOpen className="h-4 w-4" /> },
    { id: "slots", label: "Book Slot", icon: <CalendarIcon className="h-4 w-4" /> },
    { id: "reviews", label: "Reviews", icon: <MessageSquare className="h-4 w-4" />, count: reviews?.length },
  ];

  const metaStats = [
    { icon: <Award className="h-4 w-4 text-teal-600" />, label: "Experience", value: `${doctor.experienceYears} Years` },
    { icon: <MapPin className="h-4 w-4 text-teal-600" />, label: "Location", value: doctor.city || "—" },
    { icon: <DollarSign className="h-4 w-4 text-teal-600" />, label: "Consult Fee", value: `$${doctor.consultationFee}` },
    { icon: <Languages className="h-4 w-4 text-teal-600" />, label: "Languages", value: doctor.languages?.join(", ") || "English" },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <Link href="/" className="hover:text-teal-600 transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/doctors" className="hover:text-teal-600 transition-colors">Doctors</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-600 truncate max-w-[160px]">{doctor.user.name}</span>
        </nav>
      </div>

      {/* Hero Card */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="relative h-36 md:h-44 bg-gradient-to-r from-teal-700 via-teal-500 to-emerald-400 overflow-hidden">
            <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 right-24 h-32 w-32 rounded-full bg-white/5" />
            <div className="absolute top-4 right-1/3 h-16 w-16 rounded-full bg-emerald-300/20" />
            <Link href="/doctors" className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all">
              <ArrowLeft className="h-3.5 w-3.5" /> All Doctors
            </Link>
          </div>

          <div className="px-5 md:px-8 pb-7">
            <div className="flex flex-col md:flex-row gap-5 md:gap-7 items-start -mt-14 md:-mt-16">
              <Avatar name={doctor.user.name} imageUrl={doctor.imageUrl} size="xl" />
              <div className="flex-1 flex flex-col gap-4 w-full pt-2 md:pt-16">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">{doctor.user.name}</h1>
                      {doctor.verified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-full">
                          <BadgeCheck className="h-3.5 w-3.5" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">{doctor.specialty}</span>
                      {doctor.consultationTypes?.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full capitalize">
                          <ConsultTypeIcon type={t} />{t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl self-start shrink-0">
                    <RatingStars rating={doctor.avgRating} size="md" />
                    <div className="flex flex-col leading-none">
                      <span className="font-extrabold text-slate-900 text-sm">{doctor.avgRating > 0 ? doctor.avgRating.toFixed(1) : "—"}</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">{doctor.reviewCount} review{doctor.reviewCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100 pt-4">
                  {metaStats.map(({ icon, label, value }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">{icon}</div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                        <p className="text-sm font-bold text-slate-700 truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left: Tabs */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Tab bar */}
            <div className="flex gap-1 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === tab.id ? "bg-teal-600 text-white shadow-md shadow-teal-600/15" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="flex flex-col gap-5">
                {doctor.bio ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <SectionHeading icon={<Stethoscope className="h-4 w-4" />} title="About the Doctor" />
                    <p className="text-sm text-slate-600 leading-relaxed">{doctor.bio}</p>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <UserCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No biography added yet.</p>
                  </div>
                )}

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <SectionHeading icon={<BookOpen className="h-4 w-4" />} title="Qualifications & Credentials" />
                  {doctor.qualifications && doctor.qualifications.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {doctor.qualifications.map((q, i) => (
                        <span key={i} className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-xl text-xs font-semibold text-teal-800">
                          <CheckCircle className="h-3.5 w-3.5 text-teal-500 shrink-0" />{q}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No qualifications listed.</p>
                  )}
                </div>

                {doctor.availability && doctor.availability.length > 0 && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <SectionHeading
                      icon={<CalendarIcon className="h-4 w-4" />}
                      title="Weekly Schedule"
                      badge={<span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">Template</span>}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {doctor.availability.map((av, i) => (
                        <div key={i} className="flex items-center gap-3 bg-gradient-to-r from-teal-50/70 to-emerald-50/70 border border-teal-100 rounded-2xl p-3.5">
                          <div className="h-9 w-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                            <CalendarIcon className="h-4 w-4 text-teal-700" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-teal-900">{av.day}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {av.startTime} – {av.endTime}
                              <span className="ml-2 text-teal-600 font-semibold">· {av.slotDurationMins} min slots</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-4 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                      Go to the{" "}
                      <button onClick={() => setActiveTab("slots")} className="text-teal-600 font-bold hover:underline cursor-pointer">Book Slot</button>
                      {" "}tab to pick a real-time available slot.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Slots Tab */}
            {activeTab === "slots" && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionHeading icon={<CalendarCheck className="h-4 w-4" />} title="Available Time Slots" />
                {isDoctor ? (
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">Doctor accounts can&apos;t book appointments.</p>
                      <p className="text-xs text-amber-600 mt-0.5">Please sign in with a patient account to book.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Select a Date</p>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={dateOffset === 0}
                          onClick={() => { setDateOffset(Math.max(0, dateOffset - 7)); setSelectedDate(null); setSelectedSlot(null); }}
                          className="h-10 w-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="flex gap-2 flex-1 overflow-x-auto pb-1">
                          {visibleDays.map((day, i) => {
                            const isSel = selectedDate?.toDateString() === day.toDateString();
                            const isToday = day.toDateString() === new Date().toDateString();
                            return (
                              <button
                                key={i}
                                onClick={() => { setSelectedDate(day); setSelectedSlot(null); }}
                                className={`flex flex-col items-center px-3 py-2.5 rounded-2xl border transition-all shrink-0 cursor-pointer min-w-[68px] relative ${
                                  isSel ? "bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-600/20" : "bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:shadow-sm"
                                }`}
                              >
                                {isToday && (
                                  <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full whitespace-nowrap ${isSel ? "bg-white/25 text-white" : "bg-teal-600 text-white"}`}>
                                    Today
                                  </span>
                                )}
                                <span className="text-[9px] font-black uppercase tracking-wider mt-1">{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
                                <span className="text-xl font-black mt-0.5">{day.getDate()}</span>
                                <span className="text-[9px] font-semibold opacity-70">{day.toLocaleDateString("en-US", { month: "short" })}</span>
                              </button>
                            );
                          })}
                        </div>
                        <button
                          disabled={dateOffset + 7 >= 14}
                          onClick={() => { setDateOffset(Math.min(7, dateOffset + 7)); setSelectedDate(null); setSelectedSlot(null); }}
                          className="h-10 w-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {selectedDate ? (
                      <div className="border-t border-slate-100 pt-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-sm font-bold text-slate-700">
                            {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                          </p>
                          {availabilitySlots && availabilitySlots.length > 0 && (
                            <div className="flex items-center gap-3 text-[10px] font-semibold">
                              <span className="flex items-center gap-1 text-teal-600"><span className="h-2 w-2 rounded-full bg-teal-500 inline-block" />{availableCount} available</span>
                              <span className="flex items-center gap-1 text-slate-400"><span className="h-2 w-2 rounded-full bg-slate-300 inline-block" />{bookedCount} booked</span>
                            </div>
                          )}
                        </div>

                        {isSlotsLoading ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
                          </div>
                        ) : !availabilitySlots || availabilitySlots.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center flex flex-col items-center gap-2">
                            <XCircle className="h-8 w-8 text-slate-300" />
                            <p className="text-sm font-semibold text-slate-400">No schedule on this day</p>
                            <p className="text-xs text-slate-400">Try selecting a different date.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {availabilitySlots.map((slot) => {
                              const booked = !slot.available;
                              const isSel = selectedSlot === slot.timeSlot;
                              return (
                                <button
                                  key={slot.timeSlot}
                                  disabled={booked}
                                  onClick={() => setSelectedSlot(isSel ? null : slot.timeSlot)}
                                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                                    booked ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed line-through"
                                    : isSel ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/15 scale-[1.02]"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-teal-400 hover:bg-teal-50/40 cursor-pointer"
                                  }`}
                                >
                                  <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                  {slot.timeSlot}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {selectedSlot && (
                          <div className="mt-1 rounded-2xl bg-teal-50 border border-teal-200 p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-teal-800 min-w-0">
                              <Clock className="h-4 w-4 shrink-0" />
                              <span className="truncate">{selectedSlot}</span>
                              <span className="text-teal-400 shrink-0">·</span>
                              <span className="text-teal-700 truncate">{selectedDate.toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
                            </div>
                            <button onClick={handleBookRedirect} className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-teal-600/20 cursor-pointer shrink-0">
                              Confirm <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center flex flex-col items-center gap-2">
                        <CalendarIcon className="h-8 w-8 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-400">Pick a date above to see open slots</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionHeading
                  icon={<MessageSquare className="h-4 w-4" />}
                  title="Patient Reviews"
                  badge={reviews && reviews.length > 0 ? (
                    <span className="text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full">
                      {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                    </span>
                  ) : undefined}
                />

                {reviews && reviews.length > 0 && (
                  <div className="flex items-center gap-5 mb-6 p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100">
                    <div className="text-center shrink-0">
                      <p className="text-4xl font-black text-slate-900">{doctor.avgRating > 0 ? doctor.avgRating.toFixed(1) : "—"}</p>
                      <RatingStars rating={doctor.avgRating} size="md" />
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">{doctor.reviewCount} ratings</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter((r) => Math.round(r.rating) === star).length;
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500 font-medium w-4 text-right">{star}</span>
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                            <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-slate-400 w-4 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isReviewsLoading ? (
                  <div className="flex flex-col gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 animate-pulse">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-9 w-9 rounded-full bg-slate-200" />
                          <div className="flex flex-col gap-1.5"><div className="h-3 w-28 bg-slate-200 rounded" /><div className="h-2.5 w-20 bg-slate-100 rounded" /></div>
                        </div>
                        <div className="h-3 bg-slate-100 rounded w-full" />
                        <div className="h-3 bg-slate-100 rounded w-3/4 mt-1.5" />
                      </div>
                    ))}
                  </div>
                ) : !reviews || reviews.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center gap-3">
                    <ThumbsUp className="h-10 w-10 text-slate-200" />
                    <p className="text-sm font-semibold text-slate-400">No reviews yet</p>
                    <p className="text-xs text-slate-400">Be the first to review after your appointment.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-1">
                    {reviews.map((review) => (
                      <div key={review._id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:border-slate-200 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-400 text-white flex items-center justify-center text-xs font-black uppercase shrink-0">
                              {review.patient.name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{review.patient.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <RatingStars rating={review.rating} size="sm" />
                            <span className="text-xs font-bold text-amber-600">{review.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        {review.comment && (
                          <div className="flex gap-2.5 mt-2">
                            <Quote className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-600 leading-relaxed italic">{review.comment}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Sticky Booking Sidebar */}
          <div className="flex flex-col gap-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24 flex flex-col gap-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                  <CalendarCheck className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Book Consultation</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Select a date & slot to confirm</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Doctor</span>
                  <span className="font-bold text-slate-800 max-w-[140px] truncate text-right">{doctor.user.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Specialty</span>
                  <span className="font-bold text-slate-800">{doctor.specialty}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 mt-0.5">
                  <span className="text-slate-500 font-medium">Consultation Fee</span>
                  <span className="font-extrabold text-teal-600 text-sm">${doctor.consultationFee}</span>
                </div>
                {selectedDate && (
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
                    <span className="text-slate-500 font-medium">Date</span>
                    <span className="font-bold text-slate-800">{selectedDate.toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
                  </div>
                )}
                {selectedSlot && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Time Slot</span>
                    <span className="font-bold text-teal-700">{selectedSlot}</span>
                  </div>
                )}
              </div>

              {isDoctor ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 font-medium text-center">
                  Doctors cannot book consultations.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {!selectedDate && (
                    <p className="text-xs text-slate-400 text-center">
                      Go to{" "}
                      <button onClick={() => setActiveTab("slots")} className="text-teal-600 font-bold hover:underline cursor-pointer">
                        Book Slot
                      </button>{" "}
                      to pick a date & time.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleBookRedirect}
                    className={`w-full flex items-center justify-center gap-2 cursor-pointer rounded-xl py-3.5 text-sm font-bold text-white transition-all shadow-md active:scale-[0.98] ${
                      selectedSlot ? "bg-teal-600 hover:bg-teal-500 shadow-teal-600/20" : "bg-slate-800 hover:bg-slate-700"
                    }`}
                  >
                    <CalendarCheck className="h-4 w-4" />
                    {selectedSlot ? `Book — ${selectedSlot}` : "Book Appointment"}
                  </button>
                  {!session?.user && (
                    <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                      You&apos;ll be prompted to sign in before completing your booking.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Trust highlights */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Why Book Here</h4>
              {[
                { icon: <BadgeCheck className="h-4 w-4 text-teal-500" />, text: "Verified professional" },
                { icon: <Clock className="h-4 w-4 text-teal-500" />, text: "Instant slot confirmation" },
                { icon: <Star className="h-4 w-4 text-amber-400 fill-amber-400" />, text: `${doctor.avgRating > 0 ? doctor.avgRating.toFixed(1) + " avg" : "New"} patient rating` },
                { icon: <Languages className="h-4 w-4 text-teal-500" />, text: `Speaks ${doctor.languages?.join(", ") || "English"}` },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs font-medium text-slate-600">{icon} {text}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Doctors */}
        {!isRelatedLoading && relatedDoctors && relatedDoctors.length > 0 && (
          <div className="mt-12 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Users className="h-4 w-4 text-teal-600" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">Other {doctor.specialty} Specialists</h2>
              </div>
              <Link href={`/doctors?specialty=${encodeURIComponent(doctor.specialty)}`} className="text-xs font-bold text-teal-600 hover:text-teal-500 flex items-center gap-1 transition-colors">
                Browse all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {relatedDoctors.map((rel) => (
                <Link
                  key={rel._id}
                  href={`/doctors/${rel.userId}`}
                  className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-teal-200 transition-all flex flex-col gap-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={rel.user.name} imageUrl={rel.imageUrl} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900 group-hover:text-teal-600 transition-colors truncate">{rel.user.name}</p>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full inline-block mt-0.5">{rel.specialty}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <RatingStars rating={rel.avgRating} size="sm" />
                    <span className="text-xs font-bold text-slate-600 ml-0.5">{rel.avgRating > 0 ? rel.avgRating.toFixed(1) : "New"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1"><Award className="h-3 w-3 text-slate-400" /> {rel.experienceYears} Yrs</span>
                    <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3 text-slate-400 shrink-0" /> {rel.city}</span>
                    <span className="flex items-center gap-1 col-span-2"><DollarSign className="h-3 w-3 text-slate-400" /> ${rel.consultationFee} per consult</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-slate-900 group-hover:bg-teal-600 text-xs font-bold text-white transition-all mt-auto">
                    View Profile <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}