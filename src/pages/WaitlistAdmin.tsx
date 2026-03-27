import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  role: string | null;
  team_size: string | null;
  biggest_pain: string | null;
  referral_source: string | null;
  created_at: string;
}

function countBy(arr: WaitlistEntry[], key: keyof WaitlistEntry) {
  const counts: Record<string, number> = {};
  arr.forEach((e) => {
    const val = (e[key] as string) || "Not specified";
    counts[val] = (counts[val] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export default function WaitlistAdmin() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("waitlist")
        .select("*")
        .order("created_at", { ascending: false });
      setEntries(data || []);
      setLoading(false);
    })();
  }, []);

  const exportCSV = () => {
    const headers = ["Name", "Email", "Role", "Team Size", "Biggest Pain", "Referral Source", "Date"];
    const rows = entries.map((e) => [
      e.name, e.email, e.role || "", e.team_size || "",
      (e.biggest_pain || "").replace(/"/g, '""'), e.referral_source || "",
      new Date(e.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const roleCounts = countBy(entries, "role");
  const sizeCounts = countBy(entries, "team_size");

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Waitlist</h1>
            <p className="text-sm text-white/40 mt-1">Admin view</p>
          </div>
          <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2 border-white/10 text-white/60 hover:text-white">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 text-center">
            <p className="text-4xl font-bold text-primary">{entries.length}</p>
            <p className="text-xs text-white/40 mt-1">Total signups</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-xs text-white/40 mb-2 font-medium">By role</p>
            <div className="space-y-1">
              {roleCounts.map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-white/60">{k}</span>
                  <span className="text-white/40 font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-xs text-white/40 mb-2 font-medium">By team size</p>
            <div className="space-y-1">
              {sizeCounts.map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-white/60">{k}</span>
                  <span className="text-white/40 font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/[0.08] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-white/40">Name</TableHead>
                <TableHead className="text-white/40">Email</TableHead>
                <TableHead className="text-white/40">Role</TableHead>
                <TableHead className="text-white/40">Team</TableHead>
                <TableHead className="text-white/40">Pain</TableHead>
                <TableHead className="text-white/40">Source</TableHead>
                <TableHead className="text-white/40">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id} className="border-white/[0.06]">
                  <TableCell className="text-white/70 text-xs">{e.name}</TableCell>
                  <TableCell className="text-white/70 text-xs font-mono">{e.email}</TableCell>
                  <TableCell className="text-white/50 text-xs">{e.role || "—"}</TableCell>
                  <TableCell className="text-white/50 text-xs">{e.team_size || "—"}</TableCell>
                  <TableCell className="text-white/50 text-xs max-w-[200px] truncate">{e.biggest_pain || "—"}</TableCell>
                  <TableCell className="text-white/50 text-xs">{e.referral_source || "—"}</TableCell>
                  <TableCell className="text-white/40 text-xs font-mono">{new Date(e.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-white/30 text-sm py-10">No signups yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
