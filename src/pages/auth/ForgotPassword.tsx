import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    setSent(true);
    toast.success("Reset link sent!");
  };
  return (
    <div>
      <div className="lg:hidden flex items-center gap-2 mb-8">
        <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center"><Sparkles className="h-5 w-5 text-primary-foreground" /></div>
        <span className="font-bold text-xl">Intelligence Recruitment Platform</span>
      </div>
      {sent ? (
        <div className="text-center">
          <div className="inline-flex p-4 rounded-2xl bg-success/10 mb-4"><MailCheck className="h-8 w-8 text-success" /></div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground mt-2">We've sent a reset link to {email}</p>
          <Button asChild variant="outline" className="mt-6"><Link to="/login"><ArrowLeft className="h-4 w-4 mr-2" /> Back to sign in</Link></Button>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold">Forgot password?</h1>
          <p className="text-muted-foreground mt-2">Enter your email and we'll send a reset link.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
            <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">Send reset link</Button>
          </form>
          <Link to="/login" className="flex items-center gap-2 justify-center text-sm text-muted-foreground hover:text-foreground mt-6"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link>
        </>
      )}
    </div>
  );
}
