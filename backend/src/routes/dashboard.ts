import { Router, Request, Response } from "express";
import { getDb } from "../config/db.js";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { ObjectId } from "mongodb";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";

const router = Router();

router.get("/summary", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const userId = req.query.userId as string || session?.user?.id || "mock_patient_id";
    const role = req.query.role as string || session?.user?.role || "patient";

    if (role === "patient") {
      // 1. Fetch upcoming appointments
      const queryIds = [userId];
      if (ObjectId.isValid(userId)) {
        queryIds.push(new ObjectId(userId) as any);
      }

      const appointments = await db.collection("appointments").aggregate([
        {
          $match: {
            patientId: { $in: queryIds },
            status: { $in: ["pending", "confirmed"] }
          }
        },
        {
          $lookup: {
            from: "user",
            let: { docId: "$doctorId" },
            pipeline: [
              { $match: { $expr: { $eq: [{ $toString: "$_id" }, { $toString: "$$docId" }] } } }
            ],
            as: "doctorUser"
          }
        },
        { $unwind: { path: "$doctorUser", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "doctorProfile",
            let: { docId: "$doctorId" },
            pipeline: [
              { $match: { $expr: { $eq: [{ $toString: "$userId" }, { $toString: "$$docId" }] } } }
            ],
            as: "doctorProfile"
          }
        },
        { $unwind: { path: "$doctorProfile", preserveNullAndEmptyArrays: true } },
        { $sort: { date: 1, timeSlot: 1 } }
      ]).toArray();

      // 2. Fetch past doctors ("Book Again" feature)
      const pastAppointments = await db.collection("appointments").aggregate([
        {
          $match: {
            patientId: { $in: queryIds },
            status: "completed"
          }
        },
        {
          $group: {
            _id: "$doctorId",
            lastAppointmentDate: { $max: "$date" }
          }
        },
        {
          $lookup: {
            from: "user",
            let: { docId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: [{ $toString: "$_id" }, { $toString: "$$docId" }] } } }
            ],
            as: "user"
          }
        },
        { $unwind: "$user" },
        {
          $lookup: {
            from: "doctorProfile",
            let: { docId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: [{ $toString: "$userId" }, { $toString: "$$docId" }] } } }
            ],
            as: "profile"
          }
        },
        { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } }
      ]).toArray();

      const pastDoctors = pastAppointments.map(pa => ({
        userId: pa._id,
        specialty: pa.profile?.specialty || "Specialist",
        consultationFee: pa.profile?.consultationFee || 0,
        city: pa.profile?.city || "",
        imageUrl: pa.profile?.imageUrl || "",
        user: {
          name: pa.user.name
        }
      }));

      // 3. AI-recommended doctors
      const latestCheck = await db.collection("symptomCheck")
        .findOne({ userId }, { sort: { createdAt: -1 } });

      let recommendedDoctors: any[] = [];
      if (latestCheck && latestCheck.suggestedSpecialty) {
        recommendedDoctors = await db.collection("doctorProfile").aggregate([
          { $match: { specialty: latestCheck.suggestedSpecialty } },
          {
            $lookup: {
              from: "user",
              let: { docId: "$userId" },
              pipeline: [
                { $match: { $expr: { $eq: [{ $toString: "$_id" }, { $toString: "$$docId" }] } } },
                { $project: { name: 1, image: 1 } }
              ],
              as: "user"
            }
          },
          { $unwind: "$user" },
          { $sort: { avgRating: -1 } },
          { $limit: 3 }
        ]).toArray();
      }

      if (recommendedDoctors.length === 0) {
        recommendedDoctors = await db.collection("doctorProfile").aggregate([
          {
            $lookup: {
              from: "user",
              let: { docId: "$userId" },
              pipeline: [
                { $match: { $expr: { $eq: [{ $toString: "$_id" }, { $toString: "$$docId" }] } } },
                { $project: { name: 1, image: 1 } }
              ],
              as: "user"
            }
          },
          { $unwind: "$user" },
          { $sort: { avgRating: -1 } },
          { $limit: 3 }
        ]).toArray();
      }

      const formattedRecs = recommendedDoctors.map(rd => ({
        userId: rd.userId,
        specialty: rd.specialty,
        consultationFee: rd.consultationFee,
        city: rd.city,
        imageUrl: rd.imageUrl || "",
        avgRating: rd.avgRating,
        user: {
          name: rd.user.name
        }
      }));

      return res.json({
        upcomingAppointments: appointments,
        pastDoctors,
        recommendedDoctors: formattedRecs,
        latestSymptomCheck: latestCheck ? {
          symptoms: latestCheck.symptoms,
          aiAssessment: latestCheck.aiAssessment,
          suggestedSpecialty: latestCheck.suggestedSpecialty
        } : null
      });

    } else if (role === "doctor") {
      const queryIds = [userId];
      if (ObjectId.isValid(userId)) {
        queryIds.push(new ObjectId(userId) as any);
      }

      const doctorProfile = await db.collection("doctorProfile").findOne({ userId });
      const fee = doctorProfile?.consultationFee || 0;

      const allAppointments = await db.collection("appointments").aggregate([
        {
          $match: {
            doctorId: { $in: queryIds }
          }
        },
        {
          $lookup: {
            from: "user",
            let: { patId: "$patientId" },
            pipeline: [
              { $match: { $expr: { $eq: [{ $toString: "$_id" }, { $toString: "$$patId" }] } } }
            ],
            as: "patientUser"
          }
        },
        { $unwind: { path: "$patientUser", preserveNullAndEmptyArrays: true } }
      ]).toArray();

      const confirmedAgenda = allAppointments.filter(app => app.status === "confirmed");
      const pendingRequests = allAppointments.filter(app => app.status === "pending");

      const sortByDateTime = (a: any, b: any) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.timeSlot.localeCompare(b.timeSlot);
      };
      confirmedAgenda.sort(sortByDateTime);
      pendingRequests.sort(sortByDateTime);

      const pendingConfirmationsCount = pendingRequests.length;
      const confirmedAgendaCount = confirmedAgenda.length;

      const completedSessionsCount = allAppointments.filter(app => 
        app.status === "completed"
      ).length;

      const totalEarnings = completedSessionsCount * fee;

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const appCounts: Record<string, number> = {};
      months.forEach(m => { appCounts[m] = 0; });

      allAppointments.forEach(app => {
        if (app.status === "completed" || app.status === "confirmed") {
          const dateObj = new Date(app.date + "T00:00:00");
          if (!isNaN(dateObj.getTime())) {
            const mLabel = months[dateObj.getMonth()];
            appCounts[mLabel]++;
          }
        }
      });

      const curMonth = new Date().getMonth();
      const appointmentsOverTime = months.map(m => ({
        name: m,
        count: appCounts[m],
        earnings: appCounts[m] * fee
      })).filter((_, idx) => {
        return idx <= curMonth && idx >= curMonth - 5;
      });

      const reviews = await db.collection("reviews")
        .find({ doctorId: userId })
        .sort({ createdAt: 1 })
        .toArray();

      const ratingTrend = reviews.map((r, idx) => ({
        index: idx + 1,
        rating: r.rating,
        date: new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      }));

      return res.json({
        confirmedAgenda,
        pendingRequests,
        pendingConfirmationsCount,
        appointmentsOverTime,
        ratingTrend,
        stats: {
          totalEarnings,
          pendingRequestsCount: pendingConfirmationsCount,
          confirmedAgendaCount,
          completedSessionsCount
        }
      });
    }

    res.status(400).json({ error: "Invalid user role." });
  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    res.status(500).json({ error: "Failed to load dashboard summary." });
  }
});

export default router;
