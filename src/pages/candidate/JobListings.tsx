import { useState, useMemo } from "react";
import { Job } from "@/data/jobs";
import { jobsStore } from "@/store/jobsStore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Search, MapPin, Briefcase, DollarSign, Clock, SearchX } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const PAGE_SIZE = 6;

export default function JobListings() {
  const jobs = jobsStore.useStore();
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("all");
  const [type, setType] = useState("all");
  const [exp, setExp] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list: Job[] = jobs.filter((j) => {
      const s = search.toLowerCase();
      const matchSearch = !s || j.title.toLowerCase().includes(s) || j.company.toLowerCase().includes(s) || j.skills.some(sk => sk.toLowerCase().includes(s));
      const matchLoc = location === "all" || j.location.includes(location);
      const matchType = type === "all" || j.type === type;
      const matchExp = exp === "all" || j.experience === exp;
      return matchSearch && matchLoc && matchType && matchExp;
    });
    if (sort === "salary") list = [...list].sort((a, b) => b.salaryMax - a.salaryMax);
    else list = [...list].sort((a, b) => b.postedDate.localeCompare(a.postedDate));
    return list;
  }, [jobs, search, location, type, exp, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const locations = Array.from(new Set(jobs.map((j) => j.location.split(",")[0])));

  return (
    <div>
      <PageHeader title="Browse Jobs" description={`${filtered.length} opportunities found`} />

      <Card className="shadow-soft mb-6">
        <CardContent className="p-4 grid md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Job title, company, skill..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={location} onValueChange={(v) => { setLocation(v); setPage(1); }}>
            <SelectTrigger className="md:col-span-2"><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent className="bg-popover"><SelectItem value="all">All locations</SelectItem>{locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
            <SelectTrigger className="md:col-span-2"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent className="bg-popover"><SelectItem value="all">All types</SelectItem>{["Full-time", "Part-time", "Contract", "Internship", "Remote"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={exp} onValueChange={(v) => { setExp(v); setPage(1); }}>
            <SelectTrigger className="md:col-span-2"><SelectValue placeholder="Experience" /></SelectTrigger>
            <SelectContent className="bg-popover"><SelectItem value="all">Any experience</SelectItem>{["Entry-level", "Mid-level", "Senior"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="md:col-span-2"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-popover"><SelectItem value="newest">Newest</SelectItem><SelectItem value="salary">Highest salary</SelectItem></SelectContent>
          </Select>
        </CardContent>
      </Card>

      {paged.length === 0 ? (
        <EmptyState icon={SearchX} title="No jobs found" description="Try adjusting your filters or search terms." />
      ) : (
        <div className="grid gap-4">
          {paged.map((j) => (
            <Card key={j.id} className="shadow-soft hover:shadow-card transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={j.companyLogo}
                      alt={j.company}
                      className="h-full w-full object-contain p-2"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div className="hidden h-full w-full items-center justify-center text-primary">
                      <Briefcase className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 items-start justify-between">
                      <div>
                        <Link to={`/candidate/jobs/${j.id}`} className="font-semibold text-lg hover:text-primary transition-colors">{j.title}</Link>
                        <p className="text-sm text-muted-foreground">{j.company}</p>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-0">{j.type}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {j.location}</span>
                      <span className="flex items-center"><DollarSign className="h-3 w-3 mr-1" /> {j.salary}</span>
                      <span className="flex items-center"><Briefcase className="h-3 w-3 mr-1" /> {j.experience}</span>
                      <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> Posted {j.postedDate}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {j.skills.slice(0, 4).map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 sm:w-32">
                    <Button asChild className="bg-gradient-primary hover:opacity-90 flex-1"><Link to={`/candidate/jobs/${j.id}`}>View</Link></Button>
                    <Button variant="outline" className="flex-1" onClick={() => toast.success(`Applied to ${j.title}`)}>Apply</Button>
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
