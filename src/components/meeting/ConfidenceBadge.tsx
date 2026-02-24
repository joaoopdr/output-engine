import type { Confidence } from "@/types/meeting";

const styles: Record<Confidence, string> = {
  high: "bg-confidence-high/15 text-confidence-high border-confidence-high/30",
  medium: "bg-confidence-medium/15 text-confidence-medium border-confidence-medium/30",
  low: "bg-confidence-low/15 text-confidence-low border-confidence-low/30",
};

export function ConfidenceBadge({ level }: { level: Confidence }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${styles[level]}`}>
      {level}
    </span>
  );
}
