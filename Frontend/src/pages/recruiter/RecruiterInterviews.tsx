import { useState } from "react";
import { useRecruiterInterviews } from "@/api/interviews";
import { useSubmitFeedback } from "@/api/interviews";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Calendar, Briefcase, Clock, Video, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function RecruiterInterviews() {
  const { data: interviews = [], isLoading } = useRecruiterInterviews();
  const submitFeedback = useSubmitFeedback();

  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [form, setForm] = useState({ score: "", feedback: "" });

  const submit = () => {
    if (!feedbackFor || !form.score) {
      toast.error("Please enter a score");
      return;
    }
    submitFeedback.mutate(
      { id: feedbackFor, score: Number(form.score), feedback: form.feedback },
      {
        onSuccess: () => {
          toast.success("Feedback submitted");
          setFeedbackFor(null);
          setForm({ score: "", feedback: "" });
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to submit feedback"),
      }
    );
  };

  if (isLoading) return <LoadingSpinner label="Loading interviews..." />;

  return (
    <div>
      <PageHeader title="Interviews" description="Interviews scheduled across all your job postings" />

      {interviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No interviews scheduled yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Schedule one from the Applicants page for a specific job.</p>
          <Button asChild><Link to="/recruiter/applicants">Go to Applicants</Link></Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {interviews.map((iv) => {
            const application = typeof iv.applicationId === "string" ? undefined : iv.applicationId;
            const candidate = application?.candidateId;
            const job = application?.jobId;
            const date = new Date(iv.date);
            return (
              <Card key={iv._id} className="shadow-soft">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                          {candidate?.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{candidate?.fullName ?? "Candidate"}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3" /> {job?.title} · {job?.company}
                        </p>
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

                  <div className="flex flex-wrap gap-2 mt-3">
                    {iv.meetingLink && (
                      <a href={iv.meetingLink} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline"><Video className="h-3.5 w-3.5 mr-1.5" /> Join</Button>
                      </a>
                    )}
                    {iv.status !== "completed" && (
                      <Button size="sm" onClick={() => { setFeedbackFor(iv._id); setForm({ score: String(iv.score ?? ""), feedback: iv.feedback ?? "" }); }}>
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Add Feedback
                      </Button>
                    )}
                  </div>

                  {iv.status === "completed" && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm">
                      <p className="font-medium">Score: {iv.score}/100</p>
                      {iv.feedback && <p className="text-muted-foreground mt-1">{iv.feedback}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!feedbackFor} onOpenChange={(open) => !open && setFeedbackFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Interview Feedback</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Score (0-100) *</Label>
              <Input type="number" min={0} max={100} className="mt-1.5" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
            </div>
            <div>
              <Label>Feedback</Label>
              <Textarea className="mt-1.5" rows={4} value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackFor(null)}>Cancel</Button>
            <Button onClick={submit} disabled={submitFeedback.isPending}>{submitFeedback.isPending ? "Saving..." : "Submit Feedback"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
