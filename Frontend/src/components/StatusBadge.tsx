import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  // Application statuses (backend: Application.applicationStatus)
  applied: "bg-primary/10 text-primary hover:bg-primary/15",
  under_review: "bg-warning/15 text-warning hover:bg-warning/20",
  shortlisted: "bg-warning/15 text-warning hover:bg-warning/20",
  interview: "bg-accent/15 text-accent hover:bg-accent/20",
  rejected: "bg-destructive/15 text-destructive hover:bg-destructive/20",
  selected: "bg-success/15 text-success hover:bg-success/20",
  // Job posting state
  Active: "bg-success/15 text-success hover:bg-success/20",
  Closed: "bg-muted text-muted-foreground hover:bg-muted",
  Draft: "bg-warning/15 text-warning hover:bg-warning/20",
  // Interview statuses (backend: Interview.status)
  scheduled: "bg-primary/10 text-primary hover:bg-primary/15",
  completed: "bg-success/15 text-success hover:bg-success/20",
  cancelled: "bg-destructive/15 text-destructive hover:bg-destructive/20",
  rescheduled: "bg-warning/15 text-warning hover:bg-warning/20",
  not_scheduled: "bg-muted text-muted-foreground hover:bg-muted",
};

const label = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const StatusBadge = ({ status }: { status: string }) => (
  <Badge variant="secondary" className={cn("border-0 font-medium", styles[status] ?? "")}>
    {label(status)}
  </Badge>
);
