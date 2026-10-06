import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyApplications } from "@/api/candidate";
import { useBrowseJobs } from "@/api/candidate";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { Briefcase, Calendar, Bookmark, FileText, ArrowRight, MapPin } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Application } from "@/types/api";

type JobRef = Application["jobId"];

const STATUS_COLORS: Record<string, string> = {
  applied: "hsl(217 91% 50%)",
  under_review: "hsl(38 92% 50%)",
  shortlisted: "hsl(38 92% 50%)",
  interview: "hsl(199 89% 48%)",
  rejected: "hsl(0 84% 60%)",
  selected: "hsl(142 71% 45%)",
};

const jobLabel = (job: JobRef) => (typeof job === "string" ? "" : job.title);
const companyLabel = (job: JobRef) => (typeof job === "string" ? "" : job.company);

export default function CandidateDashboard() {
  const { user } = useAuth();
  const { data: applications = [], isLoading: appsLoading } = useMyApplications();
  const { data: jobsData, isLoading: jobsLoading } = useBrowseJobs({ limit: 3 });
  const { savedIds } = useSavedJobs();

  if (appsLoading || jobsLoading) return <LoadingSpinner label="Loading your dashboard..." />;

  const statusCounts = applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.applicationStatus] = (acc[a.applicationStatus] || 0) + 1;
    return acc;
  }, {});
  const pieData: { name: string; value: number }[] = Object.entries(statusCounts).map(
    ([name, value]: [string, number]) => ({ name, value })
  );
  const scheduledInterviews = applications.filter((a) => a.interviewStatus === "scheduled").length;
  const recommended = jobsData?.jobs ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${user?.fullName?.split(" ")[0]} `} description="Here's your job search at a glance." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Applications" value={applications.length} icon={FileText} />
        <StatCard label="Interviews" value={scheduledInterviews} icon={Calendar} accent="accent" />
        <StatCard label="Saved Jobs" value={savedIds.length} icon={Bookmark} accent="warning" />
        <StatCard label="Avg. AI Match" value={applications.length ? Math.round(applications.reduce((s, a) => s + a.AI_score, 0) / applications.length) : 0} icon={Briefcase} accent="success" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="shadow-soft lg:col-span-1">
          <CardHeader><CardTitle className="text-lg">Application Status</CardTitle></CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No applications yet.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                      {pieData.map((e) => <Cell key={e.name} fill={STATUS_COLORS[e.name] ?? "hsl(var(--muted))"} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {pieData.map((e) => (
                    <div key={e.name} className="flex items-center gap-1.5 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[e.name] ?? "hsl(var(--muted))" }} />
                      <span className="text-muted-foreground capitalize">{e.name.replace("_", " ")}</span>
                      <span className="font-medium">{e.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Applications</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/candidate/applications">View all <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {applications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">You haven't applied to any jobs yet.</p>
            ) : (
              applications.slice(0, 4).map((a) => (
                <div key={a._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{jobLabel(a.jobId)}</p>
                    <p className="text-sm text-muted-foreground">{companyLabel(a.jobId)} · Applied {new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={a.applicationStatus} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recommended for you</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link to="/candidate/jobs">Browse all <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          {recommended.length === 0 ? (
            <p className="text-sm text-muted-foreground col-span-3 text-center py-6">No jobs posted yet.</p>
          ) : recommended.map((j) => (
            <Link to={`/candidate/jobs/${j._id}`} key={j._id} className="p-4 rounded-xl border hover:border-primary/50 hover:shadow-soft transition-all">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Briefcase className="h-5 w-5" />
              </div>
              <p className="font-semibold truncate">{j.title}</p>
              <p className="text-sm text-muted-foreground">{j.company}</p>
              <div className="flex items-center text-xs text-muted-foreground mt-2">
                <MapPin className="h-3 w-3 mr-1" /> {j.location}
              </div>
              <p className="text-sm font-medium text-primary mt-2">{j.salary}</p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
