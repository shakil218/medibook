import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Providers } from "@/lib/providers";
import { Toaster } from "sonner";
import AssistantWidget from "@/components/AssistantWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediBook — Doctor Appointment & Consultation Platform",
  description: "Search for verified specialists, book appointments, check symptoms using AI triage, and manage consultation agendas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800">
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Toaster richColors position="top-right" />
          <AssistantWidget />
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                {/* Brand */}
                <div className="col-span-2 md:col-span-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="rounded-xl bg-teal-500 p-1.5 text-white">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </div>
                    <span className="font-bold text-lg text-slate-800">Medi<span className="text-teal-600">Book</span></span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    Connecting patients with verified specialists for better healthcare outcomes.
                  </p>
                  <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} MediBook. All rights reserved.</p>
                </div>

                {/* Platform */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Platform</h4>
                  <ul className="space-y-2">
                    {[
                      { label: "Find Doctors", href: "/doctors" },
                      { label: "AI Symptom Checker", href: "/symptom-checker" },
                      { label: "Book Appointment", href: "/appointments/add" },
                      { label: "Manage Appointments", href: "/appointments/manage" },
                    ].map((link) => (
                      <li key={link.href}>
                        <a href={link.href} className="text-sm text-slate-500 hover:text-teal-600 transition-colors">{link.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Company */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Company</h4>
                  <ul className="space-y-2">
                    {[
                      { label: "About Us", href: "/about" },
                      { label: "Blog", href: "/blog" },
                      { label: "Contact", href: "/contact" },
                      { label: "FAQ", href: "/faq" },
                    ].map((link) => (
                      <li key={link.href}>
                        <a href={link.href} className="text-sm text-slate-500 hover:text-teal-600 transition-colors">{link.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Account */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Account</h4>
                  <ul className="space-y-2">
                    {[
                      { label: "Sign In", href: "/login" },
                      { label: "Create Account", href: "/register" },
                      { label: "Dashboard", href: "/dashboard/patient" },
                      { label: "Profile", href: "/profile" },
                    ].map((link) => (
                      <li key={link.href}>
                        <a href={link.href} className="text-sm text-slate-500 hover:text-teal-600 transition-colors">{link.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-400">Professional healthcare made accessible to everyone.</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                    All systems operational
                  </span>
                  <span>·</span>
                  <a href="/faq" className="hover:text-teal-600 transition-colors">Privacy</a>
                  <a href="/faq" className="hover:text-teal-600 transition-colors">Terms</a>
                </div>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
