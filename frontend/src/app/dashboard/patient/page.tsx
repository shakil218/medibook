"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  Brain,
  MessageCircle,
  Loader2,
  X,
  Smile,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

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
  doctorUser: {
    name: string;
    image?: string;
  };
  doctorProfile?: {
    specialty: string;
    imageUrl?: string;
  };
}

export default function PatientDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending: authPending } = authClient.useSession();

  const [activeTab, setActiveTab] = useState<"appointments" | "symptoms">("appointments");
  const [reviewAppointment, setReviewAppointment] = useState<Appointment | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  interface DashboardSummary {
    upcomingAppointments: Appointment[];
    pastDoctors: {
      userId: string;
      specialty: string;
      consultationFee: number;
      city: string;
      imageUrl: string;
      user: {
        name: string;
      };
    }[];
    recommendedDoctors: {
      userId: string;
      specialty: string;
      consultationFee: number;
      city: string;
      imageUrl: string;
      avgRating: number;
      user: {
        name: string;
      };
    }[];
    latestSymptomCheck?: {
      symptoms: string[];
      aiAssessment: string;
      suggestedSpecialty: string;
    } | null;
  }

  // AI Recommendation Engine States
  const [recommendationSymptoms, setRecommendationSymptoms] = useState("");
  const [maxDistance, setMaxDistance] = useState(30);
  const [minFee, setMinFee] = useState(0);
  const [maxFee, setMaxFee] = useState(250);

  interface AIRecommendedDoctor {
    doctorId: string;
    name: string;
    specialty: string;
    consultationFee: number;
    avgRating: number;
    city: string;
    bio: string;
    imageUrl: string;
    distance: number;
    feedback: "like" | "dislike" | null;
    reason: string;
  }

  // Fetch AI Smart Recommendations
  const { data: aiRecommendations, isLoading: recsLoading } = useQuery<AIRecommendedDoctor[]>({
    queryKey: ["ai-recommendations", recommendationSymptoms, maxDistance, minFee, maxFee],
    queryFn: () => apiFetch("/api/ai/recommendations", {
      method: "POST",
      body: JSON.stringify({
        symptoms: recommendationSymptoms || (summary?.latestSymptomCheck?.symptoms.join(", ") || "general checkup"),
        maxDistance,
        feeRange: { min: minFee, max: maxFee }
      })
    }),
    enabled: !!session?.user,
  });

  // Feedback thumbs mutation
  const feedbackMutation = useMutation({
    mutationFn: (values: { doctorId: string; feedback: "like" | "dislike" }) =>
      apiFetch("/api/ai/recommendations/feedback", {
        method: "POST",
        body: JSON.stringify(values)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] });
      toast.success("Rankings updated based on your feedback!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit feedback.");
    }
  });

  const handleFeedback = (doctorId: string, feedback: "like" | "dislike") => {
    feedbackMutation.mutate({ doctorId, feedback });
  };

  // Fetch Patient Dashboard Summary
  const { data: summary, isLoading: appsLoading, error: appsError } = useQuery<DashboardSummary>({
    queryKey: ["patient-dashboard-summary"],
    queryFn: () => apiFetch("/api/dashboard/summary"),
    enabled: !!session?.user,
  });

  const appointments = summary?.upcomingAppointments;

  // Cancel Appointment Mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "cancelled" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-dashboard-summary"] });
      toast.success("Appointment cancelled successfully.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to cancel appointment.");
    }
  });

  // Submit Review Mutation
  const reviewMutation = useMutation({
    mutationFn: (values: { doctorId: string; appointmentId: string; rating: number; comment: string }) =>
      apiFetch(`/api/appointments/${values.appointmentId}/review`, {
        method: "POST",
        body: JSON.stringify({ rating: values.rating, comment: values.comment }),
      }),
    onSuccess: () => {
      setReviewSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["patient-dashboard-summary"] });
      setTimeout(() => {
        setReviewAppointment(null);
        setReviewSuccess(false);
        setRating(5);
        setComment("");
      }, 2000);
    },
    onError: (err: Error) => {
      setReviewError(err.message || "Failed to submit review.");
    },
  });

  const handleCancel = (id: string) => {
    if (confirm("Are you sure you want to cancel this appointment?")) {
      cancelMutation.mutate(id);
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    if (!reviewAppointment) return;

    reviewMutation.mutate({
      doctorId: reviewAppointment.doctorId,
      appointmentId: reviewAppointment._id,
      rating,
      comment,
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

  // Redirect if not patient
  if (!session?.user || session.user.role !== "patient") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center flex-1 flex flex-col justify-center">
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-8 text-amber-700">
          <AlertCircle className="h-10 w-10 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-bold">Access Restricted</h2>
          <p className="text-sm mt-1">Please log in with a Patient account to view this panel.</p>
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full flex-1 flex flex-col gap-8">
      {/* Patient Greeting Header */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Hello, {session.user.name}</h1>
          <p className="text-slate-300 text-sm mt-1.5">Manage your consultations, view medical symptoms, and leave feedback.</p>
        </div>
        <button
          onClick={() => router.push("/symptom-checker")}
          className="cursor-pointer flex items-center justify-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-white px-5 py-3 text-sm font-bold shadow-md shadow-teal-500/10 transition-all self-start md:self-auto"
        >
          <Brain className="h-4 w-4" />
          Triage Symptoms
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("appointments")}
          className={`pb-3 text-sm font-bold transition-all border-b-2 px-1 cursor-pointer ${
            activeTab === "appointments" ? "border-teal-600 text-teal-700" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          My Consultations
        </button>
        <button
          onClick={() => router.push("/appointments/manage")}
          className="pb-3 text-sm font-bold transition-all border-b-2 px-1 cursor-pointer border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-350"
        >
          Manage & Review Bookings
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1">
        {appsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-teal-600" />
            <p className="text-sm font-medium text-slate-500">Retrieving summary details...</p>
          </div>
        ) : appsError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-700">
            Error loading consultations. Please verify backend connection.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
            
            {/* Left Column: Appointments & past doctors */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 mb-4">Upcoming Consultations</h3>
                {!appointments || appointments.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white flex flex-col items-center gap-4 shadow-xs">
                    <span className="text-3xl">🗓️</span>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">No upcoming appointments</h4>
                      <p className="text-slate-500 text-xs mt-1">Book your next doctor appointment and secure your schedule.</p>
                    </div>
                    <button
                      onClick={() => router.push("/doctors")}
                      className="cursor-pointer rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-teal-500 transition-all shadow-md shadow-teal-600/10"
                    >
                      Browse Providers
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {appointments.map((app) => (
                      <div
                        key={app._id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between"
                      >
                        <div className="flex flex-col gap-3">
                          {/* Doctor Info */}
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex gap-2.5 items-center">
                              <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-teal-50 flex items-center justify-center font-bold text-sm uppercase text-teal-700">
                                {app.doctorProfile?.imageUrl ? (
                                  <img src={app.doctorProfile.imageUrl} alt={app.doctorUser.name} className="h-full w-full object-cover" />
                                ) : (
                                  app.doctorUser.name[0]
                                )}
                              </div>
                              <div className="flex flex-col">
                                <h4 className="font-bold text-slate-800 text-xs">{app.doctorUser.name}</h4>
                                <span className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">
                                  {app.doctorProfile?.specialty || "Specialist"}
                                </span>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <span
                              className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                app.status === "confirmed"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : app.status === "completed"
                                  ? "bg-slate-100 text-slate-700 border border-slate-200"
                                  : app.status === "cancelled"
                                  ? "bg-red-50 text-red-700 border border-red-100"
                                  : "bg-amber-50 text-amber-700 border border-amber-100" // pending
                              }`}
                            >
                              {app.status}
                            </span>
                          </div>

                          {/* Date/Time details */}
                          <div className="flex gap-2 flex-wrap text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              <span>{app.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              <span>{app.timeSlot}</span>
                            </div>
                            <div className="flex items-center gap-1 ml-auto">
                              {app.type === "video" ? (
                                <>
                                  <Video className="h-3.5 w-3.5 text-indigo-600" />
                                  <span className="font-bold text-indigo-700">Video</span>
                                </>
                              ) : (
                                <>
                                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                  <span>Clinic</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Reasons */}
                          <div className="text-[11px]">
                            <span className="font-bold text-slate-600">Reason:</span>
                            <span className="text-slate-500 ml-1 leading-relaxed line-clamp-2">{app.reasonForVisit}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                          {app.status === "completed" ? (
                            <button
                              onClick={() => setReviewAppointment(app)}
                              className="cursor-pointer flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-500 transition-colors"
                            >
                              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                              Write a Review
                            </button>
                          ) : app.status === "pending" || app.status === "confirmed" ? (
                            <button
                              onClick={() => handleCancel(app._id)}
                              disabled={cancelMutation.isPending}
                              className="cursor-pointer flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-500 disabled:text-slate-300 transition-colors ml-auto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Cancel Booking
                            </button>
                          ) : null}

                          {app.status === "confirmed" && app.type === "video" && (
                            <button
                              onClick={() => alert("Launching secure encrypted video consultation room...")}
                              className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10px] px-3 py-1.5 shrink-0 cursor-pointer"
                            >
                              Join Call
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick "Book Again" for past doctors */}
              {summary?.pastDoctors && summary.pastDoctors.length > 0 && (
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs flex flex-col gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Book Again</h3>
                    <p className="text-slate-500 text-[11px] mt-0.5">Quickly schedule another visit with a provider you have seen before.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {summary.pastDoctors.map((doc) => (
                      <div key={doc.userId} className="flex items-center justify-between border border-slate-100 p-3 rounded-2xl bg-slate-50/50 hover:border-teal-200 transition-all">
                        <div className="flex items-center gap-2.5">
                          <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-teal-50 flex items-center justify-center font-bold text-xs uppercase text-teal-700">
                            {doc.imageUrl ? (
                              <img src={doc.imageUrl} alt={doc.user.name} className="h-full w-full object-cover" />
                            ) : (
                              doc.user.name[0]
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">{doc.user.name}</h4>
                            <p className="text-[10px] text-slate-400">{doc.specialty}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/appointments/add?doctorId=${doc.userId}`)}
                          className="rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10px] px-2.5 py-1.5 transition-all cursor-pointer shadow-sm shadow-teal-600/5 shrink-0"
                        >
                          Book
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: AI Triage & Recommended Doctors */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {summary?.latestSymptomCheck && (
                <div className="rounded-3xl border border-teal-100 bg-teal-50/20 p-5 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-teal-600" />
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">AI Symptom Triage</h4>
                  </div>
                  <div className="text-xs text-slate-600 space-y-2">
                    <p>
                      <span className="font-bold text-slate-700">Symptoms:</span> {summary.latestSymptomCheck.symptoms.slice(0, 3).join(", ")}
                      {summary.latestSymptomCheck.symptoms.length > 3 ? "..." : ""}
                    </p>
                    <p className="p-2.5 bg-white border border-teal-100/50 rounded-xl italic leading-relaxed text-[11px] text-slate-700">
                      &quot;{summary.latestSymptomCheck.aiAssessment.substring(0, 160)}...&quot;
                    </p>
                    <div className="text-[10px] text-teal-700 bg-teal-50 border border-teal-100 px-2 py-1 rounded-lg inline-block font-bold">
                      Suggested Specialty: {summary.latestSymptomCheck.suggestedSpecialty}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs flex flex-col gap-5">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    ✨ AI Smart Recommendations
                  </h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    LLM-powered doctor matching that learns from your likes and dislikes.
                  </p>
                </div>

                {/* Refine Controls */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[11px]">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Filter by Symptoms</label>
                    <input
                      type="text"
                      placeholder="e.g. chest pain, skin rash"
                      value={recommendationSymptoms}
                      onChange={(e) => setRecommendationSymptoms(e.target.value)}
                      className="w-full bg-white rounded-xl border border-slate-200 px-3 py-2 outline-none text-xs text-slate-800 focus:border-teal-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Max Distance</span>
                      <span className="text-teal-600 font-extrabold">{maxDistance} km</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(Number(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Max Fee</span>
                      <span className="text-teal-600 font-extrabold">${maxFee}</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="300"
                      step="10"
                      value={maxFee}
                      onChange={(e) => setMaxFee(Number(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>
                </div>

                {/* Recommendations List */}
                <div className="flex flex-col gap-3">
                  {recsLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                      <p className="text-[10px] text-slate-400 font-medium">Ranking providers...</p>
                    </div>
                  ) : aiRecommendations && aiRecommendations.length > 0 ? (
                    aiRecommendations.map((doc) => (
                      <div
                        key={doc.doctorId}
                        className="flex flex-col gap-2 border border-slate-100 p-3 rounded-2xl bg-white hover:border-teal-200 transition-all shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => router.push(`/doctors/${doc.doctorId}`)}
                          >
                            <div className="h-11 w-11 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-teal-50 flex items-center justify-center font-bold text-sm uppercase text-teal-700">
                              {doc.imageUrl ? (
                                <img src={doc.imageUrl} alt={doc.name} className="h-full w-full object-cover" />
                              ) : (
                                doc.name[0]
                              )}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-800 text-xs line-clamp-1">{doc.name}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">{doc.specialty} • {doc.city} ({doc.distance}km)</p>
                              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-amber-500 font-bold">
                                ★ {doc.avgRating > 0 ? doc.avgRating.toFixed(1) : "New"}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="text-xs font-black text-slate-900">${doc.consultationFee}</span>
                            
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleFeedback(doc.doctorId, "like")}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  doc.feedback === "like"
                                    ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                                    : "bg-white hover:bg-slate-50 text-slate-400 border-slate-200"
                                }`}
                                title="Recommend matches like this"
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleFeedback(doc.doctorId, "dislike")}
                                className="p-1.5 rounded-lg border bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border-slate-200 transition-all cursor-pointer"
                                title="Don't recommend this doctor again"
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-teal-50/20 border border-teal-100/50 p-2.5 rounded-xl text-[10px] text-teal-800 italic leading-relaxed">
                          💡 {doc.reason}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No recommended providers match filters.</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setReviewAppointment(null)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {reviewSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <Smile className="h-12 w-12 text-teal-600 animate-bounce" />
                <h3 className="text-lg font-bold text-slate-900">Thank You for Your Feedback!</h3>
                <p className="text-slate-500 text-xs mt-0.5">Your rating will help other patients make informed health choices.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-950">Review Doctor</h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Share your experience with {reviewAppointment.doctorUser.name}
                  </p>
                </div>

                {reviewError && (
                  <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{reviewError}</span>
                  </div>
                )}

                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {/* Rating Selector */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 cursor-pointer transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-7 w-7 ${
                              rating >= star ? "fill-amber-400 text-amber-400" : "text-slate-200"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Comment</label>
                    <textarea
                      placeholder="Write your feedback regarding professionalism, timing, and details..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 p-3 mt-1.5 text-xs text-slate-700 outline-none h-24 focus:border-teal-500 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reviewMutation.isPending}
                    className="flex w-full items-center justify-center gap-2 cursor-pointer rounded-xl bg-teal-600 hover:bg-teal-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all"
                  >
                    {reviewMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Review"
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Inline fallback loader helper
function RefreshCw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
