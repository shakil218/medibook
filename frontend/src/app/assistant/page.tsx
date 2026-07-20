"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { apiFetch, BASE_URL } from "@/lib/api";
import {
  Brain,
  Send,
  Loader2,
  AlertCircle,
  ArrowLeft,
  User,
  Bot,
  Compass,
  CornerDownLeft,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AssistantPage() {
  const router = useRouter();
  const { data: session, isPending: authPending } = authClient.useSession();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sessionId] = useState(() => "sess_" + Math.random().toString(36).substring(2, 11));
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([
    "I have a headache and fatigue",
    "Show me general practitioners near me",
    "Check my upcoming appointments"
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isStreaming]);

  // Load profile / check auth
  useEffect(() => {
    if (!authPending && !session?.user) {
      router.push("/login?redirect=/assistant");
    }
  }, [session, authPending, router]);

  // Handle parsing tags from messages
  const cleanMessageContent = (content: string) => {
    return content.replace(/\[\[.+?\]\]/g, "").trim();
  };

  const extractTags = (content: string) => {
    const navMatch = content.match(/\[\[ACTION:NAVIGATE:(.+?)\]\]/);
    const followUpsMatch = content.match(/\[\[FOLLOW_UPS:\s*(.+?)\]\]/);

    let parsedFollowUps: string[] = [];
    if (followUpsMatch) {
      try {
        parsedFollowUps = JSON.parse(followUpsMatch[1]);
      } catch (e) {
        console.error("Failed to parse follow ups json:", e);
      }
    }

    return {
      navigatePath: navMatch ? navMatch[1] : null,
      followUps: parsedFollowUps
    };
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isStreaming) return;

    const userText = textToSend;
    setInputText("");
    setFollowUps([]);

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
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Triage connection failed.");
      }

      // Add empty message placeholder for assistant
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

      // Finalized message extraction for follow-ups and actions
      const tags = extractTags(assistantText);
      if (tags.followUps && tags.followUps.length > 0) {
        setFollowUps(tags.followUps);
      }
      const targetPath = tags.navigatePath;
      if (targetPath) {
        toast.info("AI recommended navigation path detected. Routing in 3 seconds...", {
          action: {
            label: "Go Now",
            onClick: () => router.push(targetPath)
          }
        });
        setTimeout(() => {
          router.push(targetPath);
        }, 3000);
      }

    } catch (err: any) {
      toast.error(err.message || "Failed to retrieve assistant reply.");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  if (authPending) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 flex-1 bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm font-semibold text-slate-500">Retrieving chat settings...</p>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 w-full flex-1 flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/10">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-base leading-none">Triage AI Assistant</h1>
              <p className="text-[10px] text-teal-600 font-bold mt-1">Compassionate guidance • No diagnosis</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-1.5 text-[10px] text-amber-700 font-medium flex items-center gap-1.5 max-w-xs sm:max-w-none">
          <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span>Informational triage only. Avoids diagnosing.</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto border border-slate-150 rounded-3xl bg-slate-50/50 p-4 md:p-6 mb-4 space-y-4 flex flex-col">
        {chatMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto gap-5 py-12">
            <div className="h-16 w-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-2xl animate-pulse">
              ✨
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Your Symptom Triage Desk</h3>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                Describe your symptoms in plain language. The AI will ask clarifying follow-ups, suggest matching specialties, and offer booking tools.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-bold">Checks appointments</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-bold">Offers direct filters</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-bold">Compassionate</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 flex-1">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${
                    msg.role === "user"
                      ? "bg-slate-800 text-white border-slate-700"
                      : "bg-teal-600 text-white border-teal-500"
                  }`}
                >
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-slate-900 text-white rounded-tr-none shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-xs whitespace-pre-line"
                  }`}
                >
                  {cleanMessageContent(msg.content)}
                </div>
              </div>
            ))}
            {isStreaming && (
              <div className="flex gap-3 mr-auto items-center max-w-[85%]">
                <div className="h-9 w-9 rounded-xl bg-teal-600 text-white border border-teal-500 flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 flex items-center justify-center shadow-xs">
                  <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Suggested Follow Ups */}
      {followUps.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          {followUps.map((text, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(text)}
              className="rounded-xl border border-teal-100 bg-teal-50/50 hover:bg-teal-50 text-teal-700 text-[11px] px-3.5 py-2 font-bold cursor-pointer transition-all shadow-2xs"
            >
              💡 {text}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="relative rounded-2xl border border-slate-200 bg-white p-2 shadow-sm flex items-center gap-2">
        <textarea
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Describe how you are feeling (e.g. chest pain, stomach ache)..."
          className="flex-1 bg-transparent border-0 outline-none text-xs text-slate-800 p-2.5 resize-none max-h-24 h-10 leading-relaxed"
        />
        <button
          onClick={() => handleSendMessage(inputText)}
          disabled={!inputText.trim() || isStreaming}
          className="h-10 w-10 shrink-0 rounded-xl bg-teal-600 text-white hover:bg-teal-500 disabled:bg-slate-100 disabled:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
