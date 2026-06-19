import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AI_DISCLAIMER } from "@/lib/prompts";

export function AINotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground/80",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
      <p>{AI_DISCLAIMER}</p>
    </div>
  );
}
