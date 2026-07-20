import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, HelpCircle, Calendar, Stethoscope, CreditCard, ArrowRight, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ — MediBook Help Center",
  description: "Find answers to common questions about MediBook — appointments, doctors, payments, and platform usage.",
};

const FAQ_SECTIONS = [
  {
    id: "general",
    title: "General",
    icon: <HelpCircle className="h-5 w-5" />,
    color: "text-teal-600",
    bg: "bg-teal-50",
    questions: [
      {
        q: "What is MediBook?",
        a: "MediBook is a digital healthcare platform that connects patients with verified, board-certified doctors for in-person and video consultations. We make booking appointments fast, simple, and transparent.",
      },
      {
        q: "Is MediBook available in my city?",
        a: "MediBook currently serves patients nationwide. Our doctor network is rapidly growing — use the specialty and city filters on the Find Doctors page to see available specialists in your area.",
      },
      {
        q: "Do I need to create an account?",
        a: "Yes, a free account is required to book appointments, manage consultations, and access your health records. Registration takes less than a minute and you can sign up with Google.",
      },
      {
        q: "Is my health information safe?",
        a: "Absolutely. MediBook uses HIPAA-grade encryption for all data at rest and in transit. We follow a zero-trust security model and undergo regular third-party security audits. We never sell your data.",
      },
    ],
  },
  {
    id: "appointments",
    title: "Appointments",
    icon: <Calendar className="h-5 w-5" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    questions: [
      {
        q: "How do I book an appointment?",
        a: 'Go to "Find Doctors", filter by specialty and location, select a doctor, choose your preferred date and time slot, select appointment type (in-person or video), and confirm. You\'ll receive a confirmation instantly.',
      },
      {
        q: "Can I book a video consultation?",
        a: "Yes. Many doctors on MediBook offer video consultations. When booking, select the 'Video' type. You'll receive a meeting link before your appointment time.",
      },
      {
        q: "How do I cancel or reschedule?",
        a: 'Go to "Manage Appointments", find your upcoming appointment, and click "Cancel". Rescheduling is done by cancelling the current slot and booking a new one. Please cancel at least 2 hours before your appointment.',
      },
      {
        q: "What happens if a doctor cancels?",
        a: "If a doctor cancels or marks your appointment, you'll be notified and the slot will be marked cancelled. You can immediately book an alternative appointment with the same or another doctor at no extra charge.",
      },
      {
        q: "Can I book for a family member?",
        a: "Currently, each account represents one patient. For family members, we recommend creating separate accounts. A family account feature is on our roadmap.",
      },
    ],
  },
  {
    id: "doctors",
    title: "Doctors",
    icon: <Stethoscope className="h-5 w-5" />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    questions: [
      {
        q: "How are doctors verified on MediBook?",
        a: "Every doctor undergoes credential verification including medical degree, board certification, license number, and hospital affiliation checks. Profiles are reviewed by our clinical team before activation.",
      },
      {
        q: "Can I choose a specific doctor?",
        a: "Yes. Use the search and filter tools to browse doctors by specialty, city, rating, consultation type, and availability. You can view full profiles, experience, and patient reviews before booking.",
      },
      {
        q: "How do I leave a review?",
        a: 'After a completed appointment, go to "Manage Appointments", find the completed consultation, and click "Leave Review". You can rate 1–5 stars and write a detailed comment.',
      },
      {
        q: "Are the doctor ratings genuine?",
        a: "All ratings and reviews are from verified patients who completed an actual appointment. We do not allow unverified or anonymous reviews. Doctors cannot edit or delete patient feedback.",
      },
    ],
  },
  {
    id: "billing",
    title: "Billing & Payments",
    icon: <CreditCard className="h-5 w-5" />,
    color: "text-amber-600",
    bg: "bg-amber-50",
    questions: [
      {
        q: "Is MediBook free to use?",
        a: "Creating an account, browsing doctors, and using the AI symptom checker are completely free. Appointment booking fees vary by doctor and are displayed clearly before you confirm a booking.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept major credit and debit cards, mobile banking, and select digital wallets. All payments are processed securely through our payment gateway.",
      },
      {
        q: "Will I get a refund if I cancel?",
        a: "Refund policies depend on the cancellation timing. Cancellations made 24+ hours before the appointment are eligible for a full refund. Within 24 hours, a partial or no refund may apply. Contact support for help.",
      },
      {
        q: "Do doctors charge differently for video vs in-person?",
        a: "Yes, some doctors have different fee structures for video and in-person consultations. All fees are transparently shown on the doctor's profile and during the booking process.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="flex-1 bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-20 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-slate-300 backdrop-blur-sm">
            <HelpCircle className="h-4 w-4" />
            Help Center
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Everything you need to know about using MediBook. Can&apos;t find what you&apos;re looking for?{" "}
            <Link href="/contact" className="text-teal-400 hover:underline font-semibold">
              Contact us
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Section Nav */}
      <section className="sticky top-16 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4">
        <div className="mx-auto max-w-5xl flex gap-1 overflow-x-auto py-3 scrollbar-hide">
          {FAQ_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${section.color} ${section.bg} hover:opacity-80`}
            >
              {section.icon}
              {section.title}
            </a>
          ))}
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-3xl space-y-16">
          {FAQ_SECTIONS.map((section) => (
            <div key={section.id} id={section.id}>
              <div className={`inline-flex items-center gap-2 rounded-xl ${section.bg} ${section.color} px-4 py-2 text-sm font-bold mb-6`}>
                {section.icon}
                {section.title}
              </div>
              <div className="space-y-3">
                {section.questions.map((item, qi) => (
                  <details key={qi} className="group rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors list-none">
                      <span>{item.q}</span>
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-600 leading-relaxed">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still need help CTA */}
      <section className="py-16 px-4 bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex p-4 rounded-2xl bg-teal-50">
            <MessageSquare className="h-8 w-8 text-teal-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Still have questions?</h2>
          <p className="text-slate-600 mb-6">
            Our support team is available Monday–Friday, 9am–6pm. We typically respond within 2 business hours.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 text-white font-bold px-6 py-3 hover:bg-teal-500 transition-all shadow-lg shadow-teal-600/20"
          >
            Contact Support <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
