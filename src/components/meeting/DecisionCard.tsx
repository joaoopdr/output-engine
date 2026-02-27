import { useState } from "react";
import type { MeetingDecision, Confidence } from "@/types/meeting";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { EvidenceToggle } from "./EvidenceToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, Check, MoreHorizontal, ChevronDown, ChevronRight } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  decision: MeetingDecision;
  isSelected: boolean;
  isEditing: boolean;
  viewMode: "clean" | "review";
  onStartEdit: () => void;
  onStopEdit: () => void;
  onUpdate: (patch: Partial<MeetingDecision>) => void;
  onDelete: () => void;
  onAction: (action: string) => void;
  onEvidenceClick?: (snippet: string) => void;
}

export function DecisionCard({
  decision, isSelected, isEditing, viewMode,
  onStartEdit, onStopEdit, onUpdate, onDelete, onAction, onEvidenceClick,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-lg border bg-card transition-all ${isSelected ? "ring-1 ring-primary shadow-sm" : ""}`}>
      {isEditing ? (
        <div className="px-3 py-2 space-y-2">
          <Input
            value={decision.decision}
            onChange={(e) => onUpdate({ decision: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") onStopEdit(); }}
            placeholder="Decision statement (one crisp sentence)"
            className="text-sm font-medium"
            autoFocus
          />
          <div className="flex gap-2 items-center">
            <select value={decision.confidence} onChange={(e) => onUpdate({ confidence: e.target.value as Confidence })} className="text-sm rounded-md border bg-background px-2 py-1">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <Button variant="ghost" size="sm" className="text-xs ml-auto" onClick={onStopEdit}>
              <Check className="h-3 w-3 mr-1" /> Done
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-3 py-2">
          <div className="flex items-start gap-2">
            <button onClick={() => setExpanded(!expanded)} className="mt-0.5 shrink-0 text-muted-foreground">
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            <p className="flex-1 text-sm font-medium">{decision.decision}</p>
            <ConfidenceBadge level={decision.confidence} />
            <div className="flex items-center gap-0.5 shrink-0">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onStartEdit}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onDelete}>
                <Trash2 className="h-3 w-3" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onAction("to-task")}>Convert to task</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction("to-confirm")}>Move to Things to confirm</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {(expanded || viewMode === "review") && (
            <div className="ml-5 mt-1">
              <EvidenceToggle evidence={decision.evidence || []} onSnippetClick={onEvidenceClick} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
