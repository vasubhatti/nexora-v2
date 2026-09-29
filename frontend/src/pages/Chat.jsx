import { useEffect, useRef, useState } from "react";
import { Download, Globe } from "lucide-react";
import Sidebar from "../components/Sidebar.jsx";
import ChatMessage from "../components/ChatMessage.jsx";
import ChatInput from "../components/ChatInput.jsx";
import Spinner from "../components/Spinner.jsx";
import useChatStore from "../store/chatStore.js";
import useCreditStore from "../store/creditStore.js";
import api from "../api/axios.js";


const EmptyState = () => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", height: "100%", padding: "2rem", textAlign: "center",
  }}>
    <h2 style={{ fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
      How can I help you?
    </h2>
    <p style={{ fontSize: 14, color: "#71717a", maxWidth: 340, lineHeight: 1.7 }}>
      Ask anything, search the web, generate images, or analyze documents.
    </p>
  </div>
);

const ThinkingIndicator = ({ mode }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (mode !== "thinking") return;
    setSeconds(0);
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [mode]);

  return (
    <div style={{ padding: "20px 32px", background: "rgba(255,255,255,0.015)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{
            width: 22, height: 22, background: "#fff", borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: "#000" }}>N</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Nexora AI
          </span>
        </div>

        {mode === "web_search" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Globe size={15} style={{ color: "#60a5fa" }} />
            <span style={{ fontSize: 14, color: "#60a5fa", fontWeight: 500 }}>Searching the web...</span>
            <div style={{ display: "flex", gap: 4, marginLeft: 2 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 4, height: 4, borderRadius: "50%", background: "#60a5fa",
                  animation: "thinkDot 1.2s ease infinite",
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </div>
          </div>
        )}

        {mode === "thinking" && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "8px 14px", borderRadius: 10,
            background: "rgba(167,139,250,0.08)",
            border: "1px solid rgba(167,139,250,0.15)",
          }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 5, height: 5, borderRadius: "50%", background: "#a78bfa",
                  animation: "thinkDot 1.2s ease infinite",
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </div>
            <span style={{ fontSize: 13, color: "#a78bfa", fontWeight: 500 }}>
              Thinking... {seconds}s
            </span>
          </div>
        )}

        {mode !== "web_search" && mode !== "thinking" && (
          <div style={{ display: "flex", gap: 5 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 7, height: 7, borderRadius: "50%", background: "#52525b",
                animation: "thinkDot 1.2s ease infinite",
                animationDelay: `${i * 0.2}s`,
              }} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes thinkDot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
};

const metaStore = {};

const Chat = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [error, setError] = useState(null);
  const [, forceUpdate] = useState(0);
  const [currentMode, setCurrentMode] = useState(null);
  const bottomRef = useRef(null);
  const thinkSecondsRef = useRef(0);
  const thinkTimerRef = useRef(null);
  const {
    activeConversation, messages, sending, loading,
    createConversation, sendMessage, addOptimisticMessage,
  } = useChatStore();
  const { fetchBalance } = useCreditStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
  if (sending && currentMode === "thinking") {
    thinkSecondsRef.current = 0;

    thinkTimerRef.current = setInterval(() => {
      thinkSecondsRef.current += 1;
    }, 1000);
  } else {
    clearInterval(thinkTimerRef.current);
    thinkTimerRef.current = null;
  }

  return () => clearInterval(thinkTimerRef.current);
}, [sending, currentMode]);

  const getMeta = id => metaStore[id] || {};

  const storeMeta = (id, data) => {
    metaStore[id] = data;
    forceUpdate(n => n + 1);
  };

  const handleSend = async (payload, text, mode, fileName) => {
    setError(null);
    setCurrentMode(mode);

    let conv = activeConversation;
    if (!conv) {
      conv = await createConversation();
      if (!conv) return;
    }

    if (payload instanceof FormData) {
      payload.append("conversationId", conv._id);
    } else {
      payload.conversationId = conv._id;
    }

    addOptimisticMessage({
      _id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      type: "text",
      file: fileName ? { name: fileName } : undefined,
      createdAt: new Date().toISOString(),
    });

    try {
      const data = await sendMessage(payload);
      if (data?.assistantMessage?._id) {
        storeMeta(data.assistantMessage._id, {
          mode,
          thinking: data.thinking,
          sources: data.sources,
          thinkSeconds: mode === "thinking"
            ? thinkSecondsRef.current
            : null,
        });
      }
      fetchBalance();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setCurrentMode(null);
    }
  };

  const handleSuggestion = async text => {
    let conv = activeConversation;
    if (!conv) conv = await createConversation();
    if (!conv) return;
    await handleSend({ message: text, mode: "text", conversationId: conv._id }, text, "text", null);
  };

  const handleExportPDF = async () => {
    if (!activeConversation) return;
    try {
      const res = await api.get(`/chat/conversations/${activeConversation._id}/export`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexora-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      fetchBalance();
    } catch { setError("PDF export failed."); }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#0a0a0a" }}>
    <style>{`
      @media (max-width: 768px) {
        .chat-sidebar { display: none !important; }
        .chat-mobile-btn { display: flex !important; }
        .chat-messages { padding-left: 0 !important; }
      }
    `}</style>

    {/* Sidebar — hide on mobile */}
    <div className="chat-sidebar" style={{ display: "flex" }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
    </div>

    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 52, flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className={`chat-mobile-btn ${mobileOpen ? "sidebar-open" : ""}`}
            aria-label="Open sidebar"
          >
            <span style={{ fontSize: 20 }}>☰</span>
          </button>
          <h1 style={{ fontSize: 14, fontWeight: 500, color: "#a1a1aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60vw" }}>
            {activeConversation?.title || "Nexora V2"}
          </h1>
        </div>
        {activeConversation && (
          <button onClick={handleExportPDF}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#52525b", background: "none", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 8, transition: "all 0.15s", whiteSpace: "nowrap" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#e4e4e7"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#52525b"; }}
          >
            <Download size={13} /> <span className="chat-mobile-btn" style={{ display: "none" }}>PDF</span>
            <span className="hide-mobile">Export PDF</span>
          </button>
        )}
      </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <Spinner size={24} />
            </div>
          ) : messages.length === 0 && !sending ? (
            <EmptyState />
          ) : (
            <div style={{ paddingBottom: 16 }}>
              {messages.map((msg, i) => {
                const m = getMeta(msg._id);
                return (
                  <ChatMessage
                    key={msg._id || i}
                    message={msg}
                    thinking={m.thinking}
                    sources={m.sources}
                    thinkSeconds={m.thinkSeconds}
                    mode={m.mode}
                  />
                );
              })}

              {sending && <ThinkingIndicator mode={currentMode} />}

              {error && (
                <div style={{ padding: "12px 32px", maxWidth: 720, margin: "0 auto" }}>
                  <div style={{
                    padding: "12px 16px", borderRadius: 12, fontSize: 14,
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#f87171",
                  }}>
                    {error}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} sending={sending} disabled={false} />
      </div>
    </div>
  );
};

export default Chat;