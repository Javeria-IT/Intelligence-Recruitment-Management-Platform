import { useMyInterviews } from "@/api/interviews";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Calendar, Briefcase, Clock, Video } from "lucide-react";
import { Interview } from "@/types/api";

const jobOf = (application: Interview["applicationId"]) =>
  typeof application === "string" ? undefined : application.jobId;

export default function Interviews() {
  const { data: interviews = [], isLoading } = useMyInterviews();

  if (isLoading) return <LoadingSpinner label="Loading interviews..." />;

  return (
    <div>
      <PageHeader title="My Interviews" description="Interviews scheduled for you by recruiters" />

      {interviews.length === 0 ? (
        <EmptyState icon={Calendar} title="No interviews yet" description="Interviews you're scheduled for will show up here." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {interviews.map((iv) => {
            const job = jobOf(iv.applicationId);
            const date = new Date(iv.date);
            return (
              <Card key={iv._id} className="shadow-soft hover:shadow-card transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{job?.title ?? "Interview"}</p>
                        <p className="text-sm text-muted-foreground">{job?.company}</p>
                      </div>
                    </div>
                    <StatusBadge status={iv.status} />
                  </div>

                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    {iv.interviewer && <p>Interviewer: {iv.interviewer}</p>}
                  </div>

                  {iv.meetingLink && iv.status === "scheduled" && (
                    <a href={iv.meetingLink} target="_blank" rel="noreferrer" className="block mt-3">
                      <Button size="sm" className="w-full">
                        <Video className="h-3.5 w-3.5 mr-1.5" /> Join Meeting
                      </Button>
                    </a>
                  )}

                  {iv.status === "completed" && iv.score != null && (
                    <p className="text-xs text-muted-foreground mt-3">Score: {iv.score}/100</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
