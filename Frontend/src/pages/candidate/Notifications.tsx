import { useMyNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/api/notifications";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, FileText, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NotificationType } from "@/types/api";

const ICONS: Record<NotificationType, typeof Bell> = {
  new_application: FileText,
  shortlisted: Sparkles,
  interview_scheduled: Calendar,
  rejected: XCircle,
  selected: CheckCircle2,
  general: Bell,
};

export default function Notifications() {
  const { data, isLoading } = useMyNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = data?.notifications ?? [];

  const handleMarkAll = () => {
    markAllRead.mutate(undefined, { onSuccess: () => toast.success("All marked as read") });
  };
  const onOpen = (id: string) => markRead.mutate(id);

  if (isLoading) return <LoadingSpinner label="Loading notifications..." />;

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Notifications" description="Stay on top of your job search" action={<Button variant="outline" onClick={handleMarkAll} disabled={markAllRead.isPending}>Mark all read</Button>} />

      {items.length === 0 ? (
        <EmptyState icon={Bell} title="All caught up" description="You have no notifications." />
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            return (
              <Card
                key={n._id}
                onClick={() => !n.isRead && onOpen(n._id)}
                className={cn(
                  "shadow-soft transition-colors cursor-pointer",
                  !n.isRead && "border-primary/30 bg-primary/5"
                )}
              >
                <CardContent className="p-4 flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon className="h-5 w-5" /></div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{n.title}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  </div>
                  {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary mt-2" />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
