import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Upload, Loader2, Trash2, Play, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { validateModelOutput } from "@/lib/validation";
import { scoreRun, formatScore, type ScoreResult } from "@/lib/scoring";

interface RunSummary {
  id: string;
  transcript_case_id: string;
  title: string | null;
  prompt_version: string;
  validation_status: string;
  created_at: string;
  task_count: number;
  decision_count: number;
  question_count: number;
  low_confidence_count: number;
  error_message: string | null;
  heavy_edits: boolean;
}

interface GoldStandard {
  id: string;
  transcript_title: string;
  transcript_text: string;
  expected_tasks: any[];
  expected_decisions: any[];
  expected_things_to_confirm: any[];
  notes: string | null;
  created_at: string;
}

function ThemedLogo({ className = "h-9" }: { className?: string }) {
  return (
    <>
      <img src="/logo-dark.png" alt="BriefSync" className={`${className} dark:block hidden`} />
      <img src="/logo-light.png" alt="BriefSync" className={`${className} dark:hidden block`} />
    </>
  );
}

export default function BatchDashboard() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchRunning, setBatchRunning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gold standards state
  const [goldStandards, setGoldStandards] = useState<GoldStandard[]>([]);
  const [gsLoading, setGsLoading] = useState(false);
  const [gsScores, setGsScores] = useState<Record<string, ScoreResult>>({});
  const [gsRunning, setGsRunning] = useState<string | null>(null);
  const [gsExpanded, setGsExpanded] = useState<Record<string, boolean>>({});
  const [compareResults, setCompareResults] = useState<{ version: string; avgScore: number; taskRecall: number; decisionRecall: number; confirmRecall: number; avgHallucinations: number } | null>(null);
  const [compareRunning, setCompareRunning] = useState(false);
  const gsFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadRuns(); loadGoldStandards(); }, []);

  const loadRuns = async () => {
    setLoading(true);
    const { data: runsData } = await supabase
      .from("runs")
      .select("id, transcript_case_id, prompt_version, validation_status, created_at, parsed_output_json, error_message")
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
        id: r.id, transcript_case_id: r.transcript_case_id,
        title: caseMap.get(r.transcript_case_id) || null,
        prompt_version: r.prompt_version, validation_status: r.validation_status,
        created_at: r.created_at, task_count: tasks.length, decision_count: decisions.length,
        question_count: questions.length,
        low_confidence_count: allItems.filter((i: any) => i.confidence === "low").length,
        error_message: r.error_message, heavy_edits: false,
      };
    });

    setRuns(summaries);
    setLoading(false);
  };

  const loadGoldStandards = async () => {
    setGsLoading(true);
    const { data } = await supabase.from("gold_standards").select("*").order("created_at", { ascending: false });
    setGoldStandards((data as any) || []);
    setGsLoading(false);
  };

  const toggleHeavyEdits = (id: string) => {
    setRuns(runs.map(r => r.id === id ? { ...r, heavy_edits: !r.heavy_edits } : r));
  };

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setBatchRunning(true);
    let success = 0, fail = 0;

    for (const file of files) {
      try {
        const text = await file.text();
        const { data: tc, error: tcErr } = await supabase
          .from("transcript_cases")
          .insert({ title: file.name.replace(/\.txt$/i, ""), template_type: "weekly_planning", transcript_text: text })
          .select().single();
        if (tcErr || !tc) { fail++; continue; }

        const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-transcript", {
          body: { transcript_text: text, template_type: "weekly_planning" },
        });
        if (fnErr) { fail++; continue; }

        const rawOutput = fnData?.raw_output || "";
        const validation = validateModelOutput(rawOutput);
        await supabase.from("runs").insert({
          transcript_case_id: tc.id, prompt_version: "v14", model_name: "google/gemini-3-flash-preview",
          raw_model_output: rawOutput, parsed_output_json: validation.output as any,
          validation_status: validation.valid ? "ok" : "fail",
          error_message: validation.errors.length > 0 ? validation.errors.join("; ") : null,
        });
        success++;
      } catch { fail++; }
    }

    toast.success(`Batch complete: ${success} ok, ${fail} failed`);
    setBatchRunning(false);
    await loadRuns();
    e.target.value = "";
  };

  const handleGsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    let success = 0;
    let fail = 0;
    const total = files.length;

    for (const file of files) {
      try {
        if (total > 1) toast.loading(`Uploading ${success + fail + 1}/${total}...`, { id: "gs-upload-progress" });
        const text = await file.text();
        const json = JSON.parse(text);
        const { error } = await supabase.from("gold_standards").insert({
          transcript_title: json.title || "Untitled",
          transcript_text: json.transcript || "",
          expected_tasks: json.expected?.tasks || [],
          expected_decisions: json.expected?.decisions || [],
          expected_things_to_confirm: json.expected?.things_to_confirm || [],
          notes: json.notes || null,
        } as any);
        if (error) throw error;
        success++;
      } catch {
        fail++;
      }
    }

    toast.dismiss("gs-upload-progress");
    if (fail === 0) {
      toast.success(`${success} gold standard${success > 1 ? "s" : ""} uploaded successfully`);
    } else {
      toast.warning(`${success} uploaded, ${fail} failed`);
    }
    await loadGoldStandards();
    e.target.value = "";
  };

  const handleGsDelete = async (id: string) => {
    await supabase.from("gold_standards").delete().eq("id", id);
    setGoldStandards(gs => gs.filter(g => g.id !== id));
    toast.success("Deleted");
  };

  const handleGsRun = async (gs: GoldStandard) => {
    setGsRunning(gs.id);
    try {
      const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-transcript", {
        body: { transcript_text: gs.transcript_text, template_type: "weekly_planning" },
      });
      if (fnErr) throw fnErr;

      const rawOutput = fnData?.raw_output || "";
      const validation = validateModelOutput(rawOutput);
      if (!validation.output) throw new Error("Parse failed");

      const result = scoreRun(
        { tasks: gs.expected_tasks, decisions: gs.expected_decisions, things_to_confirm: gs.expected_things_to_confirm },
        { tasks: validation.output.tasks, decisions: validation.output.decisions, open_questions: validation.output.open_questions }
      );
      setGsScores(prev => ({ ...prev, [gs.id]: result }));
    } catch (err: any) {
      toast.error("Run failed", { description: err.message });
    }
    setGsRunning(null);
  };

  const handleCompareAll = async () => {
    if (goldStandards.length === 0) return;
    setCompareRunning(true);
    const scores: ScoreResult[] = [];

    for (const gs of goldStandards) {
      try {
        const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-transcript", {
          body: { transcript_text: gs.transcript_text, template_type: "weekly_planning" },
        });
        if (fnErr) continue;
        const rawOutput = fnData?.raw_output || "";
        const validation = validateModelOutput(rawOutput);
        if (!validation.output) continue;

        const result = scoreRun(
          { tasks: gs.expected_tasks, decisions: gs.expected_decisions, things_to_confirm: gs.expected_things_to_confirm },
          { tasks: validation.output.tasks, decisions: validation.output.decisions, open_questions: validation.output.open_questions }
        );
        scores.push(result);
        setGsScores(prev => ({ ...prev, [gs.id]: result }));
      } catch { /* skip */ }
    }

    if (scores.length > 0) {
      const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
      setCompareResults({
        version: "v14",
        avgScore: avg(scores.map(s => s.overall_score)),
        taskRecall: avg(scores.map(s => s.task_recall)),
        decisionRecall: avg(scores.map(s => s.decision_recall)),
        confirmRecall: avg(scores.map(s => s.confirm_recall)),
        avgHallucinations: avg(scores.map(s => s.task_hallucinations)),
      });
    }
    setCompareRunning(false);
    toast.success(`Scored ${scores.length}/${goldStandards.length} gold standards`);
  };

  const okCount = runs.filter(r => r.validation_status === "ok").length;
  const failCount = runs.filter(r => r.validation_status === "fail").length;
  const avgTasks = runs.length > 0 ? (runs.reduce((s, r) => s + r.task_count, 0) / runs.length).toFixed(1) : "0";
  const totalLowConf = runs.reduce((s, r) => s + r.low_confidence_count, 0);
  const pctLowConf = runs.length > 0 ? ((runs.filter(r => r.low_confidence_count > 0).length / runs.length) * 100).toFixed(0) : "0";
  const heavyEditsCount = runs.filter(r => r.heavy_edits).length;
  const pctHeavy = runs.length > 0 ? ((heavyEditsCount / runs.length) * 100).toFixed(0) : "0";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-7 w-7"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <ThemedLogo className="h-5 w-auto" />
          <h1 className="text-sm font-semibold font-mono tracking-tight">BATCH EVALUATION</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs font-mono" disabled={batchRunning} onClick={() => fileInputRef.current?.click()}>
            {batchRunning ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
            {batchRunning ? "Running…" : "Upload .txt files"}
          </Button>
          <input ref={fileInputRef} type="file" accept=".txt" multiple className="hidden" onChange={handleBatchUpload} />
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        <Tabs defaultValue="runs">
          <TabsList className="bg-transparent border-b border-border/40 rounded-none p-0 gap-0 mb-4">
            <TabsTrigger value="runs" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2.5 pt-1.5">Runs</TabsTrigger>
            <TabsTrigger value="gold" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2.5 pt-1.5">Gold Standards</TabsTrigger>
          </TabsList>

          <TabsContent value="runs" className="mt-0">
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
                    <th className="text-center px-3 py-2 font-mono text-xs text-muted-foreground">Prompt</th>
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
                    <tr><td colSpan={9} className="text-center py-8 text-muted-foreground font-mono text-xs">Loading...</td></tr>
                  ) : runs.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 text-muted-foreground font-mono text-xs">No runs yet. Upload .txt transcripts to start.</td></tr>
                  ) : runs.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-1.5 font-medium truncate max-w-[200px]">{r.title || r.transcript_case_id.slice(0, 8)}</td>
                      <td className="text-center px-3 py-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">{r.prompt_version}</span>
                      </td>
                      <td className="text-center px-3 py-1.5">
                        {r.validation_status === "ok" ? <CheckCircle className="h-4 w-4 text-[hsl(var(--confidence-high))] inline" /> :
                         r.validation_status === "fail" ? <XCircle className="h-4 w-4 text-destructive inline" /> :
                         <AlertTriangle className="h-4 w-4 text-[hsl(var(--confidence-medium))] inline" />}
                      </td>
                      <td className="text-center px-3 py-1.5 font-mono">{r.task_count}</td>
                      <td className="text-center px-3 py-1.5 font-mono">{r.decision_count}</td>
                      <td className="text-center px-3 py-1.5 font-mono">{r.question_count}</td>
                      <td className="text-center px-3 py-1.5">
                        {r.low_confidence_count > 0 ? <span className="text-[hsl(var(--confidence-low))] font-mono">{r.low_confidence_count}</span> : <span className="text-muted-foreground font-mono">0</span>}
                      </td>
                      <td className="text-center px-3 py-1.5">
                        <button onClick={() => toggleHeavyEdits(r.id)} className={`text-xs font-mono px-2 py-0.5 rounded border transition-colors ${r.heavy_edits ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-muted text-muted-foreground border-transparent hover:border-border"}`}>
                          {r.heavy_edits ? "Yes" : "No"}
                        </button>
                      </td>
                      <td className="text-right px-4 py-1.5 text-muted-foreground text-xs font-mono">
                        {new Date(r.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="gold" className="mt-0">
            <div className="space-y-6">
              {/* Upload + Compare */}
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="text-xs font-mono" onClick={() => gsFileRef.current?.click()}>
                  <Upload className="h-3 w-3 mr-1" /> Upload gold standard (.json)
                </Button>
                <input ref={gsFileRef} type="file" accept=".json" multiple className="hidden" onChange={handleGsUpload} />
                <Button variant="outline" size="sm" className="text-xs font-mono" onClick={handleCompareAll} disabled={compareRunning || goldStandards.length === 0}>
                  {compareRunning ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
                  Compare all (v14)
                </Button>
              </div>

              {/* Compare results */}
              {compareResults && (
                <div className="rounded-lg border bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/80">
                        <th className="text-left px-4 py-2 font-mono text-xs text-muted-foreground">Prompt Version</th>
                        <th className="text-center px-3 py-2 font-mono text-xs text-muted-foreground">Avg Score</th>
                        <th className="text-center px-3 py-2 font-mono text-xs text-muted-foreground">Task Recall</th>
                        <th className="text-center px-3 py-2 font-mono text-xs text-muted-foreground">Decision Recall</th>
                        <th className="text-center px-3 py-2 font-mono text-xs text-muted-foreground">Confirm Recall</th>
                        <th className="text-center px-3 py-2 font-mono text-xs text-muted-foreground">Hallucinations</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 font-mono font-medium">{compareResults.version}</td>
                        <td className="text-center px-3 py-2 font-mono font-semibold">
                          {formatScore(compareResults.avgScore)} ({(compareResults.avgScore * 100).toFixed(0)}%)
                        </td>
                        <td className="text-center px-3 py-2 font-mono">{(compareResults.taskRecall * 100).toFixed(0)}%</td>
                        <td className="text-center px-3 py-2 font-mono">{(compareResults.decisionRecall * 100).toFixed(0)}%</td>
                        <td className="text-center px-3 py-2 font-mono">{(compareResults.confirmRecall * 100).toFixed(0)}%</td>
                        <td className="text-center px-3 py-2 font-mono">{compareResults.avgHallucinations.toFixed(1)} avg</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Gold standards list */}
              {gsLoading ? (
                <p className="text-muted-foreground font-mono text-xs">Loading...</p>
              ) : goldStandards.length === 0 ? (
                <p className="text-muted-foreground font-mono text-xs py-8 text-center">No gold standards yet. Upload a .json file to start.</p>
              ) : (
                <div className="space-y-3">
                  {goldStandards.map(gs => {
                    const score = gsScores[gs.id];
                    const expanded = gsExpanded[gs.id];
                    return (
                      <div key={gs.id} className="rounded-lg border bg-card p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-medium text-sm truncate">{gs.transcript_title}</span>
                            <span className="text-[10px] font-mono text-muted-foreground shrink-0">{gs.expected_tasks.length}T · {gs.expected_decisions.length}D · {gs.expected_things_to_confirm.length}C</span>
                            {gs.notes && <span className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">{gs.notes}</span>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {score && (
                              <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${score.overall_score >= 0.8 ? "bg-[hsl(var(--confidence-high)/0.15)] text-[hsl(var(--confidence-high))]" : score.overall_score >= 0.7 ? "bg-[hsl(var(--confidence-medium)/0.15)] text-[hsl(var(--confidence-medium))]" : "bg-destructive/15 text-destructive"}`}>
                                {formatScore(score.overall_score)} ({(score.overall_score * 100).toFixed(0)}%)
                              </span>
                            )}
                            <Button variant="outline" size="sm" className="text-xs h-7 font-mono" disabled={gsRunning === gs.id} onClick={() => handleGsRun(gs)}>
                              {gsRunning === gs.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                              <span className="ml-1">Run & Score</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleGsDelete(gs.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {score && (
                          <>
                            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                              <span>Task recall: {(score.task_recall * 100).toFixed(0)}%</span>
                              <span>Decision recall: {(score.decision_recall * 100).toFixed(0)}%</span>
                              <span>Confirm recall: {(score.confirm_recall * 100).toFixed(0)}%</span>
                              <span>Hallucinations: {score.task_hallucinations}</span>
                              <button onClick={() => setGsExpanded(prev => ({ ...prev, [gs.id]: !prev[gs.id] }))} className="ml-auto flex items-center gap-1 hover:text-foreground transition-colors">
                                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                Details
                              </button>
                            </div>

                            {expanded && (
                              <div className="grid grid-cols-3 gap-4 text-xs">
                                <div>
                                  <p className="font-mono text-[10px] text-muted-foreground mb-1">✅ Matched</p>
                                  <div className="space-y-0.5">
                                    {[...score.matched_tasks, ...score.matched_decisions, ...score.matched_confirms].map((m, i) => (
                                      <p key={i} className="text-[hsl(var(--confidence-high))] truncate">{m}</p>
                                    ))}
                                    {score.matched_tasks.length + score.matched_decisions.length + score.matched_confirms.length === 0 && <p className="text-muted-foreground italic">None</p>}
                                  </div>
                                </div>
                                <div>
                                  <p className="font-mono text-[10px] text-muted-foreground mb-1">❌ Missed</p>
                                  <div className="space-y-0.5">
                                    {[...score.missed_tasks, ...score.missed_decisions, ...score.missed_confirms].map((m, i) => (
                                      <p key={i} className="text-destructive truncate">{m}</p>
                                    ))}
                                    {score.missed_tasks.length + score.missed_decisions.length + score.missed_confirms.length === 0 && <p className="text-muted-foreground italic">None</p>}
                                  </div>
                                </div>
                                <div>
                                  <p className="font-mono text-[10px] text-muted-foreground mb-1">⚠️ Hallucinated</p>
                                  <div className="space-y-0.5">
                                    {score.hallucinated_tasks.map((m, i) => (
                                      <p key={i} className="text-[hsl(var(--confidence-medium))] truncate">{m}</p>
                                    ))}
                                    {score.hallucinated_tasks.length === 0 && <p className="text-muted-foreground italic">None</p>}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
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
