"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Settings,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Camera,
  Upload,
  X,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  city: z.string().min(2, "City name must be at least 2 characters"),
  image: z.string().optional(),
  specialty: z.string().optional(),
  experienceYears: z.number().optional(),
  consultationFee: z.number().optional(),
  bio: z.string().optional(),
  qualifications: z.string().optional(),
  languages: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
  slotDurationMins: number;
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
  availability: AvailabilitySlot[];
  imageUrl?: string;
}

// ─── ImgBB Upload Hook ─────────────────────────────────────────────────────
function useImgBBUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(async (file: File): Promise<string> => {
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY?.trim();
    
    // Demo Mode fallback if key is missing or is the default placeholder
    if (!apiKey || apiKey === "your_imgbb_api_key_here") {
      setUploading(true);
      setProgress(20);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setProgress(60);
      await new Promise((resolve) => setTimeout(resolve, 400));
      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 200));
      
      const mockAvatars = [
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300",
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300",
        "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300&h=300",
        "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300&h=300"
      ];
      const selected = mockAvatars[Math.floor(Math.random() * mockAvatars.length)];
      
      setUploading(false);
      setProgress(0);
      toast.info("Demo Mode: Using mock upload (No real ImgBB API key found).");
      return selected;
    }

    setUploading(true);
    setProgress(10);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("key", apiKey);

    try {
      setProgress(40);
      const res = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: formData,
      });
      setProgress(80);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || "ImgBB upload failed. Check your API key at imgbb.com/api");
      }

      const data = await res.json();
      setProgress(100);

      if (!data.success) throw new Error("ImgBB returned failure. Verify your API key.");
      return data.data.url as string;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 600);
    }
  }, []);

  return { upload, uploading, progress };
}

