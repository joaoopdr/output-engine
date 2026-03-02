import { useState, useEffect, useRef } from "react";
import { resolveDate, formatDateDisplay, isToday, isOverdue } from "@/lib/dateUtils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar, X } from "lucide-react";

interface Props {
  dateText: string;
  iso?: string | null;
  confidence?: "exact" | "assumed" | "unresolved";
  meetingDate?: string;
  evidence?: string;
  onUpdate: (text: string, iso: string | null) => void;
}

export function DatePill({ dateText, iso, confidence, meetingDate, evidence, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [freeText, setFreeText] = useState("");
  const [preview, setPreview] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFreeText("");
      setPreview("");
    }
  }, [open]);

  useEffect(() => {
    if (freeText.trim()) {
      const resolved = resolveDate(freeText, meetingDate);
      setPreview(resolved.iso ? formatDateDisplay(resolved.iso) : "");
    } else {
      setPreview("");
    }
  }, [freeText, meetingDate]);

  const applyQuick = (text: string) => {
    const resolved = resolveDate(text, meetingDate);
    onUpdate(text, resolved.iso);
    setOpen(false);
  };

  const applyTimeModifier = (modifier: string) => {
    const base = dateText || "today";
    const newText = `${base} ${modifier}`.trim();
    const resolved = resolveDate(newText, meetingDate);
    onUpdate(newText, resolved.iso);
    setOpen(false);
  };

  const applyFreeText = () => {
    if (!freeText.trim()) return;
    const resolved = resolveDate(freeText, meetingDate);
    onUpdate(freeText, resolved.iso);
    setOpen(false);
  };

  const handleClear = () => {
    onUpdate("", null);
    setOpen(false);
  };

  // Display logic
  const displayText = iso ? formatDateDisplay(iso) : dateText;
  const todayHighlight = iso ? isToday(iso) : false;
  const overdueHighlight = iso ? isOverdue(iso) : false;

  const pillColor = overdueHighlight
    ? "bg-confidence-low/12 text-confidence-low border-confidence-low/25"
    : todayHighlight
      ? "bg-confidence-medium/12 text-confidence-medium border-confidence-medium/25"
      : "bg-muted text-muted-foreground border-border";

  if (!dateText && !iso) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-border/60 text-muted-foreground/50 hover:border-primary/30 hover:text-muted-foreground transition-colors flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Add date</span>
          </button>
        </PopoverTrigger>
        <DatePopoverContent
          freeText={freeText}
          setFreeText={setFreeText}
          preview={preview}
          inputRef={inputRef}
          onQuick={applyQuick}
          onTime={applyTimeModifier}
          onFreeText={applyFreeText}
          onClear={handleClear}
          hasDate={false}
        />
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={`text-[11px] font-mono px-2 py-0.5 rounded-full border shrink-0 transition-colors hover:border-primary/30 flex items-center gap-1 ${pillColor}`}>
          {confidence === "assumed" && <span className="text-muted-foreground/60">~</span>}
          {displayText}
        </button>
      </PopoverTrigger>
      <DatePopoverContent
        freeText={freeText}
        setFreeText={setFreeText}
        preview={preview}
        inputRef={inputRef}
        onQuick={applyQuick}
        onTime={applyTimeModifier}
        onFreeText={applyFreeText}
        onClear={handleClear}
        hasDate={!!dateText}
        evidence={evidence}
      />
    </Popover>
  );
}

function DatePopoverContent({
  freeText, setFreeText, preview, inputRef,
  onQuick, onTime, onFreeText, onClear, hasDate, evidence,
}: {
  freeText: string;
  setFreeText: (v: string) => void;
  preview: string;
  inputRef: React.RefObject<HTMLInputElement>;
  onQuick: (text: string) => void;
  onTime: (modifier: string) => void;
  onFreeText: () => void;
  onClear: () => void;
  hasDate: boolean;
  evidence?: string;
}) {
  return (
    <PopoverContent className="w-72 p-3 space-y-3" align="start" sideOffset={6}>
      {/* Transcript evidence */}
      {evidence && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">From transcript</p>
          <p className="text-[11px] text-muted-foreground italic leading-snug border-l-2 border-primary/20 pl-2">
            "{evidence}"
          </p>
        </div>
      )}

      {/* Quick date buttons */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Quick select</p>
        <div className="flex flex-wrap gap-1">
          {["Today", "Tomorrow", "This Friday", "Next Monday"].map(label => (
            <Button
              key={label}
              variant="outline"
              size="sm"
              className="text-[11px] h-6 px-2 border-border/60"
              onClick={() => onQuick(label.toLowerCase())}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Time quick-select */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Time</p>
        <div className="flex flex-wrap gap-1">
          {[
            { label: "Morning 9am", value: "morning" },
            { label: "Lunch 12:30", value: "lunch" },
            { label: "Afternoon 3pm", value: "afternoon" },
            { label: "Evening 6pm", value: "evening" },
            { label: "EOD 5pm", value: "eod" },
          ].map(({ label, value }) => (
            <Button
              key={value}
              variant="outline"
              size="sm"
              className="text-[11px] h-6 px-2 border-border/60"
              onClick={() => onTime(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Free text */}
      <div className="space-y-1">
        <input
          ref={inputRef}
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") onFreeText(); }}
          placeholder="e.g. tomorrow morning, 27 Feb, Friday"
          className="w-full text-sm h-8 rounded-md border border-input bg-transparent px-2.5 placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
        />
        {preview && (
          <p className="text-[11px] text-primary">→ {preview}</p>
        )}
      </div>

      {/* Clear */}
      {hasDate && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-[11px] h-6 text-muted-foreground hover:text-destructive"
            onClick={onClear}
          >
            <X className="h-3 w-3 mr-1" /> Clear date
          </Button>
        </div>
      )}
    </PopoverContent>
  );
}
