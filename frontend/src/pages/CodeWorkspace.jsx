import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  Plus, Trash2, Pencil, Check, X, ArrowLeft,
  Download, PanelLeftClose, PanelLeftOpen,
  FolderPlus, FileCode, ChevronDown,
  Eye, EyeOff, Code,Zap, SplitSquareHorizontal,
} from "lucide-react";
import Spinner from "../components/Spinner.jsx";
import FileTree from "../components/code/FileTree.jsx";
import OutputPreview from "../components/code/OutputPreview.jsx";
import CodeAssistant from "../components/code/CodeAssistant.jsx";
import useCreditStore from "../store/creditStore.js";
import api from "../api/axios.js";

// ── Language map for Monaco ───────────────────────────────
const getMonacoLang = (filename) => {
  const ext = filename?.split(".").pop()?.toLowerCase();
  const map = {
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    py: "python", java: "java", cpp: "cpp", c: "c", cs: "csharp",
    go: "go", rs: "rust", php: "php", rb: "ruby", html: "html",
    css: "css", scss: "scss", json: "json", md: "markdown",
    sh: "shell", xml: "xml", yaml: "yaml", yml: "yaml", sql: "sql",
  };
  return map[ext] || "plaintext";
};

// ── New File/Folder Modal ─────────────────────────────────
const NewFileModal = ({ onClose, onCreate, folders }) => {
  const [name, setName] = useState("");
  const [folder, setFolder] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);

  const fullPath = folder ? `${folder}/${name}` : name;

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), folder.trim());
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#252526", border: "1px solid #3e3e42",
        borderRadius: 12, padding: 24, width: 380,
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#cccccc", marginBottom: 18 }}>
          New File
        </h3>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: "#858585", display: "block", marginBottom: 6 }}>
            FILENAME
          </label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") onClose(); }}
            placeholder="App.jsx"
            style={{
              width: "100%", padding: "9px 12px", borderRadius: 6,
              background: "#3c3c3c", border: "1px solid #3e3e42",
              color: "#cccccc", fontSize: 13, outline: "none",
              fontFamily: "monospace",
            }}
            onFocus={e => e.target.style.borderColor = "#007acc"}
            onBlur={e => e.target.style.borderColor = "#3e3e42"}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <button
            onClick={() => setShowFolderInput(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 6, fontSize: 12,
              color: "#858585", background: "none", border: "none", cursor: "pointer",
              padding: 0, marginBottom: showFolderInput ? 8 : 0,
            }}
          >
            <FolderPlus size={13} />
            {showFolderInput ? "Remove folder" : "Place in folder (optional)"}
          </button>

          {showFolderInput && (
            <>
              {folders.length > 0 && (
                <select
                  value={folder}
                  onChange={e => setFolder(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: 6,
                    background: "#3c3c3c", border: "1px solid #3e3e42",
                    color: "#cccccc", fontSize: 13, outline: "none",
                    marginBottom: 6,
                  }}
                >
                  <option value="">Root (no folder)</option>
                  {folders.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              )}
              <input
                value={folder}
                onChange={e => setFolder(e.target.value)}
                placeholder="src/components (or type new folder name)"
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 6,
                  background: "#3c3c3c", border: "1px solid #3e3e42",
                  color: "#cccccc", fontSize: 13, outline: "none",
                  fontFamily: "monospace",
                }}
                onFocus={e => e.target.style.borderColor = "#007acc"}
                onBlur={e => e.target.style.borderColor = "#3e3e42"}
              />
            </>
          )}
        </div>

        {name && (
          <div style={{
            marginBottom: 16, padding: "7px 12px", borderRadius: 6,
            background: "rgba(0,122,204,0.1)", border: "1px solid rgba(0,122,204,0.25)",
          }}>
            <span style={{ fontSize: 11, color: "#858585" }}>Path: </span>
            <span style={{ fontSize: 12, color: "#007acc", fontFamily: "monospace" }}>
              {fullPath}
            </span>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose}
            style={{
              padding: "8px 16px", borderRadius: 6, border: "1px solid #3e3e42",
              background: "transparent", color: "#858585", cursor: "pointer", fontSize: 13,
            }}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!name.trim()}
            style={{
              padding: "8px 18px", borderRadius: 6, border: "none",
              background: name.trim() ? "#007acc" : "#3e3e42",
              color: name.trim() ? "#fff" : "#6e6e6e",
              cursor: name.trim() ? "pointer" : "not-allowed",
              fontSize: 13, fontWeight: 600,
            }}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Projects Sidebar ──────────────────────────────────────
