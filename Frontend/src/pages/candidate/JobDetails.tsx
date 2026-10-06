import { useParams, Link, useNavigate } from "react-router-dom";
import { useJob } from "@/api/jobs";
import { useApplyToJob } from "@/api/candidate";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowLeft, MapPin, DollarSign, Briefcase, Clock, Bookmark, BookmarkCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: job, isLoading } = useJob(id);
  const applyMutation = useApplyToJob();
  const { isSaved, toggle } = useSavedJobs();

  if (isLoading) return <LoadingSpinner label="Loading job..." />;

  if (!job) {
    return (
      <div className="text-center py-16">
        <p>Job not found.</p>
        <Button variant="link" asChild><Link to="/candidate/jobs">Back to jobs</Link></Button>
      </div>
    );
  }

  const saved = isSaved(job._id);

  const handleApply = () => {
    applyMutation.mutate(job._id, {
      onSuccess: () => toast.success("Application submitted!"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to apply"),
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>

      <Card className="shadow-soft mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="h-20 w-20 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Briefcase className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">{job.title}</h1>
              <p className="text-lg text-muted-foreground mt-1">{job.company}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground mt-3">
                <span className="flex items-center"><MapPin className="h-4 w-4 mr-1.5" /> {job.location}</span>
                <span className="flex items-center"><DollarSign className="h-4 w-4 mr-1.5" /> {job.salary}</span>
                <span className="flex items-center"><Briefcase className="h-4 w-4 mr-1.5" /> {job.experience}</span>
                <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5" /> Posted {new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {job.requiredSkills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
              </div>
            </div>
            <div className="flex md:flex-col gap-2 md:w-40">
              <Button onClick={handleApply} disabled={applyMutation.isPending} className="bg-gradient-primary hover:opacity-90 flex-1">
                {applyMutation.isPending ? "Applying..." : "Apply Now"}
              </Button>
              <Button variant="outline" onClick={() => toggle(job._id)} className="flex-1">
                {saved ? <BookmarkCheck className="h-4 w-4 mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
                {saved ? "Saved" : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <h2 className="font-semibold text-lg mb-3">About the role</h2>
              <p className="text-muted-foreground whitespace-pre-line">{job.description}</p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((s) => (
                  <span key={s} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {s}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          {job.deadline && (
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Application Deadline</h3>
                <p className="text-sm text-muted-foreground">{new Date(job.deadline).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
