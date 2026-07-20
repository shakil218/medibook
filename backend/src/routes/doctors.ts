import { Router, Request, Response } from "express";
import { getDb } from "../config/db.js";
import { authMiddleware, requireRole, AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { ObjectId } from "mongodb";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";

const router = Router();

const USER_LOOKUP = {
  $lookup: {
    from: "user",
    let: { uid: "$userId" },
    pipeline: [
      { $addFields: { idStr: { $toString: "$_id" } } },
      { $match: { $expr: { $eq: ["$idStr", "$$uid"] } } },
      { $project: { passwordHash: 0, googleId: 0, idStr: 0 } }
    ],
    as: "user"
  }
};

const PATIENT_LOOKUP = {
  $lookup: {
    from: "user",
    let: { pid: "$patientId" },
    pipeline: [
      { $addFields: { idStr: { $toString: "$_id" } } },
      { $match: { $expr: { $eq: ["$idStr", "$$pid"] } } },
      { $project: { name: 1, image: 1 } }
    ],
    as: "patient"
  }
};

router.get("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { specialty, city, query, minRating, availableToday, type, minFee, maxFee, sort, page, limit } = req.query;

    const matchStage: any = {};
    if (specialty) matchStage.specialty = { $regex: new RegExp(specialty as string, "i") };
    if (city) matchStage.city = { $regex: new RegExp(city as string, "i") };
    if (minRating) matchStage.avgRating = { $gte: parseFloat(minRating as string) };
    if (availableToday === "true") {
      const day = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
      matchStage["availability.day"] = { $regex: new RegExp("^" + day + "$", "i") };
    }
    if (type) matchStage.consultationTypes = type as string;
    if (minFee || maxFee) {
      matchStage.consultationFee = {};
      if (minFee) matchStage.consultationFee.$gte = parseFloat(minFee as string);
      if (maxFee) matchStage.consultationFee.$lte = parseFloat(maxFee as string);
    }

    const pipeline: any[] = [
      { $match: matchStage },
      USER_LOOKUP,
      { $unwind: "$user" }
    ];

    if (query) {
      pipeline.push({ $match: { $or: [
        { "user.name": { $regex: new RegExp(query as string, "i") } },
        { specialty: { $regex: new RegExp(query as string, "i") } }
      ]}});
    }

    const sortStage: any = {};
    if (sort === "rating") { sortStage.avgRating = -1; sortStage.reviewCount = -1; }
    else if (sort === "experience") sortStage.experienceYears = -1;
    else if (sort === "fee") sortStage.consultationFee = 1;
    else sortStage.createdAt = -1;
    pipeline.push({ $sort: sortStage });

    const parsedPage = parseInt(page as string, 10) || 1;
    const parsedLimit = parseInt(limit as string, 10) || 8;
    pipeline.push({ $facet: {
      metadata: [{ $count: "total" }],
      data: [{ $skip: (parsedPage - 1) * parsedLimit }, { $limit: parsedLimit }]
    }});

    const results = await db.collection("doctorProfile").aggregate(pipeline).toArray();
    const total = results[0]?.metadata[0]?.total || 0;
    res.json({ doctors: results[0]?.data || [], total, page: parsedPage, limit: parsedLimit, totalPages: Math.ceil(total / parsedLimit) });
  } catch (error) {
    console.error("Search Doctors Error:", error);
    res.status(500).json({ error: "Failed to fetch doctors." });
  }
});

router.get("/specialties", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const specialties = await db.collection("doctorProfile").distinct("specialty");
    const icons: Record<string, string> = {
      "Cardiologist": "❤️", "Dermatologist": "✨", "Pediatrician": "👶",
      "General Practitioner": "🩺", "Psychiatrist": "🧠",
      "Orthopedician": "🦴", "Neurologist": "⚡", "Ophthalmologist": "👁️"
    };
    res.json(specialties.map(name => ({ name, icon: icons[name] || "🩺", desc: `Consult with our certified ${name.toLowerCase()} experts.` })));
  } catch (error) {
    console.error("Specialties Error:", error);
    res.status(500).json({ error: "Failed to fetch specialties." });
  }
});

// PATCH /api/doctors/me/availability - Update weekly availability (doctor only)
router.patch("/me/availability", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const userId = req.body.userId || session?.user?.id || "mock_patient_id";
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      return res.status(400).json({ error: "Availability must be an array." });
    }

    const doctorProfile = await db.collection("doctorProfile").findOne({ userId });
    if (!doctorProfile) {
      return res.status(404).json({ error: "Doctor profile not found." });
    }

    await db.collection("doctorProfile").updateOne(
      { userId },
      { $set: { availability, updatedAt: new Date() } }
    );

    res.json({ message: "Availability updated successfully.", availability });
  } catch (error) {
    console.error("Patch Doctor Availability Error:", error);
    res.status(500).json({ error: "Failed to update availability." });
  }
});

