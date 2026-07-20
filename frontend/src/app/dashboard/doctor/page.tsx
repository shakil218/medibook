"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  Briefcase,
  Users,
  Settings,
  TrendingUp,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Star
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";

interface Appointment {
  _id: string;
  patientId: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  type: "in-person" | "video";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  reasonForVisit: string;
  notes?: string;
  patientUser: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface DoctorProfile {
  _id: string;
  specialty: string;
  qualifications: string[];
  experienceYears: number;
  bio: string;
  consultationFee: number;
  city: string;
  languages: string[];
  availability: {
    day: string;
    startTime: string;
    endTime: string;
    slotDurationMins: number;
  }[];
}

const profileSchema = z.object({
  specialty: z.string().min(2, "Specialty is required"),
  experienceYears: z.number().min(0, "Invalid years of experience"),
  consultationFee: z.number().min(0, "Invalid consultation fee"),
  city: z.string().min(2, "City name is required"),
  bio: z.string().min(10, "Please provide a detailed bio (min 10 chars)"),
  qualifications: z.string().min(2, "Qualifications are required"),
  languages: z.string().min(2, "Languages are required"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function DoctorDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending: authPending } = authClient.useSession();

  const [activeTab, setActiveTab] = useState<"appointments" | "requests" | "settings">("appointments");
  const [availabilitySlots, setAvailabilitySlots] = useState<DoctorProfile["availability"]>([]);
  const [newDay, setNewDay] = useState("Monday");
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");
  const [newDuration, setNewDuration] = useState(30);

  interface DoctorDashboardSummary {
    confirmedAgenda: Appointment[];
    pendingRequests: Appointment[];
    pendingConfirmationsCount: number;
    appointmentsOverTime: {
      name: string;
      count: number;
      earnings: number;
    }[];
    ratingTrend: {
      index: number;
      rating: number;
      date: string;
    }[];
    stats: {
      totalEarnings: number;
      pendingRequestsCount: number;
      confirmedAgendaCount: number;
      completedSessionsCount: number;
    };
  }

  // Fetch Doctor Dashboard Summary
  const { data: summary, isLoading: appsLoading } = useQuery<DoctorDashboardSummary>({
    queryKey: ["doctor-dashboard-summary"],
    queryFn: () => apiFetch("/api/dashboard/summary"),
    enabled: !!session?.user,
  });

  const confirmedAgenda = summary?.confirmedAgenda || [];
  const pendingRequests = summary?.pendingRequests || [];
  const completedCount = summary?.stats.completedSessionsCount || 0;
  const totalEarnings = summary?.stats.totalEarnings || 0;
  const chartData = summary?.appointmentsOverTime || [];

  // Fetch Doctor Profile
  const { data: doctorDetails, isLoading: profileLoading } = useQuery<DoctorProfile>({
    queryKey: ["doctor-profile", session?.user?.id],
    queryFn: () => apiFetch(`/api/doctors/${session?.user?.id}`),
    enabled: !!session?.user,
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });
  // Load defaults into form when details are fetched
  useEffect(() => {
    if (doctorDetails) {
      reset({
        specialty: doctorDetails.specialty || "",
        experienceYears: doctorDetails.experienceYears || 0,
        consultationFee: doctorDetails.consultationFee || 0,
        city: doctorDetails.city || "",
        bio: doctorDetails.bio || "",
        qualifications: doctorDetails.qualifications?.join(", ") || "",
        languages: doctorDetails.languages?.join(", ") || "",
      });
      if (doctorDetails.availability) {
        Promise.resolve().then(() => {
          setAvailabilitySlots(doctorDetails.availability);
        });
      }
    }
  }, [doctorDetails, reset]);

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/api/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-dashboard-summary"] });
    },
  });

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: Omit<DoctorProfile, "_id">) =>
      apiFetch("/api/doctors/profile", {
        method: "POST",
        body: JSON.stringify(profileData),
      }),
    onSuccess: () => {
      alert("Doctor profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["doctor-profile", session?.user?.id] });
    },
    onError: (err: Error) => {
      alert(err.message || "Failed to update profile.");
    },
  });

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleAddSlot = () => {
    // Prevent duplicates for the same day
    if (availabilitySlots.some((s) => s.day === newDay)) {
      alert(`Availability slot for ${newDay} already exists.`);
      return;
    }

    setAvailabilitySlots((prev) => [
      ...prev,
      {
        day: newDay,
        startTime: newStart,
        endTime: newEnd,
        slotDurationMins: Number(newDuration),
      },
    ]);
  };

  const handleRemoveSlot = (day: string) => {
    setAvailabilitySlots((prev) => prev.filter((s) => s.day !== day));
  };

  const onSubmitProfile = (values: ProfileFormValues) => {
    updateProfileMutation.mutate({
      specialty: values.specialty,
      experienceYears: values.experienceYears,
      consultationFee: values.consultationFee,
      city: values.city,
      bio: values.bio,
      qualifications: values.qualifications.split(",").map((s) => s.trim()),
      languages: values.languages.split(",").map((s) => s.trim()),
      availability: availabilitySlots,
    });
  };

  if (authPending) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 flex-1">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm font-semibold text-slate-500">Checking auth session...</p>
      </div>
    );
  }

  // Redirect if not doctor
  if (!session?.user || session.user.role !== "doctor") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center flex-1 flex flex-col justify-center">
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-8 text-amber-700">
          <AlertCircle className="h-10 w-10 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-bold">Access Restricted</h2>
          <p className="text-sm mt-1">Please log in with a Doctor account to view this panel.</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm px-4 py-2"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Stat summaries are computed dynamically from the summary API query hook above.

  // Compute Chart Data (Month wise Completed Appointments)
  // Replaced with dynamic summary dataset

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full flex-1 flex flex-col gap-8">
      {/* Doctor Header */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Welcome, {session.user.name}</h1>
          <p className="text-slate-300 text-sm mt-1.5">Manage consultation requests, agenda schedules, and billing analytics.</p>
        </div>
        <button
          onClick={() => setActiveTab("settings")}
          className="cursor-pointer flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 text-sm font-bold transition-all"
        >
          <Settings className="h-4 w-4" />
          Edit Profile
        </button>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Earnings</p>
            <p className="text-2xl font-black text-slate-800">${totalEarnings}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pending Requests</p>
            <p className="text-2xl font-black text-slate-800">{pendingRequests.length}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Confirmed Agenda</p>
            <p className="text-2xl font-black text-slate-800">{confirmedAgenda.length}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="rounded-xl bg-slate-50 p-3 text-slate-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Completed Sessions</p>
            <p className="text-2xl font-black text-slate-800">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Agenda & Chart */}
      {activeTab !== "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
              <button
                onClick={() => setActiveTab("appointments")}
                className={`pb-3 text-sm font-bold transition-all border-b-2 px-1 cursor-pointer ${activeTab === "appointments" ? "border-teal-600 text-teal-700" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
              >
                Today&apos;s Agenda ({confirmedAgenda.length})
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`pb-3 text-sm font-bold transition-all border-b-2 px-1 cursor-pointer ${activeTab === "requests" ? "border-teal-600 text-teal-700" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
              >
                Booking Requests Inbox ({pendingRequests.length})
              </button>
            </div>

            {/* List */}
            {activeTab === "appointments" ? (
              <div className="flex flex-col gap-4">
                {confirmedAgenda.length === 0 ? (
                  <p className="text-sm text-slate-500 italic bg-white p-6 rounded-2xl border border-slate-200 text-center">
                    No consultations scheduled for today.
                  </p>
                ) : (
                  confirmedAgenda.map((app) => (
                    <div
                      key={app._id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between gap-4"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-slate-800 text-base">{app.patientUser.name}</h4>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {app.date} @ {app.timeSlot}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-teal-700 font-bold bg-teal-50 px-2.5 py-1 rounded-xl">
                          {app.type === "video" ? (
                            <>
                              <Video className="h-4 w-4" />
                              Video Call
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4" />
                              Clinic Visit
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-600">Reason for visit:</span>
                        <p className="text-slate-500 mt-0.5">{app.reasonForVisit}</p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleUpdateStatus(app._id, "completed")}
                          className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2 cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Mark Completed
                        </button>
                        {app.type === "video" && (
                          <button
                            onClick={() => alert("Initiating secure encrypted video call with patient...")}
                            className="rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2 cursor-pointer"
                          >
                            Launch Consultation
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pendingRequests.length === 0 ? (
                  <p className="text-sm text-slate-500 italic bg-white p-6 rounded-2xl border border-slate-200 text-center">
                    No pending booking requests.
                  </p>
                ) : (
                  pendingRequests.map((app) => (
                    <div
                      key={app._id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-slate-800 text-base">{app.patientUser.name}</h4>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Requested: {app.date} @ {app.timeSlot}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          Pending Approval
                        </span>
                      </div>

                      <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-600">Reason:</span>
                        <p className="text-slate-500 mt-0.5">{app.reasonForVisit}</p>
                      </div>

                      <div className="flex gap-3 justify-end mt-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleUpdateStatus(app._id, "cancelled")}
                          className="rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs px-4 py-2 cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Decline
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app._id, "confirmed")}
                          className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2 cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve Slot
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Earnings chart sidebar */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-6">
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-teal-600" />
                Earnings Analytics
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Consultation metrics computed over time</p>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="earnings" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-1">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                Ratings Trend
              </h3>
              <p className="text-xs text-slate-400 mb-4">Patient feedback history trend over time</p>
              <div className="h-48 w-full">
                {summary?.ratingTrend && summary.ratingTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={summary.ratingTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis domain={[1, 5]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="rating" stroke="#eab308" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <p className="text-xs text-slate-400 italic">No ratings data available yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Profile Editor Form */}
      {activeTab === "settings" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm flex flex-col gap-8">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Configure Doctor Profile</h2>
            <p className="text-slate-500 text-sm mt-0.5">Configure your medical specialties, consultation fees, and availability schedules.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Specialty</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiologist"
                  {...register("specialty")}
                  className="w-full rounded-xl border border-slate-200 p-3 mt-1.5 text-sm outline-none focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Years of Experience</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  {...register("experienceYears", { valueAsNumber: true })}
                  className="w-full rounded-xl border border-slate-200 p-3 mt-1.5 text-sm outline-none focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Consultation Fee ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  {...register("consultationFee", { valueAsNumber: true })}
                  className="w-full rounded-xl border border-slate-200 p-3 mt-1.5 text-sm outline-none focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Practice City / Location</label>
                <input
                  type="text"
                  placeholder="e.g. New York"
                  {...register("city")}
                  className="w-full rounded-xl border border-slate-200 p-3 mt-1.5 text-sm outline-none focus:border-teal-500 transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">Qualifications</label>
                <input
                  type="text"
                  placeholder="e.g. MD, FACC, MBBS (comma separated)"
                  {...register("qualifications")}
                  className="w-full rounded-xl border border-slate-200 p-3 mt-1.5 text-sm outline-none focus:border-teal-500 transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">Languages</label>
                <input
                  type="text"
                  placeholder="e.g. English, Spanish (comma separated)"
                  {...register("languages")}
                  className="w-full rounded-xl border border-slate-200 p-3 mt-1.5 text-sm outline-none focus:border-teal-500 transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">Biography</label>
                <textarea
                  placeholder="Tell patients about your background, medical treatments, and approach to care..."
                  {...register("bio")}
                  className="w-full rounded-xl border border-slate-200 p-3 mt-1.5 text-sm outline-none h-28 focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            {/* Availability Slots Editor */}
            <div className="border-t border-slate-100 pt-6">
              <label className="block text-sm font-bold text-slate-900 mb-4">Availability Schedule</label>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500">Day</label>
                    <select
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 mt-1 text-sm bg-white cursor-pointer"
                    >
                      {WEEKDAYS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500">Start Time</label>
                    <input
                      type="time"
                      value={newStart}
                      onChange={(e) => setNewStart(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2 mt-1 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500">End Time</label>
                    <input
                      type="time"
                      value={newEnd}
                      onChange={(e) => setNewEnd(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2 mt-1 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500">Duration (mins)</label>
                    <input
                      type="number"
                      value={newDuration}
                      onChange={(e) => setNewDuration(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 p-2 mt-1 text-sm bg-white"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddSlot}
                  className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold py-2.5 px-4 cursor-pointer self-start flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Day Slot
                </button>
              </div>

              {/* Display Availability List */}
              <div className="mt-4 flex flex-col gap-2">
                {availabilitySlots.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No availability slots added yet.</p>
                ) : (
                  availabilitySlots.map((slot) => (
                    <div
                      key={slot.day}
                      className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl text-sm"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-slate-800 min-w-[100px]">{slot.day}</span>
                        <span className="text-slate-500 text-xs">
                          ⏱️ {slot.startTime} - {slot.endTime} ({slot.slotDurationMins}m slots)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(slot.day)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm px-6 py-3 cursor-pointer disabled:bg-slate-300 transition-all"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Profile Details"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("appointments")}
                className="rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm px-6 py-3 cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
