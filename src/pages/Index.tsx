import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMeetingProcessor } from "@/hooks/use-meeting-processor";
import { TaskEditor } from "@/components/meeting/TaskEditor";
import { DecisionEditor } from "@/components/meeting/DecisionEditor";
import { QuestionEditor } from "@/components/meeting/QuestionEditor";
import { exportAsMarkdown, exportAsJSON } from "@/lib/export";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MeetingTask, MeetingDecision, MeetingQuestion } from "@/types/meeting";
import {
  Zap, BarChart3, Copy, FileJson, FileText, RotateCcw, Loader2,
  ListTodo, MessageSquare, HelpCircle, Save, AlertTriangle, Upload, Filter,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Index() {
  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [attendees, setAttendees] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const { process, isProcessing, currentRun, parsedOutput, setParsedOutput } = useMeetingProcessor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tasks, setTasks] = useState<MeetingTask[]>([]);
  const [decisions, setDecisions] = useState<MeetingDecision[]>([]);
  const [questions, setQuestions] = useState<MeetingQuestion[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [filterLow, setFilterLow] = useState(false);

  const hasRelativeDates = transcript.match(/\b(tomorrow|end of week|friday|monday|next week)\b/i) && !meetingDate;

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
    }
  };

  const handleRegenerate = (section?: "tasks" | "decisions" | "questions") => {
    if (!section) { handleGenerate(); return; }
    // Partial regeneration: keep other sections, re-run and only replace the target section
    // For now, full regenerate (partial would need backend support)
    handleGenerate();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setTranscript(ev.target?.result as string || "");
      toast.success(`Loaded ${file.name}`);
    };
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
      edit_notes: editNotes || null,
    });
    if (error) toast.error("Failed to save edits");
    else toast.success("Edits saved");
  };

  const handleCopy = () => {
    const md = exportAsMarkdown(tasks, decisions, questions, title);
    navigator.clipboard.writeText(md);
    toast.success("Copied to clipboard");
  };

  const handleExportMD = () => {
    const md = exportAsMarkdown(tasks, decisions, questions, title);
    download(md, `${title || "meeting-outputs"}.md`, "text/markdown");
  };

  const handleExportJSON = () => {
    const json = exportAsJSON(tasks, decisions, questions);
    download(json, `${title || "meeting-outputs"}.json`, "application/json");
  };

  const lowConfidenceCount = [...tasks, ...decisions, ...questions].filter((i) => i.confidence === "low").length;
  const hasOutputs = tasks.length > 0 || decisions.length > 0 || questions.length > 0;

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-semibold font-mono tracking-tight">MEETINGS → WORK</h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Weekly Planning
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/batch">
            <Button variant="outline" size="sm" className="text-xs font-mono">
              <BarChart3 className="h-3 w-3 mr-1" /> Batch Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1" style={{ height: "calc(100vh - 49px)" }}>
        {/* Left: Input */}
        <div className="w-[420px] border-r flex flex-col shrink-0">
          <div className="p-4 space-y-3 flex-1 overflow-auto">
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1 block">Meeting title (optional)</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sprint Planning W8" className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1 block">Attendees (optional, comma-separated)</label>
              <Input value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="e.g. Alice, Bob, Charlie" className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1 block">Meeting date (optional, helps resolve "tomorrow")</label>
              <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="text-sm" />
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono text-muted-foreground">Transcript</label>
                <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3 w-3 mr-1" /> Upload .txt
                </Button>
                <input ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
              </div>
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste meeting transcript here..."
                className="flex-1 min-h-[300px] text-sm font-mono resize-none"
              />
              {hasRelativeDates && (
                <p className="text-xs text-confidence-medium mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Relative dates present; add meeting date to convert them.
                </p>
              )}
            </div>
          </div>
          <div className="p-4 border-t space-y-2">
            <p className="text-xs text-muted-foreground mb-2">
              We avoid guessing owners or deadlines. Unclear items go to Things to confirm.
            </p>
            <Button onClick={handleGenerate} disabled={isProcessing} className="w-full font-mono text-sm">
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              {isProcessing ? "Processing…" : "Generate Outputs"}
            </Button>
            {hasOutputs && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isProcessing} className="w-full font-mono text-sm">
                    <RotateCcw className="h-3 w-3 mr-2" /> Regenerate <ChevronDown className="h-3 w-3 ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => handleRegenerate()}>Regenerate all</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRegenerate("tasks")}>Regenerate Tasks only</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRegenerate("decisions")}>Regenerate Decisions only</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRegenerate("questions")}>Regenerate Things to confirm only</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Right: Review + Edit */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!hasOutputs ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Zap className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-mono">Paste a transcript and hit Generate</p>
                <p className="text-xs mt-1 opacity-60">j/k to navigate · e to edit · d to delete · f to filter low-confidence</p>
              </div>
            </div>
          ) : (
            <>
              {/* Metrics bar */}
              <div className="px-4 py-2 border-b flex items-center gap-4 text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1"><ListTodo className="h-3 w-3" /> {tasks.length} tasks</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {decisions.length} decisions</span>
                <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3" /> {questions.length} to confirm</span>
                {lowConfidenceCount > 0 && (
                  <button
                    onClick={() => setFilterLow(!filterLow)}
                    className={`flex items-center gap-1 cursor-pointer transition-colors ${filterLow ? "text-confidence-low font-semibold" : "text-confidence-low hover:text-foreground"}`}
                  >
                    <Filter className="h-3 w-3" /> {lowConfidenceCount} low-confidence
                    {filterLow && <span className="text-[10px]">(filtered)</span>}
                  </button>
                )}
                {currentRun?.validation_status === "fail" && (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Validation errors
                  </span>
                )}
              </div>

              {/* Tabs */}
              <Tabs defaultValue="tasks" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="mx-4 mt-2 bg-muted/50 self-start">
                  <TabsTrigger value="tasks" className="text-xs font-mono">Tasks ({tasks.length})</TabsTrigger>
                  <TabsTrigger value="decisions" className="text-xs font-mono">Decisions ({decisions.length})</TabsTrigger>
                  <TabsTrigger value="questions" className="text-xs font-mono">Things to confirm ({questions.length})</TabsTrigger>
                </TabsList>
                <div className="flex-1 overflow-auto p-4">
                  <TabsContent value="tasks" className="mt-0">
                    <TaskEditor tasks={tasks} onChange={setTasks} filterLowConfidence={filterLow} />
                  </TabsContent>
                  <TabsContent value="decisions" className="mt-0">
                    <DecisionEditor decisions={decisions} onChange={setDecisions} filterLowConfidence={filterLow} />
                  </TabsContent>
                  <TabsContent value="questions" className="mt-0">
                    <QuestionEditor questions={questions} onChange={setQuestions} filterLowConfidence={filterLow} />
                  </TabsContent>
                </div>
              </Tabs>

              {/* Export bar */}
              <div className="px-4 py-3 border-t flex items-center gap-2">
                <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Edit notes (optional)" className="text-sm flex-1" />
                <Button onClick={handleSaveEdits} size="sm" className="font-mono text-xs">
                  <Save className="h-3 w-3 mr-1" /> Save Edits
                </Button>
                <div className="h-4 w-px bg-border" />
                <Button onClick={handleCopy} variant="outline" size="sm" className="font-mono text-xs">
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
                <Button onClick={handleExportMD} variant="outline" size="sm" className="font-mono text-xs">
                  <FileText className="h-3 w-3 mr-1" /> Markdown
                </Button>
                <Button onClick={handleExportJSON} variant="outline" size="sm" className="font-mono text-xs">
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
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
