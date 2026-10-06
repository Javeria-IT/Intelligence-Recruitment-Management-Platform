import { useState } from "react";
import { Link } from "react-router-dom";
import { useJobs, useDeleteJob, useUpdateJob } from "@/api/jobs";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Briefcase, MapPin, Users, Plus, Trash2, Power, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ManageJobs() {
  const { data, isLoading } = useJobs({ mine: true });
  const deleteJob = useDeleteJob();
  const updateJob = useUpdateJob();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const jobs = data?.jobs ?? [];

  const toggleActive = (id: string, isActive: boolean) => {
    updateJob.mutate(
      { id, payload: { isActive: !isActive } },
      {
        onSuccess: () => toast.success(!isActive ? "Job reopened" : "Job closed"),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update"),
      }
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteJob.mutate(pendingDelete, {
      onSuccess: () => toast.success("Job deleted"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete"),
    });
    setPendingDelete(null);
  };

  if (isLoading) return <LoadingSpinner label="Loading your jobs..." />;

  return (
    <div>
      <PageHeader title="Manage Jobs" description={`${jobs.length} jobs posted`} action={<Button asChild className="bg-gradient-primary hover:opacity-90"><Link to="/recruiter/post"><Plus className="h-4 w-4 mr-2" /> Post Job</Link></Button>} />

      {jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs posted" description="Post your first job to start receiving applicants." />
      ) : (
        <div className="grid gap-4">
          {jobs.map((j) => (
            <Card key={j._id} className="shadow-soft">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{j.title}</p>
                      <StatusBadge status={j.isActive ? "Active" : "Closed"} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground mt-1.5">
                      <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {j.location}</span>
                      <span>Posted {new Date(j.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {j.requiredSkills.slice(0, 5).map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <Button variant="outline" size="sm" asChild><Link to={`/recruiter/applicants?jobId=${j._id}`}><Users className="h-3.5 w-3.5 mr-1.5" /> Applicants</Link></Button>
                    <Button variant="outline" size="sm" asChild><Link to={`/candidate/jobs/${j._id}`}><Eye className="h-3.5 w-3.5 mr-1.5" /> Preview</Link></Button>
                    <Button variant="outline" size="sm" onClick={() => toggleActive(j._id, j.isActive)}><Power className="h-3.5 w-3.5 mr-1.5" /> {j.isActive ? "Close" : "Reopen"}</Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setPendingDelete(j._id)}><Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job posting?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone. Existing applications tied to it will remain in the database but the listing will no longer be visible to candidates.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
