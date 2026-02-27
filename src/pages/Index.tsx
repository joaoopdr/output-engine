import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMeetingProcessor } from "@/hooks/use-meeting-processor";
import { TaskList } from "@/components/meeting/TaskList";
import { DecisionList } from "@/components/meeting/DecisionList";
import { ConfirmList } from "@/components/meeting/ConfirmList";
import { OutputHeader } from "@/components/meeting/OutputHeader";
import { CommandPalette } from "@/components/meeting/CommandPalette";
import { exportAsMarkdown, exportAsJSON } from "@/lib/export";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MeetingTask, MeetingDecision, MeetingQuestion } from "@/types/meeting";
import {
  Zap, BarChart3, Copy, FileJson, FileText, Loader2,
  Save, AlertTriangle, Upload, Eraser, User, Calendar,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

const DEMO_TRANSCRIPT = `Alice: Alright everyone, let's go through this week's priorities.
Bob: I'll finish the API integration by Wednesday. Already started yesterday.
Alice: Great. Charlie, can you handle the design review for the new dashboard?
Charlie: Sure, I can have it done by Thursday.
Alice: We decided to drop the mobile app for now and focus entirely on web.
Bob: Makes sense. I also need access to the staging environment - can someone sort that out?
Alice: Sam, can you give Bob staging access today?
Sam: Will do.
Alice: One more thing - we should probably think about the onboarding flow soon.
Charlie: Yeah, maybe next sprint. Not urgent.
Alice: Agreed. Let's revisit onboarding next week. For now, focus on web dashboard.`;

export default function Index() {
  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [attendees, setAttendees] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const { process, isProcessing, currentRun } = useMeetingProcessor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLTextAreaElement>(null);

  const [tasks, setTasks] = useState<MeetingTask[]>([]);
  const [decisions, setDecisions] = useState<MeetingDecision[]>([]);
  const [questions, setQuestions] = useState<MeetingQuestion[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [heavyEdits, setHeavyEdits] = useState(false);
  const [filterLow, setFilterLow] = useState(false);
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  const [filterNoDate, setFilterNoDate] = useState(false);
  const [viewMode, setViewMode] = useState<"clean" | "review">("clean");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const hasRelativeDates = transcript.match(/\b(tomorrow|end of week|friday|monday|next week)\b/i) && !meetingDate;

  // Track dirty state
  useEffect(() => {
    if (tasks.length > 0 || decisions.length > 0 || questions.length > 0) setIsDirty(true);
  }, [tasks, decisions, questions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return;
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setCmdOpen(true); }
      if (e.key === "f" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setFilterLow(v => !v); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleGenerate = async () => {
    if (!transcript.trim()) { toast.error("Paste a transcript first"); return; }
    const result = await process({
      transcript_text: transcript, title, attendees,
      template_type: "weekly_planning", meeting_date: meetingDate,
    });
    if (result?.output) {
      setTasks(result.output.tasks);
      setDecisions(result.output.decisions);
      setQuestions(result.output.open_questions);
      setIsDirty(false);
    }
  };

  const handleRegenerate = (section?: string) => {
    if (section === "scratch" || !isDirty) { handleGenerate(); return; }
    // For now, full regenerate
    handleGenerate();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setTranscript(ev.target?.result as string || ""); toast.success(`Loaded ${file.name}`); };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSaveEdits = async () => {
    if (!currentRun) return;
    const { error } = await supabase.from("edited_outputs").insert({
      run_id: currentRun.id,
      final_tasks_json: tasks as any,
      final_decisions_json: decisions as any,
      final_questions_json: questions as any,
      edit_notes: [editNotes, heavyEdits ? "[HEAVY EDITS]" : ""].filter(Boolean).join(" ") || null,
    });
    if (error) toast.error("Failed to save edits");
    else { toast.success("Edits saved"); setIsDirty(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportAsMarkdown(tasks, decisions, questions, title));
    toast.success("Copied to clipboard");
  };

  const handleExportMD = () => {
    download(exportAsMarkdown(tasks, decisions, questions, title), `${title || "meeting-outputs"}.md`, "text/markdown");
  };

  const handleExportJSON = () => {
    download(exportAsJSON(tasks, decisions, questions), `${title || "meeting-outputs"}.json`, "application/json");
  };

  const handleClear = () => {
    setTranscript(""); setTitle(""); setAttendees(""); setMeetingDate("");
    setTasks([]); setDecisions([]); setQuestions([]);
    setEditNotes(""); setHeavyEdits(false); setIsDirty(false);
  };

  const handleEvidenceClick = useCallback((snippet: string) => {
    if (!transcriptRef.current) return;
    const text = transcriptRef.current.value;
    const idx = text.toLowerCase().indexOf(snippet.toLowerCase().slice(0, 30));
    if (idx >= 0) {
      transcriptRef.current.focus();
      transcriptRef.current.setSelectionRange(idx, idx + snippet.length);
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight * (idx / text.length);
    }
  }, []);

  // Cross-type conversions
  const convertTaskToConfirm = (task: MeetingTask) => {
    setQuestions(prev => [...prev, {
      id: crypto.randomUUID(), question: `Is someone owning "${task.title}" this week?`,
      directed_to: task.owner === "Unassigned" ? "" : task.owner,
      suggested_owner: task.owner === "Unassigned" ? "" : task.owner,
      confidence: "low", evidence: task.evidence || [],
    }]);
  };

  const convertDecisionToTask = (d: MeetingDecision) => {
    setTasks(prev => [...prev, {
      id: crypto.randomUUID(), title: d.decision, owner: "Unassigned",
      due_date_text: "", description_bullets: [], details: [],
      confidence: d.confidence, evidence: d.evidence || [], notes: "",
    }]);
  };

  const convertDecisionToConfirm = (d: MeetingDecision) => {
    setQuestions(prev => [...prev, {
      id: crypto.randomUUID(), question: d.decision, directed_to: "",
      suggested_owner: "", confidence: d.confidence, evidence: d.evidence || [],
    }]);
  };

  const convertConfirmToTask = (q: MeetingQuestion) => {
    setTasks(prev => [...prev, {
      id: crypto.randomUUID(), title: q.question, owner: q.directed_to || "Unassigned",
      due_date_text: "", description_bullets: [], details: [],
      confidence: q.confidence, evidence: q.evidence || [], notes: "",
    }]);
  };

  const convertConfirmToDecision = (q: MeetingQuestion) => {
    setDecisions(prev => [...prev, {
      id: crypto.randomUUID(), decision: q.question, context: "",
      confidence: q.confidence, evidence: q.evidence || [],
    }]);
  };

  const handleCommand = (action: string) => {
    if (action === "filter-low") setFilterLow(v => !v);
    if (action === "filter-unassigned") setFilterUnassigned(v => !v);
    if (action === "filter-no-date") setFilterNoDate(v => !v);
    if (action === "toggle-mode") setViewMode(v => v === "clean" ? "review" : "clean");
    if (action === "export-markdown") handleExportMD();
    if (action === "regen-tasks") handleRegenerate("tasks");
    if (action === "regen-decisions") handleRegenerate("decisions");
    if (action === "regen-confirm") handleRegenerate("confirm");
    if (action === "regen-all") handleRegenerate();
  };

  const lowConfidenceCount = [...tasks, ...decisions, ...questions].filter(i => i.confidence === "low").length;
  const hasOutputs = tasks.length > 0 || decisions.length > 0 || questions.length > 0;

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} onAction={handleCommand} />

      {/* Header */}
      <header className="border-b px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-semibold font-mono tracking-tight">MEETINGS → WORK</h1>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Weekly Planning
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-mono hidden md:block">
            / command palette · j/k navigate · e edit · f filter
          </span>
          <Link to="/batch">
            <Button variant="outline" size="sm" className="text-xs font-mono h-7">
              <BarChart3 className="h-3 w-3 mr-1" /> Batch
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1" style={{ height: "calc(100vh - 45px)" }}>
        {/* Left: Input */}
        <div className="w-[400px] border-r flex flex-col shrink-0">
          <div className="p-4 space-y-3 flex-1 overflow-auto">
            <div>
              <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sprint Planning W8" className="text-sm h-8" />
            </div>
            <div>
              <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">Attendees</label>
              <Input value={attendees} onChange={e => setAttendees(e.target.value)} placeholder="Alice, Bob, Charlie" className="text-sm h-8" />
            </div>
            <div>
              <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">Meeting date</label>
              <Input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} className="text-sm h-8" />
              <p className="text-[10px] text-muted-foreground mt-0.5">Resolves "tomorrow", "Friday", etc.</p>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Transcript</label>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="text-[11px] h-6 px-2" onClick={() => setTranscript(DEMO_TRANSCRIPT)}>
                    Example
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[11px] h-6 px-2" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3 w-3 mr-1" /> .txt
                  </Button>
                </div>
                <input ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
              </div>
              <Textarea
                ref={transcriptRef}
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="Paste meeting transcript here…"
                className="flex-1 min-h-[250px] text-sm font-mono resize-none"
              />
              {hasRelativeDates && (
                <p className="text-[11px] text-confidence-medium mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Relative dates detected — add meeting date to resolve them.
                </p>
              )}
            </div>
          </div>
          <div className="p-3 border-t space-y-2">
            <p className="text-[10px] text-muted-foreground">
              We avoid guessing owners or deadlines. Unclear items → Things to confirm.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={isProcessing} className="flex-1 font-mono text-sm h-9">
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                {isProcessing ? "Processing…" : "Generate"}
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleClear} title="Clear all">
                <Eraser className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Outputs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!hasOutputs ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground max-w-xs">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-15" />
                <p className="text-sm font-mono mb-1">Paste a transcript and hit Generate</p>
                <p className="text-[11px] opacity-50">
                  Press <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">/</kbd> for commands
                </p>
              </div>
            </div>
          ) : (
            <>
              <OutputHeader
                taskCount={tasks.length}
                decisionCount={decisions.length}
                confirmCount={questions.length}
                lowConfidenceCount={lowConfidenceCount}
                filterLow={filterLow}
                onToggleFilterLow={() => setFilterLow(v => !v)}
                viewMode={viewMode}
                onToggleViewMode={() => setViewMode(v => v === "clean" ? "review" : "clean")}
                onRegenerate={handleRegenerate}
                isProcessing={isProcessing}
                validationFailed={currentRun?.validation_status === "fail"}
              />

              <Tabs defaultValue="tasks" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="mx-4 mt-2 bg-muted/50 self-start">
                  <TabsTrigger value="tasks" className="text-xs font-mono gap-1.5">
                    Tasks <span className="text-muted-foreground">({tasks.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="decisions" className="text-xs font-mono gap-1.5">
                    Decisions <span className="text-muted-foreground">({decisions.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="confirm" className="text-xs font-mono gap-1.5">
                    Things to confirm <span className="text-muted-foreground">({questions.length})</span>
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-auto p-4">
                  <TabsContent value="tasks" className="mt-0">
                    {/* Filter chips */}
                    <div className="flex gap-1.5 mb-3">
                      <button
                        onClick={() => setFilterUnassigned(v => !v)}
                        className={`flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-full border transition-colors ${filterUnassigned ? "bg-primary/15 text-primary border-primary/30" : "text-muted-foreground border-border hover:border-primary/30"}`}
                      >
                        <User className="h-3 w-3" /> Unassigned
                      </button>
                      <button
                        onClick={() => setFilterNoDate(v => !v)}
                        className={`flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-full border transition-colors ${filterNoDate ? "bg-primary/15 text-primary border-primary/30" : "text-muted-foreground border-border hover:border-primary/30"}`}
                      >
                        <Calendar className="h-3 w-3" /> No due date
                      </button>
                    </div>
                    <TaskList
                      tasks={tasks} onChange={setTasks}
                      filterLowConfidence={filterLow} filterUnassigned={filterUnassigned} filterNoDate={filterNoDate}
                      viewMode={viewMode}
                      onConvertToConfirm={convertTaskToConfirm}
                      onEvidenceClick={handleEvidenceClick}
                    />
                  </TabsContent>
                  <TabsContent value="decisions" className="mt-0">
                    <DecisionList
                      decisions={decisions} onChange={setDecisions}
                      filterLowConfidence={filterLow} viewMode={viewMode}
                      onConvertToTask={convertDecisionToTask}
                      onConvertToConfirm={convertDecisionToConfirm}
                      onEvidenceClick={handleEvidenceClick}
                    />
                  </TabsContent>
                  <TabsContent value="confirm" className="mt-0">
                    <p className="text-[11px] text-muted-foreground mb-3 font-mono">Only blockers / missing info</p>
                    <ConfirmList
                      items={questions} onChange={setQuestions}
                      filterLowConfidence={filterLow} viewMode={viewMode}
                      onConvertToTask={convertConfirmToTask}
                      onConvertToDecision={convertConfirmToDecision}
                      onEvidenceClick={handleEvidenceClick}
                    />
                  </TabsContent>
                </div>
              </Tabs>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t flex items-center gap-2">
                <Input value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Edit notes…" className="text-sm flex-1 h-8" />
                <div className="flex items-center gap-1.5 shrink-0">
                  <Switch checked={heavyEdits} onCheckedChange={setHeavyEdits} className="scale-75" />
                  <span className="text-[11px] font-mono text-muted-foreground">Heavy edits</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <Button onClick={handleSaveEdits} size="sm" className="font-mono text-xs h-7">
                  <Save className="h-3 w-3 mr-1" /> Save
                </Button>
                <Button onClick={handleCopy} variant="outline" size="sm" className="font-mono text-xs h-7">
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
                <Button onClick={handleExportMD} variant="outline" size="sm" className="font-mono text-xs h-7">
                  <FileText className="h-3 w-3 mr-1" /> MD
                </Button>
                <Button onClick={handleExportJSON} variant="outline" size="sm" className="font-mono text-xs h-7">
                  <FileJson className="h-3 w-3 mr-1" /> JSON
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
