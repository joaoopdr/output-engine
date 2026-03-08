import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

interface Entry { date: string; version: string; title: string; items: string[] }

const entries: Entry[] = [
  {
    date: "March 2025", version: "v1.3", title: "Customer Handoff meeting type",
    items: [
      "New extraction model for sales-to-delivery handoff meetings",
      "Internal vs customer task labelling",
      "Customer context card: goal, success criteria, constraints, stakeholders",
      "Teams webhook and email integrations",
    ],
  },
  {
    date: "March 2025", version: "v1.2", title: "Gold standard evaluation system",
    items: [
      "Batch evaluation dashboard with scoring",
      "10 gold standard test cases",
      "Fuzzy matching scorer with recall, precision, and F1",
    ],
  },
  {
    date: "February 2025", version: "v1.1", title: "Output quality improvements",
    items: [
      "Commitment vs non-commitment phrase detection",
      "Evidence snippets for every extracted item",
      "Click-to-highlight evidence in transcript",
      "Priority tags: Urgent / This week / When possible",
    ],
  },
  {
    date: "February 2025", version: "v1.0", title: "Initial release",
    items: [
      "Weekly Planning extraction: tasks, decisions, things to confirm",
      "Clean mode and review mode",
      "MD, JSON, TXT export",
      "Date resolution for relative dates",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <LandingNav />

      <section className="px-5 pt-20 pb-8 text-center max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold">Changelog</h1>
        <p className="mt-3 text-sm text-white/45">What's new in BriefSync</p>
      </section>

      <section className="px-5 pb-20 max-w-2xl mx-auto">
        <div className="space-y-10">
          {entries.map((e, i) => (
            <div key={i} className="relative pl-6 border-l border-white/[0.06]">
              <div className="absolute left-0 top-0 -translate-x-1/2 h-3 w-3 rounded-full bg-primary/60 border-2 border-[#0a0a0f]" />
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[11px] font-mono text-white/30">{e.date}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">{e.version}</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">{e.title}</h3>
              <ul className="space-y-1">
                {e.items.map((item, j) => (
                  <li key={j} className="text-xs text-white/45 leading-relaxed">• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
