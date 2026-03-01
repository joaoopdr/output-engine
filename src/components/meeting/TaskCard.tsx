import { useState } from "react";
import type { MeetingTask, Confidence } from "@/types/meeting";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { DatePill } from "./DatePill";
import { EvidenceToggle } from "./EvidenceToggle";
import { resolveDate } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2, Plus, ChevronDown, ChevronRight, Pencil, Check, X, MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  task: MeetingTask;
  isSelected: boolean;
  isEditing: boolean;
  isExpanded: boolean;
  viewMode: "clean" | "review";
  meetingDate?: string;
  onToggleExpand: () => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onUpdate: (patch: Partial<MeetingTask>) => void;
  onDelete: () => void;
  onAction: (action: string) => void;
  onEvidenceClick?: (snippet: string) => void;
}

export function TaskCard({
  task, isSelected, isEditing, isExpanded, viewMode, meetingDate,
  onToggleExpand, onStartEdit, onStopEdit, onUpdate, onDelete, onAction, onEvidenceClick,
}: Props) {
  return (
    <div className={`rounded-lg border bg-[hsl(var(--card))] border-l-[3px] border-l-[hsl(var(--primary)/0.4)] transition-all ${isSelected ? "ring-1 ring-primary shadow-sm" : ""}`}>
      {/* Header row */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={onToggleExpand}
      >
        {isExpanded
          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        }
        <span className="flex-1 text-sm font-medium truncate">{task.title}</span>
        {task.owner && task.owner !== "Unassigned" && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
            {task.owner}
          </span>
        )}
        {task.owner === "Unassigned" && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border shrink-0">
            Unassigned
          </span>
        )}
        <div onClick={e => e.stopPropagation()}>
          <DatePill
            dateText={task.due_date_text}
            iso={task.due_date_iso}
            confidence={task.due_date_confidence}
            meetingDate={meetingDate}
            onUpdate={(text, iso) => {
              const resolved = resolveDate(text, meetingDate);
              const resolved = resolveDate(text, meetingDate);
              onUpdate({
                due_date_text: text,
                due_date_iso: iso,
                due_date_display: resolved.display,
                due_date_confidence: resolved.confidence,
              });
            }}
          />
        </div>
        <ConfidenceBadge level={task.confidence} />
        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={isEditing ? onStopEdit : onStartEdit}>
            {isEditing ? <Check className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
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
              <DropdownMenuItem onClick={() => onAction("split")}>Split into two tasks</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("to-confirm")}>Move to Things to confirm</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 border-t">
          {isEditing ? (
            <div className="space-y-2 pt-2">
              <Input
                value={task.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") onStopEdit(); }}
                placeholder="Task title"
                className="text-sm font-medium"
                autoFocus
              />
              <div className="grid grid-cols-3 gap-2">
                <Input value={task.owner} onChange={(e) => onUpdate({ owner: e.target.value })} placeholder="Owner" className="text-sm" />
                <div className="flex items-center">
                  <DatePill
                    dateText={task.due_date_text}
                    iso={task.due_date_iso}
                    confidence={task.due_date_confidence}
                    meetingDate={meetingDate}
                    onUpdate={(text, iso) => {
                      const { resolveDate } = require("@/lib/dateUtils");
                      const resolved = resolveDate(text, meetingDate);
                      onUpdate({
                        due_date_text: text,
                        due_date_iso: iso,
                        due_date_display: resolved.display,
                        due_date_confidence: resolved.confidence,
                      });
                    }}
                  />
                </div>
                <select
                  value={task.confidence}
                  onChange={(e) => onUpdate({ confidence: e.target.value as Confidence })}
                  className="text-sm rounded-md border bg-background px-2 py-1"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Details</label>
                {(task.details || []).map((b, i) => (
                  <div key={i} className="flex gap-1">
                    <Input
                      value={b}
                      onChange={(e) => {
                        const items = [...(task.details || [])];
                        items[i] = e.target.value;
                        onUpdate({ details: items, description_bullets: items });
                      }}
                      className="text-sm"
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => {
                      const items = (task.details || []).filter((_, j) => j !== i);
                      onUpdate({ details: items, description_bullets: items });
                    }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => {
                  const items = [...(task.details || []), ""];
                  onUpdate({ details: items, description_bullets: items });
                }}>
                  <Plus className="h-3 w-3 mr-1" /> Add detail
                </Button>
              </div>
              <div>
                <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Notes / Dependencies</label>
                <Input value={task.notes || ""} onChange={(e) => onUpdate({ notes: e.target.value })} placeholder="Dependencies, blockers…" className="text-sm" />
              </div>
            </div>
          ) : (
            <div className="pt-2 space-y-1.5 text-sm">
              {task.due_date_display && <p className="text-muted-foreground text-xs">Due: {task.due_date_display}</p>}
              {!task.due_date_display && task.due_date_text && <p className="text-muted-foreground text-xs">Due: {task.due_date_text}</p>}
              {(task.details || []).length > 0 && (
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5 text-xs">
                  {(task.details || []).map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}
              {task.notes && <p className="text-xs text-muted-foreground">📝 {task.notes}</p>}
              {(viewMode === "review" || isExpanded) && (
                <EvidenceToggle evidence={task.evidence || []} onSnippetClick={onEvidenceClick} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
