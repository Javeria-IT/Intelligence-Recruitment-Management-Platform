import { useMemo, useState } from "react";
import { recruiterJobsStore, removeRecruiterJob } from "@/store/jobsStore";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Edit, Trash2, Users, Eye, Plus, MapPin, Briefcase, Search } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function ManageJobs() {
  const jobs = recruiterJobsStore.useStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [department, setDepartment] = useState("all");

  const filtered = useMemo(
  () =>
    jobs.filter((j) => {
      const s = search.toLowerCase();

      const matchS =
        !s ||
        j.title.toLowerCase().includes(s) ||
        j.location.toLowerCase().includes(s);

      const matchSt =
        status === "all" || j.status === status;

      const matchT =
        type === "all" || j.type === type;

      const matchD =
        department === "all" ||
        j.department === department;

      return matchS && matchSt && matchT && matchD;
    }),
  [jobs, search, status, type, department]
);
  const types = useMemo(() => Array.from(new Set(jobs.map((j) => j.type))), [jobs]);
  const remove = (id: string) => { removeRecruiterJob(id); toast.success("Job deleted"); };
  const departments = useMemo(
  () => Array.from(new Set(jobs.map((j) => j.department))),
  [jobs, search, status, type, department]
);
  return (
    <div>
      <PageHeader title="Manage Jobs" description={`${filtered.length} of ${jobs.length} jobs`} action={<Button asChild className="bg-gradient-primary hover:opacity-90"><Link to="/recruiter/post"><Plus className="h-4 w-4 mr-2" /> Post Job</Link></Button>} />

      <Card className="shadow-soft mb-6">
        <CardContent className="p-4 grid md:grid-cols-12 gap-3">
          <div className="md:col-span-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search title or location..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div><Select value={department} onValueChange={setDepartment}>
  <SelectTrigger className="md:col-span-3">
    <SelectValue placeholder="Department" />
  </SelectTrigger>

  <SelectContent className="bg-popover">
    <SelectItem value="all">All Departments</SelectItem>

    {departments.map((d) => (
      <SelectItem key={d} value={d}>
        {d}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="md:col-span-3"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="bg-popover"><SelectItem value="all">All statuses</SelectItem>{["Active","Closed","Draft"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}><SelectTrigger className="md:col-span-3"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent className="bg-popover"><SelectItem value="all">Any type</SelectItem>{types.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>

        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filtered.map((j) => (
          <Card key={j.id} className="shadow-soft">
            <CardContent className="p-5 flex flex-col md:flex-row gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="font-semibold text-lg">{j.title}</p>
                  <StatusBadge status={j.status} />
                </div>
                <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {j.location}</span>
                  <span>{j.type}</span>
                  <span className="flex items-center"><Users className="h-3 w-3 mr-1" /> {j.applicants} applicants</span>
                  <span className="flex items-center"><Eye className="h-3 w-3 mr-1" /> {j.views} views</span>
                  <span>Posted {j.postedDate}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild><Link to="/recruiter/applicants"><Users className="h-4 w-4 mr-1" /> View</Link></Button>
                <Button variant="outline" size="sm" asChild><Link to={`/recruiter/edit/${j.id}`}><Edit className="h-4 w-4" /></Link></Button>
                <Button variant="outline" size="sm" onClick={() => remove(j.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No jobs match your filters.</p>
        )}
      </div>
    </div>
  );
}
