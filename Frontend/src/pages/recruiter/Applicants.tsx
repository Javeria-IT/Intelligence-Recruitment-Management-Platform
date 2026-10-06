import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useJobs } from "@/api/jobs";
import { useJobApplicants } from "@/api/jobs";
import { useShortlistCandidate, useUpdateApplicationStatus } from "@/api/recruiter";
import { useScheduleInterview } from "@/api/interviews";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Users, Star, Calendar, CheckCircle2, XCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApplicationStatus, User } from "@/types/api";
import { resolveUploadUrl } from "@/lib/api";
import { FraudVerificationCard } from "@/components/fraud/FraudVerificationCard";

const candidateId = (c: string | Pick<User, "_id" | "fullName" | "email">) =>
  typeof c === "string" ? c : c._id;

const candidateName = (c: string | Pick<User, "_id" | "fullName" | "email">) =>
  typeof c === "string" ? "Candidate" : c.fullName;
const candidateEmail = (c: string | Pick<User, "_id" | "fullName" | "email">) =>
  typeof c === "string" ? "" : c.email;

export default function Applicants() {
  const [params, setParams] = useSearchParams();
  const jobIdParam = params.get("jobId") ?? undefined;
  const { data: jobsData } = useJobs({ mine: true, limit: 100 });
  const jobs = jobsData?.jobs ?? [];
  const [selectedJob, setSelectedJob] = useState<string | undefined>(jobIdParam);

  useEffect(() => {
    if (!selectedJob && jobs.length > 0) setSelectedJob(jobs[0]._id);
  }, [jobs, selectedJob]);

  const { data, isLoading } = useJobApplicants(selectedJob);
  const shortlist = useShortlistCandidate();
  const updateStatus = useUpdateApplicationStatus();
  const scheduleInterview = useScheduleInterview();

  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ date: "", meetingLink: "", interviewer: "" });

  const applicants = data?.applicants ?? [];

  const handleJobChange = (id: string) => {
    setSelectedJob(id);
    setParams({ jobId: id });
  };

  const handleShortlist = (applicationId: string, current: boolean) => {
    shortlist.mutate(
      { applicationId, shortlisted: !current },
      {
        onSuccess: () => toast.success(!current ? "Shortlisted" : "Removed from shortlist"),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
      }
    );
  };

  const handleStatus = (applicationId: string, status: ApplicationStatus) => {
    updateStatus.mutate(
      { applicationId, status },
      {
        onSuccess: () => toast.success("Status updated"),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
      }
    );
  };

  const submitSchedule = () => {
    if (!scheduleFor || !scheduleForm.date) {
      toast.error("Please pick a date/time");
      return;
    }
    scheduleInterview.mutate(
      {
        applicationId: scheduleFor,
        date: new Date(scheduleForm.date).toISOString(),
        meetingLink: scheduleForm.meetingLink || undefined,
        interviewer: scheduleForm.interviewer || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Interview scheduled");
          setScheduleFor(null);
          setScheduleForm({ date: "", meetingLink: "", interviewer: "" });
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to schedule"),
      }
    );
  };

  return (
    <div>
      <PageHeader title="Applicants" description="Ranked by our AI scoring engine, per job posting." />

      <Card className="shadow-soft mb-6">
        <CardContent className="p-4">
          <Label className="text-xs">Select a job</Label>
          <Select value={selectedJob} onValueChange={handleJobChange}>
            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose a job posting" /></SelectTrigger>
            <SelectContent>
              {jobs.map((j) => <SelectItem key={j._id} value={j._id}>{j.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!selectedJob ? (
        <EmptyState icon={Users} title="No jobs yet" description="Post a job to start receiving applicants." />
      ) : isLoading ? (
        <LoadingSpinner label="Loading applicants..." />
      ) : applicants.length === 0 ? (
        <EmptyState icon={Users} title="No applicants yet" description="Candidates who apply to this job will show up here, ranked by AI match score." />
      ) : (
        <div className="grid gap-4">
          {applicants.map((a) => (
            <Card key={a._id} className="shadow-soft">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {candidateName(a.candidateId).split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{candidateName(a.candidateId)}</p>
                        <p className="text-sm text-muted-foreground">{candidateEmail(a.candidateId)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                          <Star className="h-3.5 w-3.5 fill-primary" /> {a.AI_score}%
                        </div>
                        <StatusBadge status={a.applicationStatus} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Applied {new Date(a.createdAt).toLocaleDateString()}</p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button size="sm" variant={a.shortlisted ? "default" : "outline"} onClick={() => handleShortlist(a._id, a.shortlisted)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> {a.shortlisted ? "Shortlisted" : "Shortlist"}
                      </Button>
                      {a.resume && (
                        <a href={resolveUploadUrl(a.resume)} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline">
                            <FileText className="h-3.5 w-3.5 mr-1.5" /> View Resume
                          </Button>
                        </a>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setScheduleFor(a._id)}>
                        <Calendar className="h-3.5 w-3.5 mr-1.5" /> Schedule Interview
                      </Button>
                      <Select value={a.applicationStatus} onValueChange={(v) => handleStatus(a._id, v as ApplicationStatus)}>
                        <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["applied", "under_review", "shortlisted", "interview", "selected", "rejected"].map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <a href={`mailto:${candidateEmail(a.candidateId)}`}>
                        <Button size="sm" variant="ghost">Email</Button>
                      </a>
                    </div>

                    <div className="mt-4">
                      <FraudVerificationCard
                        applicationId={a._id}
                        candidateId={candidateId(a.candidateId)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!scheduleFor} onOpenChange={(open) => !open && setScheduleFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Interview</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Date & Time *</Label><Input type="datetime-local" className="mt-1.5" value={scheduleForm.date} onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })} /></div>
            <div><Label>Meeting Link</Label><Input className="mt-1.5" placeholder="https://meet.google.com/..." value={scheduleForm.meetingLink} onChange={(e) => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })} /></div>
            <div><Label>Interviewer</Label><Input className="mt-1.5" placeholder="Name" value={scheduleForm.interviewer} onChange={(e) => setScheduleForm({ ...scheduleForm, interviewer: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleFor(null)}>Cancel</Button>
            <Button onClick={submitSchedule} disabled={scheduleInterview.isPending}>{scheduleInterview.isPending ? "Scheduling..." : "Schedule"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
