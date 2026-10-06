import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RiskLevelBadge,
  VerificationStatusBadge,
  riskProgressColorClass,
  riskScoreColorClass,
} from "@/components/fraud/RiskBadge";
import { FraudReportModal } from "@/components/fraud/FraudReportModal";
import { useFraudCheckByApplication, useRunFraudCheck } from "@/api/fraud";
import { ShieldAlert, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface FraudVerificationCardProps {
  applicationId: string;
  candidateId: string;
}

const ROWS: Array<{
  key: "certificate" | "experience" | "github" | "resume";
  label: string;
}> = [
  { key: "certificate", label: "Certificate Verification" },
  { key: "experience", label: "Experience Timeline" },
  { key: "github", label: "GitHub Verification" },
  { key: "resume", label: "Resume Consistency" },
];

export function FraudVerificationCard({ applicationId, candidateId }: FraudVerificationCardProps) {
  const { data: fraudCheck, isLoading, isError } = useFraudCheckByApplication(applicationId);
  const runCheck = useRunFraudCheck();
  const [reportOpen, setReportOpen] = useState(false);

  const handleRerun = () => {
    runCheck.mutate(
      { candidateId, applicationId },
      {
        onSuccess: () => toast.success("Fraud analysis re-run"),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to run analysis"),
      }
    );
  };

  if (isLoading) {
    return (
      <Card className="shadow-soft border-primary/20">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !fraudCheck) {
    return (
      <Card className="shadow-soft border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" /> AI Candidate Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            No verification data is available for this candidate yet.
          </p>
          <Button size="sm" variant="outline" onClick={handleRerun} disabled={runCheck.isPending}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${runCheck.isPending ? "animate-spin" : ""}`} />
            {runCheck.isPending ? "Running..." : "Run Fraud Analysis"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const rowStatus: Record<(typeof ROWS)[number]["key"], string> = {
    certificate:
      fraudCheck.certificateChecks.length === 0
        ? "No Data Available"
        : fraudCheck.certificateChecks.some((c) => c.status === "Contradiction Found")
        ? "Contradiction Found"
        : fraudCheck.certificateChecks.every((c) => c.status === "Verified")
        ? "Verified"
        : "Needs Review",
    experience: fraudCheck.timelineChecks.hasOverlap ? "Conflict Found" : "Passed",
    github: fraudCheck.githubCheck.status,
    resume: fraudCheck.consistencyChecks.length === 0 ? "Passed" : "Needs Review",
  };

  return (
    <>
      <Card className="shadow-soft border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> AI Candidate Verification
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={handleRerun}
              disabled={runCheck.isPending}
              title="Re-run fraud analysis"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${runCheck.isPending ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Fraud Risk Score</p>
              <p className={`text-2xl font-bold ${riskScoreColorClass(fraudCheck.fraudRiskScore)}`}>
                {fraudCheck.fraudRiskScore}/100
              </p>
            </div>
            <div className="text-right space-y-1">
              <RiskLevelBadge level={fraudCheck.riskLevel} />
              <div>
                <VerificationStatusBadge status={fraudCheck.verificationStatus} />
              </div>
            </div>
          </div>

          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full ${riskProgressColorClass(fraudCheck.fraudRiskScore)} transition-all`}
              style={{ width: `${fraudCheck.fraudRiskScore}%` }}
            />
          </div>

          <div className="space-y-2 pt-1">
            {ROWS.map((row) => (
              <div key={row.key} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium">{rowStatus[row.key]}</span>
              </div>
            ))}
          </div>

          <Button size="sm" variant="outline" className="w-full" onClick={() => setReportOpen(true)}>
            View Detailed Report
          </Button>
        </CardContent>
      </Card>

      <FraudReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        candidateId={candidateId}
        preloadedReport={fraudCheck}
      />
    </>
  );
}
