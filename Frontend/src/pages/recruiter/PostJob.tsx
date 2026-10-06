import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useCreateJob } from "@/api/jobs";
import { toast } from "sonner";

export default function PostJob() {
  const navigate = useNavigate();
  const createJob = useCreateJob();
  const [form, setForm] = useState({
    title: "", company: "", location: "", description: "", experience: "", salary: "", deadline: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setSkillInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.company || !form.description) {
      toast.error("Title, company, and description are required");
      return;
    }
    createJob.mutate(
      { ...form, requiredSkills: skills, deadline: form.deadline || undefined },
      {
        onSuccess: () => {
          toast.success("Job posted!");
          navigate("/recruiter/jobs");
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to post job"),
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Post a New Job" description="Fill in the details to publish your job listing." />
      <form onSubmit={handleSubmit}>
        <Card className="shadow-soft">
          <CardHeader><CardTitle className="text-lg">Job Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Job Title *</Label><Input className="mt-1.5" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Frontend Engineer" /></div>
              <div><Label>Company *</Label><Input className="mt-1.5" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Your company name" /></div>
              <div><Label>Location</Label><Input className="mt-1.5" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Remote, San Francisco" /></div>
              <div><Label>Salary</Label><Input className="mt-1.5" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="e.g. $90k - $120k" /></div>
              <div><Label>Experience Required</Label><Input className="mt-1.5" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 3-5 years" /></div>
              <div><Label>Application Deadline</Label><Input type="date" className="mt-1.5" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea className="mt-1.5" rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the role, responsibilities, and what you're looking for..." />
            </div>
            <div>
              <Label>Required Skills</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {skills.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1.5">{s}<button type="button" onClick={() => setSkills(skills.filter(k => k !== s))}><X className="h-3 w-3" /></button></Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Add a skill and press Enter" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
                <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" className="bg-gradient-primary hover:opacity-90" disabled={createJob.isPending}>
            {createJob.isPending ? "Posting..." : "Post Job"}
          </Button>
        </div>
      </form>
    </div>
  );
}
