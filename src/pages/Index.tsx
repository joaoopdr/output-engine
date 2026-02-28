import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  Zap, Copy, FileJson, FileText, Loader2,
  Save, AlertTriangle, Upload, Eraser, User, Calendar,
  LayoutGrid, HelpCircle, CheckCircle2, Shield, Eye,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

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

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

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
  const wc = useMemo(() => wordCount(transcript), [transcript]);

  useEffect(() => {
    if (tasks.length > 0 || decisions.length > 0 || questions.length > 0) setIsDirty(true);
  }, [tasks, decisions, questions]);

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
    <TooltipProvider>
      <div className="dark min-h-screen bg-background text-foreground">
        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} onAction={handleCommand} />

        {/* Header */}
        <header className="border-b border-border/60 px-5 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium tracking-wide text-muted-foreground">
              Meetings → Work
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Weekly Planning
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Link to="/batch">
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1.5 text-muted-foreground hover:text-foreground">
                <LayoutGrid className="h-3.5 w-3.5" /> Batch
              </Button>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" className="max-w-[240px] text-xs space-y-1 p-3">
                <p className="font-medium text-foreground mb-1.5">Keyboard shortcuts</p>
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-center">/</kbd><span>Command palette</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-center">j/k</kbd><span>Navigate items</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-center">e</kbd><span>Edit item</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-center">d</kbd><span>Delete item</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-center">f</kbd><span>Filter low-confidence</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        <div className="flex" style={{ height: "calc(100vh - 41px)" }}>
          {/* Left: Input Panel */}
          <div className="w-[460px] border-r border-border/40 flex flex-col shrink-0 bg-background">
            <div className="px-6 pt-6 pb-4 space-y-4 flex-1 flex flex-col overflow-auto custom-scrollbar">
              {/* Floating label inputs */}
              <div className="floating-label-group">
                <input
                  id="title-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder=" "
                  className="h-[52px]"
                />
                <label htmlFor="title-input">Title</label>
              </div>

              <div>
                <div className="floating-label-group">
                  <input
                    id="attendees-input"
                    value={attendees}
                    onChange={e => setAttendees(e.target.value)}
                    placeholder=" "
                    className="h-[52px]"
                  />
                  <label htmlFor="attendees-input">Attendees</label>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 ml-1">Helps assign owners automatically</p>
              </div>

              <div>
                <div className="floating-label-group">
                  <input
                    id="date-input"
                    value={meetingDate}
                    onChange={e => setMeetingDate(e.target.value)}
                    placeholder=" "
                    className="h-[52px]"
                  />
                  <label htmlFor="date-input">Meeting date</label>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 ml-1">e.g. 12 Jun 2025 — resolves "tomorrow", "Friday"</p>
              </div>

              {/* Transcript */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Transcript</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[11px] h-6 px-2.5 text-muted-foreground hover:text-foreground"
                      onClick={() => setTranscript(DEMO_TRANSCRIPT)}
                    >
                      Example
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[11px] h-6 px-2.5 text-muted-foreground hover:text-foreground"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3 w-3 mr-1" /> Upload .txt
                    </Button>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
                </div>
                <div className="relative flex-1 min-h-[240px]">
                  <textarea
                    ref={transcriptRef}
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    placeholder={"Paste your meeting transcript here...\nOr load an example →"}
                    className="transcript-textarea w-full h-full rounded-lg border border-input bg-transparent px-3.5 py-3 text-sm resize-none transition-colors placeholder:text-muted-foreground/60"
                  />
                  {wc > 0 && (
                    <span className="absolute bottom-2.5 right-3 text-[10px] text-muted-foreground/50 pointer-events-none">
                      {wc} words
                    </span>
                  )}
                </div>
                {hasRelativeDates && (
                  <p className="text-[11px] text-confidence-medium mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Relative dates detected — add meeting date to resolve them.
                  </p>
                )}
              </div>

              {/* Generate area */}
              <div className="pt-1 space-y-2.5">
                <p className="text-[11px] text-muted-foreground italic">
                  We avoid guessing owners or deadlines. Unclear items go to Things to confirm.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={isProcessing}
                    className={`generate-btn flex-1 h-[52px] rounded-lg text-primary-foreground font-medium text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isProcessing ? 'loading' : ''}`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-1.5">
                        Generating
                        <span className="inline-flex gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-primary-foreground animate-pulse" style={{ animationDelay: "0ms" }} />
                          <span className="w-1 h-1 rounded-full bg-primary-foreground animate-pulse" style={{ animationDelay: "150ms" }} />
                          <span className="w-1 h-1 rounded-full bg-primary-foreground animate-pulse" style={{ animationDelay: "300ms" }} />
                        </span>
                      </span>
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    {isProcessing ? "" : "Generate outputs"}
                  </button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-[52px] w-[52px] shrink-0 border-border/60"
                    onClick={handleClear}
                    title="Clear all"
                  >
                    <Eraser className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Subtle divider */}
          <div className="w-px bg-border/30" />

          {/* Right: Outputs */}
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {!hasOutputs ? (
              /* Empty state */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-sm">
                  {/* 3-step visual */}
                  <div className="flex items-center justify-center gap-0 mb-8">
                    {[
                      { num: 1, label: "Paste transcript" },
                      { num: 2, label: "Hit Generate" },
                      { num: 3, label: "Review & export" },
                    ].map((step, i) => (
                      <div key={step.num} className="flex items-center">
                        {i > 0 && <div className="w-10 h-px bg-primary/20 mx-1" />}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-8 h-8 rounded-full border border-primary/40 flex items-center justify-center text-xs font-medium text-primary">
                            {step.num}
                          </div>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">{step.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Value chips */}
                  <div className="flex items-center justify-center gap-2 mb-8">
                    {[
                      { icon: CheckCircle2, label: "Commitments only" },
                      { icon: Eye, label: "Evidence shown" },
                      { icon: FileText, label: "Export-ready" },
                    ].map(({ icon: Icon, label }) => (
                      <span key={label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 px-2.5 py-1 rounded-full border border-border/40 bg-primary/5">
                        <Icon className="h-3 w-3 text-primary/60" />
                        {label}
                      </span>
                    ))}
                  </div>

                  {/* Shortcut badge */}
                  <p className="text-[11px] text-muted-foreground/50">
                    Press{" "}
                    <kbd className="px-1.5 py-0.5 rounded border border-border/60 bg-muted/50 text-[10px]">/</kbd>
                    {" "}for commands
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
                  <TabsList className="mx-4 mt-2 bg-transparent self-start border-0 border-b border-border/40 rounded-none p-0 gap-0">
                    <TabsTrigger value="tasks" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground/70 px-4 pb-2.5 pt-1.5">
                      Tasks <span className="opacity-60">({tasks.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="decisions" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground/70 px-4 pb-2.5 pt-1.5">
                      Decisions <span className="opacity-60">({decisions.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="confirm" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground/70 px-4 pb-2.5 pt-1.5">
                      Things to confirm <span className="opacity-60">({questions.length})</span>
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    <TabsContent value="tasks" className="mt-0">
                      <div className="flex gap-1.5 mb-3">
                        <button
                          onClick={() => setFilterUnassigned(v => !v)}
                          className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${filterUnassigned ? "bg-primary/10 text-primary border-primary/25" : "text-muted-foreground border-border/50 hover:border-primary/25"}`}
                        >
                          <User className="h-3 w-3" /> Unassigned
                        </button>
                        <button
                          onClick={() => setFilterNoDate(v => !v)}
                          className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${filterNoDate ? "bg-primary/10 text-primary border-primary/25" : "text-muted-foreground border-border/50 hover:border-primary/25"}`}
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
                      <p className="text-[11px] text-muted-foreground mb-3 italic">Only blockers and missing info</p>
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
                <div className="px-4 py-2.5 border-t border-border/40 flex items-center gap-2">
                  <input
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="Edit notes…"
                    className="text-sm flex-1 h-7 rounded-md border border-input bg-transparent px-3 placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Switch checked={heavyEdits} onCheckedChange={setHeavyEdits} className="scale-75" />
                    <span className="text-[11px] text-muted-foreground">Heavy edits</span>
                  </div>
                  <div className="h-4 w-px bg-border/40" />
                  <div className="flex items-center gap-0.5 border border-border/40 rounded-md px-0.5">
                    <Button onClick={handleCopy} variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground">
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                    <Button onClick={handleExportMD} variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground">
                      <FileText className="h-3 w-3" /> MD
                    </Button>
                    <Button onClick={handleExportJSON} variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground">
                      <FileJson className="h-3 w-3" /> JSON
                    </Button>
                  </div>
                  <div className="h-4 w-px bg-border/40" />
                  <button
                    onClick={handleSaveEdits}
                    className="generate-btn h-7 px-3 rounded-md text-primary-foreground text-xs font-medium flex items-center gap-1"
                  >
                    <Save className="h-3 w-3" /> Save
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
