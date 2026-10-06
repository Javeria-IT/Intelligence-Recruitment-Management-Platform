import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types/api";
import { toast } from "sonner";
import { Sparkles, Briefcase, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error("Please fill in all fields"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const user = await register(name, email, password, role);
      toast.success("Account created! Check your email for a verification code.");
      navigate("/verify-otp");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="lg:hidden flex items-center gap-2 mb-8">
        <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center"><span className="text-white text-xl font-bold tracking-tight">IR</span></div>
        <span className="font-bold text-xl">Intelligence Recruitment Platform</span>
      </div>
      <h1 className="text-3xl font-bold">Create account</h1>
      <p className="text-muted-foreground mt-2">Start your hiring journey today.</p>
      <div className="grid grid-cols-2 gap-3 mt-6">
        {[
          { value: "candidate" as Role, icon: User, label: "Candidate", desc: "Find a job" },
          { value: "recruiter" as Role, icon: Briefcase, label: "Recruiter", desc: "Hire talent" },
        ].map((opt) => (
          <button key={opt.value} type="button" onClick={() => setRole(opt.value)} className={cn("p-4 rounded-xl border-2 text-left transition-all", role === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
            <opt.icon className={cn("h-5 w-5 mb-2", role === opt.value ? "text-primary" : "text-muted-foreground")} />
            <div className="font-semibold text-sm">{opt.label}</div>
            <div className="text-xs text-muted-foreground">{opt.desc}</div>
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" /></div>
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
        <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
        <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={loading}>{loading ? "Creating account..." : "Create account"}</Button>
      </form>
      <p className="text-sm text-muted-foreground text-center mt-6">Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link></p>
    </div>
  );
}
