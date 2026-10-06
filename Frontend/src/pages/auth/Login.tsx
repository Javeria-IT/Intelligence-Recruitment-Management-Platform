import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      if (!user.isVerified) {
        toast.message("Please verify your email to continue");
        navigate("/verify-otp");
      } else {
        toast.success("Welcome back!");
        navigate(user.role === "recruiter" ? "/recruiter" : "/candidate");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="lg:hidden flex items-center gap-2 mb-8">
        <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center">
          <span className="text-white text-xl font-bold tracking-tight">IR</span>
        </div>
        <span className="font-bold text-xl">Intelligence Recruitment Platform</span>
      </div>
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <p className="text-muted-foreground mt-2">Sign in to continue your journey.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-2">
          <div className="flex justify-between"><Label htmlFor="password">Password</Label><Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link></div>
          <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
      </form>
      <p className="text-sm text-muted-foreground text-center mt-6">Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Sign up</Link></p>
    </div>
  );
}
