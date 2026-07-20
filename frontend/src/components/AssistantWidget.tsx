"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { BASE_URL } from "@/lib/api";
import {
  Brain,
  Send,
  Loader2,
  X,
  User,
  Bot,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AssistantWidget() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sessionId] = useState(() => "widget_" + Math.random().toString(36).substring(2, 11));
  const [isStreaming, setIsStreaming] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([
    "Filter general practitioners",
    "Upcoming schedule check"
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isOpen, isStreaming]);

  // If user is not authenticated, do not show the widget at all
  if (!session?.user || session.user.role !== "patient") {
    return null;
  }

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
        throw new Error("Chat connection failed.");
      }

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

      const tags = extractTags(assistantText);
      if (tags.followUps && tags.followUps.length > 0) {
        setFollowUps(tags.followUps);
      }
      const targetPath = tags.navigatePath;
      if (targetPath) {
        toast.info("AI suggested navigation. Routing in 3 seconds...", {
          action: {
            label: "Go Now",
            onClick: () => {
              setIsOpen(false);
              router.push(targetPath);
            }
          }
        });
        setTimeout(() => {
          setIsOpen(false);
          router.push(targetPath);
        }, 3000);
      }

    } catch (err: any) {
      toast.error(err.message || "Failed to load triage chat.");
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

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-teal-600 hover:bg-teal-500 hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-teal-600/30 transition-all cursor-pointer group"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Brain className="h-6 w-6 group-hover:animate-pulse" />}
      </button>

      {/* Slide-up Chat Screen */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] h-[480px] rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-teal-400" />
              <div>
                <h4 className="font-extrabold text-xs">MediBook AI Triage</h4>
                <p className="text-[9px] text-slate-400 font-bold">Compassionate Guide • No Diagnosis</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Warning banner */}
          <div className="bg-amber-50 border-b border-amber-100 p-2 text-[9px] text-amber-700 flex items-center gap-1.5 shrink-0">
            <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
            <span>Triage helper only. Avoids diagnosing.</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 flex flex-col">
            {chatMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3">
                <div className="h-10 w-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg animate-pulse">
                  ✨
                </div>
                <h5 className="font-bold text-slate-700 text-xs">AI Symptom Triage Desk</h5>
                <p className="text-slate-500 text-[10px] leading-relaxed">
                  Describe symptoms in plain language (e.g. chest pain, stomach ache) to check specialties or schedule slots.
                </p>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2 max-w-[85%] ${
                      msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                  >
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border ${
                        msg.role === "user"
                          ? "bg-slate-800 text-white border-slate-700"
                          : "bg-teal-600 text-white border-teal-500"
                      }`}
                    >
                      {msg.role === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                    </div>
                    <div
                      className={`rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-slate-900 text-white rounded-tr-none shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 rounded-tl-none shadow-2xs whitespace-pre-line"
                      }`}
                    >
                      {cleanMessageContent(msg.content)}
                    </div>
                  </div>
                ))}
                {isStreaming && (
                  <div className="flex gap-2 mr-auto items-center max-w-[85%]">
                    <div className="h-7 w-7 rounded-lg bg-teal-600 text-white border border-teal-500 flex items-center justify-center shrink-0 shadow-xs">
                      <Bot className="h-3 w-3" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none px-3 py-2 flex items-center justify-center shadow-xs">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Suggested follow-ups */}
          {followUps.length > 0 && (
            <div className="flex gap-1.5 p-2 bg-slate-50 border-t border-slate-100 overflow-x-auto shrink-0 justify-center">
              {followUps.slice(0, 2).map((text, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(text)}
                  className="rounded-lg border border-teal-100 bg-white hover:bg-teal-50/50 text-teal-700 text-[9px] px-2.5 py-1.5 font-bold cursor-pointer transition-all shadow-3xs shrink-0 max-w-[150px] truncate"
                  title={text}
                >
                  💡 {text}
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          <div className="p-2 border-t border-slate-150 bg-white flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask triage AI..."
              className="flex-1 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 outline-none text-xs text-slate-800 focus:border-teal-500"
            />
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || isStreaming}
              className="h-8 w-8 rounded-lg bg-teal-600 text-white hover:bg-teal-500 disabled:bg-slate-100 disabled:text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
