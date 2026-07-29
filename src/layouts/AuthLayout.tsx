import { Outlet, Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export const AuthLayout = () => (
  <div className="min-h-screen grid lg:grid-cols-2">
    <div className="hidden lg:flex relative bg-gradient-hero p-12 flex-col justify-between text-primary-foreground overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_white_0%,_transparent_50%)] opacity-10" />
      <Link to="/" className="flex items-center gap-2 relative z-10">
        <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
          <Sparkles className="h-6 w-6" />
        </div>
        <span className="font-bold text-xl">Intelligence Recruitment Platform</span>
      </Link>
      <div className="relative z-10">
        <h2 className="text-4xl font-bold leading-tight">Find your next opportunity, intelligently.</h2>
        <p className="text-lg mt-4 text-white/85 max-w-md">
          Join thousands of candidates and recruiters using Intelligence Recruitment Platform to make better hiring decisions.
        </p>
        <div className="grid grid-cols-3 gap-6 mt-12">
          {[{ v: "50k+", l: "Active Jobs" }, { v: "200k+", l: "Candidates" }, { v: "98%", l: "Satisfaction" }].map((s) => (
            <div key={s.l}>
              <div className="text-3xl font-bold">{s.v}</div>
              <div className="text-sm text-white/80">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="text-sm text-white/70 relative z-10">© 2026 Intelligence Recruitment Platform. All rights reserved.</div>
    </div>
    <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  </div>
);
