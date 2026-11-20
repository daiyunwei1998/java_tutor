import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders lesson markdown. Raw HTML in content is not rendered (react-markdown default). */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
