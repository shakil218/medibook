import { Router, Request, Response } from "express";
import { getDb } from "../config/db.js";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { ObjectId } from "mongodb";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";

const router = Router();

// POST /api/reviews - Add a review for a doctor
router.post("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const patientId = req.body.patientId || session?.user?.id || "mock_patient_id";

    const { doctorId, appointmentId, rating, comment } = req.body;

    if (!doctorId || !appointmentId || !rating || comment === undefined) {
      return res.status(400).json({ error: "Missing review details." });
    }

    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: "Rating must be an integer between 1 and 5." });
    }

    if (!ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ error: "Invalid appointment ID." });
    }

    // Verify appointment exists
    const appointment = await db.collection("appointments").findOne({
      _id: new ObjectId(appointmentId)
    });

    if (!appointment) {
      return res.status(400).json({
        error: "Appointment not found."
      });
    }

    // Check if review already exists for this appointment
    const existingReview = await db.collection("reviews").findOne({
      appointmentId
    });

    if (existingReview) {
      return res.status(409).json({ error: "You have already reviewed this appointment." });
    }

    const newReview = {
      doctorId,
      patientId,
      appointmentId,
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
    console.error("Submit Review Error:", error);
    res.status(500).json({ error: "Failed to submit review." });
  }
});

export default router;
