import { useMemo, useState } from "react";
import { useBrowseJobs } from "@/api/candidate";
import { useApplyToJob } from "@/api/candidate";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Search, MapPin, Briefcase, DollarSign, Clock, SearchX } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const PAGE_SIZE = 6;

export default function JobListings() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [skill, setSkill] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 400);
  const debouncedLocation = useDebouncedValue(location, 400);
  const debouncedSkill = useDebouncedValue(skill, 400);

  const { data, isLoading } = useBrowseJobs({
    search: debouncedSearch || undefined,
    location: debouncedLocation || undefined,
    skill: debouncedSkill || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const applyMutation = useApplyToJob();

  const jobs = data?.jobs ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.pagination.total ?? 0) / PAGE_SIZE));

  const handleApply = (jobId: string, title: string) => {
    applyMutation.mutate(jobId, {
      onSuccess: () => toast.success(`Applied to ${title}`),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to apply"),
    });
  };

  return (
    <div>
      <PageHeader title="Browse Jobs" description={`${data?.pagination.total ?? 0} opportunities found`} />

      <Card className="shadow-soft mb-6">
        <CardContent className="p-4 grid md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Job title or company..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Input placeholder="Location" value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }} className="md:col-span-3" />
          <Input placeholder="Skill (e.g. React)" value={skill} onChange={(e) => { setSkill(e.target.value); setPage(1); }} className="md:col-span-4" />
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSpinner label="Loading jobs..." />
      ) : jobs.length === 0 ? (
        <EmptyState icon={SearchX} title="No jobs found" description="Try adjusting your filters or search terms." />
      ) : (
        <div className="grid gap-4">
          {jobs.map((j) => (
            <Card key={j._id} className="shadow-soft hover:shadow-card transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 items-start justify-between">
                      <div>
                        <Link to={`/candidate/jobs/${j._id}`} className="font-semibold text-lg hover:text-primary transition-colors">{j.title}</Link>
                        <p className="text-sm text-muted-foreground">{j.company}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {j.location}</span>
                      <span className="flex items-center"><DollarSign className="h-3 w-3 mr-1" /> {j.salary}</span>
                      <span className="flex items-center"><Briefcase className="h-3 w-3 mr-1" /> {j.experience}</span>
                      <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> Posted {new Date(j.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {j.requiredSkills.slice(0, 4).map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 sm:w-32">
                    <Button asChild className="bg-gradient-primary hover:opacity-90 flex-1"><Link to={`/candidate/jobs/${j._id}`}>View</Link></Button>
                    <Button variant="outline" className="flex-1" disabled={applyMutation.isPending} onClick={() => handleApply(j._id, j.title)}>Apply</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
