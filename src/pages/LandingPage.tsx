import { Link } from "react-router-dom";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Zap, LayoutGrid, Send, Search } from "lucide-react";
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
    <div className="relative mx-auto max-w-4xl mt-14">
      {/* Purple glow */}
      <div className="absolute -inset-10 rounded-3xl blur-[80px] pointer-events-none" style={{ background: "rgba(124,58,237,0.25)" }} />
      <div className="relative rounded-xl border border-white/[0.08] bg-[#111118] p-6 space-y-4 text-left shadow-[0_0_80px_-10px_rgba(124,58,237,0.4)]">
        <div className="flex items-center gap-2 text-xs font-mono text-white/40 border-b border-white/[0.06] pb-3">
          <span className="px-2.5 py-1 rounded bg-primary/20 text-primary text-[10px] font-semibold animate-[pulse_3s_ease-in-out_infinite]">Tasks</span>
          <span className="px-2.5 py-1 rounded bg-white/[0.06] text-white/40 text-[10px]">Decisions</span>
          <span className="px-2.5 py-1 rounded bg-white/[0.06] text-white/40 text-[10px]">To Confirm</span>
        </div>
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">{t.owner}</span>
              <span className="text-xs text-white/70 flex-1">{t.title}</span>
              <span className="text-[10px] font-mono text-white/30">{t.due}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Decisions</p>
          {decisions.map((d, i) => (
            <p key={i} className="text-xs text-white/50 pl-3 border-l-2 border-primary/30">{d}</p>
          ))}
        </div>
        <div className="space-y-1.5 pt-1">
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
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-3 hover:border-primary/30 hover:-translate-y-1 transition-all duration-200">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
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
    <div className="flex-1 text-center space-y-2 relative">
      <span className="text-8xl font-bold font-mono text-primary/[0.08] leading-none select-none">{num}</span>
      <h3 className="text-sm font-semibold text-white -mt-4 relative">{title}</h3>
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
      <section className="px-6 pt-20 pb-16 text-center max-w-4xl mx-auto">
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
            <Link to="/waitlist">Get early access →</Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="h-11 px-6 text-sm text-white/60 hover:text-white">
            <Link to="/app">See the demo →</Link>
          </Button>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-[11px] text-white/40 font-mono">
          {["✓ No signup required", "✓ Weekly Planning", "✓ Customer Handoff"].map((t) => (
            <span key={t} className="px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03]">{t}</span>
          ))}
        </div>
        <OutputMockup />
      </section>

      {/* Gradient divider */}
      <div className="h-px mx-auto max-w-3xl" style={{ background: "linear-gradient(90deg, transparent, hsl(258 85% 68% / 0.4), transparent)" }} />

      {/* Features */}
      <section id="features" className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="text-center text-xl sm:text-2xl font-bold mb-10">Built for action, not summaries</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <FeatureCard icon={Zap} title="Instant extraction" desc="Paste a transcript, hit generate. Tasks, decisions, and open items appear in seconds. No prompting, no configuration." />
          <FeatureCard icon={LayoutGrid} title="Purpose-built meeting types" desc="Weekly Planning, Customer Handoff, and Sprint Planning — each with a purpose-built extraction model that knows what to look for." />
          <FeatureCard icon={Send} title="Push anywhere" desc="Post summaries to Microsoft Teams or send via email in one click. Integrations that take 30 seconds to set up." />
          <FeatureCard icon={Search} title="Evidence-backed" desc="Every extracted item links back to the exact transcript quote that justified it. No black box." />
        </div>
      </section>

      {/* Social proof strip */}
      <section className="px-6 py-10 max-w-4xl mx-auto text-center">
        <p className="text-[11px] font-mono text-white/25 uppercase tracking-wider mb-4">Trusted by teams at</p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {["Meridian Health", "Stonegate Logistics", "Apex Digital", "NorthStar Ops", "Relay Agency"].map((name) => (
            <span key={name} className="text-xs font-mono text-white/20">{name}</span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 max-w-4xl mx-auto border-t border-white/[0.04]">
        <h2 className="text-center text-xl sm:text-2xl font-bold mb-14">How it works</h2>
        <div className="relative flex flex-col md:flex-row gap-10">
          {/* Connecting dotted line on desktop */}
          <div className="hidden md:block absolute top-10 left-[20%] right-[20%] border-t border-dashed border-white/[0.08]" />
          <Step num={1} title="Paste your transcript" desc="Copy from Zoom, Teams, Notion, or wherever your notes live. Drop it in." />
          <Step num={2} title="Generate outputs" desc="BriefSync extracts tasks with owners and deadlines, decisions, and things to confirm — automatically." />
          <Step num={3} title="Share and act" desc="Export as markdown, push to Teams, or send via email. Your team gets what they need in seconds." />
        </div>
      </section>

      {/* Meeting types */}
      <section className="px-6 py-20 max-w-4xl mx-auto border-t border-white/[0.04]">
        <h2 className="text-center text-xl sm:text-2xl font-bold mb-10">Meeting types</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { title: "Weekly Planning", desc: "Extracts commitments, scope decisions, and execution blockers from team standups and sprint meetings.", live: true },
            { title: "Customer Handoff", desc: "Separates internal tasks from customer deliverables. Captures promises made to the customer and who owns what.", live: true },
            { title: "Sprint Planning", desc: "Extracts sprint goals, stories with points, acceptance criteria, and unresolved dependencies.", live: false },
          ].map((m) => (
            <div key={m.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-3 border-l-2 border-l-primary/60">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">{m.title}</h3>
                {!m.live && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">Coming soon</span>}
              </div>
              <p className="text-xs text-white/45 leading-relaxed">{m.desc}</p>
              {m.live && <Link to="/app" className="inline-block text-xs text-primary hover:underline">→ Try it</Link>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <div className="relative rounded-2xl border border-primary/20 p-10 text-center overflow-hidden">
          <div className="absolute inset-0 bg-primary/[0.04] animate-[pulse_4s_ease-in-out_infinite]" />
          <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl pointer-events-none" />
          <div className="relative space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">Ready to stop losing action items?</h2>
            <p className="text-sm text-white/45">Paste your first transcript in under a minute.</p>
            <Button asChild size="lg" className="h-12 px-8 text-sm font-semibold bg-primary hover:bg-primary/90 group">
              <Link to="/waitlist">
                Join the waitlist
                <span className="inline-block ml-1 transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </Button>
            <p className="text-[11px] text-white/30 font-mono">No account required · Works with any transcript format</p>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
