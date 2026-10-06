import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { addRecruiterJob, addJob } from "@/store/jobsStore";

export default function PostJob() {
  const [skills, setSkills] = useState<string[]>(["React"]);
  const [skill, setSkill] = useState("");
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [responsibility, setResponsibility] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [requirement, setRequirement] = useState("");
  const [benefits, setBenefits] = useState<string[]>([]);
  const [benefit, setBenefit] = useState("");
  const [form, setForm] = useState({
    title: "",
    company: "",
    department: "",
    location: "",
    type: "Full-time",
    salaryMin: "",
    salaryMax: "",
    experience: "Mid-level",
    remote: "No",
    description: "",
  });
  const navigate = useNavigate();
  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const addItem = (
    val: string,
    list: string[],
    setList: (v: string[]) => void,
    setVal: (v: string) => void
  ) => {
    if (val.trim()) {
      setList([...list, val.trim()]);
      setVal("");
    }
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.company || !form.location || !form.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    const id = `rj${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    addRecruiterJob({
      id,
      title: form.title,
      location: form.location,
      department: form.department,
      type: form.type,
      status: "Active",
      applicants: 0,
      views: 0,
      postedDate: today,
    });
    const min = Number(form.salaryMin) || 0;
    const max = Number(form.salaryMax) || 0;
    const company = form.company.trim();
    const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "");
    addJob({
      id: `j${Date.now()}`,
      title: form.title,
      company,
      companyLogo: `https://logo.clearbit.com/${slug}.com`,
      location: form.location,
      department: form.department,
      type: form.type as any,
      salary: min && max ? `$${(min/1000).toFixed(0)}k - $${(max/1000).toFixed(0)}k` : "Competitive",
      salaryMin: min,
      salaryMax: max,
      experience: form.experience,
      experienceYears: form.experience === "Senior" ? 5 : form.experience === "Mid-level" ? 3 : 1,
      skills,
      description: form.description,
      responsibilities,
      requirements,
      benefits,
      postedDate: today,
      applicants: 0,
    });
    toast.success("Job posted!");
    navigate("/recruiter/jobs");
  };

  const ChipList = ({
    items,
    onRemove,
  }: {
    items: string[];
    onRemove: (i: string) => void;
  }) => (
    <div className="flex flex-wrap gap-2 mt-1.5 mb-2">
      {items.map((s) => (
        <Badge key={s} variant="secondary" className="gap-1.5 py-1.5">
          <span>{s}</span>
          <button type="button" onClick={() => onRemove(s)}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Post a New Job" description="Reach top candidates in minutes." />
      <Card className="shadow-soft">
        <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Job Title *</Label><Input placeholder="e.g. Senior Frontend Engineer" required className="mt-1.5" value={form.title} onChange={(e)=>update("title", e.target.value)} /></div>
              <div><Label>Company *</Label><Input placeholder="e.g. Stripe" required className="mt-1.5" value={form.company} onChange={(e)=>update("company", e.target.value)} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Department</Label><Input placeholder="Engineering" className="mt-1.5" value={form.department} onChange={(e)=>update("department", e.target.value)} /></div>
              <div><Label>Location *</Label><Input placeholder="San Francisco, CA" required className="mt-1.5" value={form.location} onChange={(e)=>update("location", e.target.value)} /></div>
              <div><Label>Job Type *</Label>
                <Select value={form.type} onValueChange={(v)=>update("type", v)}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">{["Full-time","Part-time","Contract","Internship","Remote"].map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Remote Friendly</Label>
                <Select value={form.remote} onValueChange={(v)=>update("remote", v)}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">{["No","Hybrid","Yes"].map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Min Salary</Label><Input type="number" placeholder="80000" className="mt-1.5" value={form.salaryMin} onChange={(e)=>update("salaryMin", e.target.value)} /></div>
              <div><Label>Max Salary</Label><Input type="number" placeholder="120000" className="mt-1.5" value={form.salaryMax} onChange={(e)=>update("salaryMax", e.target.value)} /></div>
              <div><Label>Experience Level</Label>
                <Select value={form.experience} onValueChange={(v)=>update("experience", v)}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">{["Entry-level","Mid-level","Senior"].map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Required Skills</Label>
              <ChipList items={skills} onRemove={(s)=>setSkills(skills.filter(k=>k!==s))} />
              <div className="flex gap-2">
                <Input placeholder="Add skill" value={skill} onChange={e=>setSkill(e.target.value)} onKeyDown={(e)=>{ if(e.key==="Enter"){e.preventDefault(); addItem(skill, skills, setSkills, setSkill);} }} />
                <Button type="button" variant="outline" onClick={()=>addItem(skill, skills, setSkills, setSkill)}>Add</Button>
              </div>
            </div>
            <div>
              <Label>Responsibilities</Label>
              <ChipList items={responsibilities} onRemove={(s)=>setResponsibilities(responsibilities.filter(k=>k!==s))} />
              <div className="flex gap-2">
                <Input placeholder="Add responsibility" value={responsibility} onChange={e=>setResponsibility(e.target.value)} onKeyDown={(e)=>{ if(e.key==="Enter"){e.preventDefault(); addItem(responsibility, responsibilities, setResponsibilities, setResponsibility);} }} />
                <Button type="button" variant="outline" onClick={()=>addItem(responsibility, responsibilities, setResponsibilities, setResponsibility)}>Add</Button>
              </div>
            </div>
            <div>
              <Label>Requirements</Label>
              <ChipList items={requirements} onRemove={(s)=>setRequirements(requirements.filter(k=>k!==s))} />
              <div className="flex gap-2">
                <Input placeholder="Add requirement" value={requirement} onChange={e=>setRequirement(e.target.value)} onKeyDown={(e)=>{ if(e.key==="Enter"){e.preventDefault(); addItem(requirement, requirements, setRequirements, setRequirement);} }} />
                <Button type="button" variant="outline" onClick={()=>addItem(requirement, requirements, setRequirements, setRequirement)}>Add</Button>
              </div>
            </div>
            <div>
              <Label>Benefits</Label>
              <ChipList items={benefits} onRemove={(s)=>setBenefits(benefits.filter(k=>k!==s))} />
              <div className="flex gap-2">
                <Input placeholder="Add benefit" value={benefit} onChange={e=>setBenefit(e.target.value)} onKeyDown={(e)=>{ if(e.key==="Enter"){e.preventDefault(); addItem(benefit, benefits, setBenefits, setBenefit);} }} />
                <Button type="button" variant="outline" onClick={()=>addItem(benefit, benefits, setBenefits, setBenefit)}>Add</Button>
              </div>
            </div>
            <div><Label>Description *</Label><Textarea placeholder="Describe the role..." rows={6} required className="mt-1.5" value={form.description} onChange={(e)=>update("description", e.target.value)} /></div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline">Save as draft</Button>
              <Button type="submit" className="bg-gradient-primary hover:opacity-90">Publish job</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
