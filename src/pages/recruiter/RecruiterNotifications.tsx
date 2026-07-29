import {
  recruiterNotificationsStore,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/store/notificationsStore";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, FileText, MessageSquare, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ICONS = { interview: Calendar, application: FileText, message: MessageSquare, job: Briefcase };

export default function RecruiterNotifications() {
  const items = recruiterNotificationsStore.useStore();
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Notifications" action={<Button variant="outline" onClick={() => { markAllNotificationsRead(recruiterNotificationsStore); toast.success("All read"); }}>Mark all read</Button>} />
      <div className="space-y-3">
        {items.map((n) => {
          const Icon = ICONS[n.type];
          return (
            <Card
              key={n.id}
              onClick={() => !n.read && markNotificationRead(recruiterNotificationsStore, n.id)}
              className={cn("shadow-soft cursor-pointer", !n.read && "border-primary/30 bg-primary/5")}
            >
              <CardContent className="p-4 flex gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon className="h-5 w-5" /></div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2"><p className="font-medium text-sm">{n.title}</p><span className="text-xs text-muted-foreground">{n.date}</span></div>
                  <p className="text-sm text-muted-foreground mt-1">{n.description}</p>
                </div>
                {!n.read && <span className="h-2 w-2 rounded-full bg-primary mt-2" />}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
