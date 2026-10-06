import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Search, Users, BarChart3, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-30">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Intelligence Recruitment Platform</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild><Link to="/login">Sign in</Link></Button>
            <Button asChild className="bg-gradient-primary hover:opacity-90"><Link to="/register">Get started</Link></Button>
          </div>
        </div>
      </header>
      <section className="container py-20 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
          <Sparkles className="h-3 w-3" /> AI-powered recruitment
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
          The intelligent way to <span className="text-gradient">hire & get hired</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto">
          Intelligence Recruitment Platform connects exceptional candidates with forward-thinking companies through smart matching and seamless workflows.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Button size="lg" asChild className="bg-gradient-primary hover:opacity-90">
            <Link to="/register">Get started <ArrowRight className="h-4 w-4 ml-2" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild><Link to="/login">Sign in</Link></Button>
        </div>
      </section>
      <section className="container pb-20 grid md:grid-cols-3 gap-6">
        {[
          { icon: Search, title: "Smart Job Matching", desc: "Discover roles tailored to your skills and aspirations." },
          { icon: Users, title: "Top Talent Pool", desc: "Access pre-vetted candidates across every industry." },
          { icon: BarChart3, title: "Insightful Analytics", desc: "Make data-driven hiring decisions with rich dashboards." },
        ].map((f) => (
          <div key={f.title} className="p-6 rounded-2xl bg-card border shadow-soft">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4"><f.icon className="h-5 w-5" /></div>
            <h3 className="font-semibold text-lg">{f.title}</h3>
            <p className="text-muted-foreground text-sm mt-2">{f.desc}</p>
          </div>
        ))}
      </section>
      <footer className="border-t py-8"><div className="container text-center text-sm text-muted-foreground">© 2026 Intelligence Recruitment Platform. All rights reserved.</div></footer>
    </div>
  );
}
