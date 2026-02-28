import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Filter, Eye, EyeOff, RotateCcw, ChevronDown, AlertTriangle,
} from "lucide-react";

interface Props {
  taskCount: number;
  decisionCount: number;
  confirmCount: number;
  lowConfidenceCount: number;
  filterLow: boolean;
  onToggleFilterLow: () => void;
  viewMode: "clean" | "review";
  onToggleViewMode: () => void;
  onRegenerate: (section?: string) => void;
  isProcessing: boolean;
  validationFailed?: boolean;
}

export function OutputHeader({
  taskCount, decisionCount, confirmCount, lowConfidenceCount,
  filterLow, onToggleFilterLow, viewMode, onToggleViewMode,
  onRegenerate, isProcessing, validationFailed,
}: Props) {
  return (
    <div>
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="px-4 py-2 border-b border-border/40 flex items-center gap-3">
      {/* Counts */}
      <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
        <span>
          <span className="text-sm font-semibold text-foreground">{taskCount}</span> tasks
        </span>
        <span className="text-border">·</span>
        <span>
          <span className="text-sm font-semibold text-foreground">{decisionCount}</span> decisions
        </span>
        <span className="text-border">·</span>
        <span>
          <span className="text-sm font-semibold text-foreground">{confirmCount}</span> to confirm
        </span>
      </div>

      <div className="flex-1" />

      {/* Low confidence pill */}
      {lowConfidenceCount > 0 && (
        <button
          onClick={onToggleFilterLow}
          className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-all ${
            filterLow
              ? "bg-confidence-low/12 text-confidence-low border-confidence-low/25 font-medium"
              : "text-muted-foreground border-border/50 hover:border-confidence-low/25 hover:text-confidence-low"
          }`}
        >
          <Filter className="h-3 w-3" />
          {lowConfidenceCount} low-confidence
        </button>
      )}

      {validationFailed && (
        <span className="text-destructive flex items-center gap-1 text-[11px]">
          <AlertTriangle className="h-3 w-3" /> Parse errors
        </span>
      )}

      {/* View mode toggle */}
      <button
        onClick={onToggleViewMode}
        className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
      >
        {viewMode === "clean" ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        {viewMode === "clean" ? "Clean" : "Review"}
      </button>

      {/* Regenerate dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isProcessing} className="text-xs h-7 gap-1.5 border-border/50">
            <RotateCcw className="h-3 w-3" /> Regenerate <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => onRegenerate()}>Regenerate all</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRegenerate("tasks")}>Regenerate Tasks only</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRegenerate("decisions")}>Regenerate Decisions only</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRegenerate("confirm")}>Regenerate Things to confirm only</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onRegenerate("scratch")} className="text-destructive">
            Regenerate from scratch
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
