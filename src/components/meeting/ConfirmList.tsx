import { useState } from "react";
import type { MeetingQuestion, MeetingTask, MeetingDecision } from "@/types/meeting";
import { ConfirmCard } from "./ConfirmCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Props {
  items: MeetingQuestion[];
  onChange: (items: MeetingQuestion[]) => void;
  filterLowConfidence?: boolean;
  viewMode: "clean" | "review";
  onConvertToTask?: (q: MeetingQuestion) => void;
  onConvertToDecision?: (q: MeetingQuestion) => void;
  onEvidenceClick?: (snippet: string) => void;
}

export function ConfirmList({
  items, onChange, filterLowConfidence, viewMode,
  onConvertToTask, onConvertToDecision, onEvidenceClick,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const displayItems = filterLowConfidence ? items.filter(q => q.confidence === "low") : items;

  const update = (id: string, patch: Partial<MeetingQuestion>) => {
    onChange(items.map(q => q.id === id ? { ...q, ...patch } : q));
  };

  const remove = (id: string) => onChange(items.filter(q => q.id !== id));

  const add = () => {
    const newQ: MeetingQuestion = { id: crypto.randomUUID(), question: "New item", directed_to: "", suggested_owner: "", confidence: "medium", evidence: [] };
    onChange([...items, newQ]);
    setEditingId(newQ.id);
  };

  const handleAction = (q: MeetingQuestion, action: string) => {
    if (action === "to-task" && onConvertToTask) { onConvertToTask(q); remove(q.id); }
    if (action === "to-decision" && onConvertToDecision) { onConvertToDecision(q); remove(q.id); }
  };

  return (
    <div className="space-y-1.5">
      {displayItems.map((q, idx) => (
        <ConfirmCard
          key={q.id}
          item={q}
          isSelected={selectedIdx === idx}
          isEditing={editingId === q.id}
          viewMode={viewMode}
          onStartEdit={() => setEditingId(q.id)}
          onStopEdit={() => setEditingId(null)}
          onUpdate={(patch) => update(q.id, patch)}
          onDelete={() => remove(q.id)}
          onAction={(action) => handleAction(q, action)}
          onEvidenceClick={onEvidenceClick}
        />
      ))}
      <Button variant="outline" size="sm" className="w-full mt-2 text-xs font-mono" onClick={add}>
        <Plus className="h-3 w-3 mr-1" /> Add Item
      </Button>
    </div>
  );
}
