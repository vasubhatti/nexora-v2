import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Terminal } from "lucide-react";

const detect = (code) => {
  if (!code) return "text";
  if (code.includes("import ") && code.includes("from ")) return "javascript";
  if (code.includes("def ") && code.includes(":")) return "python";
  if (code.includes("public class")) return "java";
  if (code.includes("func ") && code.includes("fmt.")) return "go";
  if (code.includes("SELECT ") || code.includes("FROM ")) return "sql";
  if (code.includes("<?php")) return "php";
  if (code.includes("<html") || code.includes("</div>")) return "html";
  if (code.includes("{") && code.includes("margin")) return "css";
  return "javascript";
};

const isCompact = (code) => {
  const lines = code.trim().split("\n").length;
  const hasStructure =
    code.includes("import ") || code.includes("function ") ||
    code.includes("class ") || code.includes("export ") ||
    code.includes("def ") || code.includes("public ");
  return lines <= 5 && !hasStructure;
};

const CodeBlock = ({ code, language, filename }) => {
  const [copied, setCopied] = useState(false);
  const lang = language || detect(code);
  const codeStr = String(code).replace(/\n$/, "");
  const compact = isCompact(codeStr);

  const copy = () => {
    navigator.clipboard.writeText(codeStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const CopyBtn = () => (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
    >
      {copied
        ? <><Check size={11} className="text-green-400" /><span className="text-green-400">Copied</span></>
        : <><Copy size={11} /><span>Copy</span></>}
    </button>
  );

  if (compact) {
    return (
      <div className="relative group my-2 rounded-lg border border-zinc-800 overflow-hidden">
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <CopyBtn />
        </div>
        <SyntaxHighlighter
          language={lang}
          style={vscDarkPlus}
          showLineNumbers={false}
          customStyle={{ margin: 0, padding: "0.65rem 1rem", background: "#0d0d0f", fontSize: "0.8rem", lineHeight: 1.6 }}
          codeTagProps={{ style: { fontFamily: '"JetBrains Mono", "Fira Code", monospace' } }}
        >
          {codeStr}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          </div>
          <span className="text-xs text-zinc-500 font-mono">{filename || lang}</span>
        </div>
        <CopyBtn />
      </div>
      <SyntaxHighlighter
        language={lang}
        style={vscDarkPlus}
        showLineNumbers
        lineNumberStyle={{ color: "#3f3f46", fontSize: "0.72rem", paddingRight: "1rem", minWidth: "2.5rem", userSelect: "none" }}
        customStyle={{ margin: 0, padding: "1.1rem 1.25rem", background: "#0d0d0f", fontSize: "0.8rem", lineHeight: 1.65 }}
        codeTagProps={{ style: { fontFamily: '"JetBrains Mono", "Fira Code", monospace' } }}
      >
        {codeStr}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;