const ProjectsSidebar = ({
  projects, activeId, onSelect, onCreate, onDelete, onRename, meta, loading,creditBalance, subscription
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const limitReached = meta?.limit !== null && projects.length >= (meta?.limit || 2);

  return (
    <div style={{
      width: 200, flexShrink: 0, display: "flex", flexDirection: "column",
      background: "#252526", borderRight: "1px solid #3e3e42", overflow: "hidden",
    }}>
      <div style={{
        padding: "8px 12px", borderBottom: "1px solid #3e3e42",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#858585", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Projects
        </span>
        <button
          onClick={onCreate}
          disabled={limitReached}
          style={{
            width: 22, height: 22, borderRadius: 4, border: "none",
            background: limitReached ? "transparent" : "rgba(255,255,255,0.06)",
            color: limitReached ? "#3e3e42" : "#858585",
            cursor: limitReached ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onMouseEnter={e => { if (!limitReached) e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
          onMouseLeave={e => { if (!limitReached) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
        >
          <Plus size={13} />
        </button>
      </div>

      <div style={{ padding: "4px 8px 4px", borderBottom: "1px solid #3e3e42" }}>
        <span style={{ fontSize: 10, color: limitReached ? "#f87171" : "#6e6e6e" }}>
          {projects.length}/{meta?.limit ?? "∞"} · {meta?.subscription}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
            <Spinner size={16} />
          </div>
        ) : projects.map(p => (
          <div
            key={p._id}
            onClick={() => editingId !== p._id && onSelect(p._id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 10px", cursor: "pointer",
              background: activeId === p._id ? "rgba(0,122,204,0.2)" : "transparent",
              borderLeft: activeId === p._id ? "2px solid #007acc" : "2px solid transparent",
              transition: "all 0.1s",
            }}
            onMouseEnter={e => { if (activeId !== p._id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={e => { if (activeId !== p._id) e.currentTarget.style.background = "transparent"; }}
          >
            <Code size={12} style={{ color: activeId === p._id ? "#007acc" : "#858585", flexShrink: 0 }} />

            {editingId === p._id ? (
              <div style={{ display: "flex", flex: 1, gap: 4 }} onClick={e => e.stopPropagation()}>
                <input
                  autoFocus
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { onRename(p._id, editTitle); setEditingId(null); }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  style={{
                    flex: 1, minWidth: 0, background: "#3c3c3c",
                    border: "1px solid #007acc", borderRadius: 4,
                    color: "#cccccc", fontSize: 12, padding: "2px 6px", outline: "none",
                  }}
                />
                <button onClick={() => { onRename(p._id, editTitle); setEditingId(null); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#4ade80", padding: 2 }}>
                  <Check size={11} />
                </button>
              </div>
            ) : (
              <>
                <span style={{
                  flex: 1, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  color: activeId === p._id ? "#cccccc" : "#858585",
                }}>
                  {p.title}
                </span>
                {activeId === p._id && (
                  <div style={{ display: "flex", gap: 1 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditingId(p._id); setEditTitle(p.title); }}
                      style={{ padding: 2, background: "none", border: "none", cursor: "pointer", color: "#6e6e6e" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#cccccc"}
                      onMouseLeave={e => e.currentTarget.style.color = "#6e6e6e"}>
                      <Pencil size={10} />
                    </button>
                    <button onClick={() => onDelete(p._id)}
                      style={{ padding: 2, background: "none", border: "none", cursor: "pointer", color: "#6e6e6e" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                      onMouseLeave={e => e.currentTarget.style.color = "#6e6e6e"}>
                      <Trash2 size={10} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      <div style={{
        padding: "12px 16px", borderTop: "1px solid #3e3e42", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6e6e6e" }}>
            <Zap size={11} />
            <span>{creditBalance} credits</span>
          </div>
          <span style={{
            fontSize: 10, color: "#6e6e6e", padding: "2px 6px",
            background: "rgba(255,255,255,0.05)", borderRadius: 4, textTransform: "capitalize",
          }}>
            {subscription}
          </span>
        </div>
        <div style={{ height: 2, background: "#2d2d2d", borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            height: "100%", background: creditBalance < 20 ? "#f87171" : "#4ade80",
            width: `${Math.min((creditBalance / (subscription === "pro" ? 1000 : subscription === "enterprise" ? 10000 : 100)) * 100, 100)}%`,
            borderRadius: 999, transition: "width 0.5s",
          }} />
        </div>
        {creditBalance < 10 && (
          <p style={{ fontSize: 10, color: "#f87171", marginTop: 4 }}>⚠️ Low credits</p>
        )}
      </div>
    </div>
  );
};

// ── File Tabs ─────────────────────────────────────────────
const EXT_COLORS = {
  js: "#f7df1e", jsx: "#61dafb", ts: "#3178c6", tsx: "#61dafb",
  py: "#3572a5", java: "#b07219", html: "#e34c26", css: "#563d7c",
  json: "#cbcb41", md: "#083fa1", go: "#00add8", rs: "#dea584",
};

const FileTabs = ({ files, activeFile, onSelect, onClose }) => {
  if (files.length === 0) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", background: "#2d2d2d",
      borderBottom: "1px solid #3e3e42", overflowX: "auto", flexShrink: 0, minHeight: 38,
    }}>
      {files.map(f => {
        const ext = f.name.split(".").pop()?.toLowerCase();
        const color = EXT_COLORS[ext] || "#858585";
        const active = activeFile?.path === f.path || activeFile?.name === f.name;

        return (
          <div
            key={f._id || f.name}
            onClick={() => onSelect(f)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "0 14px", height: 38, cursor: "pointer", flexShrink: 0,
              borderRight: "1px solid #3e3e42",
              background: active ? "#1e1e1e" : "transparent",
              borderBottom: active ? "1px solid #1e1e1e" : "1px solid transparent",
              position: "relative", top: 1,
              transition: "background 0.1s",
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 700, color, lineHeight: 1 }}>
              {ext?.toUpperCase()}
            </span>
            <span style={{ fontSize: 12, color: active ? "#cccccc" : "#858585", whiteSpace: "nowrap" }}>
              {f.name}
            </span>
            <button
              onClick={e => { e.stopPropagation(); onClose(f); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#6e6e6e", padding: 1, display: "flex", borderRadius: 2,
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
              onMouseLeave={e => e.currentTarget.style.color = "#6e6e6e"}
            >
              <X size={11} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ── Main CodeWorkspace ────────────────────────────────────
const CodeWorkspace = () => {
  const navigate = useNavigate();
  const { fetchBalance, creditBalance, subscription } = useCreditStore();

  const [projects, setProjects] = useState([]);
  const [projectsMeta, setProjectsMeta] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingProject, setLoadingProject] = useState(false);
  const [error, setError] = useState(null);
  const [showNewFile, setShowNewFile] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Layout states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState("editor"); // mobile

  const saveTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const { data } = await api.get("/code/projects");
      setProjects(data.data);
      setProjectsMeta(data.meta);
    } catch {}
    finally { setLoadingProjects(false); }
  };

  const handleSelectProject = async (id) => {
    setLoadingProject(true);
    setActiveFile(null);
    setOpenTabs([]);
    setMessages([]);
    try {
      const { data } = await api.get(`/code/projects/${id}`);
      const project = data.data;
      setActiveProject(project);
      setMessages(project.messages || []);
      if (project.files?.length > 0) {
        setActiveFile(project.files[0]);
        setOpenTabs([project.files[0]]);
      }
    } catch {}
    finally { setLoadingProject(false); }
  };

  const handleCreateProject = async () => {
    try {
      const { data } = await api.post("/code/projects", { title: "New Project" });
      setProjects(prev => [data.data, ...prev]);
      await handleSelectProject(data.data._id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project.");
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Delete this project and all its files?")) return;
    try {
      await api.delete(`/code/projects/${id}`);
      setProjects(prev => prev.filter(p => p._id !== id));
      if (activeProject?._id === id) {
        setActiveProject(null);
        setActiveFile(null);
        setOpenTabs([]);
        setMessages([]);
      }
    } catch {}
  };

  const handleRenameProject = async (id, title) => {
    try {
      await api.patch(`/code/projects/${id}/rename`, { title });
      setProjects(prev => prev.map(p => p._id === id ? { ...p, title } : p));
      if (activeProject?._id === id) setActiveProject(prev => ({ ...prev, title }));
    } catch {}
  };

  // Get existing folders from file paths
  const getExistingFolders = () => {
    const folders = new Set();
    (activeProject?.files || []).forEach(f => {
      const parts = (f.path || f.name).split("/");
      if (parts.length > 1) {
        for (let i = 1; i < parts.length; i++) {
          folders.add(parts.slice(0, i).join("/"));
        }
      }
    });
    return [...folders];
  };

  const handleCreateFile = async (name, folder) => {
    if (!activeProject) return;
    const fullPath = folder ? `${folder}/${name}` : name;
    try {
      const { data } = await api.post(`/code/projects/${activeProject._id}/files`, {
        name, content: "", path: fullPath,
      });
      const newFile = data.data.find(f => (f.path || f.name) === fullPath);
      setActiveProject(prev => ({ ...prev, files: data.data }));
      if (newFile) {
        setActiveFile(newFile);
        setOpenTabs(prev => {
          const exists = prev.find(f => (f.path || f.name) === (newFile.path || newFile.name));
          return exists ? prev : [...prev, newFile];
        });
      }
    } catch {}
  };

  const handleDeleteFile = async (file) => {
    if (!activeProject || !window.confirm(`Delete ${file.name}?`)) return;
    try {
      const { data } = await api.delete(`/code/projects/${activeProject._id}/files/${file._id}`);
      setActiveProject(prev => ({ ...prev, files: data.data }));
      setOpenTabs(prev => prev.filter(f => f.name !== file.name));
      if (activeFile?.name === file.name) {
        const remaining = openTabs.filter(f => f.name !== file.name);
        setActiveFile(remaining[0] || null);
      }
    } catch {}
  };

  const handleSelectFile = (file) => {
    setActiveFile(file);
    setOpenTabs(prev => {
      const exists = prev.find(f => (f.path || f.name) === (file.path || file.name));
      return exists ? prev : [...prev, file];
    });
  };

  const handleCloseTab = (file) => {
    const newTabs = openTabs.filter(f => (f.path || f.name) !== (file.path || file.name));
    setOpenTabs(newTabs);
    if (activeFile?.name === file.name) {
      setActiveFile(newTabs[newTabs.length - 1] || null);
    }
  };

  const handleUploadFile = async (file) => {
    if (!file || !activeProject) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post(`/code/projects/${activeProject._id}/upload`, fd);
      setActiveProject(prev => ({ ...prev, files: data.data }));
      const uploaded = data.data.find(f => f.name === file.name);
      if (uploaded) {
        setActiveFile(uploaded);
        setOpenTabs(prev => [...prev.filter(f => f.name !== uploaded.name), uploaded]);
      }
      fetchBalance();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed.");
    } finally { setUploading(false); }
  };

  // Auto-save with debounce
  const handleEditorChange = useCallback((content) => {
    if (!activeFile || !activeProject) return;

    const updatedFile = { ...activeFile, content };
    setActiveFile(updatedFile);
    setActiveProject(prev => ({
      ...prev,
      files: prev.files.map(f =>
        (f.path || f.name) === (activeFile.path || activeFile.name)
          ? { ...f, content }
          : f
      ),
    }));
    setOpenTabs(prev => prev.map(f =>
      (f.path || f.name) === (activeFile.path || activeFile.name)
        ? { ...f, content }
        : f
    ));

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await api.post(`/code/projects/${activeProject._id}/files`, {
          name: activeFile.name,
          content,
          path: activeFile.path || activeFile.name,
          language: activeFile.language,
        });
      } catch {}
    }, 1000);
  }, [activeFile, activeProject]);

  const handleSendMessage = async (message) => {
    const userMsg = { role: "user", content: message };
    setMessages(prev => [...prev, userMsg]);

    const { data } = await api.post(`/code/projects/${activeProject._id}/message`, {
      message,
      includeFiles: true,
    });

    const aiMsg = { role: "assistant", content: data.data.answer };
    setMessages(prev => [...prev, aiMsg]);
    fetchBalance();
  };

  const handleClearMessages = async () => {
    if (!activeProject || !window.confirm("Clear chat history?")) return;
    try {
      await api.delete(`/code/projects/${activeProject._id}/messages`);
      setMessages([]);
    } catch {}
  };

  // Apply AI code to a file
  const handleApplyCode = async (file, code) => {
    if (!activeProject) return;
    try {
      await api.post(`/code/projects/${activeProject._id}/files`, {
        name: file.name,
        content: code,
        path: file.path || file.name,
        language: file.language,
      });

      const updatedFile = { ...file, content: code };
      setActiveProject(prev => ({
        ...prev,
        files: prev.files.map(f =>
          (f.path || f.name) === (file.path || file.name) ? updatedFile : f
        ),
      }));

      // Switch to that file
      setActiveFile(updatedFile);
      setOpenTabs(prev => {
        const exists = prev.find(f => (f.path || f.name) === (file.path || file.name));
        return exists
          ? prev.map(f => (f.path || f.name) === (file.path || file.name) ? updatedFile : f)
          : [...prev, updatedFile];
      });
    } catch {}
  };

  // Download ZIP
  const handleDownloadZip = async () => {
    if (!activeProject?.files?.length) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    activeProject.files.forEach(file => {
      zip.file(file.path || file.name, file.content || "");
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeProject.title.replace(/\s+/g, "-")}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: "#1e1e1e", color: "#cccccc",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{
        display: "none",
        position: "fixed", inset: 0, zIndex: 200,
        background: "#0a0a0a", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: 32, textAlign: "center",
      }} className="code-mobile-warning">
        <div style={{ fontSize: 48, marginBottom: 20 }}>💻</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
          Desktop Required
        </h2>
        <p style={{ fontSize: 15, color: "#71717a", lineHeight: 1.7, maxWidth: 300, marginBottom: 28 }}>
          The Code Workspace is a complex IDE-like environment best experienced on a desktop or laptop.
        </p>
        <button onClick={() => navigate("/chat")}
          style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: "#fff", color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Go to Chat
        </button>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .code-mobile-warning { display: flex !important; }
        }
      `}</style>
      {showNewFile && (
        <NewFileModal
          onClose={() => setShowNewFile(false)}
          onCreate={handleCreateFile}
          folders={getExistingFolders()}
        />
      )}

      {/* Projects sidebar */}
      <ProjectsSidebar
        projects={projects}
        activeId={activeProject?._id}
        onSelect={handleSelectProject}
        onCreate={handleCreateProject}
        onDelete={handleDeleteProject}
        onRename={handleRenameProject}
        meta={projectsMeta}
        loading={loadingProjects}
        creditBalance={creditBalance}
        subscription={subscription}
      />

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Activity bar / top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 14px", height: 42, flexShrink: 0,
          background: "#333333", borderBottom: "1px solid #3e3e42",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate("/chat")}
              style={{
                display: "flex", alignItems: "center", gap: 5, background: "none",
                border: "none", cursor: "pointer", color: "#858585", fontSize: 12,
                padding: "3px 6px", borderRadius: 4,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#cccccc"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#858585"; }}
            >
              <ArrowLeft size={13} /> Chat
            </button>

            {activeProject && (
              <>
                <span style={{ color: "#3e3e42" }}>›</span>
                <span style={{ fontSize: 13, color: "#cccccc", fontWeight: 500 }}>
                  {activeProject.title}
                </span>
                {uploading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#858585" }}>
                    <Spinner size={11} /> Uploading...
                  </div>
                )}
              </>
            )}
          </div>

          {activeProject && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* File actions */}
              <button
                onClick={() => setShowNewFile(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
                  borderRadius: 5, border: "1px solid #3e3e42", background: "transparent",
                  color: "#858585", cursor: "pointer", fontSize: 12, transition: "all 0.12s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#cccccc"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#858585"; }}
              >
                <Plus size={12} /> New File
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
                  borderRadius: 5, border: "1px solid #3e3e42", background: "transparent",
                  color: "#858585", cursor: "pointer", fontSize: 12, transition: "all 0.12s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#cccccc"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#858585"; }}
              >
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.cs,.go,.rs,.php,.rb,.html,.css,.json,.md,.txt,.sh,.xml,.yaml,.yml,.sql"
                onChange={e => { handleUploadFile(e.target.files[0]); e.target.value = ""; }}
              />

              {/* Toggle preview */}
              <button
                onClick={() => setShowPreview(p => !p)}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
                  borderRadius: 5, border: "1px solid #3e3e42",
                  background: showPreview ? "rgba(0,122,204,0.15)" : "transparent",
                  color: showPreview ? "#007acc" : "#858585",
                  cursor: "pointer", fontSize: 12, transition: "all 0.12s",
                }}
              >
                {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                Preview
              </button>

              {/* Download ZIP */}
              <button
                onClick={handleDownloadZip}
                disabled={!activeProject?.files?.length}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
                  borderRadius: 5, border: "1px solid #3e3e42", background: "transparent",
                  color: "#858585", cursor: "pointer", fontSize: 12, transition: "all 0.12s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#cccccc"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#858585"; }}
              >
                <Download size={12} /> Download ZIP
              </button>
            </div>
          )}
        </div>

        {!activeProject ? (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, marginBottom: 20,
              background: "rgba(255,255,255,0.03)", border: "1px solid #3e3e42",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Code size={30} style={{ color: "#3e3e42" }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#858585", marginBottom: 8 }}>
              No project selected
            </h2>
            <p style={{ fontSize: 13, color: "#6e6e6e", marginBottom: 24, maxWidth: 300, lineHeight: 1.6 }}>
              Select a project from the sidebar or create a new one to start coding.
            </p>
            <button
              onClick={handleCreateProject}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 20px",
                borderRadius: 8, border: "none", background: "#007acc",
                color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600,
              }}
            >
              <Plus size={15} /> New Project
            </button>
          </div>
        ) : loadingProject ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Spinner size={24} />
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* File Explorer sidebar (collapsible) */}
            <div style={{
              width: sidebarCollapsed ? 0 : 220,
              flexShrink: 0, transition: "width 0.2s",
              overflow: "hidden", display: "flex", flexDirection: "column",
              background: "#252526", borderRight: sidebarCollapsed ? "none" : "1px solid #3e3e42",
            }}>
              <div style={{
                padding: "7px 10px", borderBottom: "1px solid #3e3e42",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#858585", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Explorer
                </span>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#6e6e6e", padding: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = "#cccccc"}
                  onMouseLeave={e => e.currentTarget.style.color = "#6e6e6e"}
                >
                  <PanelLeftClose size={13} />
                </button>
              </div>

              <FileTree
                files={activeProject.files || []}
                activeFile={activeFile}
                onSelect={handleSelectFile}
                onDelete={handleDeleteFile}
                onNewFile={(folderPath) => setShowNewFile(true)}
              />
            </div>

            {/* Collapsed sidebar toggle */}
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                style={{
                  width: 22, flexShrink: 0, border: "none", borderRight: "1px solid #3e3e42",
                  background: "#252526", color: "#6e6e6e", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#2d2d2d"; e.currentTarget.style.color = "#cccccc"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#252526"; e.currentTarget.style.color = "#6e6e6e"; }}
                title="Show Explorer"
              >
                <PanelLeftOpen size={13} />
              </button>
            )}

            {/* Editor + Preview */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
              {/* File tabs */}
              <FileTabs
                files={openTabs}
                activeFile={activeFile}
                onSelect={handleSelectFile}
                onClose={handleCloseTab}
              />

              {/* Editor area */}
              <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {activeFile ? (
                  <>
                    {/* Monaco Editor */}
                    <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
                      <Editor
                        height="100%"
                        language={getMonacoLang(activeFile.name)}
                        value={activeFile.content || ""}
                        theme="vs-dark"
                        onChange={handleEditorChange}
                        options={{
                          minimap: { enabled: openTabs.length > 1 },
                          fontSize: 14,
                          fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
                          fontLigatures: true,
                          lineHeight: 22,
                          padding: { top: 12 },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          wordWrap: "on",
                          quickSuggestions: { other: true, comments: true, strings: true },
                          suggestOnTriggerCharacters: true,
                          acceptSuggestionOnEnter: "on",
                          formatOnType: true,
                          formatOnPaste: true,
                          bracketPairColorization: { enabled: true },
                          smoothScrolling: true,
                          cursorBlinking: "smooth",
                          cursorSmoothCaretAnimation: "on",
                          renderLineHighlight: "gutter",
                          scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                        }}
                      />
                    </div>

                    {/* Preview panel */}
                    {showPreview && (
                      <div style={{
                        width: "42%", flexShrink: 0,
                        borderLeft: "1px solid #3e3e42",
                        display: "flex", flexDirection: "column", overflow: "hidden",
                      }}>
                        <OutputPreview
                          files={activeProject.files || []}
                          activeFile={activeFile}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    padding: 32, textAlign: "center",
                  }}>
                    <FileCode size={36} style={{ color: "#3e3e42", marginBottom: 16 }} />
                    <p style={{ fontSize: 13, color: "#6e6e6e", marginBottom: 20 }}>
                      No file open
                    </p>
                    <button
                      onClick={() => setShowNewFile(true)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
                        borderRadius: 6, border: "1px solid #3e3e42", background: "transparent",
                        color: "#858585", cursor: "pointer", fontSize: 12,
                      }}
                    >
                      <Plus size={13} /> Create file
                    </button>
                  </div>
                )}
              </div>

              {/* Status bar — VS Code style */}
              <div style={{
                height: 22, flexShrink: 0,
                background: "#007acc",
                display: "flex", alignItems: "center",
                padding: "0 12px", gap: 16,
              }}>
                {activeFile && (
                  <>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
                      {getMonacoLang(activeFile.name).toUpperCase()}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                      {activeFile.path || activeFile.name}
                    </span>
                  </>
                )}
                <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                  Auto-save enabled · {activeProject.files?.length || 0} files
                </span>
              </div>
            </div>

            {/* AI Assistant */}
            <CodeAssistant
              projectId={activeProject._id}
              messages={messages}
              files={activeProject.files || []}
              onSend={handleSendMessage}
              onClear={handleClearMessages}
              onApplyCode={handleApplyCode}
            />
          </div>
        )}
      </div>

      {error && (
        <div style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 100,
          padding: "12px 16px", borderRadius: 8, fontSize: 13,
          background: "#252526", border: "1px solid rgba(239,68,68,0.3)",
          color: "#f87171", maxWidth: 320, boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{ marginLeft: 12, background: "none", border: "none", cursor: "pointer", color: "#f87171" }}
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CodeWorkspace;