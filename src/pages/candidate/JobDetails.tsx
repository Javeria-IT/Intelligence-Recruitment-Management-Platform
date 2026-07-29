import { useParams, Link, useNavigate } from "react-router-dom";
import { jobs } from "@/data/jobs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, DollarSign, Briefcase, Clock, Users, Bookmark, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const job = jobs.find((j) => j.id === id);

  if (!job) {
    return (
      <div className="text-center py-16">
        <p>Job not found.</p>
        <Button variant="link" asChild><Link to="/candidate/jobs">Back to jobs</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>

      <Card className="shadow-soft mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <img src={job.companyLogo} alt={job.company} className="h-20 w-20 rounded-xl bg-muted object-contain p-3" />
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">{job.title}</h1>
              <p className="text-lg text-muted-foreground mt-1">{job.company}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground mt-3">
                <span className="flex items-center"><MapPin className="h-4 w-4 mr-1.5" /> {job.location}</span>
                <span className="flex items-center"><DollarSign className="h-4 w-4 mr-1.5" /> {job.salary}</span>
                <span className="flex items-center"><Briefcase className="h-4 w-4 mr-1.5" /> {job.experience}</span>
                <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5" /> Posted {job.postedDate}</span>
                <span className="flex items-center"><Users className="h-4 w-4 mr-1.5" /> {job.applicants} applicants</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">{job.type}</Badge>
                {job.skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
              </div>
            </div>
            <div className="flex md:flex-col gap-2 md:w-40">
              <Button onClick={() => toast.success("Application submitted!")} className="bg-gradient-primary hover:opacity-90 flex-1">Apply Now</Button>
              <Button variant="outline" onClick={() => toast.success("Job saved")} className="flex-1"><Bookmark className="h-4 w-4 mr-2" /> Save</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <h2 className="font-semibold text-lg mb-3">About the role</h2>
              <p className="text-muted-foreground">{job.description}</p>
              <h3 className="font-semibold mt-6 mb-2">Responsibilities</h3>
              <ul className="space-y-2">
                {job.responsibilities.map((r) => (
                  <li key={r} className="flex gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {r}</li>
                ))}
              </ul>
              <h3 className="font-semibold mt-6 mb-2">Requirements</h3>
              <ul className="space-y-2">
                {job.requirements.map((r) => (
                  <li key={r} className="flex gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {r}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Benefits</h3>
              <div className="flex flex-wrap gap-2">
                {job.benefits.map((b) => <Badge key={b} variant="secondary">{b}</Badge>)}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">About {job.company}</h3>
              <p className="text-sm text-muted-foreground">A leading company in its industry with a passion for great products and incredible teams.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
