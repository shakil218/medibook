"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import {
  Activity,
  LogOut,
  Search,
  Brain,
  Calendar,
  LogIn,
  BookOpen,
  Info,
  HelpCircle,
  Mail,
  Menu,
  X,
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  const isActive = (path: string) => pathname === path;

  const linkClass = (path: string) =>
    `flex items-center text-sm font-semibold transition-all px-2.5 py-1.5 rounded-xl whitespace-nowrap ${
      isActive(path)
        ? "text-teal-600 bg-teal-50 border border-teal-100/50 shadow-sm"
        : "text-slate-600 hover:text-teal-600 hover:bg-slate-50 border border-transparent"
    }`;

  const mobileLinkClass = (path: string) =>
    `flex items-center gap-2 text-sm font-semibold transition-all px-3 py-2 rounded-xl ${
      isActive(path)
        ? "text-teal-600 bg-teal-50"
        : "text-slate-600 hover:text-teal-600 hover:bg-slate-50"
    }`;

  const dashboardPath = session?.user
    ? session.user.role === "doctor"
      ? "/dashboard/doctor"
      : "/dashboard/patient"
    : "";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="rounded-xl bg-teal-500 p-2 text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
              <Activity className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">
              Medi<span className="text-teal-600">Book</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation (Text Only) */}
        <nav className="hidden lg:flex items-center gap-1.5 xl:gap-3">
          <Link href="/doctors" className={linkClass("/doctors")}>
            Find Doctors
          </Link>
          <Link href="/symptom-checker" className={linkClass("/symptom-checker")}>
            Symptom Checker
          </Link>
          <Link href="/blog" className={linkClass("/blog")}>
            Blog
          </Link>
          <Link href="/about" className={linkClass("/about")}>
            About
          </Link>
          <Link href="/faq" className={linkClass("/faq")}>
            FAQ
          </Link>
          <Link href="/contact" className={linkClass("/contact")}>
            Contact
          </Link>

          {session?.user && (
            <Link href={dashboardPath} className={linkClass(dashboardPath)}>
              Dashboard
            </Link>
          )}
        </nav>

        {/* User Account Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isPending ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
          ) : session?.user ? (
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-800">
                  {session.user.name}
                </span>
                <span className="text-xs text-slate-500 capitalize font-medium">
                  {session.user.role}
                </span>
              </div>
              <div className="relative group">
                <Link href="/profile" className="block">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name}
                      referrerPolicy="no-referrer"
                      className="h-9 w-9 rounded-xl object-cover border border-teal-100 hover:scale-[1.03] transition-all cursor-pointer shadow-sm"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 hover:scale-[1.03] transition-all cursor-pointer border border-teal-100 font-bold uppercase shadow-sm">
                      {session.user.name[0]}
                    </div>
                  )}
                </Link>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-teal-600/10 hover:bg-teal-500 transition-all hover:translate-y-[-1px]"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Responsive Hamburger Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 lg:hidden transition-all cursor-pointer"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Drawer (With Icons) */}
      {isOpen && (
        <div className="border-t border-slate-100 bg-white lg:hidden px-4 py-4 flex flex-col gap-2.5 shadow-inner">
          <Link
            href="/doctors"
            className={mobileLinkClass("/doctors")}
            onClick={() => setIsOpen(false)}
          >
            <Search className="h-4 w-4" />
            Find Doctors
          </Link>
          <Link
            href="/symptom-checker"
            className={mobileLinkClass("/symptom-checker")}
            onClick={() => setIsOpen(false)}
          >
            <Brain className="h-4 w-4" />
            Symptom Checker
          </Link>
          <Link
            href="/blog"
            className={mobileLinkClass("/blog")}
            onClick={() => setIsOpen(false)}
          >
            <BookOpen className="h-4 w-4" />
            Blog
          </Link>
          <Link
            href="/about"
            className={mobileLinkClass("/about")}
            onClick={() => setIsOpen(false)}
          >
            <Info className="h-4 w-4" />
            About
          </Link>
          <Link
            href="/faq"
            className={mobileLinkClass("/faq")}
            onClick={() => setIsOpen(false)}
          >
            <HelpCircle className="h-4 w-4" />
            FAQ
          </Link>
          <Link
            href="/contact"
            className={mobileLinkClass("/contact")}
            onClick={() => setIsOpen(false)}
          >
            <Mail className="h-4 w-4" />
            Contact
          </Link>
          {session?.user && (
            <Link
              href={dashboardPath}
              className={mobileLinkClass(dashboardPath)}
              onClick={() => setIsOpen(false)}
            >
              <Calendar className="h-4 w-4" />
              Dashboard
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
