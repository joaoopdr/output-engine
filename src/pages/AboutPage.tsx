import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <LandingNav />

      <section className="px-6 pt-20 pb-10 text-center max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold">We built the tool we needed after every meeting</h1>
      </section>

      {/* Story */}
      <section className="px-6 pb-16 max-w-2xl mx-auto">
        <div className="prose prose-invert prose-sm mx-auto space-y-4 text-white/50 leading-relaxed text-sm">
          <p>Every team we've worked with has the same problem. The meeting ends, everyone leaves with a slightly different understanding of what was agreed, and three days later someone's chasing owners on Slack.</p>
          <p>We tried every note-taking tool. They all produce summaries — long, unstructured walls of text that someone has to read and convert into actual work.</p>
          <p>BriefSync does the conversion. It reads the transcript the way a rigorous ops person would — looking for commitments, not topics. It asks: who said they'd do what, by when, and is that actually confirmed?</p>
          <p>The result isn't a summary. It's a work plan.</p>
        </div>
      </section>

      {/* Mission */}
      <section className="px-6 pb-16 max-w-2xl mx-auto">
        <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-8 text-center">
          <p className="text-lg font-semibold text-white/90">"Meetings should produce work. BriefSync makes that automatic."</p>
        </div>
      </section>

      {/* Values */}
      <section className="px-6 pb-16 max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { title: "Precision over recall", desc: "We'd rather miss an ambiguous item than invent a fake commitment. If it wasn't said clearly, it doesn't become a task." },
            { title: "Evidence, always", desc: "Every extracted item links to the exact words that justified it. Nothing comes from nowhere." },
            { title: "Built for action", desc: "A summary you read is not the same as a plan you execute. Every output is designed to be acted on immediately." },
          ].map((v) => (
            <div key={v.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-2">
              <h3 className="text-sm font-semibold text-white">{v.title}</h3>
              <p className="text-xs text-white/45 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="px-6 pb-20 max-w-2xl mx-auto">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center space-y-3">
          <p className="text-sm text-white/60">Built by a small team obsessed with execution.</p>
          <a href="mailto:hello@briefsync.ai" className="inline-block text-xs text-primary hover:underline">Get in touch →</a>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
