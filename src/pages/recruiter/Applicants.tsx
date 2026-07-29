import { useState, useMemo } from "react";
import { candidatesStore, updateCandidateStatus } from "@/store/candidatesStore";
import { recruiterJobsStore } from "@/store/jobsStore";
import { jobsStore } from "@/store/jobsStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, FileText, Check, X, Star, MapPin, Briefcase, Trophy, Sparkles, Wand2, FolderGit2, TargetIcon } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Candidate } from "@/data/candidates";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_TABS = ["all", "New", "Shortlisted", "Interview", "Hired"] as const;
type TabValue = typeof STATUS_TABS[number];

const scoreCandidate = (c: Candidate, job?: { skills?: string[]; experienceYears?: number; title?: string }) => {
  const targetSkills = (job?.skills ?? []).map((s) => s.toLowerCase());
  const cSkills = c.skills.map((s) => s.toLowerCase());
  const matchedSkills = targetSkills.filter((s) => cSkills.includes(s)).length;
  const skillScore = targetSkills.length ? (matchedSkills / targetSkills.length) * 50 : 25;

  const targetExp = job?.experienceYears ?? 3;
  const expDiff = Math.abs(c.experienceYears - targetExp);
  const expScore = Math.max(0, 25 - expDiff * 5);

  const projects = c.pastProjects ?? [];
  const projectHits = projects.filter((p) =>
    targetSkills.some((s) => p.toLowerCase().includes(s)) ||
    (job?.title && p.toLowerCase().includes(job.title.toLowerCase().split(" ")[0]))
  ).length;
  const projectScore = Math.min(15, projects.length * 3 + projectHits * 4);

  const titleBoost = job?.title && c.title.toLowerCase().includes(job.title.toLowerCase().split(" ").pop() ?? "") ? 10 : 0;

  return Math.min(99, Math.round(skillScore + expScore + projectScore + titleBoost));
};

