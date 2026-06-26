import { useEffect, useRef, useState } from "react";
import {
  Send,
  Loader2,
  Plus,
  Volume2,
  Trash2,
  MessageSquare,
  Scale,
} from "lucide-react";
import * as api from "../../lib/api";
import { speak } from "../../lib/voice";
import { useI18n } from "../../lib/i18n";

export default function Chat() {
  const { t } = useI18n();
  const [conversations, setConversations] = useState<api.ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<api.ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refreshConversations();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function refreshConversations() {
    const convs = await api.listConversations().catch(() => []);
    setConversations(convs);
  }

  async function openConversation(id: number) {
    setActiveId(id);
    const detail = await api.getConversation(id);
    setMessages(detail.messages);
  }

  function newConversation() {
    setActiveId(null);
    setMessages([]);
  }

  async function removeConversation(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    await api.deleteConversation(id).catch(() => {});
    if (activeId === id) newConversation();
    refreshConversations();
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    // optimistic user message
    const tempUser: api.ChatMessage = {
      id: Date.now(),
      role: "user",
      content: text,
      content_ar: null,
      citations: [],
    };
    setMessages((m) => [...m, tempUser]);
    try {
      const res = await api.sendChatMessage(text, activeId ?? undefined);
      if (activeId === null) {
        setActiveId(res.conversation_id);
        refreshConversations();
      }
      setMessages((m) => [...m, res.reply]);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "Désolé, une erreur est survenue. Réessaie.",
          content_ar: null,
          citations: [],
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  const SUGGESTIONS = [
    "Mon propriétaire garde ma caution",
    "Mon patron ne paie pas mes heures sup",
    "Le magasin refuse de me rembourser",
    "J'ai été licencié sans préavis",
  ];

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-5 h-[calc(100vh-180px)]">
      {/* Sidebar */}
      <aside className="card p-3 flex flex-col min-h-0">
        <button onClick={newConversation} className="btn-primary w-full justify-center mb-3">
          <Plus className="w-4 h-4" /> {t("chat.newQuestion")}
        </button>
        <div className="text-xs uppercase tracking-widest text-slate-500 px-2 mb-2">
          {t("chat.history")}
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {conversations.length === 0 && (
            <div className="text-sm text-slate-600 px-2 py-4 text-center">
              Aucune conversation pour l'instant
            </div>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => openConversation(c.id)}
              className={`group w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition ${
                activeId === c.id ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 truncate">{c.title}</span>
              <Trash2
                onClick={(e) => removeConversation(c.id, e)}
                className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition"
              />
            </button>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <section className="card flex flex-col min-h-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/40 flex items-center justify-center mb-4">
                <Scale className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-semibold text-lg">{t("chat.emptyTitle")}</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">{t("chat.emptySub")}</p>
              <div className="flex flex-wrap gap-2 justify-center mt-5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {sending && (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> {t("chat.thinking")}
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 p-3">
          <div className="flex items-end gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 focus-within:border-gold/50 transition">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={t("chat.placeholder")}
              className="bg-transparent outline-none flex-1 resize-none text-sm py-1 max-h-32"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="btn-primary !px-3 !py-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function MessageBubble({ message }: { message: api.ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-gold text-slate-950"
            : "bg-slate-800/80 text-slate-100 border border-slate-700"
        }`}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>

        {message.citations.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {message.citations.map((c, i) => (
              <div key={i} className="text-xs bg-slate-950/60 border border-slate-700 rounded-lg p-2">
                <span className="font-semibold text-gold">
                  {c.code} · {c.article}
                </span>
              </div>
            ))}
          </div>
        )}

        {!isUser && (message.content_ar || message.content) && (
          <button
            onClick={() => speak(message.content_ar || message.content)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            title="Écouter en arabe"
          >
            <Volume2 className="w-3.5 h-3.5" /> Écouter
          </button>
        )}
      </div>
    </div>
  );
}
