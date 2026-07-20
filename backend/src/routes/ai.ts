import { Router, Request, Response } from "express";
import { getDb } from "../config/db.js";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { OpenAI } from "openai";
import { ObjectId } from "mongodb";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";

const router = Router();

// Helper to determine if we have a real key configured
function getAiClient() {
  const openAiKey = process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  const isRealOpenAi = openAiKey && openAiKey !== "your_openai_api_key_here" && openAiKey.trim() !== "";
  const isRealGroq = groqKey && groqKey !== "your_groq_api_key_here" && groqKey.trim() !== "";

  if (isRealGroq) {
    return {
      client: new OpenAI({
        apiKey: groqKey,
        baseURL: "https://api.groq.com/openai/v1",
      }),
      model: "llama-3.3-70b-versatile",
      type: "groq",
    };
  }

  if (isRealOpenAi) {
    return {
      client: new OpenAI({
        apiKey: openAiKey,
      }),
      model: "gpt-4o-mini",
      type: "openai",
    };
  }

  return null;
}

// POST /api/symptom-check - Perform AI symptom checking assessment
router.post("/symptom-check", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const userId = req.body.userId || session?.user?.id || "mock_patient_id";
    const { symptoms } = req.body;

    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ error: "Symptoms must be a non-empty array of strings." });
    }

    const aiConfig = getAiClient();
    let aiAssessment = "";
    let suggestedSpecialty = "";

    if (aiConfig) {
      const response = await aiConfig.client.chat.completions.create({
        model: aiConfig.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a medical triage assistant. Analyze the user's symptoms and return a JSON object.
The JSON object must have exactly two fields:
{
  "aiAssessment": "A professional but reassuring initial assessment of what might be happening, with a clear disclaimer that this is not medical advice.",
  "suggestedSpecialty": "The standard medical specialty they should see. Must be one of: Cardiologist, Dermatologist, Pediatrician, General Practitioner, Psychiatrist, Orthopedician, Neurologist, Ophthalmologist."
}`
          },
          {
            role: "user",
            content: `Symptoms reported: ${symptoms.join(", ")}`
          }
        ]
      });

      const jsonText = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(jsonText);
      aiAssessment = parsed.aiAssessment || "Inconclusive results.";
      suggestedSpecialty = parsed.suggestedSpecialty || "General Practitioner";
    } else {
      // Mock Fallback
      aiAssessment = `[MOCK MODE: No API key configured] Based on the symptoms: ${symptoms.join(
        ", "
      )}, you may be experiencing mild temporary stress, seasonal allergies, or minor viral fatigue. Please maintain hydration and rest. Disclaimer: This is a simulated assessment and does not replace medical counsel.`;
      
      const specialtyKeywords: Record<string, string> = {
        heart: "Cardiologist",
        chest: "Cardiologist",
        skin: "Dermatologist",
        rash: "Dermatologist",
        child: "Pediatrician",
        kid: "Pediatrician",
        anxiety: "Psychiatrist",
        depress: "Psychiatrist",
        bone: "Orthopedician",
        joint: "Orthopedician",
        brain: "Neurologist",
        headache: "Neurologist",
        eye: "Ophthalmologist",
      };

      suggestedSpecialty = "General Practitioner";
      const symptomText = symptoms.join(" ").toLowerCase();
      for (const [key, value] of Object.entries(specialtyKeywords)) {
        if (symptomText.includes(key)) {
          suggestedSpecialty = value;
          break;
        }
      }
    }

    const checkData = {
      userId,
      symptoms,
      aiAssessment,
      suggestedSpecialty,
      createdAt: new Date(),
    };

    const result = await db.collection("symptomCheck").insertOne(checkData);

    res.status(201).json({
      _id: result.insertedId,
      ...checkData,
    });
  } catch (error) {
    console.error("Symptom Check Error:", error);
    res.status(500).json({ error: "Failed to perform symptom check." });
  }
});

// POST /api/chat - Interactive streaming AI chat assistant
router.post("/chat", async (req: Request, res: Response) => {
  const db = getDb();
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  const userId = req.body.userId || session?.user?.id || "mock_patient_id";
  const { messages, sessionId } = req.body;

  if (!Array.isArray(messages) || messages.length === 0 || !sessionId) {
    return res.status(400).json({ error: "Missing messages array or sessionId." });
  }

  // Set SSE headers immediately
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let assistantReply = "";
  let streamingStarted = false;

  try {
    const aiConfig = getAiClient();

    // Fetch patient's upcoming appointments to inject into context
    const queryIds = [userId];
    if (ObjectId.isValid(userId)) {
      queryIds.push(new ObjectId(userId) as any);
    }

    const upcomingAppointments = await db.collection("appointments").aggregate([
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
      { $sort: { date: 1, timeSlot: 1 } }
    ]).toArray();

    const formattedAppointments = upcomingAppointments.map(app => (
      `- Doctor: ${app.doctorUser?.name || "Unknown"}, Date: ${app.date}, Time: ${app.timeSlot}, Status: ${app.status}`
    )).join("\n");

    const systemInstruction = `You are MediBook's AI medical triage assistant. You answer patient queries in a compassionate, professional, and clear manner.
CRITICAL RULES:
1. INFORMATIONAL GUIDANCE ONLY: You MUST NEVER diagnose conditions or say "You have X". Always explicitly state you provide triage guidance, not diagnoses, and advise consulting a physician.
2. UPCOMING APPOINTMENTS: If the patient asks about their appointments, reference this list:
${formattedAppointments || "No upcoming appointments scheduled."}
3. ROUTING AND NAVIGATION: If the patient wants to find a doctor, search for doctors, book an appointment, view their dashboard, or go to their profile, append a navigation command at the very end of your response like this:
[[ACTION:NAVIGATE:<path>]] where path is one of:
- /doctors?specialty=Cardiologist (or other specialties like Dermatologist, Pediatrician, General Practitioner, Psychiatrist, Orthopedician, Neurologist, Ophthalmologist)
- /dashboard/patient
- /profile
- /appointments/manage
For example, if they say 'Show me cardiologists', say: 'I can help with that. You can view all cardiologists in our catalog and schedule an appointment. [[ACTION:NAVIGATE:/doctors?specialty=Cardiologist]]'
4. CLARIFYING FOLLOW-UPS: Ask clarifying follow-ups regarding symptom duration, severity, and location.
5. SUGGESTED QUESTIONS: At the very end of your final response, append exactly three suggested patient follow-up questions, formatted as a JSON block like this:
[[FOLLOW_UPS: ["Follow-up question 1?", "Follow-up question 2?", "Follow-up question 3?"]]]`;

    const userMessage = messages[messages.length - 1];
    
    // Save User message — non-blocking so it doesn't delay the stream
    db.collection("chatMessage").insertOne({
      userId,
      role: "user",
      content: userMessage.content,
      createdAt: new Date(),
      sessionId,
    }).catch(e => console.error("Failed to save user message:", e));

    if (aiConfig) {
      try {
        const stream = await aiConfig.client.chat.completions.create({
          model: aiConfig.model,
          stream: true,
          max_tokens: 1024,
          messages: [
            {
              role: "system",
              content: systemInstruction,
            },
            ...messages.map((m: any) => ({
              role: m.role as "user" | "assistant" | "system",
              content: m.content,
            })),
          ],
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            assistantReply += text;
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
      } catch (openaiErr: any) {
        console.error("OpenAI API error:", openaiErr?.message || openaiErr);
        res.write(`data: ${JSON.stringify({ text: `\n\n[AI service error: ${openaiErr?.message || "connection failed"}]` })}\n\n`);
      }
    } else {
      // Mock Streaming Fallback (no API key configured)
      const queryLower = userMessage.content.toLowerCase();
      let responses = [
        "Hello! I am your MediBook virtual triage assistant.",
        " I can help guide your care. Please note that I provide informational guidance, not diagnoses. Always consult a physician for medical advice."
      ];

      if (queryLower.includes("appointment") || queryLower.includes("schedule")) {
        responses.push(`\nBased on my check, here is your schedule:\n${formattedAppointments || "- No upcoming appointments."}`);
      } else if (queryLower.includes("cardiologist") || queryLower.includes("heart")) {
        responses.push("\nFor heart or chest concerns, I'd suggest a Cardiologist. [[ACTION:NAVIGATE:/doctors?specialty=Cardiologist]]");
      } else if (queryLower.includes("skin") || queryLower.includes("rash") || queryLower.includes("dermatologist")) {
        responses.push("\nFor skin concerns, I'd suggest a Dermatologist. [[ACTION:NAVIGATE:/doctors?specialty=Dermatologist]]");
      } else if (queryLower.includes("child") || queryLower.includes("pediatrician")) {
        responses.push("\nFor child health, I'd suggest a Pediatrician. [[ACTION:NAVIGATE:/doctors?specialty=Pediatrician]]");
      } else {
        responses.push("\nCould you describe how long you've had these symptoms and their severity? That will help me suggest the right specialist.");
      }

      responses.push('\n[[FOLLOW_UPS: ["Should I see a General Practitioner first?", "How do I book an appointment?", "What symptoms need emergency care?"]]]');

      for (const chunk of responses) {
        await new Promise((resolve) => setTimeout(resolve, 80));
        assistantReply += chunk;
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
    }

    // Save Assistant reply — non-blocking
    db.collection("chatMessage").insertOne({
      userId,
      role: "assistant",
      content: assistantReply,
      createdAt: new Date(),
      sessionId,
    }).catch(e => console.error("Failed to save assistant message:", e));

    // Save triage session to SymptomCheck if a specialty was recommended
    const specialties = ["Cardiologist", "Dermatologist", "Pediatrician", "General Practitioner", "Psychiatrist", "Orthopedician", "Neurologist", "Ophthalmologist"];
    let suggestedSpecialty = "";
    for (const spec of specialties) {
      if (assistantReply.includes(spec)) {
        suggestedSpecialty = spec;
        break;
      }
    }
    if (suggestedSpecialty) {
      await db.collection("symptomCheck").insertOne({
        userId,
        symptoms: [userMessage.content.substring(0, 100)],
        aiAssessment: assistantReply.replace(/\[\[.+?\]\]/g, "").trim(),
        suggestedSpecialty,
        createdAt: new Date()
      });
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("AI Chat Error:", error);
    if (streamingStarted) {
      res.write(`data: ${JSON.stringify({ error: "AI Chat failed to stream response." })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ error: "AI Chat failed to stream response." })}\n\n`);
    }
    res.end();
  }
});

// GET /api/chat/history/:sessionId - Retrieve chat history for a session
router.get("/chat/history/:sessionId", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const userId = req.query.userId as string || session?.user?.id || "mock_patient_id";
    const { sessionId } = req.params;

    const history = await db.collection("chatMessage")
      .find({ userId, sessionId })
      .sort({ createdAt: 1 })
      .toArray();

    res.json(history);
  } catch (error) {
    console.error("Fetch Chat History Error:", error);
    res.status(500).json({ error: "Failed to load chat history." });
  }
});

// Helper to get simple seeded random number between min and max based on a string seed
function seededRandom(seed: string, min: number, max: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const rand = Math.abs(Math.sin(hash)) * 1000;
  const fraction = rand - Math.floor(rand);
  return Math.round(min + fraction * (max - min));
}

// POST /api/ai/recommendations/feedback - Register patient 👍/👎 feedback for a doctor
router.post("/recommendations/feedback", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const userId = req.body.userId || session?.user?.id || "mock_patient_id";
    const { doctorId, feedback } = req.body;

    if (!doctorId || !["like", "dislike"].includes(feedback)) {
      return res.status(400).json({ error: "Missing doctorId or invalid feedback value." });
    }

    const query = { userId, doctorId };
    const update = {
      $set: {
        feedback,
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    };

    await db.collection("doctorFeedback").updateOne(query, update, { upsert: true });

    res.json({ message: "Feedback saved successfully." });
  } catch (error) {
    console.error("Save Doctor Feedback Error:", error);
    res.status(500).json({ error: "Failed to save feedback." });
  }
});

// POST /api/ai/recommendations - Smart doctor recommendations
router.post("/recommendations", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const userId = req.body.userId || session?.user?.id || "mock_patient_id";
    const patientUser = await db.collection("user").findOne({
      _id: ObjectId.isValid(userId) ? new ObjectId(userId) : userId as any
    });
    const patientCity = patientUser?.city || "";

    const { symptoms, maxDistance, feeRange } = req.body;

    // Fetch all doctors and user info
    const doctors = await db.collection("doctorProfile").aggregate([
      {
        $lookup: {
          from: "user",
          let: { docId: "$userId" },
          pipeline: [
            { $match: { $expr: { $eq: [{ $toString: "$_id" }, { $toString: "$$docId" }] } } }
          ],
          as: "user"
        }
      },
      { $unwind: "$user" }
    ]).toArray();

    // Fetch patient's past feedbacks
    const feedbacks = await db.collection("doctorFeedback").find({ userId }).toArray();
    const feedbackMap = new Map(feedbacks.map(f => [f.doctorId, f.feedback]));

    // Filter and compute simulated distance
    const candidates = doctors.map(doc => {
      const docId = doc.userId;
      const isSameCity = (doc.city || "").toLowerCase() === patientCity.toLowerCase();
      // Seed a stable distance between patient and doctor
      const distance = isSameCity
        ? seededRandom(userId + docId, 1, 5)
        : seededRandom(userId + docId, 12, 45);

      const feedback = feedbackMap.get(docId) || null;

      return {
        doctorId: docId,
        name: doc.user.name,
        specialty: doc.specialty,
        consultationFee: doc.consultationFee,
        avgRating: doc.avgRating || 0.0,
        city: doc.city,
        bio: doc.bio || "",
        imageUrl: doc.imageUrl || "",
        distance,
        feedback
      };
    }).filter(cand => {
      // Filter out disliked doctors
      if (cand.feedback === "dislike") return false;

      // Filter by maxDistance if provided
      if (maxDistance !== undefined && cand.distance > maxDistance) {
        return false;
      }

      // Filter by fee range if provided
      if (feeRange !== undefined) {
        const minFee = feeRange.min !== undefined ? feeRange.min : 0;
        const maxFee = feeRange.max !== undefined ? feeRange.max : Infinity;
        if (cand.consultationFee < minFee || cand.consultationFee > maxFee) {
          return false;
        }
      }

      return true;
    });

    const aiConfig = getAiClient();
    let rankedResults: { doctorId: string; reason: string }[] = [];

    if (aiConfig && candidates.length > 0) {
      const promptCandidates = candidates.map(c => ({
        doctorId: c.doctorId,
        name: c.name,
        specialty: c.specialty,
        fee: c.consultationFee,
        rating: c.avgRating,
        distanceKm: c.distance,
        bio: c.bio,
        likedByPatient: c.feedback === "like"
      }));

      const response = await aiConfig.client.chat.completions.create({
        model: aiConfig.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are MediBook's matching assistant. Analyze the user's symptoms and match them with the best candidate doctors.
Prioritize doctors who were previously liked by the patient (likedByPatient = true) and have matching specialties.
Return a JSON object containing a ranked array "recommendations". For each recommendation, provide:
{
  "doctorId": "The doctor's unique ID",
  "reason": "A concise one-line reason (max 15 words) justifying why they match, referencing their specialty, fee, distance, or ratings (e.g. 'Highly rated cardiologist, located 3km away, budget-friendly')."
}`
          },
          {
            role: "user",
            content: `Patient symptoms/request: "${symptoms || "general doctor checkup"}"
Candidate Doctors: ${JSON.stringify(promptCandidates)}`
          }
        ]
      });

      try {
        const text = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(text);
        rankedResults = parsed.recommendations || [];
      } catch (err) {
        console.error("Failed to parse LLM recommendations response:", err);
      }
    }

    // Fallback: Mock ranking logic
    if (rankedResults.length === 0) {
      const keywordMap: Record<string, string[]> = {
        heart: ["Cardiologist"],
        chest: ["Cardiologist"],
        skin: ["Dermatologist"],
        rash: ["Dermatologist"],
        child: ["Pediatrician"],
        kid: ["Pediatrician"],
        anxiety: ["Psychiatrist"],
        depress: ["Psychiatrist"],
        bone: ["Orthopedician"],
        joint: ["Orthopedician"],
        brain: ["Neurologist"],
        headache: ["Neurologist"],
        eye: ["Ophthalmologist"]
      };

      const matchedSpecialties: string[] = [];
      const queryLower = (symptoms || "").toLowerCase();
      for (const [key, specialties] of Object.entries(keywordMap)) {
        if (queryLower.includes(key)) {
          matchedSpecialties.push(...specialties);
        }
      }

      const sorted = [...candidates].sort((a, b) => {
        const aMatches = matchedSpecialties.includes(a.specialty) ? 1 : 0;
        const bMatches = matchedSpecialties.includes(b.specialty) ? 1 : 0;
        if (aMatches !== bMatches) return bMatches - aMatches;

        const aLiked = a.feedback === "like" ? 1 : 0;
        const bLiked = b.feedback === "like" ? 1 : 0;
        if (aLiked !== bLiked) return bLiked - aLiked;

        if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
        return a.distance - b.distance;
      });

      rankedResults = sorted.map(c => {
        let reason = `${c.specialty} with ${c.avgRating}★ rating, located ${c.distance}km away.`;
        if (c.feedback === "like") {
          reason = `Previously consulted. ${reason}`;
        }
        return {
          doctorId: c.doctorId,
          reason
        };
      });
    }

    const result = rankedResults.map(rank => {
      const match = candidates.find(c => c.doctorId === rank.doctorId);
      if (!match) return null;
      return {
        ...match,
        reason: rank.reason
      };
    }).filter(r => r !== null);

    res.json(result);
  } catch (error) {
    console.error("Get AI Recommendations Error:", error);
    res.status(500).json({ error: "Failed to load doctor recommendations." });
  }
});

export default router;
