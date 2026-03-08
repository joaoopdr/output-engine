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
    { label: "Changelog", href: "/changelog" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#0a0a0f]/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-5">
        {/* Left */}
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo-dark.png" alt="BriefSync" className="h-6 w-auto" />
          <span className="text-sm font-semibold font-mono text-white tracking-tight">BriefSync</span>
        </Link>

        {/* Centre — desktop */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.href}
              onClick={l.onClick}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right — desktop */}
        <div className="hidden md:flex flex-col items-end gap-0.5">
          <Button asChild size="sm" className="h-8 px-4 text-xs font-semibold bg-primary hover:bg-primary/90">
            <Link to="/app">Try free →</Link>
          </Button>
          <span className="text-[10px] text-white/30">No signup needed</span>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-white/60 hover:text-white" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#0a0a0f] px-5 pb-4 pt-3 space-y-3">
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
          <Button asChild size="sm" className="w-full h-9 text-xs font-semibold bg-primary hover:bg-primary/90">
            <Link to="/app" onClick={() => setOpen(false)}>Try free →</Link>
          </Button>
        </div>
      )}
    </nav>
  );
}
