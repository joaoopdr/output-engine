import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMeetingProcessor } from "@/hooks/use-meeting-processor";
import { TaskList } from "@/components/meeting/TaskList";
import { DecisionList } from "@/components/meeting/DecisionList";
import { ConfirmList } from "@/components/meeting/ConfirmList";
import { OutputHeader } from "@/components/meeting/OutputHeader";
import { CommandPalette } from "@/components/meeting/CommandPalette";
import { exportAsMarkdown, exportAsJSON, exportAsPlainText } from "@/lib/export";
import { parseMeetingDate } from "@/lib/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MeetingTask, MeetingDecision, MeetingQuestion, TemplateType, HandoffContext } from "@/types/meeting";
import { TEMPLATE_OPTIONS } from "@/types/meeting";
import {
  Zap, Copy, FileJson, FileText, Loader2,
  Save, AlertTriangle, Upload, Eraser, User, Calendar,
  LayoutGrid, HelpCircle, CheckCircle2, Shield, Eye,
  Sun, Moon, FileType, ChevronDown, ChevronRight, Check, AlertCircle,
  Share2, ClipboardList, Handshake, Timer,
} from "lucide-react";
import { SharePanel } from "@/components/meeting/SharePanel";
import { TimePreferences, loadTimePrefs, type TimePrefs } from "@/components/meeting/TimePreferences";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";

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

const DEMO_HANDOFF_TRANSCRIPT = `Sarah (AE): Alright everyone — I'm handing Meridian Health over to our delivery team. Tom, you'll be the lead on implementation.
Tom (Delivery Lead): Got it. Meridian, can you give us a quick overview of what you're hoping to get out of this?
James (Meridian CTO): Sure. We need to replace our patient scheduling system before Q3. The old one causes about 40 missed appointments a day. We go live July 1st — that's fixed, not flexible.
Tom: Understood. July 1st is locked. Sarah, what was agreed on scope?
Sarah: Phase 1 is scheduling and reminders only. Patient portal integration is Phase 2, out of scope for now.
Tom: Perfect. I'll set up the staging environment by end of this week.
James: We'll need your staging environment to meet our HIPAA compliance requirements. I'll get you our security checklist by Wednesday.
Tom: Great. Once we have that I can start environment config. I'll need SSO credentials from your IT team as well — can you get those to us?
James: Lisa from our IT team is on this call. Lisa, can you handle that?
Lisa (Meridian IT): Yes, I can have SSO credentials ready by Friday.
Tom: Perfect. I'll assign Maya to handle the data migration planning — she'll reach out to you directly, James.
Sarah: Pricing is locked at the contracted rate. No changes.
Tom: One thing to flag — we haven't confirmed who owns UAT sign-off on the Meridian side. James, is that you?
James: Probably me, but let me confirm with our compliance officer. I'll come back to you by Monday.
Tom: Works for us. I'll draft a project kickoff doc and share it with everyone by Thursday.
Sarah: And I'll send the signed contract copy to Tom and Maya today.`;

const DEMO_SPRINT_TRANSCRIPT = `Sarah (PM): Alright, sprint goal for this one is getting the checkout flow production-ready. That's our north star for the next two weeks.
Dev (Tech Lead): Agreed. Let's go through the stories. First up — payment processing integration. Tom, that's yours?
Tom: Yeah, I'll take it. Three points. Done means: card payments work end to end in staging, error states handled, and we have a unit test suite covering the main flows.
Dev: Perfect. Next — order confirmation emails. Who's picking that up?
Lisa: I'll do it. It's straightforward — two points. Done when confirmation email sends within 30 seconds of order, with correct order details and a working unsubscribe link.
Dev: Good. Cart persistence across sessions — that's been on the backlog forever.
Sarah: That's in for this sprint. It's blocking our return-user conversion rate.
Tom: I can take that too. Five points — it's more complex than it looks. Needs to work across devices. Done when cart state survives browser close and login/logout.
Dev: Shipping address validation — Lisa?
Lisa: Yes, three points. Done when we validate format, flag invalid postcodes, and integrate with the address lookup API.
Dev: One thing we haven't resolved — the discount code system. Sarah, is that in this sprint?
Sarah: Not in scope. Next sprint. Too much scope risk.
Dev: Agreed, pushing it. One dependency flag — Tom's cart persistence work needs the auth refactor to be merged first. Is that done?
Tom: Should be merged by Monday. If not, I'll flag it.
Dev: Let's add that as a confirm item. Also — mobile responsive pass for the whole checkout, is anyone owning that?
Sarah: Nobody's committed to it yet. We should probably add it.
Dev: Let's put it as unassigned for now and confirm in standup tomorrow.`;

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function ThemedLogo({ className = "h-9" }: { className?: string }) {
  return (
    <>
      <img src="/logo-dark.png" alt="BriefSync" className={`${className} dark:block hidden`} />
      <img src="/logo-light.png" alt="BriefSync" className={`${className} dark:hidden block`} />
    </>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </Button>
  );
}

