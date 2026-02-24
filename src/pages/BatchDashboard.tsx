import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/meeting/ConfidenceBadge";
import { ArrowLeft, Zap, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

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
}

export default function BatchDashboard() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    setLoading(true);
    // Get all runs with their transcript case titles
    const { data: runsData } = await supabase
      .from("runs")
      .select("id, transcript_case_id, validation_status, created_at, parsed_output_json, error_message, raw_model_output")
      .order("created_at", { ascending: false });

    if (!runsData) { setLoading(false); return; }

    // Get transcript case titles
    const caseIds = [...new Set(runsData.map((r) => r.transcript_case_id))];
    const { data: cases } = await supabase.from("transcript_cases").select("id, title").in("id", caseIds);
    const caseMap = new Map(cases?.map((c) => [c.id, c.title]) || []);

    const summaries: RunSummary[] = runsData.map((r) => {
      const parsed = r.parsed_output_json as any;
      const tasks = parsed?.tasks || [];
      const decisions = parsed?.decisions || [];
      const questions = parsed?.open_questions || [];
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
      };
    });

    setRuns(summaries);
    setLoading(false);
  };

  const okCount = runs.filter((r) => r.validation_status === "ok").length;
  const failCount = runs.filter((r) => r.validation_status === "fail").length;
  const avgTasks = runs.length > 0 ? (runs.reduce((s, r) => s + r.task_count, 0) / runs.length).toFixed(1) : "0";
  const totalLowConf = runs.reduce((s, r) => s + r.low_confidence_count, 0);

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
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Summary metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <MetricCard label="Total Runs" value={runs.length} />
          <MetricCard label="Parsing OK" value={`${okCount}/${runs.length}`} variant={okCount === runs.length ? "success" : "default"} />
          <MetricCard label="Avg Tasks / Run" value={avgTasks} />
          <MetricCard label="Low Confidence Items" value={totalLowConf} variant={totalLowConf > 0 ? "warning" : "default"} />
        </div>

        {/* Runs table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2 font-mono text-xs text-muted-foreground">Title</th>
                <th className="text-center px-3 py-2 font-mono text-xs text-muted-foreground">Status</th>
                <th className="text-center px-3 py-2 font-mono text-xs text-muted-foreground">Tasks</th>
                <th className="text-center px-3 py-2 font-mono text-xs text-muted-foreground">Decisions</th>
                <th className="text-center px-3 py-2 font-mono text-xs text-muted-foreground">Questions</th>
                <th className="text-center px-3 py-2 font-mono text-xs text-muted-foreground">Low Conf.</th>
                <th className="text-right px-4 py-2 font-mono text-xs text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground font-mono text-xs">Loading...</td></tr>
              ) : runs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground font-mono text-xs">No runs yet</td></tr>
              ) : runs.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2 font-medium truncate max-w-[200px]">{r.title || r.transcript_case_id.slice(0, 8)}</td>
                  <td className="text-center px-3 py-2">
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

function MetricCard({ label, value, variant = "default" }: { label: string; value: string | number; variant?: "default" | "success" | "warning" }) {
  const borderClass = variant === "success" ? "border-confidence-high/30" : variant === "warning" ? "border-confidence-low/30" : "";
  return (
    <div className={`rounded-lg border bg-card p-4 ${borderClass}`}>
      <p className="text-xs font-mono text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-semibold font-mono">{value}</p>
    </div>
  );
}
