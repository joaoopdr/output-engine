import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

function RoadmapColumn({ title, borderColor, items, pulse }: { title: string; borderColor: string; items: { icon: string; label: string }[]; pulse?: boolean }) {
  return (
    <div className="flex-1 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        {pulse && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className={`rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-white/60 border-l-2 ${borderColor}`}>
            {item.icon} {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <LandingNav />

      <section className="px-6 pt-20 pb-16 text-center max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold">What we're building</h1>
        <p className="mt-3 text-sm text-white/45">Honest, public roadmap. Updated as things ship.</p>
      </section>

      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          <RoadmapColumn
            title="Shipped"
            borderColor="border-l-green-500/60"
            items={[
              { icon: "✅", label: "Weekly Planning extraction" },
              { icon: "✅", label: "Customer Handoff extraction" },
              { icon: "✅", label: "Evidence-backed items" },
              { icon: "✅", label: "MD / JSON / TXT export" },
              { icon: "✅", label: "Microsoft Teams integration" },
              { icon: "✅", label: "Email integration" },
              { icon: "✅", label: "Batch evaluation + gold standards" },
            ]}
          />
          <RoadmapColumn
            title="In progress"
            borderColor="border-l-primary/60"
            pulse
            items={[
              { icon: "🔄", label: "Sprint Planning meeting type" },
              { icon: "🔄", label: "Slack integration" },
              { icon: "🔄", label: "Follow-up email generator" },
              { icon: "🔄", label: "API key (bring your own model)" },
            ]}
          />
          <RoadmapColumn
            title="Planned"
            borderColor="border-l-white/20"
            items={[
              { icon: "📋", label: "Linear integration" },
              { icon: "📋", label: "Notion integration" },
              { icon: "📋", label: "Meeting history + search" },
              { icon: "📋", label: "User accounts" },
              { icon: "📋", label: "Custom meeting types" },
              { icon: "📋", label: "Audio/video transcript upload" },
              { icon: "📋", label: "Mobile app" },
            ]}
          />
        </div>
      </section>

      <section className="px-6 pb-20 max-w-2xl mx-auto text-center space-y-3">
        <p className="text-sm text-white/50">Have a feature request?</p>
        <a href="mailto:hello@briefsync.ai" className="inline-block text-xs text-primary hover:underline">hello@briefsync.ai →</a>
        <p className="text-[11px] text-white/25 font-mono">We read every message.</p>
      </section>

      <LandingFooter />
    </div>
  );
}