router.get("/:id/availability", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date required (YYYY-MM-DD)." });

    const q: any = ObjectId.isValid(id) ? { $or: [{ _id: id }, { _id: new ObjectId(id) }, { userId: id }] } : { userId: id };
    const doc = await db.collection("doctorProfile").findOne(q);
    if (!doc) return res.status(404).json({ error: "Doctor not found." });

    const ds = date as string;
    const [y, m, d] = ds.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dateObj.getDay()];
    const av = doc.availability?.find((a: any) => a.day.toLowerCase() === dayName.toLowerCase());
    if (!av) return res.json([]);

    const slots: string[] = [];
    const [sh, sm] = av.startTime.split(":").map(Number);
    const [eh, em] = av.endTime.split(":").map(Number);
    let cur = new Date(dateObj); cur.setHours(sh, sm, 0, 0);
    const end = new Date(dateObj); end.setHours(eh, em, 0, 0);
    while (cur < end) {
      const s = cur.toTimeString().substring(0, 5);
      const nxt = new Date(cur.getTime() + av.slotDurationMins * 60000);
      if (nxt > end) break;
      slots.push(s + " - " + nxt.toTimeString().substring(0, 5));
      cur = nxt;
    }

    const booked = await db.collection("appointments").find({ doctorId: doc.userId, date: ds, status: { $in: ["pending","confirmed"] } }).toArray();
    const bookedSet = new Set(booked.map((a: any) => a.timeSlot));
    res.json(slots.map(s => ({ timeSlot: s, available: !bookedSet.has(s) })));
  } catch (error) {
    console.error("Availability Error:", error);
    res.status(500).json({ error: "Failed to fetch availability." });
  }
});

router.get("/:id/reviews", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const q: any = ObjectId.isValid(id) ? { $or: [{ _id: id }, { _id: new ObjectId(id) }, { userId: id }] } : { userId: id };
    const doc = await db.collection("doctorProfile").findOne(q);
    if (!doc) return res.status(404).json({ error: "Doctor not found." });

    const reviews = await db.collection("reviews").aggregate([
      { $match: { doctorId: doc.userId } },
      PATIENT_LOOKUP,
      { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } }
    ]).toArray();
    res.json(reviews);
  } catch (error) {
    console.error("Reviews Error:", error);
    res.status(500).json({ error: "Failed to fetch reviews." });
  }
});

router.get("/:id/related", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const q: any = ObjectId.isValid(id) ? { $or: [{ _id: id }, { _id: new ObjectId(id) }, { userId: id }] } : { userId: id };
    const doc = await db.collection("doctorProfile").findOne(q);
    if (!doc) return res.status(404).json({ error: "Doctor not found." });

    const related = await db.collection("doctorProfile").aggregate([
      { $match: { specialty: doc.specialty, userId: { $ne: doc.userId } } },
      USER_LOOKUP,
      { $unwind: "$user" },
      { $limit: 4 }
    ]).toArray();
    res.json(related);
  } catch (error) {
    console.error("Related Error:", error);
    res.status(500).json({ error: "Failed to fetch related doctors." });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const q: any = ObjectId.isValid(id) ? { $or: [{ _id: id }, { _id: new ObjectId(id) }, { userId: id }] } : { userId: id };
    const doc = await db.collection("doctorProfile").findOne(q);

    if (!doc) {
      if (ObjectId.isValid(id)) {
        const user = await db.collection("user").findOne((ObjectId.isValid(id) ? { $or: [{ _id: id }, { _id: new ObjectId(id) }] } : { _id: id }) as any);
        if (user && user.role === "doctor") {
          return res.json({ userId: id, specialty: "", qualifications: [], experienceYears: 0, bio: "", consultationFee: 0, city: user.city || "", languages: ["English"], avgRating: 0, reviewCount: 0, availability: [], user: { name: user.name, email: user.email, image: user.image }, reviews: [], appointments: [] });
        }
      }
      return res.status(404).json({ error: "Doctor not found." });
    }

    const user = await db.collection("user").findOne((ObjectId.isValid(doc.userId) ? { $or: [{ _id: doc.userId }, { _id: new ObjectId(doc.userId) }] } : { _id: doc.userId }) as any, { projection: { passwordHash: 0 } });
    const reviews = await db.collection("reviews").aggregate([
      { $match: { doctorId: doc.userId } },
      PATIENT_LOOKUP,
      { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } }
    ]).toArray();
    const appointments = await db.collection("appointments").find({ doctorId: doc.userId, status: { $in: ["pending","confirmed"] } }).toArray();
    res.json({ ...doc, user, reviews, appointments });
  } catch (error) {
    console.error("Get Doctor Error:", error);
    res.status(500).json({ error: "Failed to fetch doctor." });
  }
});

router.post("/profile", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const userId = req.body.userId || session?.user?.id || "mock_patient_id";
    const { specialty, qualifications, experienceYears, bio, consultationFee, city, lat, lng, languages, availability, imageUrl, consultationTypes } = req.body;
    if (!specialty || !qualifications || !experienceYears || !availability) return res.status(400).json({ error: "Missing required fields." });

    const existing = await db.collection("doctorProfile").findOne({ userId });
    const data: any = {
      userId, specialty,
      qualifications: Array.isArray(qualifications) ? qualifications : [qualifications],
      experienceYears: Number(experienceYears),
      bio: bio || "", consultationFee: Number(consultationFee) || 0,
      city: city || session?.user?.city || "",
      lat: lat ? Number(lat) : undefined, lng: lng ? Number(lng) : undefined,
      languages: Array.isArray(languages) ? languages : [languages],
      availability: Array.isArray(availability) ? availability : [],
      consultationTypes: consultationTypes !== undefined
        ? (Array.isArray(consultationTypes) ? consultationTypes : [consultationTypes])
        : (existing?.consultationTypes || ["in-person", "video"]),
      imageUrl: imageUrl || session?.user?.image || "", updatedAt: new Date()
    };

    if (existing) {
      await db.collection("doctorProfile").updateOne({ userId }, { $set: data });
      res.json({ message: "Profile updated.", profile: { ...existing, ...data } });
    } else {
      data.avgRating = 0; data.reviewCount = 0; data.verified = false; data.createdAt = new Date();
      const result = await db.collection("doctorProfile").insertOne(data);
      res.status(201).json({ message: "Profile created.", profile: { _id: result.insertedId, ...data } });
    }
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ error: "Failed to update profile." });
  }
});

export default router;