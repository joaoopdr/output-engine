import { Link } from "react-router-dom";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

function SecurityCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-3">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="text-xs text-white/50 leading-relaxed flex items-start gap-2">
            <span className="text-primary mt-0.5 shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <LandingNav />

      <section className="px-6 pt-20 pb-16 text-center max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold">Security & Privacy</h1>
        <p className="mt-3 text-sm text-white/45">What happens to your transcript data.</p>
      </section>

      <section className="px-6 pb-20 max-w-4xl mx-auto grid sm:grid-cols-2 gap-5">
        <SecurityCard
          title="Data handling"
          items={[
            "Transcripts are sent to our AI processing layer and not stored permanently",
            "No transcript data is used to train models",
            "Processing happens in real-time — data is not retained after output is generated",
          ]}
        />
        <SecurityCard
          title="What we store"
          items={[
            "Run metadata (task counts, timestamps) for the batch evaluation dashboard",
            "No personally identifiable information is required to use BriefSync",
            "Local settings (time preferences, integration URLs) are stored in your browser only",
          ]}
        />
        <SecurityCard
          title="Integrations"
          items={[
            "Teams webhook URLs are stored in your browser's localStorage — never on our servers",
            "No OAuth tokens or third-party credentials pass through BriefSync servers",
          ]}
        />
        <SecurityCard
          title="Infrastructure"
          items={[
            "Built on PostgreSQL with row-level security",
            "Edge functions run in isolated Deno environments",
            "All data in transit encrypted via TLS",
          ]}
        />
      </section>

      <section className="px-6 pb-20 max-w-2xl mx-auto text-center space-y-3">
        <p className="text-xs text-white/30 font-mono">
          Questions? <a href="mailto:hello@briefsync.ai" className="text-primary hover:underline">hello@briefsync.ai</a>
        </p>
        <Link to="/app" className="inline-block text-xs text-primary hover:underline">→ Back to app</Link>
      </section>

      <LandingFooter />
    </div>
  );
}
