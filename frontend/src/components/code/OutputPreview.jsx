import { useState, useMemo } from "react";
import { RefreshCw, Monitor, FileJson, FileText, Terminal } from "lucide-react";
import MarkdownRenderer from "../MarkdownRenderer.jsx";

const buildWebPreview = (files) => {
  const find = ext => files.find(f => (f.path || f.name).endsWith(ext));
  const findAll = ext => files.filter(f => (f.path || f.name).endsWith(ext));

  const htmlFile = find(".html");
  const cssFiles = findAll(".css");
  const jsFiles = findAll(".js").filter(f =>
    !f.name.includes(".test.") && !f.name.includes(".spec.")
  );

  const cssContent = cssFiles.map(f => f.content).filter(Boolean).join("\n");
  const jsContent = jsFiles.map(f => f.content).filter(Boolean).join("\n");

  if (!htmlFile && !cssContent && !jsContent) return null;

  if (htmlFile) {
    let html = htmlFile.content || "";
    if (cssContent && !html.includes("<style>")) {
      html = html.replace("</head>", `<style>${cssContent}</style></head>`);
    }
    if (jsContent && !html.includes("<script>")) {
      html = html.replace("</body>", `<script>${jsContent}</script></body>`);
    }
    return html;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
* { box-sizing: border-box; }
body { font-family: -apple-system, sans-serif; margin: 0; padding: 16px; background: #fff; color: #333; }
${cssContent}
</style>
</head>
<body>
<script>
try {
${jsContent}
} catch(e) {
document.body.innerHTML += '<pre style="color:red;background:#fee;padding:8px;border-radius:4px;">Error: ' + e.message + '</pre>';
}
</script>
</body>
</html>`;
};

const OutputPreview = ({ files, activeFile }) => {
  const [refresh, setRefresh] = useState(0);

  const activeExt = activeFile?.name?.split(".").pop()?.toLowerCase();
  const isWeb = ["html", "css", "js"].includes(activeExt);
  const isJson = activeExt === "json";
  const isMd = activeExt === "md" || activeExt === "markdown";
  const hasWebFiles = files.some(f => {
    const ext = (f.path || f.name).split(".").pop();
    return ["html", "css", "js"].includes(ext);
  });

  const webHtml = useMemo(() => buildWebPreview(files), [files, refresh]);

  // Parsed JSON
  let parsedJson = null;
  if (isJson && activeFile?.content) {
    try {
      parsedJson = JSON.parse(activeFile.content);
    } catch {}
  }

  if (hasWebFiles && webHtml) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 14px", background: "#2d2d2d", borderBottom: "1px solid #3e3e42",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Monitor size={13} style={{ color: "#858585" }} />
            <span style={{ fontSize: 12, color: "#858585" }}>Preview</span>
          </div>
          <button
            onClick={() => setRefresh(r => r + 1)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#858585", padding: 4, display: "flex", borderRadius: 4,
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#cccccc"}
            onMouseLeave={e => e.currentTarget.style.color = "#858585"}
            title="Refresh preview"
          >
            <RefreshCw size={13} />
          </button>
        </div>
        <iframe
          key={refresh}
          srcDoc={webHtml}
          sandbox="allow-scripts allow-same-origin"
          style={{ flex: 1, border: "none", background: "#fff" }}
          title="preview"
        />
      </div>
    );
  }

  if (isJson && activeFile?.content) {
    return (
      <div style={{ flex: 1, overflow: "auto", background: "#1e1e1e", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <FileJson size={13} style={{ color: "#cbcb41" }} />
          <span style={{ fontSize: 12, color: "#858585" }}>JSON Preview</span>
        </div>
        {parsedJson ? (
          <pre style={{
            margin: 0, fontSize: 12, fontFamily: '"JetBrains Mono", monospace',
            color: "#d4d4d4", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-all",
          }}>
            {JSON.stringify(parsedJson, null, 2)}
          </pre>
        ) : (
          <p style={{ fontSize: 13, color: "#f87171" }}>Invalid JSON</p>
        )}
      </div>
    );
  }

  if (isMd && activeFile?.content) {
    return (
      <div style={{
        flex: 1, overflow: "auto", background: "#1e1e1e",
        padding: "20px 28px", color: "#cccccc",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          <FileText size={13} style={{ color: "#083fa1" }} />
          <span style={{ fontSize: 12, color: "#858585" }}>Markdown Preview</span>
        </div>
        <MarkdownRenderer content={activeFile.content} />
      </div>
    );
  }

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#1e1e1e", padding: 32, textAlign: "center",
    }}>
      <Terminal size={32} style={{ color: "#3e3e42", marginBottom: 16 }} />
      <p style={{ fontSize: 14, color: "#858585", marginBottom: 8 }}>
        Output preview not available
      </p>
      <p style={{ fontSize: 12, color: "#3e3e42", maxWidth: 280, lineHeight: 1.6 }}>
        {activeFile
          ? `${activeFile.name} cannot be previewed in browser. Run it in your local terminal.`
          : "Select a file to preview. HTML/CSS/JS files show live preview."}
      </p>
      {activeFile?.content && (
        <button
          onClick={() => navigator.clipboard.writeText(activeFile.content)}
          style={{
            marginTop: 16, padding: "7px 16px", borderRadius: 6, border: "1px solid #3e3e42",
            background: "transparent", color: "#858585", cursor: "pointer", fontSize: 12,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#6e6e6e"; e.currentTarget.style.color = "#cccccc"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#3e3e42"; e.currentTarget.style.color = "#858585"; }}
        >
          Copy to clipboard
        </button>
      )}
    </div>
  );
};

export default OutputPreview;