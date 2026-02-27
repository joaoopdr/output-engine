import { useState, useEffect } from "react";
import type { MeetingDecision, MeetingTask, MeetingQuestion } from "@/types/meeting";
import { DecisionCard } from "./DecisionCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Props {
  decisions: MeetingDecision[];
  onChange: (decisions: MeetingDecision[]) => void;
  filterLowConfidence?: boolean;
  viewMode: "clean" | "review";
  onConvertToTask?: (d: MeetingDecision) => void;
  onConvertToConfirm?: (d: MeetingDecision) => void;
  onEvidenceClick?: (snippet: string) => void;
}

export function DecisionList({
  decisions, onChange, filterLowConfidence, viewMode,
  onConvertToTask, onConvertToConfirm, onEvidenceClick,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const displayItems = filterLowConfidence ? decisions.filter(d => d.confidence === "low") : decisions;

  const update = (id: string, patch: Partial<MeetingDecision>) => {
    onChange(decisions.map(d => d.id === id ? { ...d, ...patch } : d));
  };

  const remove = (id: string) => onChange(decisions.filter(d => d.id !== id));

  const add = () => {
    const newD: MeetingDecision = { id: crypto.randomUUID(), decision: "New decision", context: "", confidence: "medium", evidence: [] };
    onChange([...decisions, newD]);
    setEditingId(newD.id);
  };

  const handleAction = (d: MeetingDecision, action: string) => {
    if (action === "to-task" && onConvertToTask) { onConvertToTask(d); remove(d.id); }
    if (action === "to-confirm" && onConvertToConfirm) { onConvertToConfirm(d); remove(d.id); }
  };

  return (
    <div className="space-y-1.5">
      {displayItems.map((d, idx) => (
        <DecisionCard
          key={d.id}
          decision={d}
          isSelected={selectedIdx === idx}
          isEditing={editingId === d.id}
          viewMode={viewMode}
          onStartEdit={() => setEditingId(d.id)}
          onStopEdit={() => setEditingId(null)}
          onUpdate={(patch) => update(d.id, patch)}
          onDelete={() => remove(d.id)}
          onAction={(action) => handleAction(d, action)}
          onEvidenceClick={onEvidenceClick}
        />
      ))}
      <Button variant="outline" size="sm" className="w-full mt-2 text-xs font-mono" onClick={add}>
        <Plus className="h-3 w-3 mr-1" /> Add Decision
      </Button>
    </div>
  );
}
