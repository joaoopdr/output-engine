import type { Priority } from "@/types/meeting";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";

const styles: Record<Priority, string> = {
  "urgent": "bg-confidence-low/15 text-confidence-low border-confidence-low/30",
  "this week": "bg-confidence-medium/15 text-confidence-medium border-confidence-medium/30",
  "when possible": "bg-muted text-muted-foreground border-border",
};

export function PriorityBadge({ level, reason }: { level: Priority; reason: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border cursor-default ${styles[level]}`}>
          {level}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[200px]">
        {reason}
      </TooltipContent>
    </Tooltip>
  );
}
