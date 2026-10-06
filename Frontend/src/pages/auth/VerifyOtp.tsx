import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useResendOtp, useVerifyOtp } from "@/api/otp";
import { toast } from "sonner";
import { MailCheck, Sparkles } from "lucide-react";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyOtp() {
  const { user, otpPurpose, updateUser, clearOtpPending, logout } = useAuth();
  const navigate = useNavigate();
  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    // Not logged in at all — nothing to verify, send them to login.
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (cooldown <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(intervalRef.current);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 4) {
      toast.error("Please enter the verification code");
      return;
    }
    try {
      const verifiedUser = await verifyOtp.mutateAsync({ otp: code.trim(), purpose: otpPurpose });
      updateUser(verifiedUser);
      clearOtpPending();
      toast.success("Verified! Redirecting to your dashboard...");
      navigate(verifiedUser.role === "recruiter" ? "/recruiter" : "/candidate", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    }
  };

  const handleResend = async () => {
    try {
      const result = await resendOtp.mutateAsync(otpPurpose);
      toast.success(result.devMode ? "Code resent — check the server console (dev mode)" : "Code resent to your email");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend code");
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

      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <MailCheck className="h-6 w-6 text-primary" />
      </div>
      <h1 className="text-3xl font-bold">Verify your email</h1>
      <p className="text-muted-foreground mt-2">
        We sent a verification code to <span className="font-medium text-foreground">{user?.email}</span>.
        Enter it below to {otpPurpose === "login" ? "finish signing in" : "activate your account"}.
      </p>

      <form onSubmit={handleVerify} className="mt-6 space-y-4">
        <Input
          inputMode="numeric"
          autoFocus
          placeholder="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
          className="text-center text-2xl tracking-[0.5em] font-semibold h-14"
          maxLength={8}
        />
        <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={verifyOtp.isPending}>
          {verifyOtp.isPending ? "Verifying..." : "Verify"}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Didn't get a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resendOtp.isPending}
          className="text-primary font-medium hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : resendOtp.isPending ? "Sending..." : "Resend code"}
        </button>
      </div>

      <button
        type="button"
        onClick={logout}
        className="mt-6 text-xs text-muted-foreground hover:underline block mx-auto"
      >
        Use a different account
      </button>
    </div>
  );
}
