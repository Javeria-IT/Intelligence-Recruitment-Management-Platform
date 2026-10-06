import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecruiterDashboard } from "@/api/recruiter";
import { useJobs } from "@/api/jobs";
import { Briefcase, Users, Calendar, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Link } from "react-router-dom";

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const { data: dashboard, isLoading: dashLoading } = useRecruiterDashboard();
  const { data: jobsData, isLoading: jobsLoading } = useJobs({ mine: true, limit: 5 });

  if (dashLoading || jobsLoading) return <LoadingSpinner label="Loading dashboard..." />;

  const jobs = jobsData?.jobs ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${user?.fullName?.split(" ")[0]}`} description="Here's your hiring overview." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Jobs Posted" value={dashboard?.totalJobs ?? 0} icon={Briefcase} />
        <StatCard label="Total Applicants" value={dashboard?.totalCandidates ?? 0} icon={Users} accent="accent" />
        <StatCard label="Shortlisted" value={dashboard?.shortlisted ?? 0} icon={TrendingUp} accent="warning" />
        <StatCard label="Hired" value={dashboard?.hired ?? 0} icon={Calendar} accent="success" />
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-lg">Your Recent Job Postings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              You haven't posted any jobs yet. <Link to="/recruiter/post" className="text-primary hover:underline">Post your first job</Link>.
            </p>
          ) : (
            jobs.map((j) => (
              <div key={j._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{j.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{j.location} · Posted {new Date(j.createdAt).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={j.isActive ? "Active" : "Closed"} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
