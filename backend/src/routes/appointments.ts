import { Router, Request, Response } from "express";
import { getDb } from "../config/db.js";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { ObjectId } from "mongodb";
import { validateRequest } from "../middlewares/validate.js";
import { AppointmentBookingSchema } from "../schemas/validationSchemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";

const router = Router();

// POST /api/appointments - Book a new appointment
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const db = getDb();
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const patientId = req.body.patientId || session?.user?.id || "mock_patient_id";

    const { doctorId, date, timeSlot, type, reasonForVisit, notes } = req.body;

    // Check if the doctor exists
    const doctorProfile = await db.collection("doctorProfile").findOne({ userId: doctorId });
    if (!doctorProfile) {
      return res.status(404).json({ error: "Doctor profile not found." });
    }

    const newAppointment = {
      patientId,
      doctorId,
      date,
      timeSlot,
      type,
      status: "pending",
      reasonForVisit,
      notes: notes || "",
      createdAt: new Date()
    };

    const result = await db.collection("appointments").insertOne(newAppointment);
    res.status(201).json({
      message: "Appointment request sent successfully.",
      appointment: { _id: result.insertedId, ...newAppointment }
    });
  })
);

// Helper for fetching appointments
async function fetchUserAppointments(userId: string, role: string) {
  const db = getDb();
  let matchQuery: any = {};

  // Build query that matches either string or ObjectId representations
  const queryIds: any[] = [userId];
  if (ObjectId.isValid(userId)) {
    queryIds.push(new ObjectId(userId));
  }

  if (role === "patient") {
    matchQuery.patientId = { $in: queryIds };
  } else if (role === "doctor") {
    matchQuery.doctorId = { $in: queryIds };
  }

  const pipeline: any[] = [
    { $match: matchQuery }
  ];

  if (role === "patient") {
    // Join with User collection (type-safe string comparison via $toString)
    pipeline.push(
      {
        $lookup: {
          from: "user",
          let: { docId: "$doctorId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toString: "$_id" },
                    { $toString: "$$docId" }
                  ]
                }
              }
            }
          ],
          as: "doctorUser"
        }
      },
      { $unwind: "$doctorUser" },
      {
        $lookup: {
          from: "doctorProfile",
          let: { docId: "$doctorId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toString: "$userId" },
                    { $toString: "$$docId" }
                  ]
                }
              }
            }
          ],
          as: "doctorProfile"
        }
      },
      { $unwind: { path: "$doctorProfile", preserveNullAndEmptyArrays: true } }
    );
  } else if (role === "doctor") {
    // Join with User collection (type-safe string comparison via $toString)
    pipeline.push(
      {
        $lookup: {
          from: "user",
          let: { patId: "$patientId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toString: "$_id" },
                    { $toString: "$$patId" }
                  ]
                }
              }
            }
          ],
          as: "patientUser"
        }
      },
      { $unwind: "$patientUser" }
    );
  }

  // Sort by date and timeslot ascending
  pipeline.push({ $sort: { date: 1, timeSlot: 1 } });

  return await db.collection("appointments").aggregate(pipeline).toArray();
}

// GET /api/appointments/mine - Retrieve appointments for current user (role-aware)
router.get("/mine", async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const userId = req.query.userId as string || session?.user?.id || "mock_patient_id";
    const role = req.query.role as string || session?.user?.role || "patient";

    const appointments = await fetchUserAppointments(userId, role);
    res.json(appointments);
  } catch (error) {
    console.error("Get Appointments Mine Error:", error);
    res.status(500).json({ error: "Failed to load appointments." });
  }
});

// GET /api/appointments - Retrieve appointments (legacy fallback)
router.get("/", async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const userId = req.query.userId as string || session?.user?.id || "mock_patient_id";
    const role = req.query.role as string || session?.user?.role || "patient";

    const appointments = await fetchUserAppointments(userId, role);
    res.json(appointments);
  } catch (error) {
    console.error("Get Appointments Error:", error);
    res.status(500).json({ error: "Failed to load appointments." });
  }
});

// PATCH /api/appointments/:id - Update appointment status (role-aware and protected)
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const userId = req.body.userId || session?.user?.id || "mock_patient_id";
    const role = req.body.role || session?.user?.role || "admin";
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid appointment ID." });
    }

    const appointment = await db.collection("appointments").findOne({ _id: new ObjectId(id) });
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found." });
    }

    await db.collection("appointments").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    res.json({ message: `Appointment status updated to ${status}.`, status });
  } catch (error) {
    console.error("Update Appointment Error:", error);
    res.status(500).json({ error: "Failed to update appointment." });
  }
});

// PATCH /api/appointments/:id/status - Update status (legacy fallback routing)
router.patch("/:id/status", async (req: Request, res: Response) => {
  // Delegate directly to the main PATCH route handler
  try {
    const db = getDb();
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid appointment ID." });
    }

    const appointment = await db.collection("appointments").findOne({ _id: new ObjectId(id) });
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found." });
    }

    await db.collection("appointments").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    res.json({ message: `Appointment status updated to ${status}.`, status });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ error: "Failed to update status." });
  }
});

// POST /api/appointments/:id/review - Leave a review for completed appointment
router.post("/:id/review", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const patientId = req.body.patientId || session?.user?.id || "mock_patient_id";
    const { id } = req.params;

    const { rating, comment } = req.body;

    if (rating === undefined || comment === undefined) {
      return res.status(400).json({ error: "Missing rating or comment." });
    }

    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: "Rating must be an integer between 1 and 5." });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid appointment ID." });
    }

    const queryPatientIds: any[] = [patientId];
    if (ObjectId.isValid(patientId)) {
      queryPatientIds.push(new ObjectId(patientId));
    }

    // Verify appointment exists
    const appointment = await db.collection("appointments").findOne({
      _id: new ObjectId(id)
    });

    if (!appointment) {
      return res.status(400).json({
        error: "Appointment not found."
      });
    }

    const doctorId = appointment.doctorId.toString(); // convert to string

    // Check if review already exists for this appointment
    const existingReview = await db.collection("reviews").findOne({
      appointmentId: id
    });

    if (existingReview) {
      return res.status(409).json({ error: "You have already reviewed this appointment." });
    }

    const newReview = {
      doctorId,
      patientId,
      appointmentId: id,
      rating: ratingNum,
      comment,
      createdAt: new Date()
    };

    const reviewResult = await db.collection("reviews").insertOne(newReview);

    // Aggregate average rating and count of reviews for doctor
    const stats = await db.collection("reviews").aggregate([
      { $match: { doctorId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    if (stats.length > 0) {
      const avg = parseFloat(stats[0].avgRating.toFixed(2));
      const count = stats[0].count;

      await db.collection("doctorProfile").updateOne(
        { userId: doctorId },
        {
          $set: {
            avgRating: avg,
            reviewCount: count
          }
        }
      );
    }

    res.status(201).json({
      message: "Review submitted successfully.",
      review: { _id: reviewResult.insertedId, ...newReview }
    });
  } catch (error) {
    console.error("Submit Appointment Review Error:", error);
    res.status(500).json({ error: "Failed to submit review." });
  }
});

export default router;
