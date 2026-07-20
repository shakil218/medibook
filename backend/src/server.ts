import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { connectDB, getDb } from "./config/db.js";
import { auth } from "./config/auth.js";
import doctorRouter from "./routes/doctors.js";
import appointmentRouter from "./routes/appointments.js";
import reviewRouter from "./routes/reviews.js";
import aiRouter from "./routes/ai.js";
import userRouter from "./routes/users.js";
import dashboardRouter from "./routes/dashboard.js";
import contactRouter from "./routes/contact.js";
import blogRouter from "./routes/blog.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const frontendUrl = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.replace(/\/$/, "")
  : "http://localhost:3000";

// CORS setup
app.use(
  cors({
    origin: frontendUrl,
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

    res.json({
      doctorsCount,
      appointmentsCount,
      avgRating
    });
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
app.get("/health", (req, res) => {
  res.json({ status: "up", timestamp: new Date() });
});

// Standard error fallback
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// Start Database and Server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
