import { useState } from "react";
import type { MeetingTask, Confidence } from "@/types/meeting";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, ChevronDown, ChevronRight, Pencil, Check, X } from "lucide-react";

interface Props {
  tasks: MeetingTask[];
  onChange: (tasks: MeetingTask[]) => void;
}

export function TaskEditor({ tasks, onChange }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<MeetingTask>) => {
    onChange(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const remove = (id: string) => onChange(tasks.filter((t) => t.id !== id));

  const add = () => {
    const newTask: MeetingTask = {
      id: crypto.randomUUID(),
      title: "New task",
      owner: "Unassigned",
      due_date_text: "",
      description_bullets: [],
      confidence: "medium",
    };
    onChange([...tasks, newTask]);
    setEditingId(newTask.id);
    setExpandedId(newTask.id);
  };

  return (
    <div className="space-y-1">
      {tasks.map((task) => {
        const isExpanded = expandedId === task.id;
        const isEditing = editingId === task.id;
        return (
          <div key={task.id} className="rounded-md border bg-card">
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : task.id)}
            >
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
              <span className="flex-1 text-sm font-medium truncate">{task.title}</span>
              <span className="text-xs font-mono text-muted-foreground shrink-0">{task.owner}</span>
              <ConfidenceBadge level={task.confidence} />
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); setEditingId(isEditing ? null : task.id); setExpandedId(task.id); }}>
                {isEditing ? <Check className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={(e) => { e.stopPropagation(); remove(task.id); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            {isExpanded && (
              <div className="px-3 pb-3 space-y-2 border-t bg-surface/50">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <Input value={task.title} onChange={(e) => update(task.id, { title: e.target.value })} placeholder="Task title" className="col-span-3 text-sm" />
                      <Input value={task.owner} onChange={(e) => update(task.id, { owner: e.target.value })} placeholder="Owner" className="text-sm" />
                      <Input value={task.due_date_text} onChange={(e) => update(task.id, { due_date_text: e.target.value })} placeholder="Due date" className="text-sm" />
                      <select
                        value={task.confidence}
                        onChange={(e) => update(task.id, { confidence: e.target.value as Confidence })}
                        className="text-sm rounded-md border bg-background px-2 py-1"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-muted-foreground">Description bullets</label>
                      {task.description_bullets.map((b, i) => (
                        <div key={i} className="flex gap-1">
                          <Input
                            value={b}
                            onChange={(e) => {
                              const bullets = [...task.description_bullets];
                              bullets[i] = e.target.value;
                              update(task.id, { description_bullets: bullets });
                            }}
                            className="text-sm"
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => {
                            const bullets = task.description_bullets.filter((_, j) => j !== i);
                            update(task.id, { description_bullets: bullets });
                          }}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => update(task.id, { description_bullets: [...task.description_bullets, ""] })}>
                        <Plus className="h-3 w-3 mr-1" /> Add bullet
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="pt-2 space-y-1 text-sm">
                    {task.due_date_text && <p className="text-muted-foreground">Due: {task.due_date_text}</p>}
                    {task.description_bullets.length > 0 && (
                      <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                        {task.description_bullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <Button variant="outline" size="sm" className="w-full mt-2 text-xs" onClick={add}>
        <Plus className="h-3 w-3 mr-1" /> Add Task
      </Button>
    </div>
  );
}
