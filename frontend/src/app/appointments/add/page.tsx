"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  Search,
  User,
  X
} from "lucide-react";
import { toast } from "sonner";

interface DoctorDetails {
  _id: string;
  userId: string;
  specialty: string;
  consultationFee: number;
  city: string;
  availability: {
    day: string;
    startTime: string;
    endTime: string;
    slotDurationMins: number;
  }[];
  user: {
    name: string;
  };
}

const bookingSchema = z.object({
  type: z.enum(["in-person", "video"]),
  reasonForVisit: z.string().min(5, "Please enter a detailed reason (min 5 chars)"),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface AvailabilitySlot {
  timeSlot: string;
  available: boolean;
}

const generateTempId = () => `temp-${Math.random()}`;

const getLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  const doctorId = searchParams.get("doctorId");
  const initialDateParam = searchParams.get("date");
  const initialSlotParam = searchParams.get("slot");

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookedDetails, setBookedDetails] = useState<BookingFormValues | null>(null);
  const [countdown, setCountdown] = useState(6);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync initial query params if present
  const [prevInitialDate, setPrevInitialDate] = useState<string | null>(null);
  const [prevInitialSlot, setPrevInitialSlot] = useState<string | null>(null);

  if (initialDateParam !== prevInitialDate || initialSlotParam !== prevInitialSlot) {
    setPrevInitialDate(initialDateParam);
    setPrevInitialSlot(initialSlotParam);
    if (initialDateParam) {
      const [y, m, d] = initialDateParam.split("-").map(Number);
      setSelectedDate(new Date(y, m - 1, d));
    } else {
      setSelectedDate(null);
    }
    setSelectedSlot(initialSlotParam);
  }

  // Handle redirect if unauthenticated
  useEffect(() => {
    if (!isSessionPending && !session?.user) {
      const search = window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(`/appointments/add${search}`)}`);
    }
  }, [session, isSessionPending, router]);

  // Click outside listener to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch all doctors for search select picker
  const { data: doctorsList, isLoading: isDoctorsLoading } = useQuery<{ doctors: DoctorDetails[] }>({
    queryKey: ["doctors-list-picker"],
    queryFn: () => apiFetch("/api/doctors?limit=100"),
    enabled: !!session?.user,
  });

  // Fetch Selected Doctor details
  const { data: doctor, isLoading: isDoctorLoading, error } = useQuery<DoctorDetails>({
    queryKey: ["doctor-booking", doctorId],
    queryFn: () => apiFetch(`/api/doctors/${doctorId}`),
    enabled: !!doctorId && !!session?.user,
  });

  // Generate next 14 days
  const daysList: Date[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  // Fetch bulk availability for next 14 days to disable fully-booked days
  const { data: daysAvailability, isLoading: isDaysAvailabilityLoading } = useQuery<Record<string, boolean>>({
    queryKey: ["doctor-days-availability", doctorId],
    queryFn: async () => {
      if (!doctorId) return {};
      const dates = daysList.map((day) => getLocalDateString(day));
      const results = await Promise.all(
        dates.map(async (dStr) => {
          try {
            const slots = await apiFetch(`/api/doctors/${doctorId}/availability?date=${dStr}`);
            const hasAvailable = Array.isArray(slots) && slots.some((s: AvailabilitySlot) => s.available);
            return { dStr, disabled: !hasAvailable };
          } catch (err) {
            return { dStr, disabled: true };
          }
        })
      );
      return results.reduce((acc, item) => {
        acc[item.dStr] = item.disabled;
        return acc;
      }, {} as Record<string, boolean>);
    },
    enabled: !!doctorId && !!session?.user,
    staleTime: 30_000,
  });

  // Live availability for selected date
  const dateStr = selectedDate ? getLocalDateString(selectedDate) : "";
  const { data: availabilitySlots, isLoading: isSlotsLoading } = useQuery<AvailabilitySlot[]>({
    queryKey: ["booking-availability", doctorId, dateStr],
    queryFn: () => apiFetch(`/api/doctors/${doctorId}/availability?date=${dateStr}`),
    enabled: !!doctorId && !!dateStr && !!session?.user,
    staleTime: 30_000,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { type: "in-person" },
  });

  // Booking Mutation with Optimistic Updates
  const bookingMutation = useMutation({
    mutationFn: (values: BookingFormValues) => {
      return apiFetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          doctorId: doctor?.userId,
          date: dateStr,
          timeSlot: selectedSlot,
          type: values.type,
          reasonForVisit: values.reasonForVisit,
          notes: values.notes,
        }),
      });
    },
    onMutate: async (newBooking) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["patient-appointments"] });
      await queryClient.cancelQueries({ queryKey: ["doctor-appointments"] });
      await queryClient.cancelQueries({ queryKey: ["appointments-mine"] });

      const previousMine = queryClient.getQueryData(["appointments-mine"]);

      // Optimistic update
      const tempId = generateTempId();
      const optimisticAppointment = {
        _id: tempId,
        doctorId: doctor?.userId,
        patientId: session?.user?.id,
        date: dateStr,
        timeSlot: selectedSlot,
        type: newBooking.type,
        reasonForVisit: newBooking.reasonForVisit,
        notes: newBooking.notes || "",
        status: "pending",
        createdAt: new Date().toISOString(),
        doctorUser: {
          name: doctor?.user.name || "Doctor",
        },
        doctorProfile: {
          specialty: doctor?.specialty || "",
        },
      };

      queryClient.setQueryData(["appointments-mine"], (old: unknown) => {
        const list = Array.isArray(old) ? old : [];
        return [optimisticAppointment, ...list];
      });

      queryClient.setQueryData(["patient-appointments"], (old: unknown) => {
        const list = Array.isArray(old) ? old : [];
        return [optimisticAppointment, ...list];
      });

      return { previousMine };
    },
    onSuccess: (data, variables) => {
      toast.success("Appointment request sent successfully!");
      setBookedDetails(variables);
      setShowConfirmation(true);
      queryClient.invalidateQueries({ queryKey: ["booking-availability", doctorId, dateStr] });
      queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-mine"] });
    },
    onError: (err: Error, variables, context: { previousMine: unknown } | undefined) => {
      toast.error(err.message || "Failed to schedule appointment.");
      if (context?.previousMine) {
        queryClient.setQueryData(["appointments-mine"], context.previousMine);
        queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
      }
    },
  });

  // Countdown countdown for redirection
  useEffect(() => {
    if (showConfirmation) {
      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            router.push("/appointments/manage");
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showConfirmation, router]);

  const filteredDoctors = doctorsList?.doctors?.filter((doc) =>
    doc.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.city.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isSessionPending) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm font-semibold text-slate-500">Checking authorization...</p>
      </div>
    );
  }

  if (showConfirmation && bookedDetails) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-slate-200 p-8 rounded-3xl shadow-sm text-center flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="h-16 w-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center border border-teal-100 animate-bounce">
          <CheckCircle className="h-10 w-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Appointment Scheduled!</h2>
          <p className="text-sm text-slate-500 mt-1">Your reservation request has been received.</p>
        </div>

        <div className="w-full text-xs space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left text-slate-600">
          <div className="flex justify-between border-b border-slate-200/50 pb-2.5">
            <span className="font-medium text-slate-400">Doctor</span>
            <span className="font-bold text-slate-800">{doctor?.user.name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/50 pb-2.5">
            <span className="font-medium text-slate-400">Specialty</span>
            <span className="font-bold text-slate-800">{doctor?.specialty}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/50 pb-2.5">
            <span className="font-medium text-slate-400">Date</span>
            <span className="font-bold text-slate-800">
              {selectedDate?.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-200/50 pb-2.5">
            <span className="font-medium text-slate-400">Time Slot</span>
            <span className="font-bold text-slate-800">{selectedSlot}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/50 pb-2.5">
            <span className="font-medium text-slate-400">Type</span>
            <span className="font-bold text-slate-800 capitalize">{bookedDetails.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-slate-400">Reason</span>
            <span className="font-bold text-slate-800 truncate max-w-[220px]">{bookedDetails.reasonForVisit}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => router.push("/appointments/manage")}
            className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 text-xs transition-all cursor-pointer shadow-md shadow-teal-600/10"
          >
            Manage Appointments
          </button>
          <button
            onClick={() => router.push("/dashboard/patient")}
            className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 text-xs transition-all cursor-pointer"
          >
            Dashboard
          </button>
        </div>

        <p className="text-[10px] text-slate-400 animate-pulse">
          Redirecting to manage appointments page in {countdown} seconds...
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Selector column */}
      <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-black text-slate-900">Schedule Consultation</h2>
          <p className="text-slate-500 text-xs mt-0.5">Configure your visit details and secure your reservation.</p>
        </div>

        {/* Doctor Search Select Picker */}
        <div ref={dropdownRef} className="relative">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Select Provider</label>
          {doctor ? (
            <div className="flex items-center justify-between border border-slate-200 p-4 rounded-2xl bg-teal-50/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700 text-sm font-bold border border-teal-200">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{doctor.user.name}</h4>
                  <p className="text-xs text-slate-500">{doctor.specialty} • {doctor.city} • ${doctor.consultationFee}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  router.replace("/appointments/add");
                  setSelectedDate(null);
                  setSelectedSlot(null);
                  setSearchQuery("");
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-all cursor-pointer"
                title="Clear selected doctor"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search provider by name, specialty, or city..."
                  value={searchQuery}
                  onFocus={() => setDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDropdownOpen(true);
                  }}
                  className="w-full rounded-2xl border border-slate-200 p-4 pl-11 text-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-slate-800 font-medium"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              </div>
              {dropdownOpen && (
                <div className="absolute z-20 mt-2 w-full max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-lg flex flex-col gap-1">
                  {isDoctorsLoading ? (
                    <div className="flex items-center justify-center py-4 text-xs text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin text-teal-600 mr-2" /> Loading providers...
                    </div>
                  ) : filteredDoctors.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 italic">No doctors match your query.</div>
                  ) : (
                    filteredDoctors.map((doc) => (
                      <button
                        key={doc.userId}
                        type="button"
                        onClick={() => {
                          router.replace(`/appointments/add?doctorId=${doc.userId}`);
                          setSearchQuery(doc.user.name);
                          setDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 text-xs font-bold border border-teal-100">
                          {doc.user.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{doc.user.name}</h4>
                          <p className="text-[10px] text-slate-500">{doc.specialty} • {doc.city} • ${doc.consultationFee}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Calendar days */}
        {doctor && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Select Date</label>
            {isDaysAvailabilityLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" /> Computing dates availability...
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {daysList.map((day, idx) => {
                  const dayStr = getLocalDateString(day);
                  const isSelected = selectedDate?.toDateString() === day.toDateString();
                  const isDisabled = daysAvailability?.[dayStr] ?? false;

                  return (
                    <button
                      key={idx}
                      disabled={isDisabled}
                      onClick={() => {
                        setSelectedDate(day);
                        setSelectedSlot(null);
                      }}
                      className={`flex flex-col items-center p-3 rounded-2xl border transition-all shrink-0 min-w-[75px] ${
                        isDisabled
                          ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-60"
                          : isSelected
                          ? "bg-teal-600 border-teal-600 text-white shadow-md cursor-pointer"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 cursor-pointer"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase">
                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                      <span className="text-lg font-black mt-1">{day.getDate()}</span>
                      <span className="text-[9px] font-semibold">
                        {day.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      {isDisabled && (
                        <span className="text-[8px] font-bold text-red-500 mt-1 uppercase scale-90">Full</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Live Availability Slots */}
        {doctor && selectedDate && (
          <div className="border-t border-slate-100 pt-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Available Slots — {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </label>
            {isSlotsLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" /> Checking live availability...
              </div>
            ) : !availabilitySlots || availabilitySlots.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No schedule configured by the doctor for this day.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availabilitySlots.map((slot) => {
                  const booked = !slot.available;
                  const isSelected = selectedSlot === slot.timeSlot;
                  return (
                    <button
                      key={slot.timeSlot}
                      disabled={booked}
                      onClick={() => setSelectedSlot(isSelected ? null : slot.timeSlot)}
                      className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                        booked
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50 line-through"
                          : isSelected
                          ? "bg-teal-50 border-teal-500 text-teal-700 ring-2 ring-teal-500/20 scale-[1.01]"
                          : "bg-white border-slate-200 text-slate-600 hover:border-teal-300 cursor-pointer"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {slot.timeSlot}
                      {booked && <span className="text-[9px] ml-0.5">(Taken)</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form column */}
      <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col gap-6">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Booking Summary</h3>
          <p className="text-xs text-slate-400 mt-0.5">Details regarding your scheduled visit.</p>
        </div>

        {doctor ? (
          <div className="text-xs space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-600">
            <p>Doctor: <strong className="text-slate-800">{doctor.user.name}</strong></p>
            <p>Specialty: <strong>{doctor.specialty}</strong></p>
            <p>Fee: <strong className="text-teal-600">${doctor.consultationFee}</strong></p>
            {selectedDate && <p>Date: <strong>{selectedDate.toLocaleDateString()}</strong></p>}
            {selectedSlot && <p>Time: <strong>{selectedSlot}</strong></p>}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-2xl border border-slate-100">
            Select a provider from the picker to view scheduling options.
          </div>
        )}

        {doctor && selectedDate && selectedSlot ? (
          <form onSubmit={handleSubmit((values) => bookingMutation.mutate(values))} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Visit Type</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-slate-200 cursor-pointer text-xs font-semibold hover:bg-slate-50 transition-all text-slate-700">
                  <input type="radio" value="in-person" {...register("type")} className="accent-teal-600" />
                  🏥 Clinic
                </label>
                <label className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-slate-200 cursor-pointer text-xs font-semibold hover:bg-slate-50 transition-all text-slate-700">
                  <input type="radio" value="video" {...register("type")} className="accent-teal-600" />
                  <Video className="h-3.5 w-3.5 text-slate-500" />
                  Video
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Reason for Visit</label>
              <textarea
                placeholder="E.g., general body checkup, prescription renewal..."
                {...register("reasonForVisit")}
                className={`w-full rounded-xl border p-3 mt-1.5 text-xs outline-none h-20 focus:border-teal-500 transition-all text-slate-800 ${
                  errors.reasonForVisit ? "border-red-300" : "border-slate-200"
                }`}
              />
              {errors.reasonForVisit && (
                <p className="mt-1 text-[10px] text-red-600 font-semibold">{errors.reasonForVisit.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={bookingMutation.isPending}
              className="flex w-full items-center justify-center gap-2 cursor-pointer rounded-xl bg-teal-600 hover:bg-teal-500 py-3 text-xs font-bold text-white shadow-md transition-all"
            >
              {bookingMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Reserving...
                </>
              ) : (
                "Book Consultation"
              )}
            </button>
          </form>
        ) : (
          doctor && (
            <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50/50 rounded-xl">
              Choose a date and available time slot to configure your consultation details.
            </p>
          )
        )}
      </div>
    </div>
  );
}

export default function AppointmentsAddPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full flex-1 flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="rounded-2xl bg-teal-50 p-2.5 text-teal-600 border border-teal-100">
          <Stethoscope className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Schedule Appointment</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pre-select and reserve checkup schedule slots instantly.</p>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="text-sm font-semibold text-slate-500">Loading schedule form...</p>
        </div>
      }>
        <BookingWizard />
      </Suspense>
    </div>
  );
}
