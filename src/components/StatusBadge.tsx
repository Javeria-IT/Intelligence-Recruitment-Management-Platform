import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  Applied: "bg-primary/10 text-primary hover:bg-primary/15",
  Shortlisted: "bg-warning/15 text-warning hover:bg-warning/20",
  Interview: "bg-accent/15 text-accent hover:bg-accent/20",
  Rejected: "bg-destructive/15 text-destructive hover:bg-destructive/20",
  Hired: "bg-success/15 text-success hover:bg-success/20",
  Active: "bg-success/15 text-success hover:bg-success/20",
  Closed: "bg-muted text-muted-foreground hover:bg-muted",
  Draft: "bg-warning/15 text-warning hover:bg-warning/20",
  Scheduled: "bg-primary/10 text-primary hover:bg-primary/15",
  Completed: "bg-success/15 text-success hover:bg-success/20",
  Cancelled: "bg-destructive/15 text-destructive hover:bg-destructive/20",
};

export const StatusBadge = ({ status }: { status: string }) => (
  <Badge variant="secondary" className={cn("border-0 font-medium", styles[status] ?? "")}>
    {status}
  </Badge>
);
