import { ObjectId } from "mongodb";

export interface User {
  _id: ObjectId;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  // Custom BetterAuth fields
  role: "patient" | "doctor" | "admin";
  phone?: string;
  city?: string;
}

export interface AvailabilitySlot {
  day: string; // e.g., "Monday", "Tuesday"
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "17:00"
  slotDurationMins: number; // e.g., 30
}

export interface DoctorProfile {
  _id: ObjectId;
  userId: string; // links to User.id (which is a string in BetterAuth)
  specialty: string; // e.g., "Cardiologist", "Pediatrician"
  qualifications: string[];
  experienceYears: number;
  bio: string;
  consultationFee: number;
  city: string;
  lat?: number;
  lng?: number;
  languages: string[];
  avgRating: number;
  reviewCount: number;
  availability: AvailabilitySlot[];
  imageUrl?: string;
  verified: boolean;
}

export interface Appointment {
  _id: ObjectId;
  patientId: string; // User ID of the patient
  doctorId: string; // User ID of the doctor (or DoctorProfile userId)
  date: string; // "YYYY-MM-DD"
  timeSlot: string; // "09:00 - 09:30"
  type: "in-person" | "video";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  reasonForVisit: string;
  notes?: string;
  createdAt: Date;
}

export interface Review {
  _id: ObjectId;
  doctorId: string; // User ID of the doctor
  patientId: string; // User ID of the patient
  appointmentId: string; // Appointment ID
  rating: number; // 1 to 5
  comment: string;
  createdAt: Date;
}

export interface ChatMessage {
  _id: ObjectId;
  userId: string; // patient User ID
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  sessionId: string;
}

export interface SymptomCheck {
  _id: ObjectId;
  userId: string; // patient User ID
  symptoms: string[];
  aiAssessment: string;
  suggestedSpecialty: string;
  createdAt: Date;
}
