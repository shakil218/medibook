import { Router, Request, Response } from "express";
import { getDb } from "../config/db.js";
import { authMiddleware, requireRole, AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { OpenAI } from "openai";
import { ObjectId } from "mongodb";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";

const router = Router();

// Helper — reuse existing AI client pattern
function getAiClient() {
  const groqKey = process.env.GROQ_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  const isRealGroq = groqKey && groqKey !== "your_groq_api_key_here" && groqKey.trim() !== "";
  const isRealOpenAi = openAiKey && openAiKey !== "your_openai_api_key_here" && openAiKey.trim() !== "";

  if (isRealGroq) {
    return {
      client: new OpenAI({ apiKey: groqKey, baseURL: "https://api.groq.com/openai/v1" }),
      model: "llama-3.3-70b-versatile",
    };
  }
  if (isRealOpenAi) {
    return { client: new OpenAI({ apiKey: openAiKey }), model: "gpt-4o-mini" };
  }
  return null;
}

// ─── GET /api/blog ─── List published posts (public)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const posts = await db
      .collection("blogPosts")
      .find({ status: "published" })
      .sort({ publishedAt: -1 })
      .toArray();
    return res.json(posts);
  } catch (error) {
    console.error("Blog list error:", error);
    return res.status(500).json({ error: "Failed to fetch blog posts." });
  }
});

// ─── GET /api/blog/drafts ─── List drafts
router.get("/drafts", async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const drafts = await db
      .collection("blogPosts")
      .find({ status: "draft" })
      .sort({ createdAt: -1 })
      .toArray();
    return res.json(drafts);
  } catch (error) {
    console.error("Blog drafts error:", error);
    return res.status(500).json({ error: "Failed to fetch drafts." });
  }
});

// ─── GET /api/blog/:slug ─── Single post by slug (public)
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { slug } = req.params;
    const post = await db.collection("blogPosts").findOne({ slug, status: "published" });
    if (!post) return res.status(404).json({ error: "Article not found." });
    return res.json(post);
  } catch (error) {
    console.error("Blog single post error:", error);
    return res.status(500).json({ error: "Failed to fetch article." });
  }
});

// ─── POST /api/blog/generate ─── AI generates a draft (any logged-in user)
import { validateRequest } from "../middlewares/validate.js";
import { AiGenerateDraftSchema, BlogPostSchema } from "../schemas/validationSchemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

router.post(
  "/generate",
  asyncHandler(async (req: Request, res: Response) => {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const authorId = req.body.authorId || session?.user?.id || "mock_patient_id";
    const authorName = req.body.authorName || session?.user?.name || "Mock Author";
    const { topic, category } = req.body;

    const aiConfig = getAiClient();

    if (!aiConfig) {
      return res.status(503).json({ error: "AI content generator is not configured. Please add GROQ_API_KEY to your environment." });
    }

    const systemPrompt = `You are a professional health content writer for MediBook, a medical appointment platform. 
Write authoritative, evidence-based, patient-friendly health articles. 
Always include a medical disclaimer. Never give specific medical advice. 
Format the response as JSON with these exact fields: title, slug, excerpt, content (HTML), category, tags (array), readingTime (number in minutes), metaDescription.`;

    const userPrompt = `Write a comprehensive health article about: "${topic}"
Category: ${category || "Health Tips"}
Requirements:
- Engaging headline (title)
- URL-friendly slug (lowercase, hyphens)  
- 150-char excerpt
- Well-structured HTML content with h2/h3 headers, paragraphs, and a bulleted list
- 3-5 relevant tags
- Estimated reading time in minutes
- SEO meta description (max 160 chars)
- Include a "Disclaimer: This article is for informational purposes only..." at the end.`;

    const response = await aiConfig.client.chat.completions.create({
      model: aiConfig.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const raw = response.choices[0].message.content || "{}";
    const generated = JSON.parse(raw);

    return res.json({
      ...generated,
      authorId,
      authorName,
      status: "draft",
    });
  })
);

// ─── POST /api/blog ─── Save draft (any logged-in user)
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const db = getDb();
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const authorId = req.body.authorId || session?.user?.id || "mock_patient_id";
    const authorName = req.body.authorName || session?.user?.name || "Mock Author";
    const { title, slug, excerpt, content, category, tags, readingTime, metaDescription } = req.body;

    // Ensure slug is unique
    const existing = await db.collection("blogPosts").findOne({ slug });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const post = {
      title,
      slug: finalSlug,
      excerpt: excerpt || "",
      content,
      category: category || "Health Tips",
      tags: tags || [],
      readingTime: readingTime || 5,
      metaDescription: metaDescription || excerpt || "",
      authorId,
      authorName,
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
    };

    const result = await db.collection("blogPosts").insertOne(post);
    return res.status(201).json({ success: true, id: result.insertedId, slug: finalSlug });
  })
);

// ─── PATCH /api/blog/:id/publish ─── Publish a draft
router.patch("/:id/publish", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid post ID." });
    }

    const result = await db.collection("blogPosts").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: "published", publishedAt: new Date(), updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) return res.status(404).json({ error: "Draft not found." });
    return res.json({ success: true, post: result });
  } catch (error) {
    console.error("Blog publish error:", error);
    return res.status(500).json({ error: "Failed to publish post." });
  }
});

// ─── DELETE /api/blog/:id ─── Delete a post
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid post ID." });
    }

    await db.collection("blogPosts").deleteOne({ _id: new ObjectId(id) });
    return res.json({ success: true });
  } catch (error) {
    console.error("Blog delete error:", error);
    return res.status(500).json({ error: "Failed to delete post." });
  }
});

export default router;
