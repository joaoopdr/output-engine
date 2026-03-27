import { useState } from "react";
import { Link } from "react-router-dom";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ROLE_OPTIONS = [
  "Student",
  "Founder / Co-founder",
  "Product Manager",
  "Engineer",
  "Consultant / Agency",
  "Operations",
  "Sales / Account Manager",
  "Other",
];

const TEAM_SIZE_OPTIONS = [
  "Just me",
  "2–5 people",
  "6–15 people",
  "16–50 people",
  "50+ people",
];

export default function WaitlistPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [biggestPain, setBiggestPain] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: insertError } = await (supabase as any)
        .from("waitlist")
        .insert({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: role || null,
          team_size: teamSize || null,
          biggest_pain: biggestPain.trim() || null,
          referral_source: referralSource.trim() || null,
        });

      if (insertError) {
        if (insertError.code === "23505" || insertError.message?.includes("duplicate")) {
          setError("This email is already on the waitlist.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <LandingNav />

      <section className="px-6 pt-16 pb-20 max-w-lg mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <span className="inline-block text-[11px] font-mono font-semibold tracking-[0.2em] uppercase text-primary mb-4">
            Early Access
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
            Be first when we launch.
          </h1>
          <p className="mt-4 text-sm text-white/45 leading-relaxed max-w-md mx-auto">
            We're building a tool that turns meeting transcripts into clear tasks, owners, and deadlines — so nothing gets lost after meetings. Join the list and get free early access.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/40 font-mono">
            {["Free during MVP", "No credit card", "Cancel anytime"].map((t) => (
              <span key={t} className="px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03]">{t}</span>
            ))}
          </div>
        </div>

        {submitted ? (
          /* ── Success state ── */
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-10 text-center space-y-4">
            <CheckCircle2 className="h-14 w-14 text-green-400 mx-auto" />
            <h2 className="text-xl font-bold">You're on the list.</h2>
            <p className="text-sm text-white/45">
              We'll reach out as soon as early access opens. Keep an eye on your inbox.
            </p>
            <p className="text-xs text-white/30">
              In the meantime, feel free to{" "}
              <Link to="/app" className="text-primary hover:underline">try the demo →</Link>
            </p>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">Name *</label>
              <Input
                required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">Work email *</label>
              <Input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">Your role</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">Team size</label>
              <Select value={teamSize} onValueChange={setTeamSize}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white">
                  <SelectValue placeholder="Select team size" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">What's your biggest pain after meetings?</label>
              <Textarea
                value={biggestPain}
                onChange={(e) => setBiggestPain(e.target.value.slice(0, 300))}
                placeholder="e.g. tasks get lost, no one knows who owns what, follow-up is manual..."
                maxLength={300}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-primary/50 min-h-[80px]"
              />
              <p className="text-[10px] text-white/25 text-right">{biggestPain.length}/300</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">How did you hear about us?</label>
              <Input
                value={referralSource} onChange={(e) => setReferralSource(e.target.value)}
                placeholder="e.g. Twitter, a friend, LinkedIn..."
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-primary/50"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button
              type="submit" disabled={loading}
              className="w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join the waitlist →"}
            </Button>
          </form>
        )}
      </section>

      <LandingFooter />
    </div>
  );
}
