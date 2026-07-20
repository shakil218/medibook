import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { connectDB, getDb } from "../src/config/db.js";
import { auth } from "../src/config/auth.js";
import doctorRouter from "../src/routes/doctors.js";
import appointmentRouter from "../src/routes/appointments.js";
import reviewRouter from "../src/routes/reviews.js";
import aiRouter from "../src/routes/ai.js";
import userRouter from "../src/routes/users.js";
import dashboardRouter from "../src/routes/dashboard.js";
import contactRouter from "../src/routes/contact.js";
import blogRouter from "../src/routes/blog.js";

dotenv.config();

const app = express();

// CORS setup — allow the deployed frontend URL and localhost for dev
const frontendUrl = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.replace(/\/$/, "")
  : "http://localhost:3000";

const allowedOrigins = [
  frontendUrl,
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman) or matching origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// 1. Mount Better Auth endpoints (MUST BE BEFORE express.json())
app.all("/api/auth/*", toNodeHandler(auth));

// 2. Parsers (Apply only after Better Auth mount)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Application API Routes
app.use("/api/doctors", doctorRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/ai", aiRouter);
app.use("/api/users", userRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/contact", contactRouter);
app.use("/api/blog", blogRouter);

// Stats summary and distinct specialties routing
app.get("/api/stats/summary", async (req, res) => {
  try {
    const activeDb = getDb();
    const doctorsCount = await activeDb.collection("doctorProfile").countDocuments();
    const appointmentsCount = await activeDb.collection("appointments").countDocuments({ status: "completed" });

    const avgRatingResult = await activeDb.collection("doctorProfile").aggregate([
      { $group: { _id: null, avg: { $avg: "$avgRating" } } }
    ]).toArray();

    const avgRating = avgRatingResult[0]?.avg ? parseFloat(avgRatingResult[0].avg.toFixed(1)) : 4.8;

    res.json({ doctorsCount, appointmentsCount, avgRating });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ error: "Failed to get stats summary." });
  }
});

app.get("/api/specialties", async (req, res) => {
  try {
    const activeDb = getDb();
    const specialties = await activeDb.collection("doctorProfile").distinct("specialty");

    const specialtyIcons: Record<string, string> = {
      "Cardiologist": "❤️",
      "Dermatologist": "✨",
      "Pediatrician": "👶",
      "General Practitioner": "🩺",
      "Psychiatrist": "🧠",
      "Orthopedician": "🦴",
      "Neurologist": "⚡",
      "Ophthalmologist": "👁️"
    };

    const result = specialties.map((name) => ({
      name,
      icon: specialtyIcons[name] || "🩺",
      desc: `Consult with our certified ${name.toLowerCase()} experts.`
    }));

    res.json(result);
  } catch (error) {
    console.error("Stats Specialties Error:", error);
    res.status(500).json({ error: "Failed to get specialties." });
  }
});

// Health Check
app.get("/health", (_req, res) => {
  res.json({ status: "up", timestamp: new Date() });
});

// Standard error fallback
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// Initialize DB connection once (Vercel reuses function instances)
let isConnected = false;

const handler = async (req: any, res: any) => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
};

export default handler;
