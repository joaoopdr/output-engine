import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0a0a0f] px-5 py-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img src="/logo-dark.png" alt="BriefSync" className="h-4 w-auto opacity-50" />
          <span className="text-xs font-mono text-white/30">© 2025 BriefSync</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-white/30">
          <Link to="/#features" className="hover:text-white/60 transition-colors">Features</Link>
          <Link to="/pricing" className="hover:text-white/60 transition-colors">Pricing</Link>
          <Link to="/changelog" className="hover:text-white/60 transition-colors">Changelog</Link>
          <Link to="/app" className="hover:text-white/60 transition-colors">Try free →</Link>
        </div>
      </div>
    </footer>
  );
}
