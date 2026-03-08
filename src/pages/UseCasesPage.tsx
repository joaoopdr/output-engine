import { Link } from "react-router-dom";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Settings, Users, Briefcase } from "lucide-react";

interface UseCaseProps {
  icon: any;
  headline: string;
  description: string;
  extracts: string[];
  quote: string;
  attribution: string;
}

function UseCaseSection({ icon: Icon, headline, description, extracts, quote, attribution }: UseCaseProps) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 space-y-5">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-white">{headline}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{description}</p>
      <div className="flex flex-wrap gap-2">
        {extracts.map((e) => (
          <span key={e} className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/50">{e}</span>
        ))}
      </div>
      <blockquote className="border-l-2 border-primary/40 pl-4 py-2">
        <p className="text-xs text-white/40 italic leading-relaxed">"{quote}"</p>
        <p className="text-[11px] text-white/25 font-mono mt-2">— {attribution}</p>
      </blockquote>
    </div>
  );
}

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <LandingNav />

      <section className="px-6 pt-20 pb-16 text-center max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold">BriefSync works where your meetings happen</h1>
        <p className="mt-3 text-sm text-white/45">Purpose-built extraction for the meetings that matter most.</p>
      </section>

      <section className="px-6 pb-20 max-w-4xl mx-auto space-y-6">
        <UseCaseSection
          icon={Settings}
          headline="Stop losing weekly action items"
          description="Weekly planning meetings produce dozens of commitments. BriefSync captures every one — with the owner, deadline, and the exact words that made it a commitment."
          extracts={["Tasks with owners + deadlines", "Scope decisions", "Execution blockers", "Follow-up items"]}
          quote="We used to spend 20 minutes after every standup just writing up what people said. Now it's instant."
          attribution="Ops Lead, SaaS company"
        />
        <UseCaseSection
          icon={Users}
          headline="Close the gap between sales and delivery"
          description="Customer handoff meetings are where deals go wrong. BriefSync captures what was promised, who owns what, and what the customer needs to deliver — split clearly between your team and theirs."
          extracts={["Internal tasks", "Customer deliverables", "Promises made to the customer", "Unresolved blockers"]}
          quote="Our first implementation failure was because nobody wrote down what the customer agreed to bring. That doesn't happen anymore."
          attribution="Account Executive, enterprise software"
        />
        <UseCaseSection
          icon={Briefcase}
          headline="Every client meeting becomes a clear brief"
          description="Client meetings are full of scope creep, vague requests, and unconfirmed timelines. BriefSync extracts what was actually agreed — and flags what still needs confirmation."
          extracts={["Scoped deliverables", "Client commitments", "Open questions", "Follow-up email draft"]}
          quote="We paste the transcript in, review the outputs in 2 minutes, and send the follow-up. Clients think we're incredibly organised."
          attribution="Project Manager, digital agency"
        />
      </section>

      {/* CTA */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <div className="relative rounded-2xl border border-primary/20 bg-primary/[0.04] p-10 text-center">
          <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl pointer-events-none" />
          <div className="relative space-y-4">
            <h2 className="text-xl font-bold">See it in action</h2>
            <p className="text-sm text-white/45">Paste any transcript and get structured outputs in seconds.</p>
            <Button asChild size="lg" className="h-11 px-8 text-sm font-semibold bg-primary hover:bg-primary/90">
              <Link to="/app">Try BriefSync free →</Link>
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