export default function Applicants() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [exp, setExp] = useState("all");
  const [location, setLocation] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [tab, setTab] = useState<TabValue>("all");
  const items = candidatesStore.useStore();
  const recruiterJobs = recruiterJobsStore.useStore();
  const allJobs = jobsStore.useStore();
  const [previewCandidate, setPreviewCandidate] = useState<Candidate | null>(null);

  const locations = useMemo(() => Array.from(new Set(items.map((c) => c.location))), [items]);

  const targetJob = useMemo(() => {
    if (jobFilter !== "all") return allJobs.find((j) => j.title === jobFilter);
    return allJobs[0];
  }, [allJobs, jobFilter]);

  const scored = useMemo(
    () => items.map((c) => ({ ...c, match: scoreCandidate(c, targetJob) })),
    [items, targetJob]
  );

  const counts = useMemo(() => ({
    all: scored.length,
    New: scored.filter((c) => c.status === "Applied").length,
    Shortlisted: scored.filter((c) => c.status === "Shortlisted").length,
    Interview: scored.filter((c) => c.status === "Interview").length,
    Hired: scored.filter((c) => c.status === "Hired").length,
  }), [scored]);

  const filtered = useMemo(() => scored.filter(c => {
    const s = search.toLowerCase();
    const matchS = !s || c.name.toLowerCase().includes(s) || c.skills.some(sk => sk.toLowerCase().includes(s)) || c.title.toLowerCase().includes(s) || (c.pastProjects ?? []).some(p => p.toLowerCase().includes(s));
    const matchSt = status === "all" || c.status === status;
    const matchE = exp === "all" || (exp === "junior" ? c.experienceYears <= 2 : exp === "mid" ? c.experienceYears > 2 && c.experienceYears <= 4 : c.experienceYears > 4);
    const matchL = location === "all" || c.location === location;
    const matchJ = jobFilter === "all" || c.appliedFor === jobFilter;
    const tabStatus = tab === "all" ? null : tab === "New" ? "Applied" : tab;
    const matchTab = !tabStatus || c.status === tabStatus;
    return matchS && matchSt && matchE && matchL && matchJ && matchTab;
  }).sort((a, b) => b.match - a.match), [scored, search, status, exp, location, jobFilter, tab]);

  const setStatusFor = (id: string, newStatus: Candidate["status"]) => {
    updateCandidateStatus(id, newStatus);
    toast.success(`Marked as ${newStatus}`);
  };

  // Top 5 ranking by match %
  const topCandidates = useMemo(() => ({
    list: [...scored].sort((a, b) => b.match - a.match).slice(0, 5),
    jobTitle: targetJob?.title ?? "all roles",
  }), [scored, targetJob]);

  const autoShortlist = () => {
    const eligible = scored.filter((c) => c.status === "Applied" && c.match >= 65);
    if (!eligible.length) {
      toast.info("No new applicants meet the AI shortlist threshold (65%+).");
      return;
    }
    eligible.forEach((c) => updateCandidateStatus(c.id, "Shortlisted"));
    toast.success(`AI shortlisted ${eligible.length} candidate${eligible.length > 1 ? "s" : ""} for ${targetJob?.title ?? "the role"}`);
    setTab("Shortlisted");
  };

  return (
    <div>
      <PageHeader title="Applicants" description={`${filtered.length} candidates`} />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="New">New ({counts.New})</TabsTrigger>
            <TabsTrigger value="Shortlisted">Shortlisted ({counts.Shortlisted})</TabsTrigger>
            <TabsTrigger value="Interview">Interview ({counts.Interview})</TabsTrigger>
            <TabsTrigger value="Hired">Hired ({counts.Hired})</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={autoShortlist} className="bg-gradient-primary text-primary-foreground">
          <Wand2 className="h-4 w-4" /> AI Shortlist for {targetJob?.title ?? "selected role"}
        </Button>
      </div>

      <Card className="shadow-soft mb-6">
        <CardContent className="p-4 grid md:grid-cols-12 gap-3">
          <div className="md:col-span-12 lg:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search name or skill..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="md:col-span-3 lg:col-span-2"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="bg-popover"><SelectItem value="all">All statuses</SelectItem>{["Applied","Shortlisted","Interview","Rejected","Hired"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={exp} onValueChange={setExp}><SelectTrigger className="md:col-span-3 lg:col-span-2"><SelectValue placeholder="Experience" /></SelectTrigger>
            <SelectContent className="bg-popover"><SelectItem value="all">Any experience</SelectItem><SelectItem value="junior">0-2 years</SelectItem><SelectItem value="mid">3-4 years</SelectItem><SelectItem value="senior">5+ years</SelectItem></SelectContent>
          </Select>
          <Select value={location} onValueChange={setLocation}><SelectTrigger className="md:col-span-3 lg:col-span-2"><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent className="bg-popover"><SelectItem value="all">Any location</SelectItem>{locations.map(l=><SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={jobFilter} onValueChange={setJobFilter}><SelectTrigger className="md:col-span-3 lg:col-span-2"><SelectValue placeholder="Job" /></SelectTrigger>
            <SelectContent className="bg-popover"><SelectItem value="all">All jobs</SelectItem>{recruiterJobs.map(j=><SelectItem key={j.id} value={j.title}>{j.title}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((c) => (
          <Card key={c.id} className="shadow-soft hover:shadow-card transition-shadow">
            <CardContent className="p-5">
              <div className="flex gap-4">
                <img src={c.avatar} alt={c.name} className="h-14 w-14 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-sm text-muted-foreground">{c.title}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={c.status} />
                      <span className="text-[11px] font-semibold text-primary">{c.match}% match</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {c.location}</span>
                    <span className="flex items-center"><Briefcase className="h-3 w-3 mr-1" /> {c.experience}</span>
                    {c.pastProjects?.length ? <span className="flex items-center"><FolderGit2 className="h-3 w-3 mr-1" /> {c.pastProjects.length} projects</span> : null}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">{c.skills.slice(0,4).map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setPreviewCandidate(c)}><FileText className="h-3 w-3 mr-1" /> Resume</Button>
                <Button variant="outline" size="sm" className="text-warning" onClick={() => setStatusFor(c.id, "Shortlisted")}><Star className="h-3 w-3 mr-1" /> Shortlist</Button>
                <Button variant="outline" size="sm" className="text-primary" onClick={() => setStatusFor(c.id, "Interview")}><TargetIcon className="h-3 w-3 mr-1" /> Interview</Button>
                <Button variant="outline" size="sm" className="text-success" onClick={() => setStatusFor(c.id, "Hired")}><Check className="h-3 w-3 mr-1" /> Accept</Button>
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => setStatusFor(c.id, "Rejected")}><X className="h-3 w-3 mr-1" /> Reject</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!previewCandidate} onOpenChange={(o) => !o && setPreviewCandidate(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> {previewCandidate?.name}'s Resume
            </DialogTitle>
          </DialogHeader>
          {previewCandidate && (
            <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
              <div className="flex items-center gap-4 pb-4 border-b">
                <img src={previewCandidate.avatar} alt={previewCandidate.name} className="h-16 w-16 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-lg">{previewCandidate.name}</p>
                  <p className="text-sm text-muted-foreground">{previewCandidate.title}</p>
                  <p className="text-xs text-muted-foreground">{previewCandidate.email}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground mb-0.5">Location</p><p>{previewCandidate.location}</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Experience</p><p>{previewCandidate.experience}</p></div>
                <div className="sm:col-span-2"><p className="text-xs text-muted-foreground mb-0.5">Education</p><p>{previewCandidate.education}</p></div>
                <div className="sm:col-span-2"><p className="text-xs text-muted-foreground mb-0.5">Applied for</p><p>{previewCandidate.appliedFor}</p></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {previewCandidate.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                </div>
              </div>
              {previewCandidate.pastProjects?.length ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Past projects</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {previewCandidate.pastProjects.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                </div>
              ) : null}
              <div className="pt-3 border-t flex justify-end">
                <Button variant="outline" onClick={() => toast.info("Download started")}>
                  <FileText className="h-4 w-4" /> Download CV
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
