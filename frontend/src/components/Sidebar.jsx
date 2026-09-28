import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, MessageSquare, Trash2, Pencil,
  Check, X, LogOut, Zap, Code, Menu,
} from "lucide-react";
import useAuthStore from "../store/authStore.js";
import useCreditStore from "../store/creditStore.js";
import useChatStore from "../store/chatStore.js";
import { CreditCard } from "lucide-react";

const s = {
  sidebar: {
    display: "flex", flexDirection: "column", height: "100%",
    background: "#111111",
    borderRight: "1px solid rgba(255,255,255,0.06)",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 16px", height: 56, flexShrink: 0,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  logo: {
    display: "flex", alignItems: "center", gap: 10,
  },
  logoIcon: {
    width: 28, height: 28, background: "#ffffff", borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  logoText: {
    fontSize: 14, fontWeight: 600, color: "#ffffff",
  },
  navArea: {
    padding: "12px 12px 8px", flexShrink: 0,
  },
  newChatBtn: {
    width: "100%", display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", borderRadius: 10, cursor: "pointer",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#e4e4e7", fontSize: 14, fontWeight: 500,
    transition: "all 0.15s", marginBottom: 4,
  },
  codeBtn: {
    width: "100%", display: "flex", alignItems: "center", gap: 10,
    padding: "8px 14px", borderRadius: 10, cursor: "pointer",
    background: "transparent", border: "none",
    color: "#71717a", fontSize: 13,
    transition: "all 0.15s",
  },
  divider: {
    margin: "0 16px", height: 1,
    background: "rgba(255,255,255,0.05)", flexShrink: 0,
  },
  convList: {
    flex: 1, overflowY: "auto", padding: "12px",
  },
  sectionLabel: {
    fontSize: 10, fontWeight: 700, color: "#3f3f46",
    textTransform: "uppercase", letterSpacing: "0.08em",
    padding: "0 8px", marginBottom: 6,
  },
  bottom: {
    padding: "12px", flexShrink: 0,
    borderTop: "1px solid rgba(255,255,255,0.06)",
    display: "flex", flexDirection: "column", gap: 12,
  },
  creditsRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 6,
  },
  creditsLeft: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 12, color: "#52525b",
  },
  planBadge: {
    fontSize: 10, color: "#52525b", padding: "2px 8px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 999, textTransform: "capitalize",
  },
  creditBar: {
    width: "100%", height: 2, borderRadius: 999,
    background: "#1f1f1f", overflow: "hidden",
  },
  userRow: {
    display: "flex", alignItems: "center", gap: 10,
  },
  avatar: {
    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700, color: "#e4e4e7",
    overflow: "hidden",
  },
  userName: { fontSize: 13, fontWeight: 500, color: "#ffffff" },
  userEmail: { fontSize: 11, color: "#52525b", marginTop: 1 },
};

