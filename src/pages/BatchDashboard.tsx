import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, CheckCircle, XCircle, AlertTriangle, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { validateModelOutput } from "@/lib/validation";

interface RunSummary {
  id: string;
  transcript_case_id: string;
  title: string | null;
  validation_status: string;
  created_at: string;
  task_count: number;
  decision_count: number;
  question_count: number;
  low_confidence_count: number;
  error_message: string | null;
  heavy_edits: boolean;
}

export default function BatchDashboard() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchRunning, setBatchRunning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadRuns(); }, []);

  const loadRuns = async () => {
    setLoading(true);
    const { data: runsData } = await supabase
      .from("runs")
      .select("id, transcript_case_id, validation_status, created_at, parsed_output_json, error_message")
      .order("created_at", { ascending: false });

    if (!runsData) { setLoading(false); return; }

    const caseIds = [...new Set(runsData.map((r) => r.transcript_case_id))];
    const { data: cases } = await supabase.from("transcript_cases").select("id, title").in("id", caseIds);
    const caseMap = new Map(cases?.map((c) => [c.id, c.title]) || []);

    const summaries: RunSummary[] = runsData.map((r) => {
      const parsed = r.parsed_output_json as any;
      const tasks = parsed?.tasks || [];
      const decisions = parsed?.decisions || [];
      const questions = parsed?.open_questions || parsed?.things_to_confirm || [];
      const allItems = [...tasks, ...decisions, ...questions];
      return {
        id: r.id,
        transcript_case_id: r.transcript_case_id,
        title: caseMap.get(r.transcript_case_id) || null,
        validation_status: r.validation_status,
        created_at: r.created_at,
        task_count: tasks.length,
        decision_count: decisions.length,
        question_count: questions.length,
        low_confidence_count: allItems.filter((i: any) => i.confidence === "low").length,
        error_message: r.error_message,
        heavy_edits: false,
      };
    });

    setRuns(summaries);
    setLoading(false);
  };

  const toggleHeavyEdits = (id: string) => {
    setRuns(runs.map(r => r.id === id ? { ...r, heavy_edits: !r.heavy_edits } : r));
  };

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setBatchRunning(true);
    let success = 0;
    let fail = 0;

    for (const file of files) {
      try {
        const text = await file.text();
        const { data: tc, error: tcErr } = await supabase
          .from("transcript_cases")
          .insert({
            title: file.name.replace(/\.txt$/i, ""),
            template_type: "weekly_planning",
            transcript_text: text,
          })
          .select()
          .single();

        if (tcErr || !tc) { fail++; continue; }

        const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-transcript", {
          body: { transcript_text: text, template_type: "weekly_planning" },
        });

        if (fnErr) { fail++; continue; }

        const rawOutput = fnData?.raw_output || "";
        const validation = validateModelOutput(rawOutput);

        await supabase.from("runs").insert({
          transcript_case_id: tc.id,
          prompt_version: "v2",
          model_name: "google/gemini-3-flash-preview",
          raw_model_output: rawOutput,
          parsed_output_json: validation.output as any,
          validation_status: validation.valid ? "ok" : "fail",
          error_message: validation.errors.length > 0 ? validation.errors.join("; ") : null,
        });

        success++;
      } catch {
        fail++;
      }
    }

    toast.success(`Batch complete: ${success} ok, ${fail} failed`);
    setBatchRunning(false);
    await loadRuns();
    e.target.value = "";
  };

  const okCount = runs.filter((r) => r.validation_status === "ok").length;
  const failCount = runs.filter((r) => r.validation_status === "fail").length;
  const avgTasks = runs.length > 0 ? (runs.reduce((s, r) => s + r.task_count, 0) / runs.length).toFixed(1) : "0";
  const totalLowConf = runs.reduce((s, r) => s + r.low_confidence_count, 0);
  const pctLowConf = runs.length > 0
    ? ((runs.filter(r => r.low_confidence_count > 0).length / runs.length) * 100).toFixed(0)
    : "0";
  const heavyEditsCount = runs.filter(r => r.heavy_edits).length;
  const pctHeavy = runs.length > 0 ? ((heavyEditsCount / runs.length) * 100).toFixed(0) : "0";

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Zap className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-semibold font-mono tracking-tight">BATCH EVALUATION</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm" className="text-xs font-mono"
            disabled={batchRunning}
            onClick={() => fileInputRef.current?.click()}
          >
            {batchRunning ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
            {batchRunning ? "Running…" : "Upload .txt files"}
          </Button>
          <input ref={fileInputRef} type="file" accept=".txt" multiple className="hidden" onChange={handleBatchUpload} />
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-5 gap-4 mb-6">
          <MetricCard label="Total Runs" value={runs.length} />
          <MetricCard label="Parse Success" value={`${okCount}/${runs.length}`} subtitle={runs.length > 0 ? `${((okCount/runs.length)*100).toFixed(0)}%` : ""} variant={okCount === runs.length ? "success" : "default"} />
          <MetricCard label="Avg Tasks / Run" value={avgTasks} />
          <MetricCard label="% Low Confidence" value={`${pctLowConf}%`} subtitle={`${totalLowConf} items`} variant={totalLowConf > 0 ? "warning" : "default"} />
          <MetricCard label="% Heavy Edits" value={`${pctHeavy}%`} subtitle={`${heavyEditsCount} runs`} />
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/80 sticky top-0 z-10">
                <th className="text-left px-4 py-2 font-mono text-xs text-muted-foreground">Title</th>
                <th className="text-center px-3 py-2 font-mono text-xs text-muted-foreground">Status</th>
                <th className="text-center px-3 py-2 font-mono text-xs text-muted-foreground">Tasks</th>
                <th className="text-center px-3 py-2 font-mono text-xs text-muted-foreground">Decisions</th>
                <th className="text-center px-3 py-2 font-mono text-xs text-muted-foreground">To Confirm</th>
                <th className="text-center px-3 py-2 font-mono text-xs text-muted-foreground">Low Conf.</th>
                <th className="text-center px-3 py-2 font-mono text-xs text-muted-foreground">Heavy Edits?</th>
                <th className="text-right px-4 py-2 font-mono text-xs text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground font-mono text-xs">Loading...</td></tr>
              ) : runs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground font-mono text-xs">No runs yet. Upload .txt transcripts to start.</td></tr>
              ) : runs.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-1.5 font-medium truncate max-w-[200px]">{r.title || r.transcript_case_id.slice(0, 8)}</td>
                  <td className="text-center px-3 py-1.5">
                    {r.validation_status === "ok" ? (
                      <CheckCircle className="h-4 w-4 text-confidence-high inline" />
                    ) : r.validation_status === "fail" ? (
                      <XCircle className="h-4 w-4 text-destructive inline" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-confidence-medium inline" />
                    )}
                  </td>
                  <td className="text-center px-3 py-2 font-mono">{r.task_count}</td>
                  <td className="text-center px-3 py-2 font-mono">{r.decision_count}</td>
                  <td className="text-center px-3 py-2 font-mono">{r.question_count}</td>
                  <td className="text-center px-3 py-2">
                    {r.low_confidence_count > 0 ? (
                      <span className="text-confidence-low font-mono">{r.low_confidence_count}</span>
                    ) : (
                      <span className="text-muted-foreground font-mono">0</span>
                    )}
                  </td>
                  <td className="text-center px-3 py-2">
                    <button
                      onClick={() => toggleHeavyEdits(r.id)}
                      className={`text-xs font-mono px-2 py-0.5 rounded border transition-colors ${r.heavy_edits ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-muted text-muted-foreground border-transparent hover:border-border"}`}
                    >
                      {r.heavy_edits ? "Yes" : "No"}
                    </button>
                  </td>
                  <td className="text-right px-4 py-2 text-muted-foreground text-xs font-mono">
                    {new Date(r.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subtitle, variant = "default" }: { label: string; value: string | number; subtitle?: string; variant?: "default" | "success" | "warning" }) {
  const topBorderClass = variant === "success" ? "border-t-2 border-t-[hsl(var(--confidence-high)/0.5)]" : variant === "warning" ? "border-t-2 border-t-[hsl(var(--confidence-low)/0.5)]" : "border-t-2 border-t-border/50";
  return (
    <div className={`rounded-lg border bg-card p-4 ${topBorderClass}`}>
      <p className="text-xs font-mono text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-semibold font-mono">{value}</p>
      {subtitle && <p className="text-xs font-mono text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
