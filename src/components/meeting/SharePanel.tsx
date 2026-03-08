import { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateEmail, generateSlack } from "@/lib/shareUtils";
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
  const [mode, setMode] = useState<"email" | "slack">("email");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedSlack, setCopiedSlack] = useState(false);

  const emailText = useMemo(() => generateEmail(props), [props]);
  const slackText = useMemo(() => generateSlack(props), [props]);

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

  const activeText = mode === "email" ? emailText : slackText;
  const isCopied = mode === "email" ? copiedEmail : copiedSlack;

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 rounded-md border border-border/50 overflow-hidden w-fit">
        {(["email", "slack"] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-[11px] font-medium px-3 py-1 transition-colors ${
              mode === m
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {m === "email" ? "Email" : "Slack"}
          </button>
        ))}
      </div>

      {/* Text area with copy button */}
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => handleCopy(activeText, mode)}
          >
            {isCopied ? (
              <><Check className="h-3 w-3 text-green-500" /> Copied</>
            ) : (
              <><Copy className="h-3 w-3" /> Copy</>
            )}
          </Button>
        </div>
        <textarea
          readOnly
          value={activeText}
          className="w-full min-h-[320px] rounded-lg border border-border/60 bg-muted/20 p-4 pr-20 text-xs font-mono text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-primary/30 custom-scrollbar"
        />
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center">
        Edit the text above before sending — always review AI-generated content.
      </p>
    </div>
  );
}