const ConversationItem = ({ conv, active, onSelect, onDelete, onRename }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(conv.title);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const save = () => {
    if (title.trim()) onRename(conv._id, title.trim());
    setEditing(false);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => !editing && onSelect(conv)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 10px", borderRadius: 8, cursor: "pointer",
        background: active ? "rgba(255,255,255,0.08)" : hovered ? "rgba(255,255,255,0.04)" : "transparent",
        transition: "background 0.15s", marginBottom: 1,
      }}
    >
      <MessageSquare size={13} style={{ color: active ? "#a1a1aa" : "#52525b", flexShrink: 0 }} />

      {editing ? (
        <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}
          onClick={e => e.stopPropagation()}>
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
            style={{
              flex: 1, minWidth: 0, background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6,
              color: "#fff", fontSize: 12, padding: "2px 8px", outline: "none",
            }}
          />
          <button onClick={save} style={{ color: "#4ade80", padding: 2, background: "none", border: "none", cursor: "pointer" }}>
            <Check size={12} />
          </button>
          <button onClick={() => setEditing(false)} style={{ color: "#71717a", padding: 2, background: "none", border: "none", cursor: "pointer" }}>
            <X size={12} />
          </button>
        </div>
      ) : (
        <>
          <span style={{
            flex: 1, fontSize: 13, color: active ? "#e4e4e7" : "#a1a1aa",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {conv.title || "New Chat"}
          </span>
          {(hovered || active) && (
            <div style={{ display: "flex", gap: 2, flexShrink: 0 }}
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setEditing(true)}
                style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#52525b", borderRadius: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = "#a1a1aa"}
                onMouseLeave={e => e.currentTarget.style.color = "#52525b"}
              >
                <Pencil size={11} />
              </button>
              <button onClick={() => onDelete(conv._id)}
                style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#52525b", borderRadius: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                onMouseLeave={e => e.currentTarget.style.color = "#52525b"}
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const SidebarContent = ({ onCloseMobile }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { creditBalance, subscription, fetchBalance } = useCreditStore();
  const {
    conversations, activeConversation,
    fetchConversations, loadConversation,
    createConversation, deleteConversation, renameConversation,
  } = useChatStore();

  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    fetchConversations();
    fetchBalance();
  }, []);

  const handleNew = async () => {
    const conv = await createConversation();
    if (conv) onCloseMobile?.();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const totalCredits = subscription === "pro" ? 1000 : subscription === "enterprise" ? 10000 : 100;
  const pct = Math.min((creditBalance / totalCredits) * 100, 100);

  const today = conversations.filter(c =>
    new Date(c.updatedAt).toDateString() === new Date().toDateString()
  );
  const older = conversations.filter(c =>
    new Date(c.updatedAt).toDateString() !== new Date().toDateString()
  );

  return (
    <div style={s.sidebar}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>
          <div style={s.logoIcon}>
            <span style={{ color: "#000", fontWeight: 900, fontSize: 12 }}>N</span>
          </div>
          <span style={s.logoText}>Nexora V2</span>
        </div>
        {onCloseMobile && (
          <button onClick={onCloseMobile}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#71717a", padding: 4 }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <div style={s.navArea}>
        <button
          onClick={handleNew}
          style={s.newChatBtn}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.11)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
        >
          <Plus size={15} />
          New chat
        </button>
        <button
          onClick={() => { navigate("/code"); onCloseMobile?.(); }}
          style={s.codeBtn}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#a1a1aa"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#71717a"; }}
        >
          <Code size={13} />
          Code Workspace
        </button>
        <button
          onClick={() => { navigate("/subscription"); onCloseMobile?.(); }}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "8px 14px", borderRadius: 10, cursor: "pointer",
            background: "transparent", border: "none",
            color: "#71717a", fontSize: 13, transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#a1a1aa"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#71717a"; }}
        >
          <CreditCard size={13} />
          Subscription
        </button>
      </div>

      <div style={s.divider} />

      {/* Conversations */}
      <div style={s.convList}>
        {conversations.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ fontSize: 13, color: "#3f3f46" }}>No conversations yet</p>
            <p style={{ fontSize: 12, color: "#27272a", marginTop: 4 }}>Start chatting above</p>
          </div>
        )}

        {today.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={s.sectionLabel}>Today</p>
            {today.map(conv => (
              <ConversationItem key={conv._id} conv={conv}
                active={activeConversation?._id === conv._id}
                onSelect={c => { loadConversation(c._id); onCloseMobile?.(); }}
                onDelete={deleteConversation} onRename={renameConversation}
              />
            ))}
          </div>
        )}

        {older.length > 0 && (
          <div>
            <p style={s.sectionLabel}>Previous</p>
            {older.map(conv => (
              <ConversationItem key={conv._id} conv={conv}
                active={activeConversation?._id === conv._id}
                onSelect={c => { loadConversation(c._id); onCloseMobile?.(); }}
                onDelete={deleteConversation} onRename={renameConversation}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div style={s.bottom}>
        {/* Credits */}
        <div>
          <div style={s.creditsRow}>
            <div style={s.creditsLeft}>
              <Zap size={11} />
              <span>{creditBalance} credits</span>
            </div>
            <span style={s.planBadge}>{subscription}</span>
          </div>
          <div style={s.creditBar}>
            <div style={{
              height: "100%", borderRadius: 999,
              background: "rgba(255,255,255,0.35)",
              width: `${pct}%`, transition: "width 0.6s",
            }} />
          </div>
        </div>

        {/* User */}
        <div style={s.userRow}>
          <div
            onClick={() => navigate("/profile")}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
              borderRadius: 8, cursor: "pointer", transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={s.avatar}>
              {user?.avatar
                ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              {user?.name && <div style={s.userName}>{user.name}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ mobileOpen, onCloseMobile }) => (
  <>
    <button
      onClick={onCloseMobile}
      style={{
        display: "none", position: "fixed", top: 14, left: 14, zIndex: 50,
        padding: "8px", background: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
        color: "#71717a", cursor: "pointer",
      }}
      className="lg:!hidden"
    >
      <Menu size={16} />
    </button>

    {mobileOpen && (
      <div
        onClick={onCloseMobile}
        style={{
          position: "fixed", inset: 0, zIndex: 40,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
        }}
        className="lg:hidden"
      />
    )}

    {/* Mobile drawer */}
    <div
      className="lg:hidden"
      style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        width: 280, zIndex: 50,
        transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <SidebarContent onCloseMobile={onCloseMobile} />
    </div>

    {/* Desktop */}
    <div
      className="hidden lg:block"
      style={{ width: 260, flexShrink: 0 }}
    >
      <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 260, zIndex: 30 }}>
        <SidebarContent />
      </div>
    </div>
  </>
);

export default Sidebar;