"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { apiFetch, BASE_URL } from "@/lib/api";
import {
  Brain,
  MessageSquare,
  ArrowRight,
  Shield,
  Loader2,
  AlertTriangle,
  Send,
  RefreshCw,
  Plus,
  X,
  Stethoscope
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const COMMON_SYMPTOMS = [
  "Headache",
  "Fever",
  "Cough",
  "Shortness of breath",
  "Fatigue",
  "Muscle aches",
  "Sore throat",
  "Loss of taste/smell",
  "Runny nose",
  "Nausea/vomiting",
  "Chest pain",
  "Skin rash",
  "Joint swelling",
  "Eye irritation",
  "Anxiety",
  "Sleep disturbance",
];

interface AssessmentResult {
  suggestedSpecialty: string;
  aiAssessment: string;
}

export default function SymptomCheckerPage() {
  const router = useRouter();
  const { data: session, isPending: authPending } = authClient.useSession();

  const [step, setStep] = useState<"select" | "assessment" | "chat">("select");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);

  // Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [chatSessionId] = useState(() => Math.random().toString(36).substring(7));
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat window to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleToggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleAddCustomSymptom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms((prev) => [...prev, customSymptom.trim()]);
      setCustomSymptom("");
    }
  };

  const handleRemoveSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) => prev.filter((s) => s !== symptom));
  };

  const handleGetAssessment = async () => {
    if (selectedSymptoms.length === 0) return;
    setLoadingAssessment(true);
    try {
      const result = await apiFetch("/api/ai/symptom-check", {
        method: "POST",
        body: JSON.stringify({ symptoms: selectedSymptoms }),
      });
      setAssessment(result);
      setStep("assessment");
    } catch (error) {
      console.error(error);
      alert("Failed to connect to the AI symptom checker. Verify backend is running.");
    } finally {
      setLoadingAssessment(false);
    }
  };

  const handleStartChat = () => {
    // Seed initial assistant message explaining the assessment
    if (assessment) {
      setChatMessages([
        {
          role: "assistant",
          content: `Hello! I've reviewed your symptom report (${selectedSymptoms.join(
            ", "
          )}). My initial assessment suggests consulting a **${
            assessment.suggestedSpecialty
          }**.\n\nHere is a summary of what might be happening:\n${
            assessment.aiAssessment
          }\n\nWhat other questions or concerns do you have about these symptoms?`,
        },
      ]);
    } else {
      setChatMessages([
        {
          role: "assistant",
          content: "Hello! How can I help you today? Please tell me about what symptoms you are experiencing.",
        },
      ]);
    }
    setStep("chat");
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isStreaming) return;

    const userText = inputText;
    setInputText("");
    
    const newMessages: ChatMessage[] = [...chatMessages, { role: "user", content: userText }];
    setChatMessages(newMessages);
    setIsStreaming(true);

    try {
      const response = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          messages: newMessages,
          sessionId: chatSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Streaming error");
      }

      // Add a placeholder message for the assistant
      setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      let buffer = "";
      let streamDone = false;

      if (reader) {
        while (!streamDone) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const dataContent = trimmed.slice(6).trim();
              if (dataContent === "[DONE]") {
                streamDone = true;
                break;
              }
              try {
                const parsed = JSON.parse(dataContent);
                if (parsed.text) {
                  assistantText += parsed.text;
                  setChatMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: assistantText,
                    };
                    return updated;
                  });
                }
                if (parsed.error) {
                  console.error("Stream error from server:", parsed.error);
                }
              } catch (err) {}
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat streaming error:", error);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Apologies, I encountered an issue streaming the response. Please try again." },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  if (authPending) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 flex-1">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm font-semibold text-slate-500">Checking auth session...</p>
      </div>
    );
  }

  // Enforce session login to use symptom checker
  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center flex-1 flex flex-col justify-center">
        <div className="rounded-3xl border border-teal-100 bg-teal-50 p-8 text-teal-700">
          <Brain className="h-10 w-10 mx-auto mb-4 text-teal-500" />
          <h2 className="text-xl font-bold">Access Authentication Required</h2>
          <p className="text-sm mt-1 text-teal-600">Please register or log in with your Patient account to access AI consultation.</p>
          <button
            onClick={() => router.push("/login?redirect=/symptom-checker")}
            className="mt-5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm px-5 py-2.5 shadow-md"
          >
            Sign In to Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 w-full flex-1 flex flex-col gap-6">
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="rounded-2xl bg-teal-50 p-2.5 text-teal-600 border border-teal-100">
          <Brain className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">AI Triage Suite</h1>
          <p className="text-xs text-slate-500 mt-0.5">Understand your clinical symptoms before scheduling checkups.</p>
        </div>
      </div>

      {/* Step 1: Select Symptoms */}
      {step === "select" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm flex flex-col gap-6">
          <h2 className="text-lg font-bold text-slate-800">Step 1: Select Symptoms</h2>

          {/* Quick List Checklist */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {COMMON_SYMPTOMS.map((symptom) => {
              const active = selectedSymptoms.includes(symptom);
              return (
                <button
                  key={symptom}
                  onClick={() => handleToggleSymptom(symptom)}
                  className={`flex items-center gap-2 p-3 text-xs font-semibold rounded-xl border text-left transition-all ${
                    active
                      ? "bg-teal-50 border-teal-500 text-teal-700 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    readOnly
                    className="accent-teal-600 h-3.5 w-3.5 shrink-0"
                  />
                  <span className="truncate">{symptom}</span>
                </button>
              );
            })}
          </div>

          {/* Add custom symptom input */}
          <form onSubmit={handleAddCustomSymptom} className="flex gap-2 border-t border-slate-100 pt-6 mt-4">
            <input
              type="text"
              placeholder="Or type a custom symptom (e.g. stomach ache)..."
              value={customSymptom}
              onChange={(e) => setCustomSymptom(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500 transition-all text-slate-700"
            />
            <button
              type="submit"
              className="rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer"
            >
              Add
            </button>
          </form>

          {/* Selected Symptoms List */}
          {selectedSymptoms.length > 0 && (
            <div className="flex flex-col gap-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Selected Symptoms</label>
              <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map((symptom) => (
                  <span
                    key={symptom}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-xl"
                  >
                    {symptom}
                    <button
                      type="button"
                      onClick={() => handleRemoveSymptom(symptom)}
                      className="text-teal-500 hover:text-teal-700 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Assessment Button */}
          <button
            onClick={handleGetAssessment}
            disabled={selectedSymptoms.length === 0 || loadingAssessment}
            className="mt-4 flex w-full items-center justify-center gap-2 cursor-pointer rounded-xl bg-teal-600 hover:bg-teal-500 py-3.5 text-sm font-bold text-white shadow-md transition-all disabled:bg-slate-200 disabled:cursor-not-allowed"
          >
            {loadingAssessment ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing symptoms...
              </>
            ) : (
              <>
                <Stethoscope className="h-4 w-4" />
                Analyze & Triage
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Assessment Results */}
      {step === "assessment" && assessment && (
        <div className="flex flex-col gap-6 animate-scale-up">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-800">Triage Summary Report</h2>
              <button
                onClick={() => setStep("select")}
                className="text-xs font-semibold text-slate-400 hover:text-teal-600 transition-all cursor-pointer"
              >
                Start Over
              </button>
            </div>

            {/* Specialty suggestion card */}
            <div className="rounded-2xl bg-teal-50 border border-teal-100 p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-teal-600 font-bold uppercase tracking-wider">Suggested Specialty</p>
                <p className="text-xl font-black text-slate-800 mt-1">{assessment.suggestedSpecialty}</p>
              </div>
              <button
                onClick={() => router.push(`/doctors?specialty=${encodeURIComponent(assessment.suggestedSpecialty)}`)}
                className="cursor-pointer flex items-center gap-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2.5 shadow-md shadow-teal-600/10 transition-all"
              >
                Find Specialists
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Triage assessment text */}
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-700">Initial AI Assessment:</p>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 leading-relaxed">
                {assessment.aiAssessment}
              </div>
            </div>

            {/* Disclaimer box */}
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-xs text-amber-700 flex gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <p>
                <strong>Disclaimer:</strong> This automated assessment is for informational purposes only. It is not a
                clinical diagnosis and does not substitute professional medical opinion. If you are experiencing chest pain,
                severe difficulty breathing, or another medical emergency, please dial your local emergency services immediately.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 border-t border-slate-100 pt-6">
              <button
                onClick={handleStartChat}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm py-3 cursor-pointer shadow-md"
              >
                <MessageSquare className="h-4 w-4" />
                Ask Follow-Up Questions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Interactive Streaming Chat Room */}
      {step === "chat" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4 animate-scale-up">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Brain className="h-5 w-5 text-teal-600" />
              AI Consultation Room
            </h2>
            <button
              onClick={() => {
                if (assessment) setStep("assessment");
                else setStep("select");
              }}
              className="text-xs font-semibold text-slate-400 hover:text-teal-600 transition-all cursor-pointer"
            >
              Back to Assessment
            </button>
          </div>

          {/* Messages window */}
          <div className="h-[400px] overflow-y-auto border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex flex-col gap-4">
            {chatMessages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-slate-900 text-white rounded-br-none"
                        : "bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Send form */}
          <form onSubmit={handleSendChatMessage} className="flex gap-2">
            <input
              type="text"
              disabled={isStreaming}
              placeholder="Ask about recommendations, medication conflicts, or symptom progressions..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-teal-500 bg-white text-slate-700"
            />
            <button
              type="submit"
              disabled={isStreaming || !inputText.trim()}
              className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-3 flex items-center justify-center cursor-pointer transition-all disabled:bg-slate-200 disabled:cursor-not-allowed shrink-0"
            >
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