function HandoffContextCard({ context }: { context: HandoffContext }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mx-4 mt-3 rounded-lg border border-border/60 bg-muted/30">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-left">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{context.customer_name}</h3>
          <p className="text-xs text-muted-foreground truncate">{context.customer_goal}</p>
        </div>
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
          {context.success_criteria.length > 0 && (
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Success Criteria</span>
              <ul className="mt-1 space-y-1">
                {context.success_criteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                    <Check className="h-3 w-3 mt-0.5 shrink-0 text-[hsl(var(--confidence-high))]" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {context.constraints.length > 0 && (
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Constraints</span>
              <ul className="mt-1 space-y-1">
                {context.constraints.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0 text-[hsl(var(--confidence-medium))]" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {context.key_stakeholders.length > 0 && (
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Key Stakeholders</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {context.key_stakeholders.map((s, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      s.side === "customer"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    }`}
                  >
                    {s.name} <span className="opacity-60">· {s.role}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SideBadge({ side }: { side: "internal" | "customer" }) {
  return side === "customer" ? (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
      Customer
    </span>
  ) : (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
      Internal
    </span>
  );
}

export default function Index() {
  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [attendees, setAttendees] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [templateType, setTemplateType] = useState<TemplateType>("weekly_planning");
  const { process, isProcessing, currentRun } = useMeetingProcessor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const [tasks, setTasks] = useState<MeetingTask[]>([]);
  const [decisions, setDecisions] = useState<MeetingDecision[]>([]);
  const [questions, setQuestions] = useState<MeetingQuestion[]>([]);
  const [handoffContext, setHandoffContext] = useState<HandoffContext | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [heavyEdits, setHeavyEdits] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const [filterLow, setFilterLow] = useState(false);
  const [filterOwner, setFilterOwner] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterSide, setFilterSide] = useState<"all" | "internal" | "customer">("all");
  const [viewMode, setViewMode] = useState<"clean" | "review">("clean");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [timePrefs, setTimePrefs] = useState<TimePrefs>(loadTimePrefs);
  const [inputCollapsed, setInputCollapsed] = useState(false);
  const isMobile = useIsMobile();

  const isHandoff = templateType === "customer_handoff";
  const isSprint = templateType === "sprint_planning";
  const meetingDateInvalid = !meetingDate || !parseMeetingDate(meetingDate);
  const hasRelativeDates = transcript.match(/\b(tomorrow|tonight|today|end of week|friday|monday|next week|morning|evening)\b/i) && meetingDateInvalid;
  const wc = useMemo(() => wordCount(transcript), [transcript]);
  const resolvedMeetingDate = useMemo(() => parseMeetingDate(meetingDate), [meetingDate]);
  const meetingDatePreview = resolvedMeetingDate ? format(resolvedMeetingDate, "EEEE, d MMM yyyy") : null;

  const internalCount = tasks.filter(t => t.side !== "customer").length;
  const customerCount = tasks.filter(t => t.side === "customer").length;

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
    if (hasRelativeDates && !isHandoff) {
      toast.warning("Relative dates detected", {
        description: "This transcript contains words like 'tomorrow' or 'tonight'. Add a meeting date so deadlines resolve correctly.",
        duration: 8000,
        id: "relative-date-warning",
      });
    }
    const result = await process({
      transcript_text: transcript, title, attendees,
      template_type: templateType, meeting_date: meetingDate,
    });
    if (result?.output) {
      setTasks(result.output.tasks);
      setDecisions(result.output.decisions);
      setQuestions(result.output.open_questions);
      setHandoffContext(result.output.handoff_context || null);
      setIsDirty(false);
      setFilterSide("all");
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
    else {
      toast.success("Edits saved");
      setIsDirty(false);
      setSavedRecently(true);
      setTimeout(() => setSavedRecently(false), 2000);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportAsMarkdown(tasks, decisions, questions, title, meetingDate, attendees));
    toast.success("Copied to clipboard");
  };

  const handleExportMD = () => {
    download(exportAsMarkdown(tasks, decisions, questions, title, meetingDate, attendees), `${title || "meeting-outputs"}.md`, "text/markdown");
  };

  const handleExportJSON = () => {
    download(exportAsJSON(tasks, decisions, questions), `${title || "meeting-outputs"}.json`, "application/json");
  };

  const handleExportTXT = () => {
    download(exportAsPlainText(tasks, decisions, questions, title, meetingDate, attendees), `${title || "meeting-outputs"}.txt`, "text/plain");
  };

  const handleClear = () => {
    setTranscript(""); setTitle(""); setAttendees(""); setMeetingDate("");
    setTasks([]); setDecisions([]); setQuestions([]); setHandoffContext(null);
    setEditNotes(""); setHeavyEdits(false); setIsDirty(false); setFilterSide("all");
  };

  const handleEvidenceClick = useCallback((snippet: string) => {
    if (!transcriptRef.current) return;
    const text = transcriptRef.current.value;
    const idx = text.toLowerCase().indexOf(snippet.toLowerCase().slice(0, 30));
    if (idx >= 0) {
      transcriptRef.current.focus();
      transcriptRef.current.setSelectionRange(idx, idx + snippet.length);
      const scrollRatio = idx / text.length;
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight * scrollRatio;

      if (highlightRef.current) {
        const el = highlightRef.current;
        const top = scrollRatio * transcriptRef.current.scrollHeight - transcriptRef.current.scrollTop;
        el.style.top = `${Math.max(0, top)}px`;
        el.style.opacity = "1";
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = setTimeout(() => { el.style.opacity = "0"; }, 1200);
      }
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
      confidence: d.confidence, priority: "when possible" as const, priority_reason: "No deadline found",
      evidence: d.evidence || [], notes: "",
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
      confidence: q.confidence, priority: "when possible" as const, priority_reason: "No deadline found",
      evidence: q.evidence || [], notes: "",
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
    if (action === "filter-unassigned") setFilterOwner(v => v === "Unassigned" ? null : "Unassigned");
    if (action === "filter-no-date") setFilterDate(v => v === "__none__" ? null : "__none__");
    if (action === "toggle-mode") setViewMode(v => v === "clean" ? "review" : "clean");
    if (action === "export-markdown") handleExportMD();
    if (action === "regen-tasks") handleRegenerate("tasks");
    if (action === "regen-decisions") handleRegenerate("decisions");
    if (action === "regen-confirm") handleRegenerate("confirm");
    if (action === "regen-all") handleRegenerate();
  };

  const lowConfidenceCount = [...tasks, ...decisions, ...questions].filter(i => i.confidence === "low").length;
  const hasOutputs = tasks.length > 0 || decisions.length > 0 || questions.length > 0;

  // Filter tasks by side for handoff
  const displayTasks = isHandoff && filterSide !== "all"
    ? tasks.filter(t => filterSide === "customer" ? t.side === "customer" : t.side !== "customer")
    : tasks;

  const templateLabel = TEMPLATE_OPTIONS.find(o => o.value === templateType)?.label || "Weekly Planning";

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} onAction={handleCommand} />

        {/* Header */}
        <header className="border-b border-border/60 px-5 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ThemedLogo className="h-12 w-auto" />
          </div>
          <div className="flex items-center gap-1.5">
            <Link to="/batch" className="hidden lg:inline-flex">
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1.5 text-muted-foreground hover:text-foreground">
                <LayoutGrid className="h-3.5 w-3.5" /> Batch
              </Button>
            </Link>
            <ThemeToggle />
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

        <div className="flex flex-col lg:flex-row" style={{ height: "calc(100vh - 41px)" }}>
          {/* Left: Input Panel */}
          <div className={`${isMobile ? 'w-full' : 'w-[460px]'} border-r border-border/40 flex flex-col shrink-0 bg-background ${isMobile && hasOutputs && inputCollapsed ? 'hidden' : ''}`}>
            {isMobile && hasOutputs && (
              <button
                onClick={() => setInputCollapsed(!inputCollapsed)}
                className="flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground border-b border-border/40"
              >
                {inputCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {inputCollapsed ? "Show input" : "Hide input"}
              </button>
            )}
            <div className="px-6 pt-4 pb-4 space-y-4 flex-1 flex flex-col overflow-auto custom-scrollbar">
              {/* Meeting type cards */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {([
                  { value: "weekly_planning" as TemplateType, label: "Weekly Planning", icon: ClipboardList, emoji: "📋" },
                  { value: "customer_handoff" as TemplateType, label: "Customer Handoff", icon: Handshake, emoji: "🤝" },
                  { value: "sprint_planning" as TemplateType, label: "Sprint Planning", icon: Timer, emoji: "⚡" },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTemplateType(opt.value)}
                    className={`flex-shrink-0 flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 w-[120px] transition-all text-left ${
                      templateType === opt.value
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/50 hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    <span className={`text-[11px] font-medium leading-tight ${
                      templateType === opt.value ? "text-primary" : "text-muted-foreground"
                    }`}>{opt.label}</span>
                  </button>
                ))}
              </div>

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
                <div className="flex items-center gap-1.5">
                  <div className="floating-label-group relative flex-1">
                    <input
                      id="date-input"
                      value={meetingDate}
                      onChange={e => setMeetingDate(e.target.value)}
                      placeholder=" "
                      className="h-[52px] pr-16"
                    />
                    <label htmlFor="date-input">Meeting date</label>
                    <button
                      type="button"
                      onClick={() => setMeetingDate(format(new Date(), "dd/MM/yyyy"))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      Today
                    </button>
                  </div>
                  <TimePreferences onChange={setTimePrefs} />
                </div>
                {meetingDatePreview ? (
                  <p className="text-[11px] text-primary mt-1 ml-1">→ {meetingDatePreview}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-1 ml-1">e.g. 12 Jun 2025 — resolves "tomorrow", "Friday"</p>
                )}
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
                      onClick={() => setTranscript(isHandoff ? DEMO_HANDOFF_TRANSCRIPT : isSprint ? DEMO_SPRINT_TRANSCRIPT : DEMO_TRANSCRIPT)}
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
                  {/* Evidence highlight overlay */}
                  <div
                    ref={highlightRef}
                    className="absolute left-0 h-5 w-full bg-primary/20 rounded pointer-events-none transition-opacity duration-500"
                    style={{ opacity: 0, top: 0 }}
                  />
                  {wc > 0 && (
                    <span className="absolute bottom-2.5 right-3 text-[10px] text-muted-foreground/50 pointer-events-none">
                      {wc} words
                    </span>
                  )}
                </div>
              </div>

              {/* Generate area */}
              <div className="pt-1 space-y-2.5">
                <p className="text-[11px] text-muted-foreground italic">
                  {isHandoff
                    ? "Extracts tasks (internal + customer), promises, and open items from handoff meetings."
                    : "We avoid guessing owners or deadlines. Unclear items go to Things to confirm."}
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
                {!hasOutputs && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    Press <kbd className="px-1 py-0.5 rounded border border-border/60 bg-muted/50 text-[9px]">/</kbd> for commands
                  </p>
                )}
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
                <div className="text-center max-w-sm space-y-6">
                  <ThemedLogo className="h-32 mx-auto" />
                  <p className="text-sm text-muted-foreground">Paste a transcript on the left and hit Generate</p>

                  <div className="space-y-2 text-left mx-auto w-fit">
                    {[
                      { keys: "⌘K or /", desc: "Open command palette" },
                      { keys: "j / k", desc: "Navigate tasks with keyboard" },
                      { keys: "Upload .txt", desc: "Or upload a transcript file" },
                    ].map((hint) => (
                      <div key={hint.keys} className="flex items-center gap-3 text-muted-foreground/60">
                        <kbd className="px-2 py-0.5 rounded border border-border/50 bg-muted/30 text-[10px] font-mono min-w-[80px] text-center">{hint.keys}</kbd>
                        <span className="text-[11px]">{hint.desc}</span>
                      </div>
                    ))}
                  </div>
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

                {/* Handoff context card */}
                {isHandoff && handoffContext && <HandoffContextCard context={handoffContext} />}

                <Tabs defaultValue="tasks" className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="mx-4 mt-2 bg-transparent self-start border-0 border-b border-border/40 rounded-none p-0 gap-0">
                    <TabsTrigger value="tasks" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground/70 px-4 pb-2.5 pt-1.5">
                      Tasks {isHandoff ? (
                        <span className="opacity-60">({internalCount} internal · {customerCount} customer)</span>
                      ) : (
                        <span className="opacity-60">({tasks.length})</span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="decisions" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground/70 px-4 pb-2.5 pt-1.5">
                      {isHandoff ? "Promises" : "Decisions"} <span className="opacity-60">({decisions.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="confirm" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground/70 px-4 pb-2.5 pt-1.5">
                      Things to confirm <span className="opacity-60">({questions.length})</span>
                    </TabsTrigger>
                    {(tasks.length > 0 || decisions.length > 0) && (
                      <TabsTrigger value="share" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground/70 px-4 pb-2.5 pt-1.5">
                        <Share2 className="h-3 w-3" /> Share
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    <TabsContent value="tasks" className="mt-0">
                      <div className="flex items-center gap-2 mb-3 w-fit">
                        {/* Side filter for handoff */}
                        {isHandoff && (
                          <div className="flex rounded-md border border-border/50 overflow-hidden mr-1">
                            {(["all", "internal", "customer"] as const).map(s => (
                              <button
                                key={s}
                                onClick={() => setFilterSide(s)}
                                className={`text-[10px] font-medium px-2.5 py-1 transition-colors ${
                                  filterSide === s
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                              >
                                {s === "all" ? "All" : s === "internal" ? "Internal" : "Customer"}
                              </button>
                            ))}
                          </div>
                        )}
                        {/* Owner filter dropdown */}
                        <div className="relative inline-flex items-center">
                          {filterOwner && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary z-10" />}
                          <select
                            value={filterOwner || ""}
                            onChange={e => setFilterOwner(e.target.value || null)}
                            className={`appearance-none text-xs px-3 py-1 rounded-full border transition-colors cursor-pointer bg-transparent ${filterOwner ? "bg-primary/10 text-primary border-primary/25" : "text-muted-foreground border-border/50 hover:border-primary/25"}`}
                          >
                            <option value="">All owners</option>
                            {[...new Set(tasks.map(t => t.owner))].sort().map(owner => (
                              <option key={owner} value={owner}>{owner}</option>
                            ))}
                          </select>
                        </div>
                        {/* Date filter dropdown */}
                        <div className="relative inline-flex items-center">
                          {filterDate && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary z-10" />}
                          <select
                            value={filterDate || ""}
                            onChange={e => setFilterDate(e.target.value || null)}
                            className={`appearance-none text-xs px-3 py-1 rounded-full border transition-colors cursor-pointer bg-transparent ${filterDate ? "bg-primary/10 text-primary border-primary/25" : "text-muted-foreground border-border/50 hover:border-primary/25"}`}
                          >
                            <option value="">All dates</option>
                            <option value="__none__">No due date</option>
                            {[...new Set(tasks.filter(t => t.due_date_display).map(t => t.due_date_display!))].sort().map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <TaskList
                        tasks={displayTasks} onChange={(newTasks) => {
                          // When filtered by side, merge back changes
                          if (isHandoff && filterSide !== "all") {
                            const otherTasks = tasks.filter(t => filterSide === "customer" ? t.side !== "customer" : t.side === "customer");
                            setTasks([...otherTasks, ...newTasks]);
                          } else {
                            setTasks(newTasks);
                          }
                        }}
                        filterLowConfidence={filterLow} filterOwner={filterOwner} filterDate={filterDate}
                        viewMode={viewMode}
                        meetingDate={meetingDate}
                        attendees={attendees}
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
                    <TabsContent value="share" className="mt-0">
                      <SharePanel
                        tasks={tasks}
                        decisions={decisions}
                        questions={questions}
                        title={title}
                        attendees={attendees}
                        meetingDate={meetingDate}
                        templateType={templateType}
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
                    {savedRecently && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--confidence-high))] animate-in fade-in duration-300" />
                    )}
                  </div>
                  <div className="h-4 w-px bg-border/40" />
                  <div className="flex items-center gap-0.5 border border-border/40 rounded-md px-0.5">
                    <Button onClick={handleCopy} variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground">
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                    <Button onClick={handleExportMD} variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground">
                      <FileText className="h-3 w-3" /> MD
                    </Button>
                    <Button onClick={handleExportTXT} variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground">
                      <FileType className="h-3 w-3" /> TXT
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
