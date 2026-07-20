"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import {
  Search,
  MapPin,
  Star,
  DollarSign,
  Award,
  ArrowRight,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Video,
  Clock,
  X,
} from "lucide-react";

interface DoctorProfileData {
  _id: string;
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
  availability?: { day: string; startTime: string; endTime: string }[];
  user: { name: string; email: string; image?: string };
}

interface SearchResponse {
  doctors: DoctorProfileData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SPECIALTIES = [
  "General Practitioner","Cardiologist","Dermatologist","Pediatrician",
  "Psychiatrist","Orthopedician","Neurologist","Ophthalmologist",
];
const CITIES = [
  "New York","Chicago","San Francisco","Boston","Los Angeles","Seattle","Miami","Houston",
];

function RatingStars({ rating }: { rating: number }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const val = i + 1;
        const full = rounded >= val;
        const half = !full && rounded >= val - 0.5;
        return (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
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

function DoctorAvatar({ name, imageUrl }: { name: string; imageUrl?: string }) {
  if (imageUrl) {
    return (
      <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-white shadow-md shrink-0 mx-auto ring-2 ring-slate-100">
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }
  const initials = name
    .split(" ").filter((n) => n.toLowerCase() !== "dr.").map((n) => n[0])
    .join("").slice(0, 2).toUpperCase();
  return (
    <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-400 text-white flex items-center justify-center font-black text-2xl uppercase shadow-md shrink-0 mx-auto ring-2 ring-white">
      {initials}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col h-[450px] animate-pulse">
      <div className="flex flex-col gap-4 flex-1">
        <div className="h-24 w-24 rounded-2xl bg-slate-100 mx-auto" />
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-slate-100 rounded-lg mx-auto" />
          <div className="h-3 w-1/2 bg-slate-100 rounded-lg mx-auto" />
          <div className="h-3 w-1/3 bg-slate-100 rounded-lg mx-auto" />
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 mt-auto">
          <div className="h-3 bg-slate-100 rounded" />
          <div className="h-3 bg-slate-100 rounded" />
          <div className="h-3 bg-slate-100 rounded" />
          <div className="h-3 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="h-11 w-full bg-slate-100 rounded-xl mt-4" />
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, idx) => <SkeletonCard key={idx} />)}
    </div>
  );
}

function DoctorsSearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [specialty, setSpecialty] = useState(searchParams.get("specialty") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [searchInput, setSearchInput] = useState(searchParams.get("query") || "");
  const [availableToday, setAvailableToday] = useState(searchParams.get("availableToday") === "true");
  const [consultationType, setConsultationType] = useState(searchParams.get("type") || "");
  const [minFee, setMinFee] = useState(searchParams.get("minFee") || "");
  const [maxFee, setMaxFee] = useState(searchParams.get("maxFee") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "rating");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));
  const limit = 8;

  useEffect(() => {
    Promise.resolve().then(() => {
      setSpecialty(searchParams.get("specialty") || "");
      setCity(searchParams.get("city") || "");
      const q = searchParams.get("query") || "";
      setQuery(q);
      setSearchInput(q);
      setAvailableToday(searchParams.get("availableToday") === "true");
      setConsultationType(searchParams.get("type") || "");
      setMinFee(searchParams.get("minFee") || "");
      setMaxFee(searchParams.get("maxFee") || "");
      setSort(searchParams.get("sort") || "rating");
      setPage(parseInt(searchParams.get("page") || "1", 10));
    });
  }, [searchParams]);

  const updateURL = (updates: Record<string, string | number | boolean | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "" || val === false) params.delete(key);
      else params.set(key, String(val));
    });
    if (!Object.prototype.hasOwnProperty.call(updates, "page")) {
      params.delete("page");
      setPage(1);
    }
    router.push(`/doctors?${params.toString()}`);
  };

  const { data, isLoading, error } = useQuery<SearchResponse>({
    queryKey: ["doctors-list", specialty, city, query, availableToday, consultationType, minFee, maxFee, sort, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (specialty) params.append("specialty", specialty);
      if (city) params.append("city", city);
      if (query) params.append("query", query);
      if (availableToday) params.append("availableToday", "true");
      if (consultationType) params.append("type", consultationType);
      if (minFee) params.append("minFee", minFee);
      if (maxFee) params.append("maxFee", maxFee);
      params.append("sort", sort);
      params.append("page", String(page));
      params.append("limit", String(limit));
      return apiFetch(`/api/doctors?${params.toString()}`);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
    updateURL({ query: searchInput });
  };

  const handleClearFilters = () => {
    setSpecialty(""); setCity(""); setQuery(""); setSearchInput("");
    setAvailableToday(false); setConsultationType(""); setMinFee(""); setMaxFee("");
    setSort("rating"); setPage(1);
    router.push("/doctors");
  };

  const hasActiveFilters = !!(specialty || city || query || availableToday || consultationType || minFee || maxFee);
  const todayDay = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full flex-1 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Search Certified Practitioners</h1>
        <p className="text-slate-500 text-sm mt-1">Discover and book verified consultations with medical experts.</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by doctor name or specialty..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none bg-slate-50/60 border border-transparent focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 transition-all"
          />
        </div>
        <button type="submit" className="shrink-0 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold px-5 py-2 transition-all cursor-pointer">
          Search
        </button>
        {searchInput && (
          <button type="button" onClick={() => { setSearchInput(""); setQuery(""); updateURL({ query: null }); }}
            className="shrink-0 rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 text-slate-400 cursor-pointer transition-all">
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr] items-start">
        {/* Filters Sidebar */}
        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
              <Filter className="h-4 w-4 text-teal-600" /> Filter Results
            </h3>
            {hasActiveFilters && (
              <button onClick={handleClearFilters}
                className="text-xs font-semibold text-slate-400 hover:text-red-500 flex items-center gap-1 cursor-pointer transition-colors">
                <X className="h-3 w-3" /> Clear All
              </button>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Specialty</label>
            <select value={specialty} onChange={(e) => { setSpecialty(e.target.value); updateURL({ specialty: e.target.value }); }}
              className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm text-slate-700 outline-none focus:border-teal-500 bg-white cursor-pointer">
              <option value="">All Specialties</option>
              {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select value={city} onChange={(e) => { setCity(e.target.value); updateURL({ city: e.target.value }); }}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-8 pr-3 text-sm text-slate-700 outline-none focus:border-teal-500 bg-white cursor-pointer">
                <option value="">All Cities</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-y border-slate-50">
            <div>
              <p className="text-sm font-semibold text-slate-700">Available Today</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{todayDay}</p>
            </div>
            <button
              onClick={() => { const updated = !availableToday; setAvailableToday(updated); updateURL({ availableToday: updated }); }}
              role="switch" aria-checked={availableToday}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${availableToday ? "bg-teal-600" : "bg-slate-200"}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${availableToday ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Consultation Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["in-person", "video"] as const).map((type) => (
                <button key={type} type="button"
                  onClick={() => { const val = consultationType === type ? "" : type; setConsultationType(val); updateURL({ type: val }); }}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                    consultationType === type ? "bg-teal-50 border-teal-500 text-teal-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}>
                  {type === "in-person" ? <>?? In-Person</> : <><Video className="h-3.5 w-3.5" /> Video</>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Fee Range (USD)</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input type="number" placeholder="Min" value={minFee} min={0}
                  onChange={(e) => { setMinFee(e.target.value); updateURL({ minFee: e.target.value }); }}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-6 pr-2 text-xs text-slate-700 outline-none focus:border-teal-500 bg-white" />
              </div>
              <span className="text-slate-400 text-xs font-bold">�</span>
              <div className="relative flex-1">
                <DollarSign className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input type="number" placeholder="Max" value={maxFee} min={0}
                  onChange={(e) => { setMaxFee(e.target.value); updateURL({ maxFee: e.target.value }); }}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-6 pr-2 text-xs text-slate-700 outline-none focus:border-teal-500 bg-white" />
              </div>
            </div>
          </div>
        </aside>

        {/* Doctor Grid */}
        <div className="flex flex-col gap-5">
          {/* Controls bar */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm">
            <span className="text-sm font-semibold text-slate-600">
              {isLoading ? "Searching..." : `${data?.total ?? 0} practitioner${data?.total !== 1 ? "s" : ""} found`}
            </span>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <select value={sort} onChange={(e) => { setSort(e.target.value); updateURL({ sort: e.target.value }); }}
                className="rounded-xl border border-slate-200 py-1.5 px-3 text-xs text-slate-700 font-semibold outline-none focus:border-teal-500 bg-white cursor-pointer">
                <option value="rating">? Top Rated</option>
                <option value="experience">?? Most Experienced</option>
                <option value="fee">?? Fee (Low ? High)</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <SkeletonLoader />
          ) : error ? (
            <div className="rounded-3xl bg-red-50 border border-red-100 p-10 text-center text-red-700">
              <p className="font-bold text-lg">Error Loading Listings</p>
              <p className="text-sm mt-1">Please try refreshing or check your database connection.</p>
            </div>
          ) : data && data.doctors.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-16 text-center bg-white flex flex-col items-center gap-4">
              <span className="text-5xl">??</span>
              <div>
                <h4 className="font-extrabold text-slate-800 text-lg">No practitioners match your query</h4>
                <p className="text-slate-500 text-sm mt-1.5">Try widening your filters or a different keyword.</p>
              </div>
              <button onClick={handleClearFilters}
                className="cursor-pointer rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-500 transition-all shadow-sm">
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data?.doctors.map((doc) => (
                <div key={doc._id}
                  className="rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:border-teal-200 transition-all duration-200 flex flex-col h-[450px] group">
                  <div className="flex flex-col h-full">
                    {/* Photo + Name + Badge */}
                    <div className="pt-6 px-5 pb-3 flex flex-col items-center gap-3">
                      <DoctorAvatar name={doc.user.name} imageUrl={doc.imageUrl} />
                      <div className="text-center flex flex-col items-center gap-1 w-full">
                        <h3 className="font-extrabold text-slate-900 text-[15px] leading-tight group-hover:text-teal-600 transition-colors line-clamp-1 w-full">
                          <Link href={`/doctors/${doc.userId}`}>{doc.user.name}</Link>
                        </h3>
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                          {doc.specialty}
                        </span>
                        {/* Rating stars */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <RatingStars rating={doc.avgRating} />
                          <span className="text-[11px] font-bold text-slate-700">
                            {doc.avgRating > 0 ? doc.avgRating.toFixed(1) : "New"}
                          </span>
                          <span className="text-[10px] text-slate-400">({doc.reviewCount})</span>
                        </div>
                      </div>
                    </div>

                    {/* Meta grid */}
                    <div className="px-5 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                        <Award className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{doc.experienceYears} Yrs Exp</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                        <DollarSign className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>${doc.consultationFee} Fee</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className={doc.availability && doc.availability.length > 0 ? "text-teal-600 font-semibold" : "text-slate-400"}>
                          {doc.availability && doc.availability.length > 0
                            ? `${doc.availability.length} day${doc.availability.length !== 1 ? "s" : ""}/wk`
                            : "No schedule"}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="px-5 pb-5 pt-4 mt-auto">
                      <Link href={`/doctors/${doc.userId}`}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 group-hover:bg-teal-600 py-3 text-xs font-bold text-white transition-all duration-200">
                        View Details
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Numbered Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 p-3 rounded-2xl shadow-sm self-center">
              <button disabled={page === 1}
                onClick={() => { const p = page - 1; setPage(p); updateURL({ page: p }); }}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all">
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => { setPage(p); updateURL({ page: p }); }}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    p === page ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}>
                  {p}
                </button>
              ))}
              <button disabled={page === data.totalPages}
                onClick={() => { const p = page + 1; setPage(p); updateURL({ page: p }); }}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all">
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DoctorsSearchPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 gap-3 flex-1">
        <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm font-semibold text-slate-500">Loading directory...</p>
      </div>
    }>
      <DoctorsSearchPageContent />
    </Suspense>
  );
}
