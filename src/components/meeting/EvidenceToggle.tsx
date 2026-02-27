import { useState } from "react";
import { ChevronRight, ChevronDown, Quote } from "lucide-react";

interface Props {
  evidence: string[];
  onSnippetClick?: (snippet: string) => void;
}

export function EvidenceToggle({ evidence, onSnippetClick }: Props) {
  const [open, setOpen] = useState(false);

  if (!evidence || evidence.length === 0) return null;

  return (
    <div className="mt-1">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Quote className="h-3 w-3" />
        <span>Evidence ({evidence.length})</span>
      </button>
      {open && (
        <div className="mt-1 ml-4 space-y-1">
          {evidence.map((e, i) => (
            <p
              key={i}
              className={`text-xs text-muted-foreground italic border-l-2 border-muted pl-2 ${onSnippetClick ? "cursor-pointer hover:text-foreground hover:border-primary transition-colors" : ""}`}
              onClick={() => onSnippetClick?.(e)}
            >
              "{e}"
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
