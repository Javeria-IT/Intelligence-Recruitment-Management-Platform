import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Construction } from "lucide-react";

// NOTE: The backend does not yet expose a forgot/reset-password endpoint
// (no route in authRoutes.js). Wire this up once POST /api/auth/forgot-password
// and POST /api/auth/reset-password exist — until then this is left as an
// honest "not available" screen instead of pretending to send an email.
export default function ForgotPassword() {
  return (
    <div>
      <div className="lg:hidden flex items-center gap-2 mb-8">
        <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center"><Sparkles className="h-5 w-5 text-primary-foreground" /></div>
        <span className="font-bold text-xl">Intelligence Recruitment Platform</span>
      </div>
      <div className="text-center">
        <div className="inline-flex p-4 rounded-2xl bg-warning/10 mb-4"><Construction className="h-8 w-8 text-warning" /></div>
        <h1 className="text-2xl font-bold">Password reset isn't set up yet</h1>
        <p className="text-muted-foreground mt-2">
          This needs a forgot/reset-password endpoint on the backend. Please contact support or reach out to your admin for now.
        </p>
        <Button asChild variant="outline" className="mt-6"><Link to="/login"><ArrowLeft className="h-4 w-4 mr-2" /> Back to sign in</Link></Button>
      </div>
    </div>
  );
}
