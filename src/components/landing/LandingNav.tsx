import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleFeaturesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === "/") {
      document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/#features");
    }
    setOpen(false);
  };

  const links = [
    { label: "Features", href: "/#features", onClick: handleFeaturesClick },
    { label: "Pricing", href: "/pricing" },
    { label: "Use Cases", href: "/use-cases" },
    { label: "About", href: "/about" },
    { label: "Roadmap", href: "/roadmap" },
    { label: "Security", href: "/security" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#0a0a0f]/95 backdrop-blur-md">
      <div className="relative max-w-6xl mx-auto flex items-center justify-between h-14 px-6">
        {/* Left — Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src="/logo-dark.png" alt="BriefSync" className="h-6 w-auto" />
          <span className="text-sm font-semibold font-mono text-white tracking-tight">BriefSync</span>
        </Link>

        {/* Centre — desktop links (absolutely centered) */}
        <div className="hidden lg:flex items-center gap-5 absolute left-1/2 -translate-x-1/2">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.href}
              onClick={l.onClick}
              className="text-[13px] text-white/50 hover:text-white transition-colors whitespace-nowrap"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right — CTA desktop */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <Link to="/app" className="text-[13px] text-white/50 hover:text-white transition-colors">
            Try demo →
          </Link>
          <Button asChild size="sm" className="h-8 px-4 text-xs font-semibold bg-primary hover:bg-primary/90">
            <Link to="/waitlist">Join waitlist →</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button className="lg:hidden text-white/60 hover:text-white" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="lg:hidden border-t border-white/[0.06] bg-[#0a0a0f] px-6 pb-4 pt-3 space-y-3">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.href}
              onClick={(e) => { l.onClick?.(e); setOpen(false); }}
              className="block text-sm text-white/60 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <Link to="/app" onClick={() => setOpen(false)} className="block text-sm text-white/60 hover:text-white">
            Try demo →
          </Link>
          <Button asChild size="sm" className="w-full h-9 text-xs font-semibold bg-primary hover:bg-primary/90">
            <Link to="/waitlist" onClick={() => setOpen(false)}>Join waitlist →</Link>
          </Button>
        </div>
      )}
    </nav>
  );
}
