import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  Shield,
  Heart,
  Users,
  Award,
  Stethoscope,
  CheckCircle2,
  Star,
  ArrowRight,
  Globe,
  Zap,
  Lock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About MediBook — Our Mission & Story",
  description:
    "Learn about MediBook's mission to make quality healthcare accessible to everyone. Meet our team, values, and the technology behind the platform.",
};

const STATS = [
  { value: "500+", label: "Verified Specialists", icon: <Stethoscope className="h-5 w-5" /> },
  { value: "50K+", label: "Patients Served", icon: <Users className="h-5 w-5" /> },
  { value: "4.9★", label: "Average Rating", icon: <Star className="h-5 w-5" /> },
  { value: "99.9%", label: "Uptime SLA", icon: <Zap className="h-5 w-5" /> },
];

const VALUES = [
  {
    icon: <Heart className="h-6 w-6 text-rose-500" />,
    title: "Patient First",
    desc: "Every decision we make starts with one question: does this make the patient experience better? From booking to follow-up, we obsess over care quality.",
  },
  {
    icon: <Shield className="h-6 w-6 text-teal-500" />,
    title: "Privacy & Security",
    desc: "Your health data is sacred. We use HIPAA-grade encryption, zero-trust architecture, and regular third-party security audits to keep your information safe.",
  },
  {
    icon: <Globe className="h-6 w-6 text-blue-500" />,
    title: "Accessibility",
    desc: "Quality healthcare shouldn't be a privilege. MediBook connects underserved communities with top specialists through affordable video consultations.",
  },
  {
    icon: <Award className="h-6 w-6 text-amber-500" />,
    title: "Clinical Excellence",
    desc: "All doctors on our platform pass rigorous credential verification, background checks, and ongoing peer reviews to maintain the highest standards.",
  },
  {
    icon: <Zap className="h-6 w-6 text-purple-500" />,
    title: "Innovation",
    desc: "From AI symptom checkers to smart scheduling, we continuously invest in technology that makes healthcare more proactive, predictive, and personal.",
  },
  {
    icon: <Lock className="h-6 w-6 text-emerald-500" />,
    title: "Transparency",
    desc: "Clear pricing, honest reviews, and open communication. No hidden fees, no opaque processes — just straightforward healthcare you can trust.",
  },
];

const TIMELINE = [
  { year: "2022", title: "Founded", desc: "MediBook was founded with a single GP and 12 patients in Dhaka." },
  { year: "2023", title: "Platform Launch", desc: "Launched full booking platform with 50 specialist doctors and video consultations." },
  { year: "2024", title: "AI Integration", desc: "Introduced AI symptom checker and smart appointment recommendations." },
  { year: "2025", title: "10K Milestone", desc: "Reached 10,000 registered patients and expanded to 8 medical specialties." },
  { year: "2026", title: "Today", desc: "Serving 50,000+ patients with 500+ verified doctors nationwide." },
];

const TEAM = [
  { name: "Dr. Arjun Mehta", role: "Chief Medical Officer", emoji: "👨‍⚕️", bg: "bg-teal-50", text: "text-teal-700" },
  { name: "Sana Rashid", role: "CEO & Co-Founder", emoji: "👩‍💼", bg: "bg-blue-50", text: "text-blue-700" },
  { name: "Omar Abdullah", role: "CTO", emoji: "👨‍💻", bg: "bg-purple-50", text: "text-purple-700" },
  { name: "Priya Sharma", role: "Head of Design", emoji: "👩‍🎨", bg: "bg-rose-50", text: "text-rose-700" },
];

