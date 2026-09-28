import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import CodeBlock from "./CodeBlock.jsx";

const MarkdownRenderer = ({ content, className = "" }) => (
  <div className={className}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-bold text-white mt-5 mb-2 first:mt-0">
            {children}
          </h1>
        ),

        h2: ({ children }) => (
          <h2 className="text-lg font-bold text-white mt-4 mb-2 first:mt-0">
            {children}
          </h2>
        ),

        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-zinc-200 mt-3 mb-1 first:mt-0">
            {children}
          </h3>
        ),

        p: ({ children }) => (
          <p className="mb-3 last:mb-0 leading-7">{children}</p>
        ),

        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),

        em: ({ children }) => (
          <em className="italic text-zinc-300">{children}</em>
        ),

        ul: ({ children }) => (
          <ul className="list-disc pl-5 space-y-1.5 mb-3">{children}</ul>
        ),

        ol: ({ children }) => (
          <ol className="list-decimal pl-5 space-y-1.5 mb-3">{children}</ol>
        ),

        li: ({ children }) => (
          <li className="text-zinc-200 leading-7">{children}</li>
        ),

        hr: () => <hr className="border-zinc-800 my-5" />,

        br: () => <br />,

        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-zinc-700 pl-4 my-3 text-zinc-400 italic">
            {children}
          </blockquote>
        ),

        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline underline-offset-4 hover:text-blue-300"
          >
            {children}
          </a>
        ),

        table: ({ children }) => (
          <div className="overflow-x-auto my-4 rounded-xl border border-zinc-800">
            <table className="w-full text-sm border-collapse">
              {children}
            </table>
          </div>
        ),

        thead: ({ children }) => (
          <thead className="bg-zinc-900">{children}</thead>
        ),

        tbody: ({ children }) => (
          <tbody className="divide-y divide-zinc-800">{children}</tbody>
        ),

        tr: ({ children }) => (
          <tr className="hover:bg-zinc-900/40 transition-colors">
            {children}
          </tr>
        ),

        th: ({ children }) => (
          <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
            {children}
          </th>
        ),

        td: ({ children }) => (
          <td className="px-4 py-2.5 text-zinc-300 leading-relaxed align-top">
            {children}
          </td>
        ),

        code({ inline, className, children }) {
          const match = /language-(\w+)/.exec(className || "");
          const str = String(children).replace(/\n$/, "");

          if (!inline) {
            return (
              <CodeBlock
                code={str}
                language={match?.[1]}
              />
            );
          }

          return (
            <code className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded text-[0.8em] font-mono">
              {children}
            </code>
          );
        },

        pre: ({ children }) => <>{children}</>,
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

export default MarkdownRenderer;