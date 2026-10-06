import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { applications, savedJobs } from "@/data/applications";
import { candidateInterviews } from "@/data/interviews";
import { jobs } from "@/data/jobs";
import { Briefcase, Calendar, Bookmark, FileText, ArrowRight, MapPin } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_COLORS: Record<string, string> = {
  Applied: "hsl(217 91% 50%)",
  Shortlisted: "hsl(38 92% 50%)",
  Interview: "hsl(199 89% 48%)",
  Rejected: "hsl(0 84% 60%)",
  Hired: "hsl(142 71% 45%)",
};

export default function CandidateDashboard() {
  const { user } = useAuth();
  const statusCounts = applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const activityData = [
    { day: "Mon", apps: 2 }, { day: "Tue", apps: 4 }, { day: "Wed", apps: 1 },
    { day: "Thu", apps: 5 }, { day: "Fri", apps: 3 }, { day: "Sat", apps: 0 }, { day: "Sun", apps: 2 },
  ];
  const recommended = jobs.slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${user?.name?.split(" ")[0]} 👋`} description="Here's your job search at a glance." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Applications" value={applications.length} icon={FileText} trend="+2 this week" />
        <StatCard label="Interviews" value={candidateInterviews.filter(i => i.status === "Scheduled").length} icon={Calendar} accent="accent" />
        <StatCard label="Saved Jobs" value={savedJobs.length} icon={Bookmark} accent="warning" />
        <StatCard label="Profile Views" value={42} icon={Briefcase} accent="success" trend="+12%" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="shadow-soft lg:col-span-1">
          <CardHeader><CardTitle className="text-lg">Application Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {pieData.map((e) => <Cell key={e.name} fill={STATUS_COLORS[e.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {pieData.map((e) => (
                <div key={e.name} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[e.name] }} />
                  <span className="text-muted-foreground">{e.name}</span>
                  <span className="font-medium">{e.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Application Activity</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="apps" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Applications</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link to="/candidate/applications">View all <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {applications.slice(0, 4).map((a) => (
            <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <img src={a.companyLogo} alt={a.company} className="h-10 w-10 rounded-lg bg-muted object-contain p-1" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{a.jobTitle}</p>
                <p className="text-sm text-muted-foreground">{a.company} · Applied {a.appliedDate}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recommended for you</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link to="/candidate/jobs">Browse all <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          {recommended.map((j) => (
            <Link to={`/candidate/jobs/${j.id}`} key={j.id} className="p-4 rounded-xl border hover:border-primary/50 hover:shadow-soft transition-all">
              <img src={j.companyLogo} alt={j.company} className="h-10 w-10 rounded-lg bg-muted object-contain p-1 mb-3" />
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