export default function AboutPage() {
  return (
    <div className="flex-1 bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 py-24 px-4">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
            <Activity className="h-4 w-4" />
            Our Story
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
            Healthcare, Reimagined<br />
            <span className="text-teal-100">for the Modern Patient.</span>
          </h1>
          <p className="text-teal-100 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            MediBook was built on a simple belief: every person deserves fast, affordable, and dignified access to quality medical care — wherever they are.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/doctors"
              className="inline-flex items-center gap-2 rounded-2xl bg-white text-teal-700 font-bold px-6 py-3 hover:bg-teal-50 transition-all shadow-lg"
            >
              Find a Doctor <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/20 text-white font-bold px-6 py-3 hover:bg-white/30 transition-all backdrop-blur-sm border border-white/30"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-100 bg-slate-50 py-12 px-4">
        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 p-3 rounded-xl bg-teal-50 text-teal-600">{s.icon}</div>
              <span className="text-3xl font-extrabold text-slate-900">{s.value}</span>
              <span className="mt-1 text-sm text-slate-500 font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-5xl grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-teal-600 font-bold text-sm uppercase tracking-widest mb-3">Our Mission</p>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-5 leading-tight">
              Bridging the gap between patients and the care they deserve.
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              In many parts of the world, getting an appointment with a specialist takes weeks — sometimes months. Meanwhile, conditions worsen, anxiety rises, and trust in the healthcare system erodes.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              MediBook is our answer to this broken system. By combining a curated network of verified doctors with AI-powered triage and instant digital booking, we make quality care accessible within minutes — not months.
            </p>
            <div className="space-y-2">
              {["Board-certified doctors only", "Instant in-person & video booking", "AI-powered health guidance", "Secure, HIPAA-compliant platform"].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square max-w-sm mx-auto rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center shadow-2xl shadow-teal-500/30">
              <div className="text-center">
                <div className="text-6xl mb-4">🏥</div>
                <p className="text-white font-bold text-xl">MediBook</p>
                <p className="text-teal-100 text-sm">Healthcare Platform</p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 rounded-2xl bg-white shadow-xl border border-slate-100 p-4">
              <p className="text-xs text-slate-500 font-medium">Patient satisfaction</p>
              <p className="text-2xl font-extrabold text-teal-600">98.6%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-teal-600 font-bold text-sm uppercase tracking-widest mb-3">What We Stand For</p>
            <h2 className="text-3xl font-extrabold text-slate-900">Our Core Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 inline-flex p-3 rounded-xl bg-slate-50">{v.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-teal-600 font-bold text-sm uppercase tracking-widest mb-3">Our Journey</p>
            <h2 className="text-3xl font-extrabold text-slate-900">Milestones</h2>
          </div>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />
            <div className="space-y-8">
              {TIMELINE.map((item, i) => (
                <div key={item.year} className="relative flex gap-6">
                  <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center z-10 text-xs font-extrabold ${i === TIMELINE.length - 1 ? "bg-teal-600 text-white shadow-lg shadow-teal-500/30" : "bg-white border-2 border-slate-200 text-slate-600"}`}>
                    {item.year.slice(2)}
                  </div>
                  <div className="pt-2 pb-2">
                    <p className="text-xs text-teal-600 font-bold mb-0.5">{item.year}</p>
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-teal-600 font-bold text-sm uppercase tracking-widest mb-3">The People Behind It</p>
            <h2 className="text-3xl font-extrabold text-slate-900">Our Leadership Team</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((member) => (
              <div key={member.name} className="bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`mx-auto mb-4 w-16 h-16 rounded-2xl ${member.bg} flex items-center justify-center text-3xl`}>
                  {member.emoji}
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{member.name}</h3>
                <p className={`text-xs font-semibold mt-1 ${member.text}`}>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-teal-600 to-emerald-500">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to experience better healthcare?</h2>
          <p className="text-teal-100 mb-8 text-lg">Join 50,000+ patients who trust MediBook for their health journey.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-white text-teal-700 font-bold px-6 py-3 hover:bg-teal-50 transition-all shadow-lg">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/doctors" className="inline-flex items-center gap-2 rounded-2xl bg-white/20 text-white font-bold px-6 py-3 hover:bg-white/30 transition-all backdrop-blur-sm border border-white/30">
              Browse Doctors
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