// ─── Avatar Uploader Component ─────────────────────────────────────────────
function AvatarUploader({
  currentUrl,
  name,
  onUpload,
}: {
  currentUrl: string;
  name: string;
  onUpload: (url: string) => void;
}) {
  const { upload, uploading, progress } = useImgBBUpload();
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync / Reset local override when the parent's value resets or shifts completely
  useEffect(() => {
    setLocalUrl(null);
  }, [currentUrl]);

  const displayUrl = localUrl !== null ? localUrl : (currentUrl || "");

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WEBP, GIF).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10MB.");
      return;
    }

    const tempUrl = URL.createObjectURL(file);
    setLocalUrl(tempUrl);

    try {
      const hostedUrl = await upload(file);
      setLocalUrl(hostedUrl);
      onUpload(hostedUrl);
      toast.success("Profile photo uploaded successfully!");
    } catch (err: unknown) {
      setLocalUrl(null);
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalUrl("");
    onUpload("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="sm:col-span-2">
      <label className="block text-sm font-semibold text-slate-700 mb-3">
        Profile Photo
      </label>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Avatar preview */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt="Profile photo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-extrabold text-slate-400">{initials}</span>
            )}
          </div>
          {/* Upload progress ring */}
          {uploading && (
            <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin text-white mx-auto" />
                <span className="text-white text-xs font-bold mt-1 block">{progress}%</span>
              </div>
            </div>
          )}
          {/* Clear button */}
          {displayUrl && !uploading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors cursor-pointer"
              title="Remove photo"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          {/* Upload indicator badge */}
          {!uploading && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md hover:bg-teal-500 transition-colors cursor-pointer"
              title="Change photo"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Drop zone */}
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex-1 w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
            isDragging
              ? "border-teal-500 bg-teal-50 scale-[1.01]"
              : uploading
              ? "border-slate-200 bg-slate-50 cursor-not-allowed"
              : "border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 bg-white"
          } p-6 text-center`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
              <p className="text-sm font-semibold text-teal-600">Uploading to ImgBB... {progress}%</p>
              {/* Progress bar */}
              <div className="w-full max-w-xs bg-slate-200 rounded-full h-1.5 mx-auto">
                <div
                  className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : displayUrl ? (
            <div className="flex flex-col items-center gap-1.5">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              <p className="text-sm font-semibold text-emerald-600">Photo uploaded</p>
              <p className="text-xs text-slate-400">Click or drag to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  <span className="text-teal-600">Click to upload</span> or drag & drop
                </p>
                <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, WEBP up to 10MB</p>
              </div>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {/* Manual URL Input Fallback */}
      <div className="mt-3">
        <label className="block text-xs font-semibold text-slate-500 mb-1">
          Or paste a direct image URL (no API key required):
        </label>
        <input
          type="text"
          value={displayUrl}
          onChange={(e) => {
            const val = e.target.value;
            setLocalUrl(val);
            onUpload(val);
          }}
          placeholder="https://example.com/your-avatar.jpg"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 text-xs outline-none focus:border-teal-500 transition-all bg-white"
        />
      </div>
    </div>
  );
}

// ─── Main Profile Page ──────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending: authPending } = authClient.useSession();

  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [newDay, setNewDay] = useState("Monday");
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");
  const [newDuration, setNewDuration] = useState(30);

  const { data: doctorDetails } = useQuery<DoctorProfile>({
    queryKey: ["doctor-profile-data", session?.user?.id],
    queryFn: () => apiFetch(`/api/doctors/${session?.user?.id}`),
    enabled: !!session?.user && session.user.role === "doctor",
  });

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const watchedImage = watch("image") || "";
  const watchedName = watch("name") || session?.user?.name || "";

  const formInitialized = useRef(false);

  useEffect(() => {
    if (session?.user && !formInitialized.current) {
      if (session.user.role === "doctor" && doctorDetails) {
        reset({
          name: session.user.name,
          phone: session.user.phone || "",
          city: session.user.city || "",
          image: session.user.image || doctorDetails.imageUrl || "",
          specialty: doctorDetails.specialty || "",
          experienceYears: doctorDetails.experienceYears || 0,
          consultationFee: doctorDetails.consultationFee || 0,
          bio: doctorDetails.bio || "",
          qualifications: doctorDetails.qualifications?.join(", ") || "",
          languages: doctorDetails.languages?.join(", ") || "",
        });
        if (doctorDetails.availability) {
          setAvailabilitySlots(doctorDetails.availability);
        }
        formInitialized.current = true;
      } else if (session.user.role === "patient") {
        reset({
          name: session.user.name,
          phone: session.user.phone || "",
          city: session.user.city || "",
          image: session.user.image || "",
        });
        formInitialized.current = true;
      }
    }
  }, [session, doctorDetails, reset]);

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      // Use Better Auth client API to update user name, image, phone, and city.
      // This automatically refreshes the session cookie/JWT so the avatar updates instantly.
      await authClient.updateUser({
        name: values.name,
        image: values.image || "",
        phone: values.phone || "",
        city: values.city,
      });

      if (session?.user?.role === "doctor") {
        await apiFetch("/api/doctors/profile", {
          method: "POST",
          body: JSON.stringify({
            specialty: values.specialty,
            experienceYears: Number(values.experienceYears),
            consultationFee: Number(values.consultationFee),
            city: values.city,
            bio: values.bio,
            qualifications: values.qualifications?.split(",").map((s: string) => s.trim()).filter(Boolean) || [],
            languages: values.languages?.split(",").map((s: string) => s.trim()).filter(Boolean) || [],
            imageUrl: values.image || "",
          }),
        });

        await apiFetch("/api/doctors/me/availability", {
          method: "PATCH",
          body: JSON.stringify({ availability: availabilitySlots }),
        });
      }

      await authClient.getSession();
    },
    onSuccess: () => {
      toast.success("Profile saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["doctor-profile-data"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update profile.");
    },
  });

  const handleAddSlot = () => {
    if (availabilitySlots.some((s) => s.day === newDay)) {
      toast.warning(`A slot for ${newDay} already exists.`);
      return;
    }
    setAvailabilitySlots((prev) => [
      ...prev,
      { day: newDay, startTime: newStart, endTime: newEnd, slotDurationMins: Number(newDuration) },
    ]);
  };

  const handleRemoveSlot = (day: string) => {
    setAvailabilitySlots((prev) => prev.filter((s) => s.day !== day));
  };

  if (authPending) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 flex-1 bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm font-semibold text-slate-500">Loading your profile...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center flex-1 flex flex-col justify-center">
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-8 text-amber-700">
          <AlertCircle className="h-10 w-10 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-bold">Authentication Required</h2>
          <p className="text-sm mt-1">Please log in to edit your profile.</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm px-4 py-2 cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const isDoctor = session.user.role === "doctor";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 w-full flex-1 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="rounded-2xl bg-teal-50 p-2.5 text-teal-600 border border-teal-100">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Account Profile</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your personal details and consultation preferences.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm">
        <form onSubmit={handleSubmit((values) => updateProfileMutation.mutate(values))} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

            <input type="hidden" {...register("image")} />

            {/* ── Avatar Uploader ── */}
            <AvatarUploader
              currentUrl={watchedImage}
              name={watchedName}
              onUpload={(url) => setValue("image", url, { shouldValidate: true })}
            />

            {/* ── Full Name ── */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">Full Name</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  {...register("name")}
                  className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-slate-800 text-sm outline-none transition-all ${
                    errors.name ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-teal-500"
                  }`}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            {/* ── Email (read-only) ── */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">Email Address <span className="text-slate-400 font-normal">(read-only)</span></label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={session.user.email}
                  disabled
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 pl-10 pr-4 py-2.5 text-slate-400 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {/* ── Phone ── */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">Phone Number</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  {...register("phone")}
                  placeholder="+1 (555) 012-3456"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-slate-800 text-sm outline-none focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            {/* ── City ── */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">Location City</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <MapPin className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  {...register("city")}
                  className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-slate-800 text-sm outline-none transition-all ${
                    errors.city ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-teal-500"
                  }`}
                />
              </div>
              {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
            </div>

            {/* ── Doctor Fields ── */}
            {isDoctor && (
              <>
                <div className="sm:col-span-2 border-t border-slate-100 pt-6">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Professional Practice Details</h3>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Specialty</label>
                  <input
                    type="text"
                    {...register("specialty")}
                    className="w-full rounded-xl border border-slate-200 p-2.5 mt-1 text-sm outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Years of Experience</label>
                  <input
                    type="number"
                    {...register("experienceYears", { valueAsNumber: true })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 mt-1 text-sm outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Consultation Fee ($)</label>
                  <input
                    type="number"
                    {...register("consultationFee", { valueAsNumber: true })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 mt-1 text-sm outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700">Qualifications <span className="text-slate-400 font-normal">(comma separated)</span></label>
                  <input
                    type="text"
                    {...register("qualifications")}
                    placeholder="MD, FACC, Harvard Medical"
                    className="w-full rounded-xl border border-slate-200 p-2.5 mt-1 text-sm outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700">Languages <span className="text-slate-400 font-normal">(comma separated)</span></label>
                  <input
                    type="text"
                    {...register("languages")}
                    placeholder="English, Spanish"
                    className="w-full rounded-xl border border-slate-200 p-2.5 mt-1 text-sm outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700">Biography</label>
                  <textarea
                    {...register("bio")}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 p-3 mt-1 text-sm outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                {/* Availability Schedule */}
                <div className="sm:col-span-2 border-t border-slate-100 pt-6">
                  <label className="block text-sm font-bold text-slate-900 mb-4">Availability Schedule</label>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500">Day</label>
                        <select
                          value={newDay}
                          onChange={(e) => setNewDay(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 p-2.5 mt-1 text-sm bg-white"
                        >
                          {WEEKDAYS.map((w) => <option key={w} value={w}>{w}</option>)}
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
                      className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold py-2.5 px-4 cursor-pointer self-start flex items-center gap-1 transition-all"
                    >
                      <Plus className="h-4 w-4" /> Add Day Slot
                    </button>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    {availabilitySlots.map((slot) => (
                      <div key={slot.day} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl text-sm">
                        <span><strong>{slot.day}</strong>: {slot.startTime} – {slot.endTime} ({slot.slotDurationMins}m slots)</span>
                        <button type="button" onClick={() => handleRemoveSlot(slot.day)} className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="flex items-center justify-center gap-2 cursor-pointer rounded-xl bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm px-6 py-3 transition-all"
          >
            {updateProfileMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving changes...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" /> Save Profile</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
