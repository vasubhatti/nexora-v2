import { useState, useEffect } from "react";
import { Copy, Check, Brain, ChevronDown, ChevronUp, Download } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer.jsx";
import useStreamingText from "../hooks/useStreamingText.js";

// ── Thought counter block ─────────────────────────────────
const ThinkingBlock = ({ thinking, thinkSeconds }) => {
  const [open, setOpen] = useState(false);

  if (thinkSeconds == null) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 13, background: "none", border: "none",
          cursor: "pointer", padding: "6px 10px", borderRadius: 8,
          color: "#a78bfa",
          background: "rgba(167,139,250,0.08)",
          marginBottom: 8,
        }}
      >
        <Brain size={13} />
        <span>Thought for {thinkSeconds}s</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && thinking && (
          <div style={{
            padding: "12px 16px",
            borderRadius: 10,
            fontSize: 13,
            color: "#71717a",
            lineHeight: 1.7,
            fontStyle: "italic",
            background: "rgba(167,139,250,0.04)",
            border: "1px solid rgba(167,139,250,0.1)",
          }}>
            {thinking}
          </div>
        )}
    </div>
  );
};

// ── Sources block ─────────────────────────────────────────
const SourcesBlock = ({ sources }) => {
  if (!sources?.length) return null;
  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: "#3f3f46",
        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8,
      }}>
        Sources
      </p>
      {sources.map((s, i) => (
        <a key={i} href={s.link} target="_blank" rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "flex-start", gap: 8,
            marginBottom: 6, fontSize: 13, color: "#52525b",
            textDecoration: "none", transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#a1a1aa"}
          onMouseLeave={e => e.currentTarget.style.color = "#52525b"}
        >
          <span style={{ fontFamily: "monospace", color: "#3f3f46", flexShrink: 0 }}>[{i + 1}]</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
        </a>
      ))}
    </div>
  );
};

// ── Image skeleton loader ─────────────────────────────────
const ImageSkeleton = () => (
  <div style={{ maxWidth: 420 }}>
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.08)",
      background: "#111",
    }}>
      {/* Shimmer box */}
      <div style={{
        width: "100%", paddingBottom: "100%", position: "relative",
        background: "linear-gradient(110deg, #111 25%, #1c1c1c 37%, #111 63%)",
        backgroundSize: "400% 100%",
        animation: "shimmer 1.6s ease infinite",
      }} />
      {/* Label */}
      <div style={{
        padding: "14px 16px",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "#a78bfa",
          animation: "pulse 1.4s ease infinite",
        }} />
        <span style={{ fontSize: 13, color: "#71717a" }}>Creating image...</span>
      </div>
    </div>
    <style>{`
      @keyframes shimmer {
        0% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `}</style>
  </div>
);

// ── Generated image with download ────────────────────────
const GeneratedImage = ({ imageUrl, prompt }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexora-image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, "_blank");
    }
  };

  if (failed) return (
    <div style={{
      padding: "16px", borderRadius: 12, fontSize: 13, color: "#f87171",
      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
    }}>
      Image failed to load. The service may be busy — please try again.
    </div>
  );

  return (
    <div style={{ maxWidth: 420 }}>
      {!loaded && <ImageSkeleton />}
      <div style={{ display: loaded ? "block" : "none" }}>
        <div style={{
          borderRadius: 16, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <img
            src={imageUrl}
            alt={prompt}
            style={{ width: "100%", display: "block" }}
            onLoad={() => setLoaded(true)}
            onError={() => { setLoaded(true); setFailed(true); }}
          />
          <div style={{
            padding: "10px 14px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(0,0,0,0.4)",
          }}>
            <span style={{
              fontSize: 12, color: "#52525b",
              overflow: "hidden", textOverflow: "ellipsis",
              whiteSpace: "nowrap", flex: 1, marginRight: 12,
            }}>
              {prompt}
            </span>
            <button
              onClick={handleDownload}
              style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: 12,
                color: "#a1a1aa", background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, padding: "5px 10px", cursor: "pointer",
                flexShrink: 0, transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#a1a1aa"; }}
            >
              <Download size={12} />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main ChatMessage ──────────────────────────────────────
const ChatMessage = ({
  message,
  thinking,
  sources,
  thinkSeconds,
  mode,
  isImageGenerating,
  isNew = false,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const shouldStream = !isUser && isNew && !isImageGenerating;
  const { displayed, done } = useStreamingText(shouldStream ? message.content : "");
  const content = shouldStream ? displayed : message.content;

  const copy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── User message — RIGHT aligned ─────────────────────────
  if (isUser) {
    return (
      <div style={{
        padding: "16px 32px",
        display: "flex",
        justifyContent: "flex-end",
      }}>
        <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          {message.file && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 10,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontSize: 13, color: "#a1a1aa",
            }}>
              📎 {message.file.name}
            </div>
          )}
          {content && (
            <div style={{
              background: "rgba(255,255,255,0.09)",
              border: "1px solid rgba(255,255,255,0.11)",
              borderRadius: "18px 18px 4px 18px",
              padding: "12px 18px",
              fontSize: 15, color: "#f5f5f5", lineHeight: 1.75,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {content}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Assistant message — LEFT with logo ───────────────────
  return (
    <div style={{ padding: "20px 32px", background: "rgba(255,255,255,0.015)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* AI label */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{
            width: 22, height: 22, background: "#ffffff", borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: "#000" }}>N</span>
          </div>
          <p style={{
            fontSize: 12, fontWeight: 700, color: "#52525b",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            Nexora AI
          </p>
        </div>

        {/* Thinking block */}
        {mode === "thinking" && (
          <ThinkingBlock
            thinking={thinking}
            thinkSeconds={thinkSeconds}
          />
        )}

        {/* Image generating skeleton */}
        {isImageGenerating && <ImageSkeleton />}

        {/* Image result */}
        {!isImageGenerating && message.imageUrl && (
          <GeneratedImage imageUrl={message.imageUrl} prompt={message.content?.replace("Here is your generated image based on: ", "") || ""} />
        )}

        {/* Text content */}
        {!message.imageUrl && !isImageGenerating && (
          <div style={{ fontSize: 16, color: "#e4e4e7", lineHeight: 1.8 }}>
            <MarkdownRenderer content={message.content} />
          </div>
        )}

        {/* Sources */}
        <SourcesBlock sources={sources} />

        {/* Copy button */}
        {!isImageGenerating && !message.imageUrl && (
          <button
            onClick={copy}
            style={{
              display: "flex", alignItems: "center", gap: 6, marginTop: 14,
              fontSize: 12, color: "#3f3f46", background: "none",
              border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#71717a"}
            onMouseLeave={e => e.currentTarget.style.color = "#3f3f46"}
          >
            {copied
              ? <><Check size={12} style={{ color: "#4ade80" }} /><span style={{ color: "#4ade80" }}>Copied</span></>
              : <><Copy size={12} /><span>Copy</span></>}
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;