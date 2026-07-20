"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import {
  BookOpen,
  Sparkles,
  Loader2,
  Clock,
  Tag,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  Search,
  PenLine,
} from "lucide-react";
import { toast } from "sonner";

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
  status: string;
}

interface GeneratedDraft {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  readingTime: number;
  metaDescription: string;
  authorName?: string;
}

const CATEGORIES = ["All", "Health Tips", "Nutrition", "Mental Health", "Cardiology", "Pediatrics", "Fitness", "Dermatology"];

const CATEGORY_COLORS: Record<string, string> = {
  "Health Tips": "bg-teal-50 text-teal-700",
  "Nutrition": "bg-emerald-50 text-emerald-700",
  "Mental Health": "bg-purple-50 text-purple-700",
  "Cardiology": "bg-rose-50 text-rose-700",
  "Pediatrics": "bg-blue-50 text-blue-700",
  "Fitness": "bg-orange-50 text-orange-700",
  "Dermatology": "bg-pink-50 text-pink-700",
};

// Static fallback articles shown when no posts published yet
const PLACEHOLDER_POSTS: BlogPost[] = [
  {
    _id: "p1", title: "10 Habits for a Healthier Heart", slug: "healthier-heart-habits",
    excerpt: "Cardiovascular disease remains the leading cause of death globally. But evidence shows that simple daily habits can dramatically reduce your risk.",
    content: "", category: "Cardiology", tags: ["heart", "lifestyle"], readingTime: 6,
    authorName: "Dr. Arjun Mehta", publishedAt: "2026-06-15T00:00:00Z", status: "published",
  },
  {
    _id: "p2", title: "Understanding Childhood Vaccines: A Parent's Guide", slug: "childhood-vaccines-guide",
    excerpt: "Vaccines are one of the greatest achievements in public health. Here's everything parents need to know about the recommended immunization schedule.",
    content: "", category: "Pediatrics", tags: ["vaccines", "children"], readingTime: 8,
    authorName: "Dr. Priya Sharma", publishedAt: "2026-06-20T00:00:00Z", status: "published",
  },
  {
    _id: "p3", title: "Managing Anxiety in the Digital Age", slug: "managing-anxiety-digital-age",
    excerpt: "Constant notifications, social media comparisons, and information overload are fueling an anxiety epidemic. Learn evidence-based strategies to reclaim your calm.",
    content: "", category: "Mental Health", tags: ["anxiety", "mental health"], readingTime: 7,
    authorName: "Dr. Sana Rashid", publishedAt: "2026-07-01T00:00:00Z", status: "published",
  },
  {
    _id: "p4", title: "The Anti-Inflammatory Diet: Foods That Heal", slug: "anti-inflammatory-diet",
    excerpt: "Chronic inflammation underlies nearly every major disease. Discover which foods fight inflammation at the cellular level.",
    content: "", category: "Nutrition", tags: ["diet", "inflammation"], readingTime: 5,
    authorName: "Dr. Omar Abdullah", publishedAt: "2026-07-05T00:00:00Z", status: "published",
  },
  {
    _id: "p5", title: "When to See a Dermatologist vs. Your GP", slug: "dermatologist-vs-gp",
    excerpt: "Skin concerns are among the most common reasons people visit a doctor. But knowing which specialist to see can save you time and money.",
    content: "", category: "Dermatology", tags: ["skin", "specialist"], readingTime: 4,
    authorName: "Dr. Arjun Mehta", publishedAt: "2026-07-10T00:00:00Z", status: "published",
  },
  {
    _id: "p6", title: "Strength Training After 40: A Complete Guide", slug: "strength-training-after-40",
    excerpt: "Contrary to popular belief, it's never too late to build muscle. Learn how resistance training transforms health in midlife and beyond.",
    content: "", category: "Fitness", tags: ["exercise", "aging"], readingTime: 9,
    authorName: "Dr. Priya Sharma", publishedAt: "2026-07-12T00:00:00Z", status: "published",
  },
];

function BlogCard({ post }: { post: BlogPost }) {
  const colorClass = CATEGORY_COLORS[post.category] || "bg-slate-100 text-slate-600";
  const date = new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      {/* Color banner */}
      <div className={`h-2 w-full ${colorClass.replace("text-", "bg-").split(" ")[0]}`} />
      <div className="flex-1 p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${colorClass}`}>
            <Tag className="h-3 w-3" />
            {post.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            {post.readingTime} min read
          </span>
        </div>
        <h3 className="font-bold text-slate-900 text-base leading-snug mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-4">{post.excerpt}</p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <User className="h-3 w-3" />
            <span className="font-medium">{post.authorName}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Calendar className="h-3 w-3" />
            {date}
          </div>
        </div>
      </div>
      <div className="px-6 pb-5">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 group-hover:gap-2 transition-all">
          Read Article <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

function AIDraftModal({ draft, onSave, onClose, isSaving }: {
  draft: GeneratedDraft;
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 mb-2">
              <Sparkles className="h-3.5 w-3.5" /> AI Generated Draft
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">{draft.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{draft.category} · {draft.readingTime} min read</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Content preview */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Excerpt</p>
            <p className="text-sm text-slate-700">{draft.excerpt}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preview</p>
            <div
              className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: draft.content?.slice(0, 800) + (draft.content?.length > 800 ? "..." : "") }}
            />
          </div>
          {draft.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {draft.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                  <Tag className="h-3 w-3" />{tag}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400 italic border-t border-slate-100 pt-3">
            ⚠️ This article is AI-generated and will be saved as a draft. An admin must review and publish it before it appears on the blog.
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
          >
            Discard
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-teal-600 text-white font-bold px-4 py-2.5 text-sm hover:bg-teal-500 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><CheckCircle2 className="h-4 w-4" /> Save as Draft</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BlogPage() {
  const { data: session } = authClient.useSession();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Health Tips");
  const [generatedDraft, setGeneratedDraft] = useState<GeneratedDraft | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  // Fetch published posts
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["blog-posts"],
    queryFn: () => apiFetch("/api/blog"),
  });

  // Use real posts if available, fallback to placeholder
  const allPosts = (posts && posts.length > 0) ? posts : PLACEHOLDER_POSTS;

  // Filter
  const filtered = allPosts.filter((p) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // AI Generate mutation
  const generateMutation = useMutation({
    mutationFn: () => apiFetch("/api/blog/generate", {
      method: "POST",
      body: JSON.stringify({ topic, category: selectedCategory }),
    }),
    onSuccess: (data: GeneratedDraft) => {
      setGeneratedDraft(data);
    },
    onError: (err: Error) => {
      toast.error(err.message || "AI generation failed. Please try again.");
    },
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: (draft: GeneratedDraft) => apiFetch("/api/blog", {
      method: "POST",
      body: JSON.stringify(draft),
    }),
    onSuccess: () => {
      toast.success("Draft saved! It will be reviewed by an admin before publishing.");
      setGeneratedDraft(null);
      setTopic("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save draft.");
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || topic.trim().length < 5) {
      toast.error("Please enter a topic (min 5 characters).");
      return;
    }
    generateMutation.mutate();
  };

  return (
    <div className="flex-1 bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-20 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-slate-300">
            <BookOpen className="h-4 w-4" />
            Health Articles
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4">
            MediBook Health Blog
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Evidence-based health articles written and reviewed by our network of certified medical professionals.
          </p>
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full rounded-2xl bg-white/10 border border-white/20 pl-11 pr-4 py-3 text-white placeholder:text-slate-500 text-sm outline-none focus:bg-white/20 transition-all backdrop-blur-sm"
            />
          </div>
        </div>
      </section>

      {/* AI Content Generator — logged in users */}
      {session?.user && (
        <section className="border-b border-slate-200 bg-gradient-to-r from-purple-50 to-teal-50 px-4 py-6">
          <div className="mx-auto max-w-5xl">
            {!showGenerator ? (
              <button
                onClick={() => setShowGenerator(true)}
                className="w-full sm:w-auto inline-flex items-center gap-2.5 rounded-2xl bg-white border border-purple-200 px-5 py-3 text-sm font-bold text-purple-700 shadow-sm hover:shadow-md hover:bg-purple-50 transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                Generate AI Health Article
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs">New</span>
              </button>
            ) : (
              <div className="rounded-2xl bg-white border border-purple-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-50">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">AI Article Generator</h3>
                      <p className="text-xs text-slate-500">Your draft will be reviewed by an admin before publishing</p>
                    </div>
                  </div>
                  <button onClick={() => setShowGenerator(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
                <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. 'Managing Type 2 Diabetes through diet'"
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-400"
                  />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-purple-500 bg-white"
                  >
                    {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                  </select>
                  <button
                    type="submit"
                    disabled={generateMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 text-white font-bold px-5 py-2.5 text-sm hover:bg-purple-500 disabled:opacity-60 transition-all cursor-pointer shrink-0"
                  >
                    {generateMutation.isPending
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                      : <><PenLine className="h-4 w-4" /> Generate</>
                    }
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className="sticky top-16 z-20 border-b border-slate-100 bg-white/90 backdrop-blur-md px-4">
        <div className="mx-auto max-w-5xl flex gap-2 overflow-x-auto py-3 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-xl px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-5xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-slate-200 bg-slate-50">
              <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800">No articles found</h3>
              <p className="text-sm text-slate-500 mt-1">
                {search ? `No results for "${search}". Try a different term.` : "No articles in this category yet."}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post) => <BlogCard key={post._id} post={post} />)}
            </div>
          )}
        </div>
      </section>

      {/* AI Draft Modal */}
      {generatedDraft && (
        <AIDraftModal
          draft={generatedDraft}
          onClose={() => setGeneratedDraft(null)}
          onSave={() => saveDraftMutation.mutate(generatedDraft)}
          isSaving={saveDraftMutation.isPending}
        />
      )}
    </div>
  );
}
