import { useState, useEffect } from "react";
import type { MeetingTask } from "@/types/meeting";
import { TaskCard } from "./TaskCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Props {
  tasks: MeetingTask[];
  onChange: (tasks: MeetingTask[]) => void;
  filterLowConfidence?: boolean;
  filterUnassigned?: boolean;
  filterNoDate?: boolean;
  viewMode: "clean" | "review";
  meetingDate?: string;
  onConvertToConfirm?: (task: MeetingTask) => void;
  onEvidenceClick?: (snippet: string) => void;
}

export function TaskList({
  tasks, onChange, filterLowConfidence, filterUnassigned, filterNoDate,
  viewMode, onConvertToConfirm, onEvidenceClick,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(-1);

  let displayTasks = tasks;
  if (filterLowConfidence) displayTasks = displayTasks.filter(t => t.confidence === "low");
  if (filterUnassigned) displayTasks = displayTasks.filter(t => t.owner === "Unassigned");
  if (filterNoDate) displayTasks = displayTasks.filter(t => !t.due_date_text);

  const update = (id: string, patch: Partial<MeetingTask>) => {
    onChange(tasks.map(t => t.id === id ? { ...t, ...patch } : t));
  };

  const remove = (id: string) => onChange(tasks.filter(t => t.id !== id));

  const add = () => {
    const newTask: MeetingTask = {
      id: crypto.randomUUID(), title: "New task", owner: "Unassigned",
      due_date_text: "", description_bullets: [], details: [],
      confidence: "medium", evidence: [], notes: "",
    };
    onChange([...tasks, newTask]);
    setEditingId(newTask.id);
    setExpandedId(newTask.id);
  };

  const handleAction = (task: MeetingTask, action: string) => {
    if (action === "split") {
      const t2: MeetingTask = { ...task, id: crypto.randomUUID(), title: task.title + " (part 2)" };
      const idx = tasks.findIndex(t => t.id === task.id);
      const newTasks = [...tasks];
      newTasks.splice(idx + 1, 0, t2);
      onChange(newTasks);
    } else if (action === "to-confirm" && onConvertToConfirm) {
      onConvertToConfirm(task);
      remove(task.id);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingId) return;
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return;
      if (e.key === "j") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, displayTasks.length - 1)); }
      if (e.key === "k") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      if (e.key === "e" && selectedIdx >= 0 && selectedIdx < displayTasks.length) {
        e.preventDefault(); const t = displayTasks[selectedIdx]; setEditingId(t.id); setExpandedId(t.id);
      }
      if (e.key === "d" && selectedIdx >= 0 && selectedIdx < displayTasks.length) {
        e.preventDefault(); remove(displayTasks[selectedIdx].id);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingId, selectedIdx, displayTasks]);

  return (
    <div className="space-y-1.5">
      {displayTasks.map((task, idx) => (
        <TaskCard
          key={task.id}
          task={task}
          isSelected={selectedIdx === idx}
          isEditing={editingId === task.id}
          isExpanded={expandedId === task.id}
          viewMode={viewMode}
          onToggleExpand={() => setExpandedId(expandedId === task.id ? null : task.id)}
          onStartEdit={() => { setEditingId(task.id); setExpandedId(task.id); }}
          onStopEdit={() => setEditingId(null)}
          onUpdate={(patch) => update(task.id, patch)}
          onDelete={() => remove(task.id)}
          onAction={(action) => handleAction(task, action)}
          onEvidenceClick={onEvidenceClick}
        />
      ))}
      <Button variant="outline" size="sm" className="w-full mt-2 text-xs font-mono" onClick={add}>
        <Plus className="h-3 w-3 mr-1" /> Add Task
      </Button>
    </div>
  );
}
