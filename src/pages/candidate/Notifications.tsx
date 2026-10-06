import {
  candidateNotificationsStore,
  markAllNotificationsRead,
  markNotificationRead,
  removeNotification,
} from "@/store/notificationsStore";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, FileText, MessageSquare, Briefcase } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ICONS = { interview: Calendar, application: FileText, message: MessageSquare, job: Briefcase };

export default function Notifications() {
  const items = candidateNotificationsStore.useStore();

  const markAllRead = () => {
    markAllNotificationsRead(candidateNotificationsStore);
    toast.success("All marked as read");
  };
  const onOpen = (id: string) => markNotificationRead(candidateNotificationsStore, id);
  const cancelInterview = (id: string) => {
    removeNotification(candidateNotificationsStore, id);
    toast.success("Interview cancelled");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Notifications" description="Stay on top of your job search" action={<Button variant="outline" onClick={markAllRead}>Mark all read</Button>} />

      {items.length === 0 ? (
        <EmptyState icon={Bell} title="All caught up" description="You have no notifications." />
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            const Icon = ICONS[n.type];
            return (
              <Card
                key={n.id}
                onClick={() => !n.read && onOpen(n.id)}
                className={cn(
                  "shadow-soft transition-colors cursor-pointer",
                  !n.read && "border-primary/30 bg-primary/5"
                )}
              >
                <CardContent className="p-4 flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon className="h-5 w-5" /></div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{n.title}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{n.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.description}</p>
                    {n.type === "interview" && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onOpen(n.id); toast.success("Confirmed"); }}>Confirm</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); cancelInterview(n.id); }}>Cancel</Button>
                      </div>
                    )}
                  </div>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-primary mt-2" />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
