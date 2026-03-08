import { useState } from "react";
import { Link } from "react-router-dom";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PlanProps {
  name: string;
  price: string;
  originalPrice?: string;
  period: string;
  tagline: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
  comingSoon?: boolean;
}

function PlanCard({ name, price, originalPrice, period, tagline, features, cta, href, highlighted, comingSoon }: PlanProps) {
  return (
    <div className={`relative rounded-xl border p-6 space-y-5 flex flex-col ${highlighted ? "border-primary/40 bg-primary/[0.04]" : "border-white/[0.06] bg-white/[0.02]"}`}
      style={highlighted ? { boxShadow: "0 0 40px -10px rgba(124,58,237,0.3)" } : undefined}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono font-semibold uppercase tracking-wider bg-primary text-white px-3 py-0.5 rounded-full">
          Most Popular
        </span>
      )}
      <div>
        <h3 className="text-sm font-semibold text-white">{name}</h3>
        <p className="mt-2">
          {originalPrice && <span className="text-sm text-white/30 line-through mr-2">{originalPrice}</span>}
          <span className="text-2xl font-bold text-white">{price}</span>
          <span className="text-xs text-white/40"> {period}</span>
        </p>
        <p className="text-xs text-white/40 mt-1">{tagline}</p>
      </div>
      <ul className="space-y-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-white/55">
            <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {comingSoon ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button disabled className="w-full h-9 text-xs font-semibold opacity-50">{cta}</Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">Coming soon</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : href.startsWith("mailto:") ? (
        <Button asChild variant={highlighted ? "default" : "outline"} className="w-full h-9 text-xs font-semibold">
          <a href={href}>{cta}</a>
        </Button>
      ) : (
        <Button asChild variant={highlighted ? "default" : "outline"} className="w-full h-9 text-xs font-semibold">
          <Link to={href}>{cta}</Link>
        </Button>
      )}
    </div>
  );
}

const faqs = [
  { q: "Do I need a credit card to start?", a: "No. The free tier requires no payment details." },
  { q: "What meeting types are supported?", a: "Weekly Planning and Customer Handoff are live. Sprint Planning is coming soon." },
  { q: "Can I export my outputs?", a: "Yes — markdown, JSON, and plain text exports are available on all plans." },
  { q: "How do integrations work?", a: "Paste a webhook URL for Teams or use the mailto button for email. No OAuth, no complex setup." },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <LandingNav />

      <section className="px-6 pt-20 pb-10 text-center max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold">Simple pricing. No surprises.</h1>
        <p className="mt-3 text-sm text-white/45">Start free. Upgrade when you need more.</p>

        {/* Monthly / Yearly toggle */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setYearly(false)}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg transition-colors ${!yearly ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/60"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg transition-colors ${yearly ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/60"}`}
          >
            Yearly <span className="text-primary text-[10px]">save 20%</span>
          </button>
        </div>
      </section>

      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-5">
          <PlanCard
            name="Free"
            price="$0"
            period="/ month"
            tagline="Perfect for trying it out"
            features={["10 transcripts / month", "Weekly Planning", "Customer Handoff", "MD, JSON, TXT export", "Email integration"]}
            cta="Get started free"
            href="/app"
          />
          <PlanCard
            name="Pro"
            price={yearly ? "$15" : "$19"}
            originalPrice={yearly ? "$19" : undefined}
            period={yearly ? "/ mo (billed yearly)" : "/ month"}
            tagline="For individuals and small teams"
            highlighted
            features={["Everything in Free", "Unlimited transcripts", "Teams & Slack integration", "Meeting history", "Priority support"]}
            cta="Start Pro trial"
            href="/app"
            comingSoon
          />
          <PlanCard
            name="Team"
            price={yearly ? "$39" : "$49"}
            originalPrice={yearly ? "$49" : undefined}
            period={yearly ? "/ mo (billed yearly)" : "/ month"}
            tagline="For growing teams"
            features={["Everything in Pro", "Unlimited seats", "Linear & Notion integration", "Custom meeting types", "API access"]}
            cta="Contact us"
            href="mailto:hello@briefsync.ai"
          />
        </div>
      </section>

      <section className="px-6 pb-20 max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold text-center mb-6">FAQ</h2>
        <Accordion type="single" collapsible className="space-y-1">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-white/[0.06]">
              <AccordionTrigger className="text-sm text-white/70 hover:text-white hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-white/45">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <LandingFooter />
    </div>
  );
}
