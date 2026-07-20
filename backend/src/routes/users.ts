import { Router, Request, Response } from "express";
import { getDb } from "../config/db.js";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { ObjectId } from "mongodb";
import { validateRequest } from "../middlewares/validate.js";
import { ProfileUpdateSchema } from "../schemas/validationSchemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";

const router = Router();

// GET /api/users/me - Get current user profile details
router.get("/me", asyncHandler(async (req: Request, res: Response) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  const user = session?.user || { id: "mock_patient_id", name: "Mock User", email: "mock@medibook.com", role: "patient" };
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: (user as any).phone || "",
    city: (user as any).city || "",
    image: (user as any).image || "",
  });
}));

// PATCH /api/users/me - Update basic user details
router.patch(
  "/me",
  asyncHandler(async (req: Request, res: Response) => {
    const db = getDb();
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const userId = req.body.userId || session?.user?.id || "mock_patient_id";
    const userRole = req.body.role || session?.user?.role || "patient";
    const { name, phone, city, image } = req.body;

    const updateData: any = {
      name,
      phone: phone || "",
      city: city || "",
      image: image || "",
      updatedAt: new Date()
    };

    // Update user in MongoDB "user" collection
    const queryId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
    await db.collection("user").updateOne(
      { _id: queryId as any },
      { $set: updateData }
    );

    // If user is doctor, sync name, city and image in doctorProfile as well
    if (userRole === "doctor") {
      const syncData: any = {
        city: city || "",
        imageUrl: image || "",
        updatedAt: new Date()
      };
      await db.collection("doctorProfile").updateOne(
        { userId },
        { $set: syncData }
      );
    }

    res.json({
      message: "Profile updated successfully.",
      user: {
        id: userId,
        email: session?.user?.email || "mock@medibook.com",
        role: userRole,
        ...updateData
      }
    });
  })
);

export default router;
