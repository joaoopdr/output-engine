import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0a0a0f] px-6 py-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo-dark.png" alt="BriefSync" className="h-4 w-auto opacity-50" />
            <span className="text-xs font-mono text-white/30">© 2025 BriefSync</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-white/30">
            <Link to="/#features" className="hover:text-white/60 transition-colors">Features</Link>
            <Link to="/pricing" className="hover:text-white/60 transition-colors">Pricing</Link>
            <Link to="/use-cases" className="hover:text-white/60 transition-colors">Use Cases</Link>
            <Link to="/about" className="hover:text-white/60 transition-colors">About</Link>
            <Link to="/roadmap" className="hover:text-white/60 transition-colors">Roadmap</Link>
            <Link to="/security" className="hover:text-white/60 transition-colors">Security</Link>
            <Link to="/waitlist" className="hover:text-white/60 transition-colors">Join waitlist</Link>
          </div>
        </div>
        <div className="text-center">
          <a href="mailto:hello@briefsync.ai" className="text-[11px] font-mono text-white/20 hover:text-white/40 transition-colors">
            hello@briefsync.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
