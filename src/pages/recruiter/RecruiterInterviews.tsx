import { useMemo, useState } from "react";
import { recruiterInterviewsStore, addRecruiterInterview } from "@/store/interviewsStore";
import type { Interview } from "@/data/interviews";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Calendar, Clock, Plus, Send, Search, Video } from "lucide-react";
import { CameraTestButton } from "@/components/CameraTestButton";
import { JoinInterviewButton } from "@/components/JoinInterviewButton";
import { toast } from "sonner";

export default function RecruiterInterviews() {
  const [open, setOpen] = useState(false);
  const recruiterInterviews = recruiterInterviewsStore.useStore();
  const [form, setForm] = useState({ candidate: "", date: "", time: "", type: "Video", platform: "Google Meet", link: "" });
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [typeF, setTypeF] = useState("all");

  const filtered = useMemo(() => recruiterInterviews.filter((iv) => {
    const s = search.toLowerCase();
    const matchS = !s || iv.candidateName.toLowerCase().includes(s) || iv.jobTitle.toLowerCase().includes(s);
    const matchSt = statusF === "all" || iv.status === statusF;
    const matchT = typeF === "all" || iv.type === typeF;
    return matchS && matchSt && matchT;
  }), [recruiterInterviews, search, statusF, typeF]);

  const submit = () => {
    if (!form.candidate || !form.date || !form.time) { toast.error("Fill all fields"); return; }
    const autoLink = form.platform === "Zoom"
      ? `https://zoom.us/j/${Math.floor(Math.random() * 9000000000 + 1000000000)}`
      : `https://meet.google.com/${Math.random().toString(36).slice(2, 5)}-${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 5)}`;
    addRecruiterInterview({
      id: `ri${Date.now()}`,
      candidateName: form.candidate,
      candidateAvatar: `https://i.pravatar.cc/150?u=${form.candidate}`,
      jobTitle: "Open Position",
      company: "Your Company",
      date: form.date,
      time: form.time,
      type: form.type as Interview["type"],
      status: "Scheduled",
      meetingPlatform: form.platform as Interview["meetingPlatform"],
      meetingLink: form.link || autoLink,
    });
    // Mirror to candidate's view
    import("@/store/interviewsStore").then(({ addCandidateInterview }) => {
      addCandidateInterview({
        id: `ic${Date.now()}`,
        jobTitle: "Open Position",
        company: "Your Company",
        date: form.date,
        time: form.time,
        type: form.type as Interview["type"],
        status: "Scheduled",
        meetingPlatform: form.platform as Interview["meetingPlatform"],
        meetingLink: form.link || autoLink,
      });
    });
    setOpen(false);
    setForm({ candidate: "", date: "", time: "", type: "Video", platform: "Google Meet", link: "" });
    toast.success("Interview scheduled & invitation sent");
  };
  return (
    <div>
      <PageHeader title="Interview Scheduling" description={`${filtered.length} of ${recruiterInterviews.length} scheduled`} action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-primary hover:opacity-90"><Plus className="h-4 w-4 mr-2" /> Schedule</Button></DialogTrigger>
          <DialogContent className="bg-popover">
            <DialogHeader><DialogTitle>Schedule Interview</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>Candidate</Label>
                <Select value={form.candidate} onValueChange={(v) => setForm({ ...form, candidate: v })}><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select candidate" /></SelectTrigger>
                  <SelectContent className="bg-popover">{["Sarah Chen","Marcus Johnson","Priya Patel"].map(n=><SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input type="date" className="mt-1.5" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><Label>Time</Label><Input type="time" className="mt-1.5" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
              </div>
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">{["Phone","Video","Onsite","Technical"].map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Meeting Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">{["Google Meet","Zoom"].map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Meeting Link (optional)</Label>
                <Input className="mt-1.5" placeholder="Auto-generated if blank" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} className="bg-gradient-primary"><Send className="h-4 w-4 mr-2" /> Schedule & Send</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      } />

      <Card className="shadow-soft mb-6">
        <CardContent className="p-4 grid md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search candidate or job..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusF} onValueChange={setStatusF}><SelectTrigger className="md:col-span-3"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="bg-popover"><SelectItem value="all">All statuses</SelectItem>{["Scheduled","Completed","Cancelled"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={typeF} onValueChange={setTypeF}><SelectTrigger className="md:col-span-3"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent className="bg-popover"><SelectItem value="all">Any type</SelectItem>{["Phone","Video","Onsite","Technical"].map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((iv) => (
          <Card key={iv.id} className="shadow-soft">
            <CardContent className="p-5 flex gap-4">
              <img src={iv.candidateAvatar} alt={iv.candidateName} className="h-12 w-12 rounded-full object-cover" />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{iv.candidateName}</p>
                    <p className="text-sm text-muted-foreground">{iv.jobTitle}</p>
                  </div>
                  <StatusBadge status={iv.status} />
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-3">
                  <span className="flex items-center"><Calendar className="h-4 w-4 mr-1.5" /> {iv.date}</span>
                  <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5" /> {iv.time}</span>
                  <span>{iv.type}</span>
                </div>
                {iv.meetingLink && (
                  <div className="mt-3 flex items-center justify-between rounded-lg border bg-muted/40 p-2.5">
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
                        variant="outline"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
