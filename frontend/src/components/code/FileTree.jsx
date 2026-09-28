import { useState } from "react";
import {
  ChevronRight, ChevronDown, FileCode, Folder,
  FolderOpen, Plus, Trash2, Upload,
} from "lucide-react";

const EXT_COLORS = {
  js: "#f7df1e", jsx: "#61dafb", ts: "#3178c6", tsx: "#61dafb",
  py: "#3572a5", java: "#b07219", html: "#e34c26", css: "#563d7c",
  json: "#cbcb41", md: "#083fa1", go: "#00add8", rs: "#dea584",
  rb: "#701516", php: "#4f5d95", sh: "#89e051", cs: "#178600",
  cpp: "#f34b7d", c: "#555555", xml: "#0060ac",
};

const getExtColor = name => {
  const ext = name?.split(".").pop()?.toLowerCase();
  return EXT_COLORS[ext] || "#858585";
};

const buildTree = (files) => {
  const root = { __files: [], __folders: {} };

  files.forEach(file => {
    const path = file.path || file.name;
    const parts = path.split("/");

    if (parts.length === 1) {
      root.__files.push(file);
    } else {
      let node = root;
      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i];
        if (!node.__folders[folderName]) {
          node.__folders[folderName] = { __files: [], __folders: {} };
        }
        node = node.__folders[folderName];
      }
      node.__files.push(file);
    }
  });

  return root;
};

const FolderNode = ({ name, node, depth, activeFile, onSelect, onDelete, onNewFile, prefix }) => {
  const [open, setOpen] = useState(depth === 0);
  const folderPath = prefix ? `${prefix}/${name}` : name;

  return (
    <div>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: `5px ${8 + depth * 14}px`,
          cursor: "pointer", userSelect: "none",
          transition: "background 0.1s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        {open
          ? <ChevronDown size={12} style={{ color: "#858585", flexShrink: 0 }} />
          : <ChevronRight size={12} style={{ color: "#858585", flexShrink: 0 }} />}
        {open
          ? <FolderOpen size={14} style={{ color: "#dcb67a", flexShrink: 0 }} />
          : <Folder size={14} style={{ color: "#dcb67a", flexShrink: 0 }} />}
        <span style={{ fontSize: 13, color: "#cccccc", flex: 1 }}>{name}</span>
        <button
          onClick={e => { e.stopPropagation(); onNewFile(folderPath); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#858585", padding: 2, display: "flex", opacity: 0,
          }}
          className="folder-action"
          onMouseEnter={e => e.currentTarget.style.color = "#cccccc"}
          onMouseLeave={e => e.currentTarget.style.color = "#858585"}
        >
          <Plus size={12} />
        </button>
      </div>

      {open && (
        <div>
          {Object.entries(node.__folders).map(([childName, childNode]) => (
            <FolderNode
              key={childName}
              name={childName}
              node={childNode}
              depth={depth + 1}
              activeFile={activeFile}
              onSelect={onSelect}
              onDelete={onDelete}
              onNewFile={onNewFile}
              prefix={folderPath}
            />
          ))}
          {node.__files.map(file => (
            <FileNode
              key={file._id || file.name}
              file={file}
              depth={depth + 1}
              active={activeFile?.path === file.path || activeFile?.name === file.name}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileNode = ({ file, depth, active, onSelect, onDelete }) => {
  const [hovered, setHovered] = useState(false);
  const color = getExtColor(file.name);

  return (
    <div
      onClick={() => onSelect(file)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: `5px ${8 + depth * 14}px`,
        cursor: "pointer",
        background: active ? "rgba(0,122,204,0.18)" : hovered ? "rgba(255,255,255,0.04)" : "transparent",
        borderLeft: active ? "2px solid #007acc" : "2px solid transparent",
        transition: "all 0.1s",
      }}
    >
      <FileCode size={13} style={{ color, flexShrink: 0 }} />
      <span style={{
        fontSize: 13, flex: 1, overflow: "hidden",
        textOverflow: "ellipsis", whiteSpace: "nowrap",
        color: active ? "#ffffff" : "#cccccc",
      }}>
        {file.name}
      </span>
      {hovered && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(file); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#858585", padding: 2, display: "flex", flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
          onMouseLeave={e => e.currentTarget.style.color = "#858585"}
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
};

const FileTree = ({ files, activeFile, onSelect, onDelete, onNewFile, onUpload }) => {
  const tree = buildTree(files);
  const uploadRef = { current: null };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <style>{`
        .folder-action { opacity: 0 !important; }
        div:hover > .folder-action { opacity: 1 !important; }
      `}</style>

      {/* Root-level folders */}
      {Object.entries(tree.__folders).map(([name, node]) => (
        <FolderNode
          key={name}
          name={name}
          node={node}
          depth={0}
          activeFile={activeFile}
          onSelect={onSelect}
          onDelete={onDelete}
          onNewFile={onNewFile}
          prefix=""
        />
      ))}

      {/* Root-level files */}
      {tree.__files.map(file => (
        <FileNode
          key={file._id || file.name}
          file={file}
          depth={0}
          active={activeFile?.path === file.path || activeFile?.name === file.name}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}

      {files.length === 0 && (
        <div style={{ padding: "24px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#858585", lineHeight: 1.6 }}>
            No files yet.<br />Create or upload a file.
          </p>
        </div>
      )}
    </div>
  );
};

export default FileTree;