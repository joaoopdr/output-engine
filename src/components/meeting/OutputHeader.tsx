import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ListTodo, MessageSquare, HelpCircle, Filter, Eye, EyeOff,
  RotateCcw, ChevronDown, AlertTriangle,
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
    <div className="px-4 py-2.5 border-b flex items-center gap-3 bg-card/50">
      {/* Counts */}
      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ListTodo className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{taskCount}</span> tasks
        </span>
        <span className="h-3 w-px bg-border" />
        <span className="flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{decisionCount}</span> decisions
        </span>
        <span className="h-3 w-px bg-border" />
        <span className="flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{confirmCount}</span> to confirm
        </span>
      </div>

      <div className="flex-1" />

      {/* Low confidence pill */}
      {lowConfidenceCount > 0 && (
        <button
          onClick={onToggleFilterLow}
          className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border transition-all ${
            filterLow
              ? "bg-confidence-low/15 text-confidence-low border-confidence-low/30 font-medium"
              : "text-muted-foreground border-border hover:border-confidence-low/30 hover:text-confidence-low"
          }`}
        >
          <Filter className="h-3 w-3" />
          {lowConfidenceCount} low-confidence
        </button>
      )}

      {validationFailed && (
        <span className="text-destructive flex items-center gap-1 text-xs font-mono">
          <AlertTriangle className="h-3 w-3" /> Parse errors
        </span>
      )}

      {/* View mode toggle */}
      <button
        onClick={onToggleViewMode}
        className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {viewMode === "clean" ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        {viewMode === "clean" ? "Clean" : "Review"}
      </button>

      {/* Regenerate dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isProcessing} className="text-xs font-mono h-7 gap-1.5">
            <RotateCcw className="h-3 w-3" /> Regenerate <ChevronDown className="h-3 w-3" />
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
