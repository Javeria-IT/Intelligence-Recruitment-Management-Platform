import { useState } from "react";
import { applications } from "@/data/applications";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Circle, FileText, Building2, Calendar } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export default function Applications() {
  const [filter, setFilter] = useState<string>("all");
  const list = filter === "all" ? applications : applications.filter((a) => a.status === filter);

  return (
    <div>
      <PageHeader title="My Applications" description="Track the status of every job you applied to." />

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
          <TabsTrigger value="Applied">Applied</TabsTrigger>
          <TabsTrigger value="Shortlisted">Shortlisted</TabsTrigger>
          <TabsTrigger value="Interview">Interview</TabsTrigger>
          <TabsTrigger value="Hired">Hired</TabsTrigger>
          <TabsTrigger value="Rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {list.length === 0 ? (
        <EmptyState icon={FileText} title="No applications" description="Nothing here yet." />
      ) : (
        <div className="space-y-4">
          {list.map((a) => (
            <Card key={a.id} className="shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img src={a.companyLogo} alt={a.company} className="h-12 w-12 rounded-lg bg-muted object-contain p-1.5" />
                    <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 shadow-soft">
                      <Building2 className="h-3 w-3" />
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{a.jobTitle}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" /> {a.company}
                          <span className="mx-1">·</span>
                          <Calendar className="h-3.5 w-3.5" /> Applied {a.appliedDate}
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      {["Applied", "Shortlisted", "Interview", "Hired"].map((step, i) => {
                        const reached = a.timeline.some(t => t.status === step) || (a.status === "Hired");
                        const isLast = i === 3;
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div className="flex flex-col items-center gap-1">
                              {reached ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                              <span className={`text-[10px] ${reached ? "text-foreground" : "text-muted-foreground"}`}>{step}</span>
                            </div>
                            {!isLast && <div className={`flex-1 h-0.5 mx-2 ${reached ? "bg-success" : "bg-muted"}`} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
