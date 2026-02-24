import { useState } from "react";
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
import type { MeetingTask, MeetingDecision, MeetingQuestion, ParsedOutput } from "@/types/meeting";
import { TEMPLATE_OPTIONS } from "@/types/meeting";
import {
  Zap, BarChart3, Copy, FileJson, FileText, RotateCcw, Loader2,
  ListTodo, MessageSquare, HelpCircle, Save, AlertTriangle,
} from "lucide-react";

export default function Index() {
  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [attendees, setAttendees] = useState("");
  const [template, setTemplate] = useState(TEMPLATE_OPTIONS[0].value);
  const { process, isProcessing, currentRun, parsedOutput, setParsedOutput } = useMeetingProcessor();

  const [tasks, setTasks] = useState<MeetingTask[]>([]);
  const [decisions, setDecisions] = useState<MeetingDecision[]>([]);
  const [questions, setQuestions] = useState<MeetingQuestion[]>([]);
  const [editNotes, setEditNotes] = useState("");

  const handleGenerate = async () => {
    if (!transcript.trim()) { toast.error("Paste a transcript first"); return; }
    const result = await process({ transcript_text: transcript, title, attendees, template_type: template });
    if (result?.output) {
      setTasks(result.output.tasks);
      setDecisions(result.output.decisions);
      setQuestions(result.output.open_questions);
    }
  };

  const handleRegenerate = () => handleGenerate();

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
              <label className="text-xs font-mono text-muted-foreground mb-1 block">Template (required)</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value as any)}
                className="w-full text-sm rounded-md border bg-card px-3 py-2 font-mono"
              >
                {TEMPLATE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1 block">Meeting title (optional)</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sprint Planning W8" className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1 block">Attendees (optional, comma-separated)</label>
              <Input value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="e.g. Alice, Bob, Charlie" className="text-sm" />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-xs font-mono text-muted-foreground mb-1 block">Transcript</label>
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste meeting transcript here..."
                className="flex-1 min-h-[300px] text-sm font-mono resize-none"
              />
            </div>
          </div>
          <div className="p-4 border-t space-y-2">
            <Button onClick={handleGenerate} disabled={isProcessing} className="w-full font-mono text-sm">
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              {isProcessing ? "Processing…" : "Generate Outputs"}
            </Button>
            {hasOutputs && (
              <Button onClick={handleRegenerate} disabled={isProcessing} variant="outline" className="w-full font-mono text-sm">
                <RotateCcw className="h-3 w-3 mr-2" /> Regenerate
              </Button>
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
              </div>
            </div>
          ) : (
            <>
              {/* Metrics bar */}
              <div className="px-4 py-2 border-b flex items-center gap-4 text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1"><ListTodo className="h-3 w-3" /> {tasks.length} tasks</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {decisions.length} decisions</span>
                <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3" /> {questions.length} questions</span>
                {lowConfidenceCount > 0 && (
                  <span className="flex items-center gap-1 text-confidence-low">
                    <AlertTriangle className="h-3 w-3" /> {lowConfidenceCount} low-confidence
                  </span>
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
                  <TabsTrigger value="questions" className="text-xs font-mono">Questions ({questions.length})</TabsTrigger>
                </TabsList>
                <div className="flex-1 overflow-auto p-4">
                  <TabsContent value="tasks" className="mt-0"><TaskEditor tasks={tasks} onChange={setTasks} /></TabsContent>
                  <TabsContent value="decisions" className="mt-0"><DecisionEditor decisions={decisions} onChange={setDecisions} /></TabsContent>
                  <TabsContent value="questions" className="mt-0"><QuestionEditor questions={questions} onChange={setQuestions} /></TabsContent>
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
