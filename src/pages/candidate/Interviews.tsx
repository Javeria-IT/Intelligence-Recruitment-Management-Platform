import { candidateInterviewsStore } from "@/store/interviewsStore";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Calendar, Clock, Video, Phone, MapPin, Briefcase } from "lucide-react";
import { CameraTestButton } from "@/components/CameraTestButton";
import { JoinInterviewButton } from "@/components/JoinInterviewButton";

const TYPE_ICON = { Video, Phone, Onsite: MapPin, Technical: Briefcase };

export default function Interviews() {
  const interviews = candidateInterviewsStore.useStore();

  return (
    <div>
      <PageHeader
        title="My Interviews"
        description="Interviews scheduled for you by recruiters"
      />
      <div className="grid md:grid-cols-2 gap-4">
        {interviews.map((iv) => {
          const Icon = TYPE_ICON[iv.type];
          return (
            <Card key={iv.id} className="shadow-soft hover:shadow-card transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold">{iv.jobTitle}</p>
                    <p className="text-sm text-muted-foreground">{iv.company}</p>
                  </div>
                  <StatusBadge status={iv.status} />
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center"><Calendar className="h-4 w-4 mr-1.5" /> {iv.date}</span>
                  <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5" /> {iv.time}</span>
                  <span className="flex items-center"><Icon className="h-4 w-4 mr-1.5" /> {iv.type}</span>
                </div>
                {iv.meetingLink && iv.status === "Scheduled" && (
                  <div className="mt-4 flex items-center justify-between rounded-lg border bg-muted/40 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-md ${iv.meetingPlatform === "Zoom" ? "bg-blue-500/10 text-blue-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                        <Video className="h-4 w-4" />
                      </span>
                      <span className="font-medium">{iv.meetingPlatform}</span>
                    </div>
                    <div className="flex gap-2">
                      <CameraTestButton />
                      <JoinInterviewButton
                        meetingLink={iv.meetingLink}
                        platform={iv.meetingPlatform}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
