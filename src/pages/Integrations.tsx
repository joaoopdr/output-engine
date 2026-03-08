import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, Send, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TEAMS_WEBHOOK_KEY = "briefs_teams_webhook";

function ThemedLogo({ className = "h-12" }: { className?: string }) {
  return (
    <>
      <img src="/logo-dark.png" alt="BriefSync" className={`${className} dark:block hidden`} />
      <img src="/logo-light.png" alt="BriefSync" className={`${className} dark:hidden block`} />
    </>
  );
}

export default function Integrations() {
  const [teamsUrl, setTeamsUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(TEAMS_WEBHOOK_KEY) || "";
    setTeamsUrl(stored);
    setSavedUrl(stored);
  }, []);

  const handleSaveTeams = () => {
    const trimmed = teamsUrl.trim();
    localStorage.setItem(TEAMS_WEBHOOK_KEY, trimmed);
    setSavedUrl(trimmed);
    toast.success(trimmed ? "Teams webhook saved" : "Teams webhook removed");
  };

  const handleTestTeams = async () => {
    setTesting(true);
    try {
      const resp = await fetch(savedUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "\u2705 BriefSync connected successfully!" }),
      });
      if (resp.ok) {
        toast.success("Test message sent to Teams!");
      } else {
        toast.error(`Teams returned ${resp.status} — check your webhook URL`);
      }
    } catch {
      toast.error("Failed to reach Teams — check your webhook URL");
    } finally {
      setTesting(false);
    }
  };

  const isConnected = !!savedUrl;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <ThemedLogo className="h-12 w-auto" />
          <span className="text-xs font-mono text-muted-foreground">/ Integrations</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-1">Connect BriefSync to your team's tools.</p>
        </div>

        {/* Microsoft Teams */}
        <div className="rounded-lg border border-border/60 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Microsoft Teams</h2>
                <p className="text-xs text-muted-foreground">Post meeting outputs to a Teams channel automatically.</p>
              </div>
            </div>
            {isConnected ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(var(--confidence-high))]/10 text-[hsl(var(--confidence-high))] border border-[hsl(var(--confidence-high))]/20">
                <Check className="h-3 w-3" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border/50">
                Not connected
              </span>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            In Teams, go to your channel → Manage channel → Connectors → Incoming Webhook → Create. Paste the webhook URL below.
          </p>

          <div className="flex gap-2">
            <Input
              value={teamsUrl}
              onChange={e => setTeamsUrl(e.target.value)}
              placeholder="https://your-org.webhook.office.com/..."
              className="text-xs font-mono flex-1"
            />
            <Button onClick={handleSaveTeams} size="sm" className="text-xs h-9 px-4">
              Save
            </Button>
          </div>

          {isConnected && (
            <Button
              onClick={handleTestTeams}
              disabled={testing}
              variant="outline"
              size="sm"
              className="text-xs h-7 gap-1.5"
            >
              {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Send test message
            </Button>
          )}
        </div>

        {/* Email */}
        <div className="rounded-lg border border-border/60 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Email</h2>
                <p className="text-xs text-muted-foreground">Open a pre-filled email with meeting outputs ready to send.</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(var(--confidence-high))]/10 text-[hsl(var(--confidence-high))] border border-[hsl(var(--confidence-high))]/20">
              <Check className="h-3 w-3" /> Ready
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            No setup required. After generating outputs, use the Send via Email button to open your email client with a pre-filled summary.
          </p>
        </div>
      </div>
    </div>
  );
}
