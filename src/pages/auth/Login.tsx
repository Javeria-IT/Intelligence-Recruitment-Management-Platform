import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, Role } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    setTimeout(() => {
      login(email, role);
      toast.success("Welcome back!");
      navigate(role === "recruiter" ? "/recruiter" : "/candidate");
    }, 500);
  };

  return (
    <div>
      <div className="lg:hidden flex items-center gap-2 mb-8">
        <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center"><Sparkles className="h-5 w-5 text-primary-foreground" /></div>
        <span className="font-bold text-xl">Intelligence Recruitment Platform</span>
      </div>
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <p className="text-muted-foreground mt-2">Sign in to continue your journey.</p>
      <Tabs value={role} onValueChange={(v) => setRole(v as Role)} className="mt-6">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="candidate">Candidate</TabsTrigger>
          <TabsTrigger value="recruiter">Recruiter</TabsTrigger>
        </TabsList>
      </Tabs>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-2">
          <div className="flex justify-between"><Label htmlFor="password">Password</Label><Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link></div>
          <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={loading}>{loading ? "Signing in..." : `Sign in as ${role}`}</Button>
      </form>
      <p className="text-sm text-muted-foreground text-center mt-6">Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Sign up</Link></p>
    </div>
  );
}
