import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CertificateStatus, RiskLevel, VerificationStatus } from "@/types/api";

const riskStyles: Record<RiskLevel, string> = {
  "Low Risk": "bg-success/15 text-success hover:bg-success/20",
  "Needs Review": "bg-warning/15 text-warning hover:bg-warning/20",
  Suspicious: "bg-orange-500/15 text-orange-600 hover:bg-orange-500/20 dark:text-orange-400",
  "High Risk": "bg-destructive/15 text-destructive hover:bg-destructive/20",
};

const verificationStyles: Record<VerificationStatus | CertificateStatus, string> = {
  Verified: "bg-success/15 text-success hover:bg-success/20",
  Passed: "bg-success/15 text-success hover:bg-success/20",
  "Needs Review": "bg-warning/15 text-warning hover:bg-warning/20",
  "Needs Manual Review": "bg-warning/15 text-warning hover:bg-warning/20",
  "Unable to Verify": "bg-muted text-muted-foreground hover:bg-muted",
  "Contradiction Found": "bg-destructive/15 text-destructive hover:bg-destructive/20",
  Suspicious: "bg-orange-500/15 text-orange-600 hover:bg-orange-500/20 dark:text-orange-400",
};

export const RiskLevelBadge = ({ level }: { level: RiskLevel }) => (
  <Badge variant="secondary" className={cn("border-0 font-medium", riskStyles[level])}>
    {level}
  </Badge>
);

export const VerificationStatusBadge = ({ status }: { status: VerificationStatus | CertificateStatus }) => (
  <Badge variant="secondary" className={cn("border-0 font-medium", verificationStyles[status] ?? "")}>
    {status}
  </Badge>
);

export const riskScoreColorClass = (score: number) => {
  if (score <= 20) return "text-success";
  if (score <= 50) return "text-warning";
  if (score <= 75) return "text-orange-600 dark:text-orange-400";
  return "text-destructive";
};

export const riskProgressColorClass = (score: number) => {
  if (score <= 20) return "bg-success";
  if (score <= 50) return "bg-warning";
  if (score <= 75) return "bg-orange-500";
  return "bg-destructive";
};
