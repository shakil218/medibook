import { z } from "zod";

// ─── Contact Form Route Schema ───
export const ContactSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Invalid email address."),
    subject: z.string().min(5, "Subject must be at least 5 characters."),
    message: z.string().min(10, "Message must be at least 10 characters."),
  }),
});

// ─── Appointment Booking Schema ───
export const AppointmentBookingSchema = z.object({
  body: z.object({
    doctorId: z.string().min(1, "Doctor ID is required."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
    timeSlot: z.string().regex(/^\d{2}:\d{2}$/, "Time slot must be in HH:MM format."),
    type: z.enum(["in-person", "video"], { message: "Type must be 'in-person' or 'video'." }),
    reasonForVisit: z.string().min(3, "Reason for visit is required (min 3 characters)."),
    notes: z.string().optional(),
  }),
});

// ─── AI Generate Draft Schema ───
export const AiGenerateDraftSchema = z.object({
  body: z.object({
    topic: z.string().min(5, "Topic must be at least 5 characters."),
    category: z.string().optional(),
  }),
});

// ─── Blog Post / Draft Save Schema ───
export const BlogPostSchema = z.object({
  body: z.object({
    title: z.string().min(5, "Title must be at least 5 characters."),
    slug: z.string().min(3, "Slug must be at least 3 characters."),
    excerpt: z.string().optional(),
    content: z.string().min(10, "Content must be at least 10 characters."),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    readingTime: z.number().min(1).optional(),
    metaDescription: z.string().optional(),
  }),
});

// ─── User Profile Update Schema ───
export const ProfileUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    phone: z.string().optional(),
    city: z.string().min(2, "City name must be at least 2 characters."),
    image: z.string().optional(),
  }),
});
