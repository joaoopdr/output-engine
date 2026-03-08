import { useState, useMemo } from "react";
import { Copy, Check, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateEmail, generateSlack } from "@/lib/shareUtils";
import { toast } from "sonner";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MeetingTask, MeetingDecision, MeetingQuestion, TemplateType } from "@/types/meeting";

interface SharePanelProps {
  tasks: MeetingTask[];
  decisions: MeetingDecision[];
  questions: MeetingQuestion[];
  title: string;
  attendees: string;
  meetingDate: string;
  templateType: TemplateType;
}

export function SharePanel(props: SharePanelProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedSlack, setCopiedSlack] = useState(false);

  const emailText = useMemo(() => generateEmail(props), [props]);
  const slackText = useMemo(() => generateSlack(props), [props]);

  const teamsWebhookUrl = typeof window !== "undefined" ? localStorage.getItem("briefs_teams_webhook") || "" : "";

  const handleCopy = async (text: string, which: "email" | "slack") => {
    await navigator.clipboard.writeText(text);
    if (which === "email") {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1500);
    } else {
      setCopiedSlack(true);
      setTimeout(() => setCopiedSlack(false), 1500);
    }
  };

  const handleSendEmail = () => {
    const typeLabel = props.templateType === "customer_handoff" ? "customer handoff"
      : props.templateType === "sprint_planning" ? "sprint planning"
      : "weekly planning";
    const subject = encodeURIComponent(`Meeting outputs: ${props.title || "Untitled meeting"}`);
    const body = encodeURIComponent(emailText);
    const toList = props.attendees ? encodeURIComponent(props.attendees) : "";
    window.open(`mailto:${toList}?subject=${subject}&body=${body}`, "_blank");
    toast.success("Opening email client...");
  };

  const handlePostToTeams = async () => {
    if (!teamsWebhookUrl) return;
    try {
      const teamsPayload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor: "7C3AED",
        summary: `Meeting outputs: ${props.title || "Untitled meeting"}`,
        sections: [
          {
            activityTitle: `📋 ${props.title || "Meeting outputs"}`,
            activitySubtitle: props.meetingDate || new Date().toLocaleDateString(),
            facts: [
              { name: "Tasks", value: `${props.tasks.length} items` },
              { name: "Decisions", value: `${props.decisions.length} items` },
              { name: "Things to confirm", value: `${props.questions.length} items` },
            ],
          },
          {
            title: "✅ Tasks",
            text: props.tasks.map(t => `• **${t.owner}**: ${t.title}${t.due_date_text ? ` _(${t.due_date_text})_` : ""}`).join("\n") || "None",
          },
          {
            title: "🔒 Decisions",
            text: props.decisions.map(d => `• ${d.decision}`).join("\n") || "None",
          },
          {
            title: "❓ Things to confirm",
            text: props.questions.map(q => `• ${q.directed_to ? `**${q.directed_to}**: ` : ""}${q.question}`).join("\n") || "None",
          },
        ],
      };
      const resp = await fetch(teamsWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamsPayload),
      });
      if (resp.ok) {
        toast.success("Posted to Teams ✓");
      } else {
        toast.error("Failed to post to Teams — check your webhook URL in Integrations.");
      }
    } catch {
      toast.error("Failed to post to Teams — check your webhook URL in Integrations.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Follow-up Email */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Follow-up Email</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => handleCopy(emailText, "email")}
            >
              {copiedEmail ? (
                <><Check className="h-3 w-3 text-[hsl(var(--confidence-high))]" /> Copied</>
              ) : (
                <><Copy className="h-3 w-3" /> Copy</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={handleSendEmail}
            >
              <Mail className="h-3 w-3" /> Send via email →
            </Button>
          </div>
        </div>
        <textarea
          readOnly
          value={emailText}
          className="w-full min-h-[220px] rounded-lg border border-border/60 bg-muted/20 p-4 text-xs font-mono text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-primary/30 custom-scrollbar"
        />
      </div>

      {/* Slack Message */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Slack Message</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => handleCopy(slackText, "slack")}
            >
              {copiedSlack ? (
                <><Check className="h-3 w-3 text-[hsl(var(--confidence-high))]" /> Copied</>
              ) : (
                <><Copy className="h-3 w-3" /> Copy</>
              )}
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5 disabled:opacity-40"
                  onClick={handlePostToTeams}
                  disabled={!teamsWebhookUrl}
                >
                  <Send className="h-3 w-3" /> Post to Teams
                </Button>
              </TooltipTrigger>
              {!teamsWebhookUrl && (
                <TooltipContent side="top" className="text-xs">
                  Configure Teams in Integrations settings
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
        <textarea
          readOnly
          value={slackText}
          className="w-full min-h-[180px] rounded-lg border border-border/60 bg-muted/20 p-4 text-xs font-mono text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-primary/30 custom-scrollbar"
        />
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center">
        Edit the text above before sending — always review AI-generated content.
      </p>
    </div>
  );
}
