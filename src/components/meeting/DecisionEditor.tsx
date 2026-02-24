import { useState } from "react";
import type { MeetingDecision, Confidence } from "@/types/meeting";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { EvidenceToggle } from "./EvidenceToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Pencil, Check } from "lucide-react";

interface Props {
  decisions: MeetingDecision[];
  onChange: (decisions: MeetingDecision[]) => void;
  filterLowConfidence?: boolean;
}

export function DecisionEditor({ decisions, onChange, filterLowConfidence }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const displayItems = filterLowConfidence ? decisions.filter(d => d.confidence === "low") : decisions;

  const update = (id: string, patch: Partial<MeetingDecision>) => {
    onChange(decisions.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const remove = (id: string) => onChange(decisions.filter((d) => d.id !== id));

  const add = () => {
    const newD: MeetingDecision = { id: crypto.randomUUID(), decision: "New decision", context: "", confidence: "medium", evidence: [] };
    onChange([...decisions, newD]);
    setEditingId(newD.id);
  };

  return (
    <div className="space-y-1">
      {displayItems.map((d) => {
        const isEditing = editingId === d.id;
        return (
          <div key={d.id} className="rounded-md border bg-card px-3 py-2">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={d.decision}
                  onChange={(e) => update(d.id, { decision: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") setEditingId(null); if (e.key === "Escape") setEditingId(null); }}
                  placeholder="Decision statement (one crisp sentence)"
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <select value={d.confidence} onChange={(e) => update(d.id, { confidence: e.target.value as Confidence })} className="text-sm rounded-md border bg-background px-2 py-1">
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
                  <p className="flex-1 text-sm font-medium">{d.decision}</p>
                  <ConfidenceBadge level={d.confidence} />
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setEditingId(d.id)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => remove(d.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <EvidenceToggle evidence={d.evidence || []} />
              </div>
            )}
          </div>
        );
      })}
      <Button variant="outline" size="sm" className="w-full mt-2 text-xs" onClick={add}>
        <Plus className="h-3 w-3 mr-1" /> Add Decision
      </Button>
    </div>
  );
}
