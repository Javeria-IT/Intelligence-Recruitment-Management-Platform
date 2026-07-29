import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recruiterJobs } from "@/data/recruiterJobs";
import { candidates } from "@/data/candidates";
import { recruiterInterviews } from "@/data/interviews";
import { Briefcase, Users, Calendar, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge } from "@/components/StatusBadge";

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const hiringData = [
    { month: "Nov", hires: 3, applicants: 80 }, { month: "Dec", hires: 5, applicants: 110 },
    { month: "Jan", hires: 4, applicants: 95 }, { month: "Feb", hires: 7, applicants: 140 },
    { month: "Mar", hires: 6, applicants: 130 }, { month: "Apr", hires: 9, applicants: 180 },
  ];
  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${user?.name?.split(" ")[0]}`} description="Here's your hiring overview." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Jobs Posted" value={recruiterJobs.length} icon={Briefcase} trend="+2 this month" />
        <StatCard label="Total Applicants" value={candidates.length * 12} icon={Users} accent="accent" trend="+18%" />
        <StatCard label="Interviews" value={recruiterInterviews.length} icon={Calendar} accent="warning" />
        <StatCard label="Hire Rate" value="18" icon={TrendingUp} accent="success" trend="+3%" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-soft">
          <CardHeader><CardTitle className="text-lg">Hiring Pipeline</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={hiringData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="hires" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader><CardTitle className="text-lg">Applicants Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={hiringData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="applicants" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-lg">Recent Applicants</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {candidates.slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50">
              <img src={c.avatar} alt={c.name} className="h-10 w-10 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{c.name}</p>
                <p className="text-sm text-muted-foreground truncate">{c.title} · Applied for {c.appliedFor}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
