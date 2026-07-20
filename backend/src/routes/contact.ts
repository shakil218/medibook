import { Router, Request, Response } from "express";
import { getDb } from "../config/db.js";
import { validateRequest } from "../middlewares/validate.js";
import { ContactSchema } from "../schemas/validationSchemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// POST /api/contact — public, no auth required, uses Zod validation
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const db = getDb();
    const { name, email, subject, message } = req.body;

    const contact = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      status: "unread",
      createdAt: new Date(),
    };

    await db.collection("contacts").insertOne(contact);

    return res.status(201).json({
      success: true,
      message: "Your message has been received. We'll get back to you shortly.",
    });
  })
);

export default router;
