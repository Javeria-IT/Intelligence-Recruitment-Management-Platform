import { useSavedJobs } from "@/hooks/useSavedJobs";
import { useQueries } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/lib/api";
import { Job } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Bookmark, MapPin, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const fetchJob = async (id: string) => {
  const { data } = await api.get<ApiEnvelope<{ job: Job }>>(`/jobs/${id}`);
  return data.data.job;
};

// NOTE: saved jobs are stored locally (see useSavedJobs) since the backend
// doesn't have a saved-jobs endpoint yet. We still fetch each job's live
// details from the real API rather than caching stale copies.
export default function SavedJobs() {
  const { savedIds, unsave } = useSavedJobs();

  const results = useQueries({
    queries: savedIds.map((id) => ({
      queryKey: ["job", id],
      queryFn: () => fetchJob(id),
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const jobs = results.map((r) => r.data).filter((j): j is Job => !!j);

  const remove = (id: string) => {
    unsave(id);
    toast.success("Removed from saved");
  };

  return (
    <div>
      <PageHeader title="Saved Jobs" description={`${jobs.length} jobs saved for later`} />
      {isLoading ? (
        <LoadingSpinner label="Loading saved jobs..." />
      ) : jobs.length === 0 ? (
        <EmptyState icon={Bookmark} title="No saved jobs" description="Save jobs you're interested in to find them here later." />
      ) : (
        <div className="grid gap-4">
          {jobs.map((j) => (
            <Card key={j._id} className="shadow-soft">
              <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-start">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Bookmark className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <Link to={`/candidate/jobs/${j._id}`} className="font-semibold hover:text-primary">{j.title}</Link>
                  <p className="text-sm text-muted-foreground">{j.company}</p>
                  <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {j.location}</span>
                    <span>{j.salary}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild><Link to={`/candidate/jobs/${j._id}`}><ExternalLink className="h-3 w-3 mr-1" /> View</Link></Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(j._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
