import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("markdown text-sm leading-relaxed text-foreground", className)}>
      <ReactMarkdown
        components={{
          h1: (p) => <h1 className="mb-2 mt-4 text-xl font-semibold" {...p} />,
          h2: (p) => <h2 className="mb-2 mt-4 text-lg font-semibold" {...p} />,
          h3: (p) => <h3 className="mb-1 mt-3 text-base font-semibold" {...p} />,
          p: (p) => <p className="my-2" {...p} />,
          ul: (p) => <ul className="my-2 ml-5 list-disc space-y-1" {...p} />,
          ol: (p) => <ol className="my-2 ml-5 list-decimal space-y-1" {...p} />,
          li: (p) => <li className="leading-relaxed" {...p} />,
          a: (p) => <a className="text-primary hover:underline" target="_blank" rel="noreferrer" {...p} />,
          strong: (p) => <strong className="font-semibold" {...p} />,
          em: (p) => <em className="italic" {...p} />,
          hr: () => <hr className="my-4 border-border" />,
          blockquote: (p) => (
            <blockquote className="my-2 border-l-2 border-primary/40 pl-3 italic text-muted-foreground" {...p} />
          ),
          code: ({ className: cls, children, ...rest }) => {
            const isBlock = (cls ?? "").includes("language-");
            if (isBlock) {
              return (
                <code className={cn("block", cls)} {...rest}>
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]" {...rest}>
                {children}
              </code>
            );
          },
          pre: (p) => (
            <pre className="my-3 overflow-x-auto rounded-lg bg-foreground/90 p-3 text-xs text-background scrollbar-thin" {...p} />
          ),
          table: (p) => <table className="my-2 w-full border-collapse text-sm" {...p} />,
          th: (p) => <th className="border border-border bg-muted px-2 py-1 text-left font-semibold" {...p} />,
          td: (p) => <td className="border border-border px-2 py-1" {...p} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
