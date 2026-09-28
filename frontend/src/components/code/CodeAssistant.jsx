import { useState, useRef, useEffect } from "react";
import { Send, Eraser, Check, ChevronDown, Wand2 } from "lucide-react";
import Spinner from "../Spinner.jsx";
import MarkdownRenderer from "../MarkdownRenderer.jsx";
import CodeBlock from "../CodeBlock.jsx";

// Parse markdown for code blocks
const parseContent = (text) => {
  const parts = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    parts.push({
      type: "code",
      language: match[1] || "text",
      content: match[2].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts;
};

// Apply button for each code block
const ApplyButton = ({ code, files, onApply }) => {
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleApply = (file) => {
    onApply(file, code);
    setOpen(false);
    setApplied(true);
    setTimeout(() => setApplied(false), 3000);
  };

  if (files.length === 0) return null;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block", marginTop: 6 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 6, border: "1px solid #3e3e42",
          background: applied ? "rgba(74,222,128,0.1)" : "rgba(0,122,204,0.12)",
          color: applied ? "#4ade80" : "#007acc",
          cursor: "pointer", fontSize: 12, fontWeight: 500,
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { if (!applied) e.currentTarget.style.background = "rgba(0,122,204,0.2)"; }}
        onMouseLeave={e => { if (!applied) e.currentTarget.style.background = "rgba(0,122,204,0.12)"; }}
      >
        {applied
          ? <><Check size={12} /> Applied!</>
          : <><Wand2 size={12} /> Apply to file<ChevronDown size={11} /></>}
      </button>

      {open && !applied && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: 0, zIndex: 50,
          background: "#252526", border: "1px solid #3e3e42", borderRadius: 8,
          minWidth: 200, maxHeight: 200, overflowY: "auto",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
          <div style={{ padding: "6px 10px", borderBottom: "1px solid #3e3e42" }}>
            <span style={{ fontSize: 11, color: "#858585", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Select file
            </span>
          </div>
          {files.map(file => (
            <button
              key={file._id || file.name}
              onClick={() => handleApply(file)}
              style={{
                width: "100%", padding: "8px 12px", border: "none",
                background: "transparent", color: "#cccccc", cursor: "pointer",
                textAlign: "left", fontSize: 12, display: "flex", alignItems: "center", gap: 8,
                transition: "background 0.1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,122,204,0.15)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 11, color: "#858585", fontFamily: "monospace" }}>
                {(file.path || file.name).split(".").pop()}
              </span>
              <span className="truncate">{file.path || file.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Single message renderer
const AssistantMessage = ({ msg, files, onApplyCode }) => {
  if (msg.role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <div style={{
          maxWidth: "85%", padding: "9px 13px",
          borderRadius: "14px 14px 4px 14px",
          background: "rgba(0,122,204,0.2)", border: "1px solid rgba(0,122,204,0.3)",
          fontSize: 13, color: "#cccccc", lineHeight: 1.6, wordBreak: "break-word",
        }}>
          {msg.content}
        </div>
      </div>
    );
  }

  const parts = parseContent(msg.content);

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <div style={{
          width: 18, height: 18, background: "#fff", borderRadius: 4,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 7, fontWeight: 900, color: "#000" }}>N</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#858585", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Nexora AI
        </span>
      </div>

      {parts.map((part, i) => (
        <div key={i}>
          {part.type === "text" ? (
            <div style={{ fontSize: 13, color: "#cccccc", lineHeight: 1.7 }}>
              <MarkdownRenderer content={part.content} />
            </div>
          ) : (
            <div style={{ marginBottom: 6 }}>
              <CodeBlock code={part.content} language={part.language} />
              <ApplyButton
                code={part.content}
                files={files}
                onApply={onApplyCode}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const CodeAssistant = ({ projectId, messages, files, onSend, onClear, onApplyCode }) => {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput("");
    setSending(true);
    setError(null);
    try {
      await onSend(msg);
    } catch (err) {
      setError(err.message || "Failed.");
    } finally {
      setSending(false);
    }
  };

  const onKey = e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const SUGGESTIONS = [
    "Explain all the files in this project",
    "Find and fix any bugs",
    "Add error handling",
    "Write unit tests for this code",
    "Optimize performance",
    "Add TypeScript types",
  ];

  return (
    <div style={{
      width: 340, flexShrink: 0, display: "flex", flexDirection: "column",
      background: "#252526", borderLeft: "1px solid #3e3e42", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "0 14px", height: 42, display: "flex", alignItems: "center",
        justifyContent: "space-between", borderBottom: "1px solid #3e3e42", flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#858585", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          AI Assistant
        </span>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            style={{
              display: "flex", alignItems: "center", gap: 4, fontSize: 11,
              color: "#858585", background: "none", border: "none", cursor: "pointer",
              padding: "3px 6px", borderRadius: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#cccccc"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#858585"; }}
          >
            <Eraser size={11} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {messages.length === 0 ? (
          <div>
            <p style={{ fontSize: 12, color: "#858585", lineHeight: 1.6, marginBottom: 14 }}>
              Ask me anything about your code. I can see all your project files and will suggest code with one-click apply.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  style={{
                    padding: "7px 10px", borderRadius: 6,
                    border: "1px solid #3e3e42",
                    background: "rgba(255,255,255,0.02)", color: "#6e6e6e",
                    cursor: "pointer", fontSize: 12, textAlign: "left",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,122,204,0.1)"; e.currentTarget.style.color = "#cccccc"; e.currentTarget.style.borderColor = "rgba(0,122,204,0.3)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.color = "#6e6e6e"; e.currentTarget.style.borderColor = "#3e3e42"; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <AssistantMessage
                key={i}
                msg={msg}
                files={files}
                onApplyCode={onApplyCode}
              />
            ))}

            {sending && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                <Spinner size={12} />
                <span style={{ fontSize: 12, color: "#858585" }}>Thinking...</span>
              </div>
            )}

            {error && (
              <div style={{
                padding: "8px 12px", borderRadius: 8, fontSize: 12,
                background: "rgba(239,68,68,0.08)", color: "#f87171",
                border: "1px solid rgba(239,68,68,0.15)", marginTop: 8,
              }}>
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid #3e3e42", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 8,
          padding: "9px 12px", borderRadius: 10,
          background: "#3c3c3c", border: "1px solid #3e3e42",
          transition: "border-color 0.15s",
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask about your code..."
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#cccccc", fontSize: 13, resize: "none", lineHeight: 1.5,
              fontFamily: "inherit", maxHeight: 100,
              overflowY: "auto",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{
              width: 28, height: 28, borderRadius: 6, border: "none",
              background: input.trim() && !sending ? "#007acc" : "#3e3e42",
              cursor: input.trim() && !sending ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.15s",
            }}
          >
            {sending
              ? <Spinner size={12} />
              : <Send size={12} style={{ color: input.trim() ? "#fff" : "#6e6e6e" }} />}
          </button>
        </div>
        <p style={{ fontSize: 10, color: "#6e6e6e", marginTop: 6, paddingLeft: 2 }}>
          AI sees all files · 4 credits/message · ↵ send
        </p>
      </div>
    </div>
  );
};

export default CodeAssistant;