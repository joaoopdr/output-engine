import { useState } from "react";
import type { MeetingQuestion, Confidence } from "@/types/meeting";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { EvidenceToggle } from "./EvidenceToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Pencil, Check } from "lucide-react";

interface Props {
  questions: MeetingQuestion[];
  onChange: (questions: MeetingQuestion[]) => void;
  filterLowConfidence?: boolean;
}

export function QuestionEditor({ questions, onChange, filterLowConfidence }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const displayItems = filterLowConfidence ? questions.filter(q => q.confidence === "low") : questions;

  const update = (id: string, patch: Partial<MeetingQuestion>) => {
    onChange(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const remove = (id: string) => onChange(questions.filter((q) => q.id !== id));

  const add = () => {
    const newQ: MeetingQuestion = { id: crypto.randomUUID(), question: "New question", directed_to: "", suggested_owner: "", confidence: "medium", evidence: [] };
    onChange([...questions, newQ]);
    setEditingId(newQ.id);
  };

  return (
    <div className="space-y-1">
      {displayItems.map((q) => {
        const isEditing = editingId === q.id;
        return (
          <div key={q.id} className="rounded-md border bg-card px-3 py-2">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={q.question}
                  onChange={(e) => update(q.id, { question: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") setEditingId(null); if (e.key === "Escape") setEditingId(null); }}
                  placeholder="Blocker or missing info"
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Input value={q.directed_to} onChange={(e) => update(q.id, { directed_to: e.target.value, suggested_owner: e.target.value })} placeholder="Directed to (optional)" className="text-sm flex-1" />
                  <select value={q.confidence} onChange={(e) => update(q.id, { confidence: e.target.value as Confidence })} className="text-sm rounded-md border bg-background px-2 py-1">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setEditingId(null)}>
                  <Check className="h-3 w-3 mr-1" /> Done
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-sm">
                    <span className="font-medium">{q.question}</span>
                    {q.directed_to && <span className="text-muted-foreground"> → {q.directed_to}</span>}
                  </p>
                  <ConfidenceBadge level={q.confidence} />
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setEditingId(q.id)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => remove(q.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <EvidenceToggle evidence={q.evidence || []} />
              </div>
            )}
          </div>
        );
      })}
      <Button variant="outline" size="sm" className="w-full mt-2 text-xs" onClick={add}>
        <Plus className="h-3 w-3 mr-1" /> Add Item
      </Button>
    </div>
  );
}
