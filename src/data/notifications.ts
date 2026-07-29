export interface AppNotification {
  id: string;
  type: "interview" | "application" | "message" | "job";
  title: string;
  description: string;
  date: string;
  read: boolean;
}

export const candidateNotifications: AppNotification[] = [
  { id: "n1", type: "interview", title: "Interview Scheduled", description: "Stripe scheduled your technical interview for April 30 at 2:00 PM.", date: "2026-04-28", read: false },
  { id: "n2", type: "application", title: "Application Shortlisted", description: "Airbnb shortlisted your application for Full-Stack Developer.", date: "2026-04-27", read: false },
  { id: "n3", type: "job", title: "New Job Match", description: "5 new jobs match your profile this week.", date: "2026-04-26", read: true },
  { id: "n4", type: "application", title: "Application Update", description: "Spotify reviewed your application.", date: "2026-04-21", read: true },
  { id: "n5", type: "message", title: "Recruiter Message", description: "Notion's recruiter sent you a message.", date: "2026-04-20", read: true },
];

export const recruiterNotifications: AppNotification[] = [
  { id: "rn1", type: "application", title: "New Applicant", description: "Sarah Chen applied to Senior Frontend Engineer.", date: "2026-04-28", read: false },
  { id: "rn2", type: "interview", title: "Interview Reminder", description: "Interview with Marcus Johnson tomorrow at 10:00 AM.", date: "2026-04-28", read: false },
  { id: "rn3", type: "job", title: "Job Posting Live", description: "Your Backend Engineer posting is now live.", date: "2026-04-25", read: true },
  { id: "rn4", type: "application", title: "12 New Applicants", description: "12 candidates applied today across your jobs.", date: "2026-04-24", read: true },
];
