import { useEffect, useRef, useState } from "react";
import { Bot, Send, X } from "lucide-react";
import api from "../api/axios";
import { useAppPreferences } from "../i18n";
import { Button } from "./ui";

// Εμφανίζει στοιχείο διεπαφής.
export default function AiAssistantWidget() {
  const { language, t } = useAppPreferences();
  const labels = t.assistant || {};
  const welcomeMessage = labels.welcome || "Hi. I can help with advice about your fields, crops, and current conditions.";
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", text: welcomeMessage }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages((current) => {
      if (current.length === 1 && current[0]?.role === "assistant") {
        return [{ role: "assistant", text: welcomeMessage }];
      }
      return current;
    });
  }, [welcomeMessage]);

  // Κρατάει το chat scrolled στο τελευταίο μήνυμα.
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [isOpen, messages, loading]);

  // Υποβάλλει φόρμα.
  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedMessage = input.trim();
    if (!trimmedMessage || loading) return;

    setMessages((current) => [...current, { role: "user", text: trimmedMessage }]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/api/ai/chat", { message: trimmedMessage, language });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: typeof response.data === "string" ? response.data : labels.unreadableResponse,
        },
      ]);
    } catch (error) {
      console.error("Σφάλμα AI Assistant:", error);
      const backendMessage = error.response?.data?.message;
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: backendMessage || labels.error || "There was a communication problem with the AI assistant.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[1400] flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          aria-label={labels.open || labels.title}
          title={labels.title || "AI Assistant"}
        >
          <span className="text-sm font-black tracking-normal">AI</span>
        </button>
      )}

      {/* Mobile backdrop */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[1400] bg-slate-950/30 backdrop-blur-[1px] lg:hidden"
          aria-label={labels.close || "Close AI Assistant"}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Right sidebar */}
      <aside
        className={[
          "fixed right-0 top-0 z-[1500] flex h-full w-80 max-w-[calc(100vw-1rem)] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-slate-950 sm:w-96",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-black text-slate-950 dark:text-slate-100">
                {labels.title || "AI Assistant"}
              </h2>
              <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">AgriManager</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => setIsOpen(false)}
            variant="ghost"
            className="h-11 w-11 shrink-0 rounded-xl p-0"
            aria-label={labels.closeButton || "Close"}
          >
            <X className="h-6 w-6" strokeWidth={2.25} />
          </Button>
        </header>

        {/* Chat body */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4 dark:bg-slate-900/60">
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <div key={`${message.role}-${index}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                    isUser
                      ? "rounded-br-md bg-emerald-950 text-white dark:bg-emerald-500 dark:text-slate-950"
                      : "rounded-bl-md border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200",
                  ].join(" ")}
                >
                  {message.text}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                {labels.thinking || "AI is thinking..."}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
              rows={2}
              placeholder={labels.placeholder || "Type your question..."}
              className="min-h-[48px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
              disabled={loading}
            />
            <Button
              type="submit"
              variant="primary"
              className="h-12 w-12 shrink-0 rounded-2xl p-0"
              disabled={loading || !input.trim()}
              aria-label={labels.send || "Send message"}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}
