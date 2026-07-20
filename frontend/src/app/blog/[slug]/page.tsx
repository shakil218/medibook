"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  ChevronLeft,
  Clock,
  Calendar,
  User,
  Tag,
  Share2,
  BookOpen,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  readingTime: number;
  authorName: string;
  publishedAt: string;
  metaDescription?: string;
}

// Placeholder content for demo slugs (shown when backend has no published posts)
const PLACEHOLDER_CONTENT: Record<string, Partial<BlogPost>> = {
  "healthier-heart-habits": {
    title: "10 Habits for a Healthier Heart",
    excerpt: "Cardiovascular disease remains the leading cause of death globally. But evidence shows that simple daily habits can dramatically reduce your risk.",
    content: `<h2>Why Your Heart Needs Daily Attention</h2>
<p>Cardiovascular disease claims more lives each year than any other condition. Yet research consistently shows that up to 80% of premature heart disease and strokes are preventable through lifestyle changes alone.</p>
<h2>1. Move for 30 Minutes Daily</h2>
<p>Regular moderate-intensity exercise — brisk walking, cycling, swimming — strengthens the heart muscle, lowers blood pressure, and improves cholesterol profiles. You don't need a gym. A daily 30-minute walk is enough to make a measurable difference.</p>
<h2>2. Adopt a Heart-Healthy Diet</h2>
<p>The Mediterranean diet — rich in vegetables, fruits, whole grains, legumes, nuts, olive oil, and fatty fish — has the most robust evidence for cardiovascular protection. Limit processed foods, refined carbohydrates, and trans fats.</p>
<h2>3. Don't Smoke</h2>
<p>Smoking doubles your risk of a heart attack. Quitting — at any age — rapidly reduces risk. Within one year of quitting, your heart attack risk drops by 50%.</p>
<h2>4. Know Your Numbers</h2>
<p>Keep track of essential vascular stats: Blood pressure below 120/80 mmHg, LDL cholesterol below 100 mg/dL, and fasting blood sugar below 100 mg/dL. Schedule regular check-ups to verify these metrics.</p>
<h2>5. Prioritize Sleep & Manage Stress</h2>
<p>Adults who sleep fewer than 6 hours per night have a significantly higher risk of cardiovascular events. Additionally, chronic stress triggers sustained cortisol release, raising blood pressure. Incorporate mindfulness, deep breathing exercises, and consistent sleep schedules to protect your heart.</p>
<p><em>Disclaimer: This article is for informational purposes only and does not constitute medical advice. Consult a qualified healthcare professional for personalized guidance.</em></p>`,
    category: "Cardiology", tags: ["heart", "lifestyle", "prevention"], readingTime: 6,
    authorName: "Dr. Arjun Mehta", publishedAt: "2026-06-15T00:00:00Z",
  },
  "preventive-heart-health-tips": {
    title: "10 Preventive Heart Health Tips for Adults",
    excerpt: "Understand the simple dietary adjustments and daily cardio schedules that reduce blood pressure and keep your heart healthy.",
    content: `<h2>Preventive Cardiology: Taking Control of Your Cardiovascular Health</h2>
<p>Preventive care is key to a long, healthy life. By adopting heart-healthy habits early, you can drastically reduce your risk of developing heart disease. Here are ten clinical recommendations from our cardiology team.</p>
<h2>1. Incorporate Daily Physical Activity</h2>
<p>Aim for at least 150 minutes of moderate aerobic exercise or 75 minutes of vigorous exercise each week. Walking, running, swimming, and cycling are excellent ways to boost cardiovascular strength, improve blood circulation, and maintain healthy arterial elasticity.</p>
<h2>2. Focus on a Nutrient-Rich Diet</h2>
<p>Your diet directly impacts your blood pressure, cholesterol levels, and arterial health. Center your meals around whole foods: fresh vegetables, leafy greens, berries, whole grains, legumes, and lean proteins. Reduce sodium and highly processed foods.</p>
<h2>3. Stay Hydrated</h2>
<p>Dehydration forces the heart to work harder to pump blood. Ensure you drink sufficient water throughout the day to support blood volume and pressure regulation.</p>
<h2>4. Monitor and Manage Stress</h2>
<p>Chronic psychological stress is a major contributor to high blood pressure and cardiac strain. Practice healthy coping mechanisms, such as meditation, yoga, cognitive behavioral exercises, or spending time outdoors.</p>
<h2>5. Ensure Quality Sleep</h2>
<p>Establish a regular sleep schedule and aim for 7 to 9 hours of uninterrupted rest each night. Sleep is essential for tissue repair and cardiac recovery.</p>
<p><em>Disclaimer: This article is for informational purposes only and does not constitute medical advice. Consult a qualified healthcare professional for personalized guidance.</em></p>`,
    category: "Cardiology", tags: ["heart", "prevention", "cardiology"], readingTime: 5,
    authorName: "Dr. Arjun Mehta", publishedAt: "2026-07-15T00:00:00Z",
  },
  "childhood-vaccines-guide": {
    title: "Understanding Childhood Vaccines: A Parent's Guide",
    excerpt: "Vaccines are one of the greatest achievements in public health. Here's everything parents need to know about the recommended immunization schedule.",
    content: `<h2>The Importance of Immunization</h2>
<p>Vaccines protect children from serious and potentially life-threatening diseases, such as measles, mumps, rubella, whooping cough, and polio. By immunizing your child, you are also helping to protect the community through herd immunity.</p>
<h2>How Vaccines Work</h2>
<p>Vaccines introduce a weakened or inactive part of a pathogen (like a virus or bacterium) into the body. This triggers the immune system to produce antibodies, creating memory cells that will recognize and fight the virus if the child is exposed to it in the future.</p>
<h2>Recommended Immunization Schedule</h2>
<p>The CDC and pediatricians recommend starting vaccinations at birth and continuing through childhood. Key milestones include:</p>
<ul>
<li><strong>At Birth:</strong> Hepatitis B</li>
<li><strong>1-2 Months:</strong> DTaP, Hib, IPV, PCV13, Rotavirus</li>
<li><strong>12-15 Months:</strong> MMR, Varicella (Chickenpox), Hepatitis A</li>
<li><strong>4-6 Years:</strong> DTaP, IPV, MMR, Varicella</li>
</ul>
<h2>Addressing Common Safety Concerns</h2>
<p>Vaccines are thoroughly tested for safety and efficacy before approval. Side effects are typically mild, such as soreness at the injection site or a low-grade fever. Extensive research has debunked any link between vaccines and developmental disorders like autism.</p>`,
    category: "Pediatrics", tags: ["vaccines", "children", "pediatrics"], readingTime: 8,
    authorName: "Dr. Priya Sharma", publishedAt: "2026-06-20T00:00:00Z",
  },
  "managing-anxiety-digital-age": {
    title: "Managing Anxiety in the Digital Age",
    excerpt: "Constant notifications, social media comparisons, and information overload are fueling an anxiety epidemic. Learn evidence-based strategies to reclaim your calm.",
    content: `<h2>The Modern Digital Landscape and Mental Health</h2>
<p>While technology keeps us connected, constant notifications, information overload, and social media comparison can elevate stress levels and trigger chronic anxiety. Reclaiming your peace of mind requires intentional boundaries.</p>
<h2>1. Practice Digital Detoxing</h2>
<p>Set aside designated times each day to unplug completely. Turn off non-essential notifications, use 'Do Not Disturb' modes during sleep, and establish screen-free zones in your home, particularly the bedroom.</p>
<h2>2. Limit Social Media Consumption</h2>
<p>Unfollow accounts that trigger feelings of inadequacy or anxiety. Shift your focus to positive, educational, or inspiring content, and remind yourself that social media is a curated highlight reel, not reality.</p>
<h2>3. Grounding Exercises</h2>
<p>When anxiety peaks, practice the 5-4-3-2-1 technique: identify 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This brings your awareness back to the physical present.</p>`,
    category: "Mental Health", tags: ["anxiety", "mental health", "wellness"], readingTime: 7,
    authorName: "Dr. Sana Rashid", publishedAt: "2026-07-01T00:00:00Z",
  },
  "anti-inflammatory-diet": {
    title: "The Anti-Inflammatory Diet: Foods That Heal",
    excerpt: "Chronic inflammation underlies nearly every major disease. Discover which foods fight inflammation at the cellular level.",
    content: `<h2>Understanding Chronic Inflammation</h2>
<p>Inflammation is a natural response by your body's immune system to injury or infection. However, chronic long-term inflammation can damage healthy tissue and contribute to cardiovascular disease, diabetes, arthritis, and cancer.</p>
<h2>Key Anti-Inflammatory Foods to Include</h2>
<p>Adjusting your diet is one of the most powerful ways to curb systemic inflammation. Prioritize these healing foods:</p>
<ul>
<li><strong>Berries:</strong> Blueberries, strawberries, and raspberries are packed with anthocyanins, which have potent anti-inflammatory properties.</li>
<li><strong>Fatty Fish:</strong> Salmon, mackerel, and sardines are rich in omega-3 fatty acids EPA and DHA.</li>
<li><strong>Leafy Greens:</strong> Spinach, kale, and collards offer high levels of vitamins and minerals that neutralize free radicals.</li>
<li><strong>Olive Oil:</strong> Extra virgin olive oil contains oleocanthal, an antioxidant with effects similar to ibuprofen.</li>
<li><strong>Nuts:</strong> Almonds and walnuts provide healthy fats and fiber.</li>
</ul>
<h2>Foods to Avoid</h2>
<p>To reduce inflammation, limit sugar-sweetened beverages, refined carbohydrates, fried foods, processed meats, and trans fats.</p>`,
    category: "Nutrition", tags: ["diet", "nutrition", "health"], readingTime: 5,
    authorName: "Dr. Omar Abdullah", publishedAt: "2026-07-05T00:00:00Z",
  },
  "dermatologist-vs-gp": {
    title: "When to See a Dermatologist vs. Your GP",
    excerpt: "Skin concerns are among the most common reasons people visit a doctor. But knowing which specialist to see can save you time and money.",
    content: `<h2>Navigating Skin Health Decisions</h2>
<p>Skin conditions affect millions of people worldwide. While your General Practitioner (GP) can handle many minor skin issues, chronic or complex problems often warrant a specialist. Here is how to decide.</p>
<h2>When to Consult Your GP First</h2>
<p>Your primary care doctor is fully qualified to treat common, mild skin issues. See them for:</p>
<ul>
<li>Mild or occasional acne flare-ups</li>
<li>Minor rashes, hives, or insect bites</li>
<li>Dry skin and general eczema management</li>
<li>First-degree burns or minor infections</li>
</ul>
<h2>When to Schedule with a Dermatologist</h2>
<p>Dermatologists are specialists with advanced training in diagnosing thousands of skin, hair, and nail disorders. Consult them for:</p>
<ul>
<li><strong>Suspicious Moles:</strong> Moles that change shape, color, or bleed (using the ABCDE rule for skin cancer detection).</li>
<li><strong>Severe Acne:</strong> Resistant acne that causes scarring or does not respond to standard treatments.</li>
<li><strong>Chronic Rashes:</strong> Severe psoriasis, eczema, or dermatitis that requires specialized systemic medication.</li>
<li><strong>Hair Loss or Nail Issues:</strong> Sudden thinning, patches, or persistent nail infections.</li>
</ul>`,
    category: "Dermatology", tags: ["skin", "dermatology", "specialist"], readingTime: 4,
    authorName: "Dr. Arjun Mehta", publishedAt: "2026-07-10T00:00:00Z",
  },
  "strength-training-after-40": {
    title: "Strength Training After 40: A Complete Guide",
    excerpt: "Contrary to popular belief, it's never too late to build muscle. Learn how resistance training transforms health in midlife and beyond.",
    content: `<h2>Why Muscle Mass Matters as We Age</h2>
<p>Sarcopenia, the natural loss of muscle mass and strength, begins around age 30 and accelerates after 40. Resistance training is the primary defense against this process, helping maintain mobility and independence.</p>
<h2>Key Health Benefits of Lifiting Weights</h2>
<p>Strength training does far more than just tone muscles. Its systemic benefits include:</p>
<ul>
<li><strong>Increased Bone Density:</strong> Lifting weights stimulates bone remodeling, preventing osteoporosis and reducing fracture risks.</li>
<li><strong>Enhanced Metabolism:</strong> Muscle tissue burns more calories at rest than fat tissue, helping combat middle-age weight gain.</li>
<li><strong>Improved Insulin Sensitivity:</strong> Resistance training improves glucose uptake, lowering the risk of type 2 diabetes.</li>
<li><strong>Joint Health:</strong> Strengthening muscles around joints (knees, hips, shoulders) reduces pain and arthritis symptoms.</li>
</ul>
<h2>Getting Started Safely</h2>
<p>Focus on compound exercises (squats, chest presses, rows) that engage multiple muscle groups. Start with lighter weights to master proper form, aim for 2-3 sessions per week, and prioritize rest and recovery between training days.</p>`,
    category: "Fitness", tags: ["exercise", "aging", "fitness"], readingTime: 9,
    authorName: "Dr. Priya Sharma", publishedAt: "2026-07-12T00:00:00Z",
  },
  "understanding-eczema-causes-treatment": {
    title: "Understanding Eczema: Causes & Treatment",
    excerpt: "A comprehensive guide on managing seasonal skin flare-ups, triggers to avoid, and dermatologist-recommended daily moisturizers.",
    content: `<h2>What is Eczema?</h2>
<p>Eczema, or atopic dermatitis, is a chronic inflammatory skin condition characterized by dry, itchy, red patches of skin. It is common in infants and children but can affect individuals at any age.</p>
<h2>Common Triggers of Eczema Flare-ups</h2>
<p>Managing eczema involves identifying and avoiding triggers that lead to skin irritation. These often include:</p>
<ul>
<li>Harsh soaps, detergents, and synthetic perfumes</li>
<li>Dry winter air and low humidity</li>
<li>Stress and environmental allergens like pollen or pet dander</li>
<li>Certain fabrics like wool or polyester</li>
</ul>
<h2>Dermatologist-Approved Treatment Options</h2>
<p>While there is no cure, eczema symptoms can be managed effectively:</p>
<ul>
<li><strong>Daily Moisturizing:</strong> Apply thick ointments or creams (rather than water-based lotions) immediately after bathing to lock in moisture.</li>
<li><strong>Topical Corticosteroids:</strong> Used short-term to reduce acute flare-ups and itching.</li>
<li><strong>Gentle Cleansers:</strong> Avoid scrubbing and use soap-free cleansers.</li>
</ul>`,
    category: "Dermatology", tags: ["skin", "eczema", "dermatology"], readingTime: 4,
    authorName: "Dr. Priya Sharma", publishedAt: "2026-06-28T00:00:00Z",
  },
  "role-ai-triage-telehealth": {
    title: "The Role of AI Triage in Modern Telehealth",
    excerpt: "How automated symptom checking helps reduce clinical workloads and guides patients to the correct specialist faster.",
    content: `<h2>Defining AI Triage</h2>
<p>AI triage involves using machine learning algorithms to assess patient symptoms and history, helping prioritize care, determine the appropriate medical specialty, and direct them to the correct channel of assistance.</p>
<h2>Benefits for Patients</h2>
<p>For patients, AI triage offers instant, 24/7 initial guidance, reducing anxiety, steering them away from unnecessary emergency room visits, and explaining which doctor they should schedule with.</p>
<h2>Reducing Clinical Overload</h2>
<p>For healthcare providers, automated intake assessments save precious administrative time. By collecting symptom histories beforehand, doctors can dive straight into medical consultation, optimizing their patient flow.</p>
<h2>Looking Ahead</h2>
<p>While AI triage is a powerful tool for patient direction, it is not a substitute for clinical diagnostics. The future lies in human-AI collaboration to optimize safety and speed up healthcare access.</p>`,
    category: "Health Tips", tags: ["ai", "triage", "telehealth"], readingTime: 6,
    authorName: "Dr. Sana Rashid", publishedAt: "2026-05-14T00:00:00Z",
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  "Health Tips": "bg-teal-50 text-teal-700",
  "Nutrition": "bg-emerald-50 text-emerald-700",
  "Mental Health": "bg-purple-50 text-purple-700",
  "Cardiology": "bg-rose-50 text-rose-700",
  "Pediatrics": "bg-blue-50 text-blue-700",
  "Fitness": "bg-orange-50 text-orange-700",
  "Dermatology": "bg-pink-50 text-pink-700",
};

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: ["blog-post", slug],
    queryFn: () => apiFetch(`/api/blog/${slug}`),
    retry: false,
  });

  // Use placeholder if real post not found
  const displayPost = post || (PLACEHOLDER_CONTENT[slug] ? { slug, ...PLACEHOLDER_CONTENT[slug] } as BlogPost : null);
  const isPlaceholder = !post && !!PLACEHOLDER_CONTENT[slug];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: displayPost?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!displayPost) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="h-12 w-12 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-800">Article Not Found</h2>
        <p className="text-slate-500 text-sm">{error instanceof Error ? error.message : "This article may have been removed or doesn't exist."}</p>
        <Link href="/blog" className="inline-flex items-center gap-2 rounded-xl bg-teal-600 text-white font-bold px-5 py-2.5 text-sm hover:bg-teal-500 transition-all">
          <ChevronLeft className="h-4 w-4" /> Back to Blog
        </Link>
      </div>
    );
  }

  const colorClass = CATEGORY_COLORS[displayPost.category] || "bg-slate-100 text-slate-600";
  const date = displayPost.publishedAt
    ? new Date(displayPost.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "Recently Published";

  return (
    <div className="flex-1 bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-16 px-4">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors group mb-6"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Blog
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${colorClass}`}>
              <Tag className="h-3 w-3" />
              {displayPost.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              {displayPost.readingTime} min read
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4">
            {displayPost.title}
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-6">{displayPost.excerpt}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span className="font-medium text-slate-300">{displayPost.authorName}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {date}
              </span>
            </div>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
          </div>

          {isPlaceholder && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300">
              <AlertCircle className="h-3.5 w-3.5" /> Demo content — real article coming soon
            </div>
          )}
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-3xl">
          {/* Prose content */}
          <div
            className="prose prose-slate max-w-none prose-headings:font-extrabold prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-slate-800 prose-h2:text-xl prose-h2:mt-8 prose-h3:text-lg"
            dangerouslySetInnerHTML={{ __html: displayPost.content || "<p>Full article content will appear here.</p>" }}
          />

          {/* Tags */}
          {displayPost.tags?.length > 0 && (
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 self-center">Tags:</span>
              {displayPost.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors">
                  <Tag className="h-3 w-3" />{tag}
                </span>
              ))}
            </div>
          )}

          {/* Author Card */}
          <div className="mt-8 rounded-2xl bg-slate-50 border border-slate-200 p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center text-2xl shrink-0">
              👨‍⚕️
            </div>
            <div>
              <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-0.5">Written by</p>
              <p className="font-bold text-slate-900">{displayPost.authorName}</p>
              <p className="text-xs text-slate-500 mt-0.5">Verified Medical Professional — MediBook Health Team</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-700 leading-relaxed">
            <strong>Medical Disclaimer:</strong> This article is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional before making any changes to your health regimen.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 bg-gradient-to-br from-teal-600 to-emerald-500">
        <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-teal-100" />
              <span className="text-teal-100 font-semibold text-sm">Ready to act on this?</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">Book a consultation today</h2>
            <p className="text-teal-100 text-sm mt-1">See a certified specialist who can give you personalized advice.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/doctors" className="inline-flex items-center gap-2 rounded-2xl bg-white text-teal-700 font-bold px-5 py-3 hover:bg-teal-50 transition-all text-sm shadow-lg">
              Find a Doctor <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/blog" className="inline-flex items-center gap-2 rounded-2xl bg-white/20 text-white font-bold px-5 py-3 hover:bg-white/30 transition-all text-sm border border-white/30">
              More Articles
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
