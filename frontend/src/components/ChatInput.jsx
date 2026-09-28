import { useState, useRef, useEffect } from "react";
import { ArrowUp, Brain, Mic, MicOff, Plus, Paperclip, Globe, Image, X, RefreshCw } from "lucide-react";
import Spinner from "./Spinner.jsx";
import useVoiceInput from "../hooks/useVoiceInput.js";

const RATIOS = [
  { id: "square",     label: "1:1",  icon: "⬜", width: 1024, height: 1024 },
  { id: "horizontal", label: "16:9", icon: "▬",  width: 1440, height: 810  },
  { id: "vertical",   label: "9:16", icon: "▮",  width: 810,  height: 1440 },
];

const ChatInput = ({ onSend, sending, disabled }) => {
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [ratio, setRatio] = useState("square");
  const [webSearch, setWebSearch] = useState(false);
  const [file, setFile] = useState(null);
  const [plusOpen, setPlusOpen] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const plusRef = useRef(null);
  const interimRef = useRef("");

  // Auto resize
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  // Close plus menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (plusRef.current && !plusRef.current.contains(e.target)) setPlusOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!voiceError) return;
    const t = setTimeout(() => setVoiceError(null), 4000);
    return () => clearTimeout(t);
  }, [voiceError]);

  const { listening, supported, toggleListening } = useVoiceInput({
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        setInput(prev => {
          const base = prev.replace(interimRef.current, "").trimEnd();
          interimRef.current = "";
          return base ? `${base} ${text}` : text;
        });
      } else {
        setInput(prev => {
          const base = prev.replace(interimRef.current, "").trimEnd();
          interimRef.current = text;
          return base ? `${base} ${text}` : text;
        });
      }
    },
    onError: (err) => setVoiceError(err),
  });

  const getMode = () => {
    if (file) return file.type.startsWith("image/") ? "image_upload" : "document_upload";
    if (imageMode) return "image_generate";
    if (webSearch) return "web_search";
    if (thinking) return "thinking";
    return "text";
  };

  const canSend = (input.trim() || file) && !sending && !disabled;

  const doSend = () => {
    if (!canSend) return;
    const mode = getMode();
    const selectedRatio = RATIOS.find(r => r.id === ratio);
    interimRef.current = "";

    if (file) {
      const fd = new FormData();
      fd.append("message", input.trim());
      fd.append("mode", mode);
      fd.append("file", file);
      onSend(fd, input.trim(), mode, file.name);
    } else {
      onSend(
        { message: input.trim(), mode, ...(imageMode && { width: selectedRatio.width, height: selectedRatio.height }) },
        input.trim(), mode, null
      );
    }
    setInput("");
    setFile(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(); }
  };

  const handlePlusOption = (option) => {
    setPlusOpen(false);
    if (option === "attach") { fileRef.current?.click(); }
    if (option === "search") { setWebSearch(v => !v); setImageMode(false); }
    if (option === "image") { setImageMode(v => !v); setWebSearch(false); }
  };

  const placeholder = listening ? "Listening..." : imageMode ? "Describe the image you want to create..." : webSearch ? "Search the web in real time..." : thinking ? "Ask something complex..." : "Ask anything...";

  return (
    <div style={{ padding: "0 16px 16px", background: "#0a0a0a" }}>
      <style>{`
        @keyframes soundWave { 0%,100%{transform:scaleY(0.5);opacity:0.6} 50%{transform:scaleY(1.4);opacity:1} }
        @media (max-width: 600px) {
          .chat-input-inner { max-width: 100% !important; }
        }
      `}</style>

      <div className="chat-input-inner" style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>

        {/* Voice error */}
        {voiceError && (
          <div style={{ marginBottom: 8, padding: "8px 14px", borderRadius: 10, fontSize: 13, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            {voiceError}
          </div>
        )}

        {/* Listening indicator */}
        {listening && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "9px 14px", borderRadius: 12, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <div style={{ display: "flex", gap: 3 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ width: 3, borderRadius: 999, background: "#f87171", animation: "soundWave 0.8s ease infinite", animationDelay: `${i*0.1}s`, height: `${8+i*3}px` }} />
              ))}
            </div>
            <span style={{ fontSize: 13, color: "#f87171", fontWeight: 500, flex: 1 }}>Listening... speak now</span>
            <button onClick={toggleListening} style={{ fontSize: 12, color: "#f87171", background: "rgba(239,68,68,0.1)", border: "none", padding: "3px 10px", borderRadius: 6, cursor: "pointer" }}>
              Stop
            </button>
          </div>
        )}

        {/* File chip */}
        {file && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 20, marginBottom: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 13, color: "#a1a1aa" }}>
            <span style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
            <button onClick={() => setFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#71717a", padding: 0, display: "flex" }}><X size={13} /></button>
          </div>
        )}

        {/* Main input box — ChatGPT style */}
        <div style={{
          borderRadius: 16,
          background: "rgba(255,255,255,0.06)",
          border: `1px solid ${listening ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.12)"}`,
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: "0 0 0 0 transparent",
        }}
          onFocusCapture={e => e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.06)"}
          onBlurCapture={e => e.currentTarget.style.boxShadow = "none"}
        >
          {/* Textarea */}
          <div style={{ padding: "14px 16px 0 16px" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              disabled={disabled}
              placeholder={placeholder}
              rows={1}
              style={{
                width: "100%", background: "transparent", border: "none", outline: "none",
                color: listening ? "#f87171" : "#f5f5f5",
                fontSize: 15, resize: "none", lineHeight: 1.6, fontFamily: "inherit",
                transition: "color 0.2s",
              }}
            />
          </div>

          {/* Image ratio options — shown inside box when imageMode active */}
          {imageMode && !file && (
            <div style={{ padding: "8px 16px 4px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#52525b", marginRight: 4 }}>Size:</span>
              {RATIOS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setRatio(r.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "3px 10px",
                    borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500,
                    background: ratio === r.id ? "rgba(251,146,60,0.18)" : "rgba(255,255,255,0.06)",
                    color: ratio === r.id ? "#fb923c" : "#71717a",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 10 }}>{r.icon}</span>{r.label}
                </button>
              ))}
            </div>
          )}

          {/* Bottom toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px 12px",
            }}
          >
            {/* Left: + button */}
            <div ref={plusRef} style={{ position: "relative" }}>
              <button
                onClick={() => setPlusOpen(v => !v)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: plusOpen
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                  fontSize: 20,
                  color: "#71717a",
                  lineHeight: 1,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background =
                    "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "#e4e4e7";
                }}
                onMouseLeave={e => {
                  if (!plusOpen) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#71717a";
                  }
                }}
              >
                +
              </button>

              {/* Plus dropdown */}
              {plusOpen && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 8px)",
                    left: 0,
                    zIndex: 50,
                    background: "#1a1a1a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    overflow: "hidden",
                    minWidth: 180,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  }}
                >
                  {[
                    {
                      id: "attach",
                      icon: Paperclip,
                      label: "Attach file",
                      color: "#a1a1aa",
                      disabled: imageMode,
                    },
                    {
                      id: "search",
                      icon: Globe,
                      label: "Web Search",
                      color: "#60a5fa",
                      active: webSearch,
                      disabled: imageMode,
                    },
                    {
                      id: "image",
                      icon: Image,
                      label: "Create image",
                      color: "#fb923c",
                      active: imageMode,
                    },
                  ].map(opt => {
                    const Icon = opt.icon;

                    return (
                      <button
                        key={opt.id}
                        onClick={() =>
                          !opt.disabled && handlePlusOption(opt.id)
                        }
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "11px 14px",
                          border: "none",
                          cursor: opt.disabled
                            ? "not-allowed"
                            : "pointer",
                          background: opt.active
                            ? `${opt.color}12`
                            : "transparent",
                          color: opt.disabled
                            ? "#3f3f46"
                            : opt.active
                            ? opt.color
                            : "#cccccc",
                          fontSize: 13,
                          textAlign: "left",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={e => {
                          if (!opt.disabled) {
                            e.currentTarget.style.background =
                              `${opt.color}10`;
                          }
                        }}
                        onMouseLeave={e => {
                          if (!opt.disabled) {
                            e.currentTarget.style.background =
                              opt.active
                                ? `${opt.color}12`
                                : "transparent";
                          }
                        }}
                      >
                        <Icon
                          size={15}
                          style={{
                            color: opt.disabled
                              ? "#3f3f46"
                              : opt.active
                              ? opt.color
                              : "#71717a",
                            flexShrink: 0,
                          }}
                        />

                        {opt.label}

                        {opt.active && (
                          <span
                            style={{
                              marginLeft: "auto",
                              fontSize: 10,
                              color: opt.color,
                            }}
                          >
                            ✓ On
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Think + Voice + Send */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {/* Think toggle */}
              <button
                onClick={() => {
                  setThinking(v => !v);
                  setImageMode(false);
                  setWebSearch(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: thinking
                    ? "1px solid rgba(167,139,250,0.4)"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: thinking
                    ? "rgba(167,139,250,0.12)"
                    : "transparent",
                  color: thinking ? "#a78bfa" : "#71717a",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                  transition: "all 0.15s",
                }}
              >
                <Brain
                  size={13}
                  style={{
                    color: thinking ? "#a78bfa" : "#71717a",
                  }}
                />

                <span style={{ display: "none" }} className="think-label">
                  Think
                </span>

                Think
              </button>

              {/* Voice button */}
              {supported && (
                <button
                  onClick={toggleListening}
                  disabled={sending || disabled}
                  title={listening ? "Stop recording" : "Voice input"}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border: listening
                      ? "1px solid rgba(239,68,68,0.4)"
                      : "1px solid rgba(255,255,255,0.1)",
                    background: listening
                      ? "rgba(239,68,68,0.12)"
                      : "transparent",
                    cursor:
                      sending || disabled
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    opacity: sending || disabled ? 0.5 : 1,
                  }}
                >
                  {listening ? (
                    <MicOff
                      size={15}
                      style={{ color: "#f87171" }}
                    />
                  ) : (
                    <Mic
                      size={15}
                      style={{ color: "#71717a" }}
                    />
                  )}
                </button>
              )}

              {/* Send button */}
              <button
                onClick={doSend}
                disabled={!canSend}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: "none",
                  background: canSend
                    ? "#fff"
                    : "rgba(255,255,255,0.1)",
                  cursor: canSend
                    ? "pointer"
                    : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  if (canSend) {
                    e.currentTarget.style.background = "#e4e4e7";
                  }
                }}
                onMouseLeave={e => {
                  if (canSend) {
                    e.currentTarget.style.background = "#fff";
                  }
                }}
              >
                {sending ? (
                  <Spinner size={14} />
                ) : (
                  <ArrowUp
                    size={15}
                    style={{
                      color: canSend ? "#000" : "#52525b",
                    }}
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        <input
          ref={fileRef} type="file"
          accept="image/*,.pdf,.txt,.js,.py,.html,.css,.json"
          style={{ display: "none" }}
          onChange={e => { setFile(e.target.files[0] || null); e.target.value = ""; }}
        />

        <p style={{ textAlign: "center", fontSize: 11, color: "#3f3f46", marginTop: 8 }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatInput;