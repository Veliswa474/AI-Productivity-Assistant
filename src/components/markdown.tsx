import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-foreground",
        "prose-headings:font-semibold prose-headings:text-foreground",
        "prose-p:my-2 prose-li:my-0.5",
        "prose-strong:text-foreground",
        "prose-a:text-primary hover:prose-a:underline",
        "prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:bg-foreground/90 prose-pre:text-background prose-pre:rounded-lg",
        "dark:prose-invert",
        className,
      )}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
