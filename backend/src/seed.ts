import { connectDB, getDb, client } from "./config/db.js";
import { auth } from "./config/auth.js";

const DOCTORS_SEED_DATA = [
  {
    name: "Dr. Sarah Jenkins",
    email: "sarah.jenkins@medibook.com",
    password: "password123",
    role: "doctor" as const,
    city: "New York",
    phone: "+1 (555) 019-2834",
    profile: {
      specialty: "Cardiologist",
      qualifications: ["MD", "FACC", "Harvard Medical School"],
      experienceYears: 14,
      bio: "Board-certified cardiologist specializing in cardiovascular health, preventative cardiology, and heart failure management with over a decade of clinical experience.",
      consultationFee: 150,
      city: "New York",
      languages: ["English", "Spanish"],
      consultationTypes: ["in-person", "video"],
      availability: [
        { day: "Monday", startTime: "09:00", endTime: "17:00", slotDurationMins: 30 },
        { day: "Wednesday", startTime: "09:00", endTime: "17:00", slotDurationMins: 30 },
        { day: "Friday", startTime: "09:00", endTime: "13:00", slotDurationMins: 30 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
      verified: true,
      avgRating: 4.8,
      reviewCount: 2,
    },
  },
  {
    name: "Dr. Marcus Vance",
    email: "marcus.vance@medibook.com",
    password: "password123",
    role: "doctor" as const,
    city: "Chicago",
    phone: "+1 (555) 043-9821",
    profile: {
      specialty: "Dermatologist",
      qualifications: ["MD", "FAAD", "Johns Hopkins Medicine"],
      experienceYears: 8,
      bio: "Dedicated dermatologist focused on medical, surgical, and cosmetic skin treatments including acne therapy, eczema control, and skin cancer screenings.",
      consultationFee: 120,
      city: "Chicago",
      languages: ["English", "French"],
      consultationTypes: ["in-person"],
      availability: [
        { day: "Tuesday", startTime: "10:00", endTime: "16:00", slotDurationMins: 30 },
        { day: "Thursday", startTime: "10:00", endTime: "16:00", slotDurationMins: 30 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
      verified: true,
      avgRating: 4.5,
      reviewCount: 1,
    },
  },
  {
    name: "Dr. Evelyn Ross",
    email: "evelyn.ross@medibook.com",
    password: "password123",
    role: "doctor" as const,
    city: "New York",
    phone: "+1 (555) 076-2384",
    profile: {
      specialty: "Pediatrician",
      qualifications: ["MD", "FAAP", "Stanford School of Medicine"],
      experienceYears: 10,
      bio: "Compassionate pediatrician committed to providing comprehensive healthcare for infants, children, and adolescents. Specializes in child development and immunizations.",
      consultationFee: 100,
      city: "New York",
      languages: ["English"],
      consultationTypes: ["in-person", "video"],
      availability: [
        { day: "Monday", startTime: "08:30", endTime: "15:00", slotDurationMins: 30 },
        { day: "Friday", startTime: "08:30", endTime: "15:00", slotDurationMins: 30 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300",
      verified: true,
      avgRating: 5.0,
      reviewCount: 1,
    },
  },
  {
    name: "Dr. Alan Chen",
    email: "alan.chen@medibook.com",
    password: "password123",
    role: "doctor" as const,
    city: "San Francisco",
    phone: "+1 (555) 021-3942",
    profile: {
      specialty: "General Practitioner",
      qualifications: ["MD", "ABFM", "UCSF School of Medicine"],
      experienceYears: 12,
      bio: "Experienced family physician offering patient-centered care for chronic disease management, annual physical exams, and overall family health coaching.",
      consultationFee: 90,
      city: "San Francisco",
      languages: ["English", "Mandarin"],
      consultationTypes: ["in-person", "video"],
      availability: [
        { day: "Wednesday", startTime: "09:00", endTime: "17:00", slotDurationMins: 30 },
        { day: "Friday", startTime: "09:00", endTime: "17:00", slotDurationMins: 30 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300",
      verified: false,
      avgRating: 0,
      reviewCount: 0,
    },
  },
  {
    name: "Dr. Priya Nair",
    email: "priya.nair@medibook.com",
    password: "password123",
    role: "doctor" as const,
    city: "Boston",
    phone: "+1 (555) 112-4499",
    profile: {
      specialty: "Psychiatrist",
      qualifications: ["MD", "FAPA", "Yale School of Medicine"],
      experienceYears: 11,
      bio: "Clinical psychiatrist focused on mood disorders, anxiety, PTSD, and cognitive behavioral therapy. Committed to holistic mental health and patient wellbeing.",
      consultationFee: 175,
      city: "Boston",
      languages: ["English", "Hindi"],
      consultationTypes: ["video"],
      availability: [
        { day: "Monday", startTime: "10:00", endTime: "18:00", slotDurationMins: 60 },
        { day: "Thursday", startTime: "10:00", endTime: "18:00", slotDurationMins: 60 },
        { day: "Saturday", startTime: "09:00", endTime: "13:00", slotDurationMins: 60 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&q=80&w=300",
      verified: true,
      avgRating: 4.9,
      reviewCount: 3,
    },
  },
  {
    name: "Dr. James Okafor",
    email: "james.okafor@medibook.com",
    password: "password123",
    role: "doctor" as const,
    city: "Houston",
    phone: "+1 (555) 338-7721",
    profile: {
      specialty: "Orthopedician",
      qualifications: ["MD", "FAAOS", "Duke University Medical Center"],
      experienceYears: 18,
      bio: "Orthopedic specialist with extensive experience in joint replacement, sports injuries, and spine disorders. Helping patients return to active lives.",
      consultationFee: 200,
      city: "Houston",
      languages: ["English"],
      consultationTypes: ["in-person"],
      availability: [
        { day: "Tuesday", startTime: "08:00", endTime: "16:00", slotDurationMins: 45 },
        { day: "Wednesday", startTime: "08:00", endTime: "16:00", slotDurationMins: 45 },
        { day: "Friday", startTime: "08:00", endTime: "12:00", slotDurationMins: 45 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=300",
      verified: true,
      avgRating: 4.7,
      reviewCount: 5,
    },
  },
  {
    name: "Dr. Mei Tanaka",
    email: "mei.tanaka@medibook.com",
    password: "password123",
    role: "doctor" as const,
    city: "Los Angeles",
    phone: "+1 (555) 559-0312",
    profile: {
      specialty: "Neurologist",
      qualifications: ["MD", "PhD", "UCLA Neurology"],
      experienceYears: 15,
      bio: "Neurology specialist treating migraines, epilepsy, Parkinson's disease, and stroke recovery. Published researcher in neuroprotective therapies.",
      consultationFee: 210,
      city: "Los Angeles",
      languages: ["English", "Japanese"],
      consultationTypes: ["in-person", "video"],
      availability: [
        { day: "Monday", startTime: "09:00", endTime: "15:00", slotDurationMins: 60 },
        { day: "Thursday", startTime: "09:00", endTime: "15:00", slotDurationMins: 60 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=300",
      verified: true,
      avgRating: 4.6,
      reviewCount: 4,
    },
  },
  {
    name: "Dr. Omar Hassan",
    email: "omar.hassan@medibook.com",
    password: "password123",
    role: "doctor" as const,
    city: "Chicago",
    phone: "+1 (555) 772-8834",
    profile: {
      specialty: "Ophthalmologist",
      qualifications: ["MD", "FACS", "Northwestern Feinberg School of Medicine"],
      experienceYears: 9,
      bio: "Comprehensive eye care specialist providing treatment for glaucoma, cataracts, macular degeneration, and laser vision correction procedures.",
      consultationFee: 140,
      city: "Chicago",
      languages: ["English", "Arabic"],
      consultationTypes: ["in-person"],
      availability: [
        { day: "Tuesday", startTime: "09:00", endTime: "17:00", slotDurationMins: 30 },
        { day: "Saturday", startTime: "09:00", endTime: "13:00", slotDurationMins: 30 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=300",
      verified: true,
      avgRating: 4.3,
      reviewCount: 2,
    },
  },
  {
    name: "Dr. Rachel Kim",
    email: "rachel.kim@medibook.com",
    password: "password123",
    role: "doctor" as const,
    city: "Seattle",
    phone: "+1 (555) 891-4423",
    profile: {
      specialty: "General Practitioner",
      qualifications: ["MD", "ABFM", "University of Washington Medicine"],
      experienceYears: 6,
      bio: "Family physician passionate about preventative care, chronic disease management, and improving patient health literacy in underserved communities.",
      consultationFee: 80,
      city: "Seattle",
      languages: ["English", "Korean"],
      consultationTypes: ["in-person", "video"],
      availability: [
        { day: "Monday", startTime: "08:00", endTime: "16:00", slotDurationMins: 30 },
        { day: "Wednesday", startTime: "08:00", endTime: "16:00", slotDurationMins: 30 },
        { day: "Friday", startTime: "08:00", endTime: "12:00", slotDurationMins: 30 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=300",
      verified: true,
      avgRating: 4.2,
      reviewCount: 1,
    },
  },
  {
    name: "Dr. Carlos Rivera",
    email: "carlos.rivera@medibook.com",
    password: "password123",
    role: "doctor" as const,
    city: "Miami",
    phone: "+1 (555) 234-5678",
    profile: {
      specialty: "Cardiologist",
      qualifications: ["MD", "FACC", "University of Miami Miller School"],
      experienceYears: 20,
      bio: "Senior interventional cardiologist with expertise in complex coronary procedures, structural heart disease, and advanced heart failure therapies.",
      consultationFee: 220,
      city: "Miami",
      languages: ["English", "Spanish", "Portuguese"],
      consultationTypes: ["in-person", "video"],
      availability: [
        { day: "Tuesday", startTime: "07:30", endTime: "15:30", slotDurationMins: 30 },
        { day: "Thursday", startTime: "07:30", endTime: "15:30", slotDurationMins: 30 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=300",
      verified: true,
      avgRating: 4.9,
      reviewCount: 6,
    },
  },
  {
    name: "Dr. Linda Patterson",
    email: "linda.patterson@medibook.com",
    password: "password123",
    role: "doctor" as const,
    city: "Boston",
    phone: "+1 (555) 445-9900",
    profile: {
      specialty: "Dermatologist",
      qualifications: ["MD", "FAAD", "Harvard Dermatology", "Cosmetic Dermatology Certificate"],
      experienceYears: 13,
      bio: "Expert in medical and cosmetic dermatology including Mohs surgery, skin cancer treatment, anti-aging therapies, and eczema management.",
      consultationFee: 160,
      city: "Boston",
      languages: ["English"],
      consultationTypes: ["in-person"],
      availability: [
        { day: "Monday", startTime: "09:00", endTime: "17:00", slotDurationMins: 30 },
        { day: "Thursday", startTime: "09:00", endTime: "17:00", slotDurationMins: 30 },
        { day: "Saturday", startTime: "10:00", endTime: "14:00", slotDurationMins: 30 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=300",
      verified: true,
      avgRating: 4.7,
      reviewCount: 3,
    },
  },
  {
    name: "Dr. Aiden Sharma",
    email: "aiden.sharma@medibook.com",
    password: "password123",
    role: "doctor" as const,
    city: "San Francisco",
    phone: "+1 (555) 667-2211",
    profile: {
      specialty: "Psychiatrist",
      qualifications: ["MD", "FAPA", "UCSF Psychiatry"],
      experienceYears: 7,
      bio: "Child and adolescent psychiatrist specializing in ADHD, autism spectrum disorder, depression, and school-related mental health challenges.",
      consultationFee: 190,
      city: "San Francisco",
      languages: ["English", "Hindi", "Punjabi"],
      consultationTypes: ["video"],
      availability: [
        { day: "Wednesday", startTime: "11:00", endTime: "19:00", slotDurationMins: 60 },
        { day: "Friday", startTime: "11:00", endTime: "17:00", slotDurationMins: 60 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&q=80&w=300",
      verified: true,
      avgRating: 4.4,
      reviewCount: 2,
    },
  },
  {
    name: "Dr. Nicole Dubois",
    email: "nicole.dubois@medibook.com",
    password: "password123",
    role: "doctor" as const,
    city: "Los Angeles",
    phone: "+1 (555) 780-3345",
    profile: {
      specialty: "Pediatrician",
      qualifications: ["MD", "FAAP", "USC Keck School of Medicine"],
      experienceYears: 5,
      bio: "Warm and approachable pediatrician focused on newborn care, developmental assessments, preventive vaccinations, and nutrition guidance for growing children.",
      consultationFee: 95,
      city: "Los Angeles",
      languages: ["English", "French"],
      consultationTypes: ["in-person", "video"],
      availability: [
        { day: "Monday", startTime: "09:00", endTime: "17:00", slotDurationMins: 30 },
        { day: "Tuesday", startTime: "09:00", endTime: "17:00", slotDurationMins: 30 },
        { day: "Thursday", startTime: "09:00", endTime: "17:00", slotDurationMins: 30 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&q=80&w=300",
      verified: false,
      avgRating: 0,
      reviewCount: 0,
    },
  },
  {
    name: "Dr. Benjamin Walsh",
    email: "ben.walsh@medibook.com",
    password: "password123",
    role: "doctor" as const,
    city: "Houston",
    phone: "+1 (555) 832-6655",
    profile: {
      specialty: "Neurologist",
      qualifications: ["MD", "FAAN", "Baylor College of Medicine"],
      experienceYears: 16,
      bio: "Clinical neurologist with deep expertise in headache disorders, multiple sclerosis, and peripheral neuropathy. Passionate about compassionate, evidence-based neurological care.",
      consultationFee: 195,
      city: "Houston",
      languages: ["English"],
      consultationTypes: ["in-person", "video"],
      availability: [
        { day: "Monday", startTime: "08:00", endTime: "15:00", slotDurationMins: 60 },
        { day: "Wednesday", startTime: "08:00", endTime: "15:00", slotDurationMins: 60 },
        { day: "Friday", startTime: "08:00", endTime: "12:00", slotDurationMins: 60 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=300",
      verified: true,
      avgRating: 4.5,
      reviewCount: 4,
    },
  },
  {
    name: "Dr. Fatima Al-Rashid",
    email: "fatima.alrashid@medibook.com",
    password: "password123",
    role: "doctor" as const,
    city: "Seattle",
    phone: "+1 (555) 901-1123",
    profile: {
      specialty: "Ophthalmologist",
      qualifications: ["MD", "PhD", "Ophthalmology Fellowship OHSU"],
      experienceYears: 12,
      bio: "Comprehensive ophthalmologist specializing in retinal diseases, diabetic eye care, and advanced LASIK procedures. Dedicated to preserving and restoring vision.",
      consultationFee: 165,
      city: "Seattle",
      languages: ["English", "Arabic", "French"],
      consultationTypes: ["in-person", "video"],
      availability: [
        { day: "Tuesday", startTime: "09:00", endTime: "17:00", slotDurationMins: 30 },
        { day: "Friday", startTime: "09:00", endTime: "17:00", slotDurationMins: 30 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&q=80&w=300",
      verified: true,
      avgRating: 4.8,
      reviewCount: 5,
    },
  },
  {
    name: "Dr. Thomas Bradley",
    email: "thomas.bradley@medibook.com",
    password: "password123",
    role: "doctor" as const,
    city: "Miami",
    phone: "+1 (555) 123-9988",
    profile: {
      specialty: "Orthopedician",
      qualifications: ["MD", "FAAOS", "Sports Medicine Certificate", "University of Miami"],
      experienceYears: 22,
      bio: "Veteran orthopedic surgeon with specialization in ACL reconstruction, total knee and hip arthroplasty, and complex trauma surgery. Team physician for professional athletes.",
      consultationFee: 250,
      city: "Miami",
      languages: ["English", "Spanish"],
      consultationTypes: ["in-person"],
      availability: [
        { day: "Monday", startTime: "07:00", endTime: "14:00", slotDurationMins: 45 },
        { day: "Thursday", startTime: "07:00", endTime: "14:00", slotDurationMins: 45 },
      ],
      imageUrl: "https://images.unsplash.com/photo-1550831106-0994fe8abcfe?auto=format&fit=crop&q=80&w=300",
      verified: true,
      avgRating: 4.9,
      reviewCount: 8,
    },
  },
];

async function seed() {
  console.log("Starting seed process...");
  await connectDB();
  const db = getDb();

  // 1. Clean existing collections
  console.log("Cleaning collections...");
  const collections = ["user", "session", "account", "verification", "doctorProfile", "reviews", "appointments", "chatMessage", "symptomCheck"];
  for (const c of collections) {
    await db.collection(c).deleteMany({});
  }

  // 2. Create Mock Patients
  console.log("Creating mock patients...");
  const patient1 = await auth.api.signUpEmail({
    body: {
      name: "John Doe",
      email: "patient@medibook.com",
      password: "password123",
      role: "patient",
      city: "New York",
      phone: "+1 (555) 012-3456",
    },
  });

  const patient2 = await auth.api.signUpEmail({
    body: {
      name: "Alice Smith",
      email: "alice@example.com",
      password: "password123",
      role: "patient",
      city: "Chicago",
      phone: "+1 (555) 098-7654",
    },
  });

  const patient1Id = patient1.user.id;
  const patient2Id = patient2.user.id;

  // 3. Create Doctors & Profiles
  console.log("Creating mock doctors and profiles...");
  for (const doc of DOCTORS_SEED_DATA) {
    const signupResult = await auth.api.signUpEmail({
      body: {
        name: doc.name,
        email: doc.email,
        password: doc.password,
        role: doc.role,
        city: doc.city,
        phone: doc.phone,
        image: doc.profile.imageUrl || ""
      },
    });

    const docUserId = signupResult.user.id;

    // Create corresponding profile
    const profile = {
      userId: docUserId,
      ...doc.profile,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("doctorProfile").insertOne(profile);
  }

  // Fetch created doctor user ids
  const sarahDoc = await db.collection("user").findOne({ email: "sarah.jenkins@medibook.com" });
  const marcusDoc = await db.collection("user").findOne({ email: "marcus.vance@medibook.com" });
  const evelynDoc = await db.collection("user").findOne({ email: "evelyn.ross@medibook.com" });

  if (sarahDoc && marcusDoc && evelynDoc) {
    // 4. Create Appointments
    console.log("Creating mock appointments...");
    
    // Confirmed appointment (sarah)
    const app1 = {
      patientId: patient1Id,
      doctorId: sarahDoc._id.toString(),
      date: new Date().toISOString().split("T")[0],
      timeSlot: "10:00 - 10:30",
      type: "video" as const,
      status: "confirmed" as const,
      reasonForVisit: "Routine cardiovascular checkup, follow-up on medication.",
      notes: "Patient complains of mild fatigue",
      createdAt: new Date(),
    };
    await db.collection("appointments").insertOne(app1);

    // Pending appointment (marcus)
    const app2 = {
      patientId: patient1Id,
      doctorId: marcusDoc._id.toString(),
      date: new Date().toISOString().split("T")[0],
      timeSlot: "11:00 - 11:30",
      type: "in-person" as const,
      status: "pending" as const,
      reasonForVisit: "Skin rash check on arm, itching for 3 days.",
      notes: "",
      createdAt: new Date(),
    };
    await db.collection("appointments").insertOne(app2);

    // Completed appointment (sarah)
    const app3 = {
      patientId: patient1Id,
      doctorId: sarahDoc._id.toString(),
      date: "2026-07-10",
      timeSlot: "09:30 - 10:00",
      type: "video" as const,
      status: "completed" as const,
      reasonForVisit: "Pre-seed heart health test consultation",
      notes: "Blood pressure reading looks perfect",
      createdAt: new Date(),
    };
    const completedApp = await db.collection("appointments").insertOne(app3);

    // Completed appointment (evelyn)
    const app4 = {
      patientId: patient2Id,
      doctorId: evelynDoc._id.toString(),
      date: "2026-07-12",
      timeSlot: "14:00 - 14:30",
      type: "in-person" as const,
      status: "completed" as const,
      reasonForVisit: "Child growth milestones checkup",
      notes: "Healthy child, fully vaccinated",
      createdAt: new Date(),
    };
    const completedApp4 = await db.collection("appointments").insertOne(app4);

    // 5. Create Reviews
    console.log("Creating mock reviews...");
    const review1 = {
      doctorId: sarahDoc._id.toString(),
      patientId: patient1Id,
      appointmentId: completedApp.insertedId.toString(),
      rating: 5,
      comment: "Dr. Sarah Jenkins was very attentive, explained my cardiovascular reading clearly, and is highly empathetic.",
      createdAt: new Date(),
    };
    await db.collection("reviews").insertOne(review1);

    const review2 = {
      doctorId: sarahDoc._id.toString(),
      patientId: patient2Id,
      appointmentId: "mock_app_id_rev_2",
      rating: 4,
      comment: "Highly experienced doctor, took the time to answer all questions. Recommended.",
      createdAt: new Date(),
    };
    await db.collection("reviews").insertOne(review2);

    const review3 = {
      doctorId: evelynDoc._id.toString(),
      patientId: patient2Id,
      appointmentId: completedApp4.insertedId.toString(),
      rating: 5,
      comment: "Extremely good with children, clean facility, and very knowledgeable physician.",
      createdAt: new Date(),
    };
    await db.collection("reviews").insertOne(review3);
  }

  console.log("Seeding complete! Closing connection...");
  await client.close();
}

seed().catch((err) => {
  console.error("Error during seeding:", err);
  process.exit(1);
});
