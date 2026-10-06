import { useState } from "react";
import { useMyApplications } from "@/api/candidate";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Circle, FileText, Building2, Calendar, Briefcase } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Application, ApplicationStatus } from "@/types/api";

const STEPS: ApplicationStatus[] = ["applied", "under_review", "shortlisted", "interview", "selected"];

type JobRef = Application["jobId"];

const jobTitle = (job: JobRef) => (typeof job === "string" ? "" : job.title);
const jobCompany = (job: JobRef) => (typeof job === "string" ? "" : job.company);

export default function Applications() {
  const { data: applications = [], isLoading } = useMyApplications();
  const [filter, setFilter] = useState<string>("all");
  const list = filter === "all" ? applications : applications.filter((a) => a.applicationStatus === filter);

  if (isLoading) return <LoadingSpinner label="Loading applications..." />;

  return (
    <div>
      <PageHeader title="My Applications" description="Track the status of every job you applied to." />

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
          <TabsTrigger value="applied">Applied</TabsTrigger>
          <TabsTrigger value="under_review">Under Review</TabsTrigger>
          <TabsTrigger value="shortlisted">Shortlisted</TabsTrigger>
          <TabsTrigger value="interview">Interview</TabsTrigger>
          <TabsTrigger value="selected">Selected</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {list.length === 0 ? (
        <EmptyState icon={FileText} title="No applications" description="Nothing here yet." />
      ) : (
        <div className="space-y-4">
          {list.map((a) => (
            <Card key={a._id} className="shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{jobTitle(a.jobId)}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" /> {jobCompany(a.jobId)}
                          <span className="mx-1">·</span>
                          <Calendar className="h-3.5 w-3.5" /> Applied {new Date(a.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={a.applicationStatus} />
                        <span className="text-[11px] font-semibold text-primary">{a.AI_score}% match</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      {STEPS.map((step, i) => {
                        const stepIndex = STEPS.indexOf(step);
                        const currentIndex = a.applicationStatus === "rejected" ? -1 : STEPS.indexOf(a.applicationStatus);
                        const reached = currentIndex >= stepIndex;
                        const isLast = i === STEPS.length - 1;
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div className="flex flex-col items-center gap-1">
                              {reached ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                              <span className={`text-[10px] capitalize ${reached ? "text-foreground" : "text-muted-foreground"}`}>{step.replace("_", " ")}</span>
                            </div>
                            {!isLast && <div className={`flex-1 h-0.5 mx-2 ${reached ? "bg-success" : "bg-muted"}`} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
