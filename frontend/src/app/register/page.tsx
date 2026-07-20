"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authClient } from "@/lib/auth-client";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Loader2,
  AlertCircle,
  Activity,
  ArrowRight,
  Shield,
  Stethoscope,
  Heart,
  CheckCircle2,
} from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["patient", "doctor"]),
  phone: z.string().optional(),
  city: z.string().min(2, "City name must be at least 2 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// Google Icon SVG
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function BenefitRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
      </div>
      <span className="text-teal-100 text-sm">{text}</span>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "patient",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await authClient.signUp.email({
        email: values.email,
        password: values.password,
        name: values.name,
        role: values.role,
        phone: values.phone,
        city: values.city,
        fetchOptions: {
          onSuccess: () => {
            router.push("/");
            router.refresh();
          },
          onError: (ctx) => {
            setError(ctx.error.message || "Failed to create account. Email might be in use.");
            setLoading(false);
          },
        },
      });
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/`,
      });
    } catch (err) {
      console.error(err);
      setError("Google sign-up failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-1 min-h-screen">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500">
        {/* Decorative */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-teal-300/20 blur-2xl" />

        <div className="relative z-10 flex flex-col justify-center px-10 py-16 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <span className="font-bold text-2xl text-white tracking-tight">
              Medi<span className="text-teal-100">Book</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white leading-tight mb-4">
              Join thousands<br />
              <span className="text-teal-100">of patients & doctors.</span>
            </h1>
            <p className="text-teal-100 text-base leading-relaxed max-w-xs">
              Sign up to unlock personalized healthcare management at your fingertips.
            </p>
          </div>

          {/* Benefits list */}
          <div className="space-y-3 mb-10">
            <BenefitRow text="Instant appointment booking with top doctors" />
            <BenefitRow text="AI-powered symptom checker & triage" />
            <BenefitRow text="Secure health records & consultation history" />
            <BenefitRow text="Real-time availability & reminders" />
            <BenefitRow text="Verified doctor profiles & reviews" />
          </div>

          {/* Icons row */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="flex gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Trusted platform</p>
              <p className="text-teal-100 text-xs">500+ verified specialists available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Register Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 bg-slate-50 lg:px-12 overflow-y-auto">
        {/* Mobile logo */}
        <div className="mb-6 flex items-center gap-2 lg:hidden">
          <div className="rounded-xl bg-teal-500 p-2 text-white shadow-md shadow-teal-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">
            Medi<span className="text-teal-600">Book</span>
          </span>
        </div>

        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="mb-7">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
            <p className="mt-2 text-slate-500 text-sm">
              Join MediBook today — it&apos;s free and takes less than a minute.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign Up */}
          <button
            id="google-signup-btn"
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? "Redirecting to Google..." : "Sign up with Google"}
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-50 px-3 text-slate-400 font-medium">or register with email</span>
            </div>
          </div>

          {/* Form */}
          <form id="register-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Role Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                I am joining as a:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="role-patient-btn"
                  type="button"
                  onClick={() => setValue("role", "patient")}
                  className={`flex flex-col items-center gap-1.5 py-3.5 px-4 rounded-2xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    selectedRole === "patient"
                      ? "bg-teal-50 border-teal-500 text-teal-700 shadow-md shadow-teal-500/10 scale-[1.02]"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xl">🤒</span>
                  <span>Patient</span>
                </button>
                <button
                  id="role-doctor-btn"
                  type="button"
                  onClick={() => setValue("role", "doctor")}
                  className={`flex flex-col items-center gap-1.5 py-3.5 px-4 rounded-2xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    selectedRole === "doctor"
                      ? "bg-teal-50 border-teal-500 text-teal-700 shadow-md shadow-teal-500/10 scale-[1.02]"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xl">🩺</span>
                  <span>Medical Doctor</span>
                </button>
              </div>
            </div>

            {/* Name + Email */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Full Name */}
              <div>
                <label htmlFor="reg-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="Jane Smith"
                    autoComplete="name"
                    {...register("name")}
                    className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-slate-800 text-sm bg-white outline-none transition-all placeholder:text-slate-400 ${
                      errors.name
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    }`}
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...register("email")}
                    className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-slate-800 text-sm bg-white outline-none transition-all placeholder:text-slate-400 ${
                      errors.email
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    }`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="min. 6 characters"
                    autoComplete="new-password"
                    {...register("password")}
                    className={`w-full rounded-xl border pl-10 pr-11 py-2.5 text-slate-800 text-sm bg-white outline-none transition-all placeholder:text-slate-400 ${
                      errors.password
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>}
              </div>

              {/* City */}
              <div>
                <label htmlFor="reg-city" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  City / Location
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <input
                    id="reg-city"
                    type="text"
                    placeholder="New York"
                    {...register("city")}
                    className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-slate-800 text-sm bg-white outline-none transition-all placeholder:text-slate-400 ${
                      errors.city
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    }`}
                  />
                </div>
                {errors.city && <p className="mt-1 text-xs text-red-600 font-medium">{errors.city.message}</p>}
              </div>

              {/* Phone — full width */}
              <div className="sm:col-span-2">
                <label htmlFor="reg-phone" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Phone Number{" "}
                  <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    id="reg-phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    autoComplete="tel"
                    {...register("phone")}
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-slate-800 text-sm bg-white outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/25 hover:shadow-teal-600/40 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-xs text-center text-slate-400 leading-relaxed">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-teal-600 hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-teal-600 hover:underline">Privacy Policy</Link>.
            </p>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-teal-600 hover:text-teal-500 transition-colors underline-offset-2 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
