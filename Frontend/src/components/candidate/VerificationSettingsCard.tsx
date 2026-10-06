import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { VerificationStatusBadge } from "@/components/fraud/RiskBadge";
import { useCertificates, useUploadCertificate } from "@/api/certificates";
import { useGithubVerification, useVerifyGithub } from "@/api/github";
import { CandidateProfile, VerificationStatus } from "@/types/api";
import { resolveUploadUrl } from "@/lib/api";
import { Github, ShieldCheck, Upload, FileBadge, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface VerificationSettingsCardProps {
  candidateId: string;
  profile?: CandidateProfile;
}

const MAX_CERT_SIZE_MB = 8;

export function VerificationSettingsCard({ candidateId, profile }: VerificationSettingsCardProps) {
  const [githubUrl, setGithubUrl] = useState(profile?.githubUrl ?? "");
  const { data: githubData } = useGithubVerification(candidateId);
  const { data: certificates, isLoading: certsLoading } = useCertificates();
  const verifyGithub = useVerifyGithub();
  const uploadCertificate = useUploadCertificate();
  const certInputRef = useRef<HTMLInputElement>(null);

  const handleSaveGithub = () => {
    if (!githubUrl) {
      toast.error("Please enter your GitHub profile URL");
      return;
    }
    verifyGithub.mutate(githubUrl, {
      onSuccess: (result) => {
        toast.success(
          result.exists
            ? "GitHub profile verified successfully"
            : "GitHub profile saved, but could not be confirmed to exist"
        );
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to verify GitHub profile"),
    });
  };

  const handleCertificateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF, PNG, JPG, or WEBP certificate");
      return;
    }
    if (file.size > MAX_CERT_SIZE_MB * 1024 * 1024) {
      toast.error(`Certificate must be under ${MAX_CERT_SIZE_MB}MB`);
      return;
    }

    uploadCertificate.mutate(file, {
      onSuccess: () => toast.success("Certificate uploaded and processed"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to upload certificate"),
    });
  };

  const githubStatus = githubData?.githubCheck?.status as VerificationStatus | undefined;

  return (
    <Card className="shadow-soft lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" /> Verification
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Adding your GitHub profile and certificates helps recruiters verify your background faster.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* GitHub */}
        <div>
          <Label className="text-sm flex items-center gap-1.5 mb-1.5">
            <Github className="h-4 w-4" /> GitHub Profile
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="https://github.com/your-username"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
            <Button onClick={handleSaveGithub} disabled={verifyGithub.isPending} className="shrink-0">
              {verifyGithub.isPending ? "Verifying..." : "Save & Verify"}
            </Button>
          </div>
          {githubStatus && (
            <div className="flex items-center gap-2 mt-2">
              <VerificationStatusBadge status={githubStatus} />
              {githubData?.githubCheck?.publicRepos !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {githubData.githubCheck.publicRepos} public repos
                </span>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1.5">
            Private repositories and non-GitHub work aren't visible to us — this is only used as supporting
            evidence, never as proof of employment.
          </p>
        </div>

        {/* Certificates */}
        <div>
          <Label className="text-sm flex items-center gap-1.5 mb-1.5">
            <FileBadge className="h-4 w-4" /> Certificates
          </Label>

          {certsLoading && (
            <div className="space-y-2 mb-3">
              <Skeleton className="h-14 w-full" />
            </div>
          )}

          {!certsLoading && certificates && certificates.length > 0 && (
            <div className="space-y-2 mb-3">
              {certificates.map((cert) => (
                <div
                  key={cert._id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate flex items-center gap-1.5">
                      {cert.extracted?.certificateName || cert.extracted?.certificateTitle || cert.originalFileName || "Certificate"}
                      {cert.isDuplicate && (
                        <span className="text-xs text-muted-foreground font-normal">(possible duplicate)</span>
                      )}
                    </p>
                    {cert.extracted?.issuingOrganization && (
                      <p className="text-xs text-muted-foreground truncate">
                        {cert.extracted.issuingOrganization}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <VerificationStatusBadge status={cert.verificationStatus} />
                    <a href={resolveUploadUrl(cert.fileUrl)} target="_blank" rel="noreferrer">
                      <Button size="icon" variant="ghost" className="h-7 w-7">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!certsLoading && certificates && certificates.length === 0 && (
            <p className="text-sm text-muted-foreground mb-3">No certificates uploaded yet.</p>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => certInputRef.current?.click()}
            disabled={uploadCertificate.isPending}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {uploadCertificate.isPending ? "Uploading..." : "Upload Certificate"}
          </Button>
          <p className="text-xs text-muted-foreground mt-1.5">
            PDF, PNG, JPG, or WEBP (max {MAX_CERT_SIZE_MB}MB). We'll extract and verify the details automatically.
          </p>
          <input
            ref={certInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
            hidden
            onChange={handleCertificateSelect}
          />
        </div>
      </CardContent>
    </Card>
  );
}
