"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  Star,
  Eye,
  Trash2,
  Check,
  X,
  MessageSquare,
  ChevronLeft
} from "lucide-react";
import { toast } from "sonner";

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
  createdAt: string;
  doctorUser?: {
    name: string;
  };
  doctorProfile?: {
    specialty: string;
    city: string;
  };
  patientUser?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export default function AppointmentsManagePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [reviewAppointment, setReviewAppointment] = useState<Appointment | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!isSessionPending && !session?.user) {
      router.push("/login?redirect=/appointments/manage");
    }
  }, [session, isSessionPending, router]);

  // Fetch current user's appointments (role-aware backend query)
  const { data: appointments, isLoading: isAppsLoading, error } = useQuery<Appointment[]>({
    queryKey: ["appointments-mine"],
    queryFn: () => apiFetch("/api/appointments/mine"),
    enabled: !!session?.user,
  });

  // Cancel Appointment Mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "cancelled" }),
      }),
    onSuccess: () => {
      toast.success("Appointment cancelled successfully.");
      queryClient.invalidateQueries({ queryKey: ["appointments-mine"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to cancel appointment.");
    },
  });

  // Confirm Appointment Mutation (Doctor only)
  const confirmMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "confirmed" }),
      }),
    onSuccess: () => {
      toast.success("Appointment confirmed.");
      queryClient.invalidateQueries({ queryKey: ["appointments-mine"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to confirm appointment.");
    },
  });

  // Complete Appointment Mutation (Doctor only)
  const completeMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      }),
    onSuccess: () => {
      toast.success("Appointment marked as completed.");
      queryClient.invalidateQueries({ queryKey: ["appointments-mine"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to complete appointment.");
    },
  });

  // Review Appointment Mutation (Patient only)
  const reviewMutation = useMutation({
    mutationFn: (values: { id: string; rating: number; comment: string }) =>
      apiFetch(`/api/appointments/${values.id}/review`, {
        method: "POST",
        body: JSON.stringify({ rating: values.rating, comment: values.comment }),
      }),
    onSuccess: () => {
      toast.success("Review submitted. Thank you for your feedback!");
      setReviewAppointment(null);
      setRating(5);
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["appointments-mine"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit review.");
    },
  });

  const handleCancel = (id: string) => {
    if (confirm("Are you sure you want to cancel this appointment?")) {
      cancelMutation.mutate(id);
    }
  };

  const handleConfirm = (id: string) => {
    confirmMutation.mutate(id);
  };

  const handleComplete = (id: string) => {
    if (confirm("Mark this appointment as completed?")) {
      completeMutation.mutate(id);
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAppointment) return;
    if (comment.trim().length < 5) {
      toast.error("Please enter a detailed review comment (min 5 chars).");
      return;
    }
    reviewMutation.mutate({
      id: reviewAppointment._id,
      rating,
      comment,
    });
  };

  if (isSessionPending || isAppsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 flex-1 bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm font-semibold text-slate-500">Loading consultations agenda...</p>
      </div>
    );
  }

  const role = session?.user?.role;
  const isPatient = role === "patient";

  const getStatusBadge = (status: Appointment["status"]) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/10">Pending</span>;
      case "confirmed":
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/10">Confirmed</span>;
      case "completed":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">Completed</span>;
      case "cancelled":
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/10">Cancelled</span>;
      default:
        return null;
    }
  };

  const dashboardHref = role === "doctor" ? "/dashboard/doctor" : "/dashboard/patient";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full flex-1 flex flex-col gap-6 bg-slate-50/50">

      {/* Back Link */}
      <Link
        href={dashboardHref}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-teal-600 transition-colors group w-fit"
      >
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Dashboard
      </Link>

      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Manage Appointments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPatient ? "Track, cancel or review your medical bookings." : "Review, confirm or complete incoming consult requests."}
          </p>
        </div>
        {isPatient && (
          <button
            onClick={() => router.push("/appointments/add")}
            className="self-start rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 transition-all shadow-md shadow-teal-600/10 cursor-pointer"
          >
            + New Appointment
          </button>
        )}
      </div>

      {/* Main List */}
      {!appointments || appointments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
          <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800">No Appointments Found</h3>
          <p className="text-xs text-slate-500 mt-1">You have no upcoming or past consultations listed.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">{isPatient ? "Doctor" : "Patient"}</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                {appointments.map((app) => {
                  const labelName = isPatient ? app.doctorUser?.name : app.patientUser?.name;
                  const labelSub = isPatient ? app.doctorProfile?.specialty : app.patientUser?.email;

                  return (
                    <tr key={app._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{labelName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{labelSub}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        <div>{new Date(app.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                        <div className="text-[10px] text-teal-600 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" /> {app.timeSlot}
                        </div>
                      </td>
                      <td className="px-6 py-4 capitalize font-semibold">
                        {app.type === "video" ? (
                          <span className="flex items-center gap-1 text-indigo-600">
                            <Video className="h-3.5 w-3.5" /> Video
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" /> In-Person
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 truncate max-w-[180px]">{app.reasonForVisit}</td>
                      <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => setSelectedAppointment(app)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-bold hover:bg-slate-50 transition-all text-slate-600 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>

                        {/* Patient Actions */}
                        {isPatient && (app.status === "pending" || app.status === "confirmed") && (
                          <button
                            onClick={() => handleCancel(app._id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/20 px-2.5 py-1.5 font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" /> Cancel
                          </button>
                        )}
                        {isPatient && app.status === "completed" && (
                          <button
                            onClick={() => {
                              setReviewAppointment(app);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50/20 px-2.5 py-1.5 font-bold text-teal-700 hover:bg-teal-50 transition-all cursor-pointer"
                          >
                            <Star className="h-3.5 w-3.5" /> Review
                          </button>
                        )}

                        {/* Doctor Actions */}
                        {!isPatient && app.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleConfirm(app._id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50/30 px-2.5 py-1.5 font-bold text-teal-700 hover:bg-teal-50 transition-all cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" /> Confirm
                            </button>
                            <button
                              onClick={() => handleCancel(app._id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/20 px-2.5 py-1.5 font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {!isPatient && app.status === "confirmed" && (
                          <>
                            <button
                              onClick={() => handleComplete(app._id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50/30 px-2.5 py-1.5 font-bold text-teal-700 hover:bg-teal-50 transition-all cursor-pointer"
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Complete
                            </button>
                            <button
                              onClick={() => handleCancel(app._id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/20 px-2.5 py-1.5 font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" /> Cancel
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (Table->Card collapse) */}
          <div className="md:hidden flex flex-col gap-4">
            {appointments.map((app) => {
              const labelName = isPatient ? app.doctorUser?.name : app.patientUser?.name;
              const labelSub = isPatient ? app.doctorProfile?.specialty : app.patientUser?.email;

              return (
                <div key={app._id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900">{labelName}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{labelSub}</p>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-slate-600 border-y border-slate-100 py-3 my-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-semibold">
                        {new Date(app.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-semibold">{app.timeSlot}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      {app.type === "video" ? (
                        <span className="flex items-center gap-1.5 text-indigo-600 text-[11px] font-bold">
                          <Video className="h-4 w-4 shrink-0" /> Video Call
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-600 text-[11px] font-bold">
                          <MapPin className="h-4 w-4 text-slate-400 shrink-0" /> Clinic Visit
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    <span className="font-bold text-slate-600">Reason:</span> {app.reasonForVisit}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 justify-end border-t border-slate-50">
                    <button
                      onClick={() => setSelectedAppointment(app)}
                      className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-600 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>

                    {/* Patient Actions */}
                    {isPatient && (app.status === "pending" || app.status === "confirmed") && (
                      <button
                        onClick={() => handleCancel(app._id)}
                        className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50/20 py-2 text-xs font-bold text-rose-600 cursor-pointer hover:bg-rose-50"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    )}
                    {isPatient && app.status === "completed" && (
                      <button
                        onClick={() => setReviewAppointment(app)}
                        className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1 rounded-xl border border-teal-200 bg-teal-50/20 py-2 text-xs font-bold text-teal-700 cursor-pointer hover:bg-teal-50"
                      >
                        <Star className="h-3.5 w-3.5" /> Review
                      </button>
                    )}

                    {/* Doctor Actions */}
                    {!isPatient && app.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleConfirm(app._id)}
                          className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1 rounded-xl border border-teal-200 bg-teal-50/30 py-2 text-xs font-bold text-teal-700 cursor-pointer hover:bg-teal-50"
                        >
                          <Check className="h-3.5 w-3.5" /> Confirm
                        </button>
                        <button
                          onClick={() => handleCancel(app._id)}
                          className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50/20 py-2 text-xs font-bold text-rose-600 cursor-pointer hover:bg-rose-50"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {!isPatient && app.status === "confirmed" && (
                      <>
                        <button
                          onClick={() => handleComplete(app._id)}
                          className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1 rounded-xl border border-teal-200 bg-teal-50/30 py-2 text-xs font-bold text-teal-700 cursor-pointer hover:bg-teal-50"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Complete
                        </button>
                        <button
                          onClick={() => handleCancel(app._id)}
                          className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50/20 py-2 text-xs font-bold text-rose-600 cursor-pointer hover:bg-rose-50"
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Appointment Detail Inspector Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-slate-100 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-800">Consultation Details</h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs text-slate-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    {isPatient ? "Doctor" : "Patient"}
                  </span>
                  <span className="text-slate-800 font-extrabold text-sm mt-1 block">
                    {isPatient ? selectedAppointment.doctorUser?.name : selectedAppointment.patientUser?.name}
                  </span>
                  <span className="text-slate-400 text-[10px] mt-0.5 block">
                    {isPatient ? selectedAppointment.doctorProfile?.specialty : selectedAppointment.patientUser?.email}
                  </span>
                </div>
                <div>
                  <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px]">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div>
                </div>
              </div>

              {!isPatient && selectedAppointment.patientUser?.phone && (
                <div>
                  <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px]">Patient Contact</span>
                  <span className="text-slate-800 font-bold mt-1 block">{selectedAppointment.patientUser.phone}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px]">Date</span>
                  <span className="text-slate-800 font-bold mt-1 block">
                    {new Date(selectedAppointment.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div>
                  <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px]">Time Slot</span>
                  <span className="text-slate-800 font-bold mt-1 block">{selectedAppointment.timeSlot}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px]">Consultation Type</span>
                  <span className="text-slate-800 font-bold mt-1 block capitalize">{selectedAppointment.type}</span>
                </div>
                {isPatient && selectedAppointment.doctorProfile?.city && (
                  <div>
                    <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px]">Location (City)</span>
                    <span className="text-slate-800 font-bold mt-1 block">{selectedAppointment.doctorProfile.city}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px]">Reason for Visit</span>
                <p className="mt-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 italic">
                  &quot;{selectedAppointment.reasonForVisit}&quot;
                </p>
              </div>

              {selectedAppointment.notes && (
                <div className="border-t border-slate-100 pt-4">
                  <span className="block font-bold text-slate-400 uppercase tracking-wider text-[10px]">Additional Notes</span>
                  <p className="mt-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleReviewSubmit}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-teal-600" />
                <h3 className="text-base font-black text-slate-800">Write a Review</h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewAppointment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Share your consultation experience with <strong>{reviewAppointment.doctorUser?.name}</strong>.
            </p>

            {/* Rating Stars Selection */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-all cursor-pointer"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Comment */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Your Feedback</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the consultation? Did the doctor address your concerns?"
                className="w-full text-xs rounded-xl border border-slate-200 p-3 h-28 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all text-slate-800"
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReviewAppointment(null)}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reviewMutation.isPending}
                className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {reviewMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" /> Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
