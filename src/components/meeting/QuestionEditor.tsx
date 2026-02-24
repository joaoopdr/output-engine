import { useState } from "react";
import type { MeetingQuestion, Confidence } from "@/types/meeting";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Pencil, Check } from "lucide-react";

interface Props {
  questions: MeetingQuestion[];
  onChange: (questions: MeetingQuestion[]) => void;
}

export function QuestionEditor({ questions, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<MeetingQuestion>) => {
    onChange(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const remove = (id: string) => onChange(questions.filter((q) => q.id !== id));

  const add = () => {
    const newQ: MeetingQuestion = { id: crypto.randomUUID(), question: "New question", suggested_owner: "", confidence: "medium" };
    onChange([...questions, newQ]);
    setEditingId(newQ.id);
  };

  return (
    <div className="space-y-1">
      {questions.map((q) => {
        const isEditing = editingId === q.id;
        return (
          <div key={q.id} className="rounded-md border bg-card px-3 py-2">
            {isEditing ? (
              <div className="space-y-2">
                <Input value={q.question} onChange={(e) => update(q.id, { question: e.target.value })} placeholder="Question" className="text-sm" />
                <div className="flex gap-2">
                  <Input value={q.suggested_owner} onChange={(e) => update(q.id, { suggested_owner: e.target.value })} placeholder="Suggested owner (optional)" className="text-sm flex-1" />
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
              <div className="flex items-start gap-2">
                <p className="flex-1 text-sm">
                  <span className="font-medium">{q.question}</span>
                  {q.suggested_owner && <span className="text-muted-foreground"> → {q.suggested_owner}</span>}
                </p>
                <ConfidenceBadge level={q.confidence} />
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setEditingId(q.id)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => remove(q.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        );
      })}
      <Button variant="outline" size="sm" className="w-full mt-2 text-xs" onClick={add}>
        <Plus className="h-3 w-3 mr-1" /> Add Question
      </Button>
    </div>
  );
}
