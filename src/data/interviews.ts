export interface Interview {
  id: string;
  candidateName?: string;
  candidateAvatar?: string;
  jobTitle: string;
  company: string;
  date: string;
  time: string;
  type: "Phone" | "Video" | "Onsite" | "Technical";
  status: "Scheduled" | "Completed" | "Cancelled";
  meetingPlatform?: "Google Meet" | "Zoom";
  meetingLink?: string;
}

export const candidateInterviews: Interview[] = [
  { id: "i1", jobTitle: "Senior Frontend Engineer", company: "Stripe", date: "2026-04-30", time: "14:00", type: "Technical", status: "Scheduled", meetingPlatform: "Google Meet", meetingLink: "https://meet.google.com/abc-defg-hij" },
  { id: "i2", jobTitle: "Full-Stack Developer (MERN)", company: "Airbnb", date: "2026-05-02", time: "10:00", type: "Video", status: "Scheduled", meetingPlatform: "Zoom", meetingLink: "https://zoom.us/j/9876543210" },
  { id: "i3", jobTitle: "Backend Engineer", company: "Notion", date: "2026-04-15", time: "11:00", type: "Phone", status: "Completed" },
];

export const recruiterInterviews: Interview[] = [
  { id: "ri1", candidateName: "Sarah khan", candidateAvatar: "https://i.pravatar.cc/150?img=1", jobTitle: "Senior Frontend Engineer", company: "Stripe", date: "2026-04-30", time: "14:00", type: "Technical", status: "Scheduled", meetingPlatform: "Google Meet", meetingLink: "https://meet.google.com/abc-defg-hij" },
  { id: "ri2", candidateName: "Moshin khan", candidateAvatar: "https://i.pravatar.cc/150?img=12", jobTitle: "Full-Stack Developer", company: "Stripe", date: "2026-04-29", time: "10:00", type: "Video", status: "Scheduled", meetingPlatform: "Zoom", meetingLink: "https://zoom.us/j/9876543210" },
  { id: "ri3", candidateName: "Priya Patel", candidateAvatar: "https://i.pravatar.cc/150?img=5", jobTitle: "Product Designer", company: "Stripe", date: "2026-05-01", time: "15:30", type: "Onsite", status: "Scheduled" },
];
