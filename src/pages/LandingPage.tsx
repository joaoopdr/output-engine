import { Link } from "react-router-dom";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Zap, LayoutGrid, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Fake output mockup ─────────────────────── */
function OutputMockup() {
  const tasks = [
    { owner: "Sam", title: "Finish API integration", due: "due Friday" },
    { owner: "Lisa", title: "Update onboarding copy", due: "due Monday" },
    { owner: "Dev", title: "Fix cart persistence bug", due: "due Thu" },
  ];
  const decisions = [
    "Ship checkout v2 behind feature flag",
    "Postpone discount codes to next sprint",
  ];
  const confirms = ["Is mobile responsive pass in scope? → Sarah"];

  return (
    <div className="relative mx-auto max-w-2xl mt-12">
      {/* Purple glow */}
      <div className="absolute -inset-8 rounded-3xl bg-primary/10 blur-3xl pointer-events-none" />
      <div className="relative rounded-xl border border-white/[0.08] bg-[#111118] p-5 space-y-4 text-left">
        <div className="flex items-center gap-2 text-xs font-mono text-white/40 border-b border-white/[0.06] pb-3">
          <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-semibold">Tasks</span>
          <span className="px-2 py-0.5 rounded bg-white/[0.06] text-white/40 text-[10px]">Decisions</span>
          <span className="px-2 py-0.5 rounded bg-white/[0.06] text-white/40 text-[10px]">To Confirm</span>
        </div>
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">{t.owner}</span>
              <span className="text-xs text-white/70 flex-1">{t.title}</span>
              <span className="text-[10px] font-mono text-white/30">{t.due}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1 pt-1">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Decisions</p>
          {decisions.map((d, i) => (
            <p key={i} className="text-xs text-white/50 pl-3 border-l-2 border-primary/30">{d}</p>
          ))}
        </div>
        <div className="space-y-1 pt-1">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">To Confirm</p>
          {confirms.map((c, i) => (
            <p key={i} className="text-xs text-white/50 pl-3 border-l-2 border-accent/40">{c}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Feature Card ────────────────────────────── */
function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── Step ─────────────────────────────────────── */
function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex-1 text-center space-y-2">
      <span className="text-4xl font-bold font-mono text-primary/25">{num}</span>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="text-xs text-white/45 leading-relaxed max-w-xs mx-auto">{desc}</p>
    </div>
  );
}

/* ── Page ─────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <LandingNav />

      {/* Hero */}
      <section className="px-5 pt-20 pb-16 text-center max-w-4xl mx-auto">
        <span className="inline-block text-[11px] font-mono font-semibold tracking-[0.2em] uppercase text-primary mb-5">
          Meetings that produce work
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight">
          Your meeting just ended.<br />The work starts now.
        </h1>
        <p className="mt-5 text-sm sm:text-base text-white/45 max-w-lg mx-auto leading-relaxed">
          BriefSync turns any meeting transcript into tasks, decisions, and follow-ups in seconds — no manual note-taking, no chasing owners.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="h-11 px-6 text-sm font-semibold bg-primary hover:bg-primary/90">
            <Link to="/app">Try free →</Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="h-11 px-6 text-sm text-white/60 hover:text-white">
            <a href="#features">See how it works</a>
          </Button>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[11px] text-white/35 font-mono">
          <span>✓ No signup required</span>
          <span>✓ Weekly Planning</span>
          <span>✓ Customer Handoff</span>
        </div>
        <OutputMockup />
      </section>

      {/* Features */}
      <section id="features" className="px-5 py-20 max-w-5xl mx-auto">
        <h2 className="text-center text-xl sm:text-2xl font-bold mb-10">Built for action, not summaries</h2>
        <div className="grid md:grid-cols-3 gap-5">
          <FeatureCard icon={Zap} title="Instant extraction" desc="Paste a transcript, hit generate. Tasks, decisions, and open items appear in seconds. No prompting, no configuration." />
          <FeatureCard icon={LayoutGrid} title="Purpose-built meeting types" desc="Weekly Planning and Customer Handoff — each with a purpose-built extraction model that knows what to look for." />
          <FeatureCard icon={Send} title="Push anywhere" desc="Post summaries to Microsoft Teams or send via email in one click. Integrations that take 30 seconds to set up." />
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-20 max-w-4xl mx-auto border-t border-white/[0.04]">
        <h2 className="text-center text-xl sm:text-2xl font-bold mb-12">How it works</h2>
        <div className="flex flex-col md:flex-row gap-10">
          <Step num={1} title="Paste your transcript" desc="Copy from Zoom, Teams, Notion, or wherever your notes live. Drop it in." />
          <Step num={2} title="Generate outputs" desc="BriefSync extracts tasks with owners and deadlines, decisions, and things to confirm — automatically." />
          <Step num={3} title="Share and act" desc="Export as markdown, push to Teams, or send via email. Your team gets what they need in seconds." />
        </div>
      </section>

      {/* Meeting types */}
      <section className="px-5 py-20 max-w-4xl mx-auto border-t border-white/[0.04]">
        <h2 className="text-center text-xl sm:text-2xl font-bold mb-10">Meeting types</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { title: "Weekly Planning", desc: "Extracts commitments, scope decisions, and execution blockers from team standups and sprint meetings." },
            { title: "Customer Handoff", desc: "Separates internal tasks from customer deliverables. Captures promises made to the customer and who owns what." },
          ].map((m) => (
            <div key={m.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-3">
              <h3 className="text-sm font-semibold text-white">{m.title}</h3>
              <p className="text-xs text-white/45 leading-relaxed">{m.desc}</p>
              <Link to="/app" className="inline-block text-xs text-primary hover:underline">→ Try it</Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20 max-w-3xl mx-auto">
        <div className="relative rounded-2xl border border-primary/20 bg-primary/[0.04] p-10 text-center">
          <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl pointer-events-none" />
          <div className="relative space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">Ready to stop losing action items?</h2>
            <p className="text-sm text-white/45">Paste your first transcript in under a minute.</p>
            <Button asChild size="lg" className="h-11 px-8 text-sm font-semibold bg-primary hover:bg-primary/90">
              <Link to="/app">Try BriefSync free →</Link>
            </Button>
            <p className="text-[11px] text-white/30 font-mono">No account required · Works with any transcript format</p>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
