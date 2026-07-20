"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiFetch } from "@/lib/api";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  User,
  FileText,
} from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const CONTACT_INFO = [
  {
    icon: <Mail className="h-5 w-5 text-teal-600" />,
    label: "Email Us",
    value: "support@medibook.health",
    sub: "We reply within 2 business hours",
    bg: "bg-teal-50",
  },
  {
    icon: <Phone className="h-5 w-5 text-blue-600" />,
    label: "Call Us",
    value: "+1 (800) MEDIBOOK",
    sub: "Mon–Fri, 9am–6pm",
    bg: "bg-blue-50",
  },
  {
    icon: <MapPin className="h-5 w-5 text-emerald-600" />,
    label: "Our Office",
    value: "42 Health Avenue, Dhaka",
    sub: "Bangladesh — 1200",
    bg: "bg-emerald-50",
  },
  {
    icon: <Clock className="h-5 w-5 text-amber-600" />,
    label: "Business Hours",
    value: "Mon–Fri: 9am–6pm",
    sub: "Sat: 10am–2pm",
    bg: "bg-amber-50",
  },
];

const SUBJECTS = [
  "General Inquiry",
  "Appointment Issue",
  "Doctor Verification",
  "Billing & Payments",
  "Technical Support",
  "Partnership Inquiry",
  "Media & Press",
  "Other",
];

export default function ContactPage() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (values: ContactFormValues) => {
    setServerError(null);
    try {
      await apiFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setSuccess(true);
      reset();
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Failed to send message. Please try again.");
    }
  };

  return (
    <div className="flex-1 bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-20 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-slate-300">
            <MessageSquare className="h-4 w-4" />
            Get in Touch
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4">
            We&apos;d Love to Hear From You
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Have a question, feedback, or need support? Send us a message and our team will get back to you promptly.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-5 gap-12">

          {/* Left — Contact Info */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 mb-2">Contact Information</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Reach out through any of the channels below. For urgent medical matters, please call emergency services.
              </p>
            </div>

            <div className="space-y-3">
              {CONTACT_INFO.map((info) => (
                <div key={info.label} className={`flex items-start gap-4 p-4 rounded-2xl ${info.bg} border border-white`}>
                  <div className="shrink-0 p-2 rounded-xl bg-white shadow-sm">
                    {info.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{info.label}</p>
                    <p className="font-semibold text-slate-900 text-sm mt-0.5">{info.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{info.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Map placeholder */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 h-40 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">42 Health Avenue, Dhaka</p>
              </div>
            </div>
          </div>

          {/* Right — Form */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100/50">
              {success ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <div className="mb-4 p-4 rounded-full bg-emerald-50">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-2">Message Sent!</h3>
                  <p className="text-slate-600 mb-6 max-w-sm">
                    Thanks for reaching out! Our team will get back to you at your email address within 2 business hours.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="rounded-xl bg-teal-600 text-white font-bold px-6 py-2.5 hover:bg-teal-500 transition-all text-sm cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-extrabold text-slate-900 mb-6">Send a Message</h2>

                  {serverError && (
                    <div className="mb-5 flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <span>{serverError}</span>
                    </div>
                  )}

                  <form id="contact-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <label htmlFor="contact-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Full Name
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                            <User className="h-4 w-4" />
                          </span>
                          <input
                            id="contact-name"
                            type="text"
                            placeholder="Jane Smith"
                            {...register("name")}
                            className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-slate-800 text-sm bg-white outline-none transition-all placeholder:text-slate-400 ${
                              errors.name ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                            }`}
                          />
                        </div>
                        {errors.name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.name.message}</p>}
                      </div>

                      {/* Email */}
                      <div>
                        <label htmlFor="contact-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Email Address
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                            <Mail className="h-4 w-4" />
                          </span>
                          <input
                            id="contact-email"
                            type="email"
                            placeholder="you@example.com"
                            {...register("email")}
                            className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-slate-800 text-sm bg-white outline-none transition-all placeholder:text-slate-400 ${
                              errors.email ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                            }`}
                          />
                        </div>
                        {errors.email && <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>}
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label htmlFor="contact-subject" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Subject
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                          <FileText className="h-4 w-4" />
                        </span>
                        <select
                          id="contact-subject"
                          {...register("subject")}
                          className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-slate-800 text-sm bg-white outline-none transition-all appearance-none ${
                            errors.subject ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                          }`}
                        >
                          <option value="">Select a subject...</option>
                          {SUBJECTS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      {errors.subject && <p className="mt-1 text-xs text-red-600 font-medium">{errors.subject.message}</p>}
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="contact-message" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Message
                      </label>
                      <textarea
                        id="contact-message"
                        rows={5}
                        placeholder="Tell us how we can help..."
                        {...register("message")}
                        className={`w-full rounded-xl border px-4 py-3 text-slate-800 text-sm bg-white outline-none transition-all placeholder:text-slate-400 resize-none ${
                          errors.message ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        }`}
                      />
                      {errors.message && <p className="mt-1 text-xs text-red-600 font-medium">{errors.message.message}</p>}
                    </div>

                    <button
                      id="contact-submit-btn"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/25 hover:shadow-teal-600/40 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                      ) : (
                        <><Send className="h-4 w-4" /> Send Message</>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
