import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  RiskLevelBadge,
  VerificationStatusBadge,
  riskScoreColorClass,
} from "@/components/fraud/RiskBadge";
import { useFraudReport, useRecordRecruiterAction } from "@/api/fraud";
import { FraudCheck, RecruiterFraudAction } from "@/types/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { CheckCircle2, AlertTriangle, XCircle, FileBadge, Clock, FileSearch } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface FraudReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  // If the caller already has a fresh FraudCheck (e.g. from the summary
  // card), pass it in so the modal opens instantly without a refetch.
  preloadedReport?: FraudCheck;
}

function SectionRow({
  ok,
  title,
  details,
  evidenceList,
}: {
  ok: boolean | null;
  title: string;
  details?: string;
  evidenceList?: string[];
}) {
  const Icon = ok === true ? CheckCircle2 : ok === false ? AlertTriangle : FileSearch;
  const colorClass = ok === true ? "text-success" : ok === false ? "text-warning" : "text-muted-foreground";

  return (
    <div className="flex gap-3 py-3">
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${colorClass}`} />
      <div className="min-w-0">
        <p className="font-medium text-sm">{title}</p>
        {details && <p className="text-sm text-muted-foreground mt-0.5">{details}</p>}
        {evidenceList && evidenceList.length > 0 && (
          <ul className="mt-1.5 space-y-1">
            {evidenceList.map((e, i) => (
              <li key={i} className="text-xs text-muted-foreground pl-3 border-l-2 border-border">
                {e}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function FraudReportModal({
  open,
  onOpenChange,
  candidateId,
  preloadedReport,
}: FraudReportModalProps) {
  const { data: fetchedReport, isLoading } = useFraudReport(candidateId, open && !preloadedReport);
  const recordAction = useRecordRecruiterAction();
  const [note, setNote] = useState("");

  const report = preloadedReport ?? fetchedReport;

  const handleAction = (action: RecruiterFraudAction, successMessage: string) => {
    recordAction.mutate(
      { candidateId, action, note: note || undefined },
      {
        onSuccess: () => {
          toast.success(successMessage);
          setNote("");
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to record action"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Candidate Verification Report</DialogTitle>
        </DialogHeader>

        {isLoading && !report ? (
          <LoadingSpinner label="Loading report..." />
        ) : !report ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No verification report is available for this candidate yet.
          </p>
        ) : (
          <div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Overall Risk</p>
                <p className={`text-3xl font-bold ${riskScoreColorClass(report.fraudRiskScore)}`}>
                  {report.fraudRiskScore}/100
                </p>
              </div>
              <div className="text-right space-y-1.5">
                <RiskLevelBadge level={report.riskLevel} />
                <div>
                  <VerificationStatusBadge status={report.verificationStatus} />
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div>
              <h3 className="text-sm font-semibold mb-1">Verification Summary</h3>
              <div className="divide-y">
                <SectionRow
                  ok={report.githubCheck.status === "Verified" || report.githubCheck.status === "Passed"}
                  title={
                    report.githubCheck.exists
                      ? `GitHub Account ${report.githubCheck.status}`
                      : "GitHub Verification"
                  }
                  details={
                    report.githubCheck.exists
                      ? `${report.githubCheck.publicRepos} public repos · ${report.githubCheck.topLanguages.join(", ") || "no dominant language detected"}`
                      : "No verifiable GitHub profile on file."
                  }
                  evidenceList={[
                    ...report.githubCheck.supportingEvidence,
                    ...report.githubCheck.claimsRequiringReview,
                  ]}
                />

                <SectionRow
                  ok={!report.timelineChecks.hasOverlap}
                  title={
                    report.timelineChecks.hasOverlap
                      ? "Experience Timeline Conflict"
                      : "Experience Timeline Consistent"
                  }
                  details={report.timelineChecks.note}
                  evidenceList={report.timelineChecks.overlaps.map(
                    (o) =>
                      `Overlap of ${o.overlapMonths} month(s) between "${o.companyA}" and "${o.companyB}". Possible reasons: ${o.possibleReasons.join(", ")}.`
                  )}
                />

                {report.certificateChecks.length === 0 ? (
                  <SectionRow ok={null} title="Certificate Verification" details="No certificates uploaded yet." />
                ) : (
                  report.certificateChecks.map((c, i) => (
                    <SectionRow
                      key={i}
                      ok={c.status === "Verified" ? true : c.status === "Contradiction Found" ? false : null}
                      title={`Certificate: ${c.certificateTitle || "Untitled"} — ${c.status}`}
                      details={c.issuingOrganization ? `Issued by ${c.issuingOrganization}` : undefined}
                      evidenceList={c.evidence}
                    />
                  ))
                )}

                <SectionRow
                  ok={report.consistencyChecks.length === 0}
                  title={
                    report.consistencyChecks.length === 0
                      ? "Resume/Profile Consistency"
                      : "Resume/Profile Inconsistencies Found"
                  }
                  evidenceList={report.consistencyChecks.map((c) => `${c.issue} — ${c.evidence}`)}
                />
              </div>
            </div>

            {report.recommendations.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <h3 className="text-sm font-semibold mb-2">Recommended Action</h3>
                  <ul className="space-y-1.5">
                    {report.recommendations.map((r, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <Clock className="h-4 w-4 shrink-0 mt-0.5" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <Separator className="my-4" />

            <div>
              <h3 className="text-sm font-semibold mb-2">Recruiter Actions</h3>
              <Textarea
                placeholder="Optional note (e.g. reason for this decision)…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mb-3 text-sm"
                rows={2}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={recordAction.isPending}
                  onClick={() => handleAction("marked_reviewed", "Marked as reviewed")}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Mark as Reviewed
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={recordAction.isPending}
                  onClick={() => handleAction("verification_requested", "Verification requested")}
                >
                  <FileBadge className="h-3.5 w-3.5 mr-1.5" /> Request Verification
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={recordAction.isPending}
                  onClick={() => handleAction("flag_ignored", "Flag ignored")}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" /> Ignore Flag
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={recordAction.isPending}
                  onClick={() => handleAction("candidate_rejected", "Recorded as rejected on fraud grounds")}
                >
                  Reject Candidate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This records your fraud-review decision only. To formally change the application status,
                use the status dropdown on the Applicants page.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
