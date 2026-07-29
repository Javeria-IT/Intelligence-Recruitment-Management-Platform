export type ApplicationStatus = "Applied" | "Shortlisted" | "Interview" | "Rejected" | "Hired";

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo: string;
  appliedDate: string;
  status: ApplicationStatus;
  timeline: { status: string; date: string; note?: string }[];
}

export const applications: Application[] = [
  {
    id: "a1",
    jobId: "j1",
    jobTitle: "Senior Frontend Engineer",
    company: "Stripe",
    companyLogo: "https://logo.clearbit.com/stripe.com",
    appliedDate: "2026-04-23",
    status: "Interview",
    timeline: [
      { status: "Applied", date: "2026-04-23" },
      { status: "Shortlisted", date: "2026-04-25", note: "Profile reviewed" },
      { status: "Interview", date: "2026-04-28", note: "Tech round scheduled" },
    ],
  },
  {
    id: "a2",
    jobId: "j2",
    jobTitle: "Full-Stack Developer (MERN)",
    company: "Airbnb",
    companyLogo: "https://logo.clearbit.com/airbnb.com",
    appliedDate: "2026-04-25",
    status: "Shortlisted",
    timeline: [
      { status: "Applied", date: "2026-04-25" },
      { status: "Shortlisted", date: "2026-04-27" },
    ],
  },
  {
    id: "a3",
    jobId: "j4",
    jobTitle: "Backend Engineer",
    company: "Notion",
    companyLogo: "https://logo.clearbit.com/notion.so",
    appliedDate: "2026-04-19",
    status: "Applied",
    timeline: [{ status: "Applied", date: "2026-04-19" }],
  },
  {
    id: "a4",
    jobId: "j5",
    jobTitle: "Data Scientist",
    company: "Spotify",
    companyLogo: "https://logo.clearbit.com/spotify.com",
    appliedDate: "2026-04-16",
    status: "Rejected",
    timeline: [
      { status: "Applied", date: "2026-04-16" },
      { status: "Rejected", date: "2026-04-21", note: "Position filled" },
    ],
  },
  {
    id: "a5",
    jobId: "j7",
    jobTitle: "Junior React Developer",
    company: "Shopify",
    companyLogo: "https://logo.clearbit.com/shopify.com",
    appliedDate: "2026-04-26",
    status: "Applied",
    timeline: [{ status: "Applied", date: "2026-04-26" }],
  },
  {
    id: "a6",
    jobId: "j8",
    jobTitle: "Software Engineer II",
    company: "Google",
    companyLogo: "https://logo.clearbit.com/google.com",
    appliedDate: "2026-03-10",
    status: "Hired",
    timeline: [
      { status: "Applied", date: "2026-03-10" },
      { status: "Shortlisted", date: "2026-03-14", note: "Resume shortlisted" },
      { status: "Interview", date: "2026-03-20", note: "Onsite completed" },
      { status: "Hired", date: "2026-04-02", note: "Offer accepted 🎉" },
    ],
  },
  {
    id: "a7",
    jobId: "j9",
    jobTitle: "Product Designer",
    company: "Figma",
    companyLogo: "https://logo.clearbit.com/figma.com",
    appliedDate: "2026-02-18",
    status: "Hired",
    timeline: [
      { status: "Applied", date: "2026-02-18" },
      { status: "Shortlisted", date: "2026-02-22" },
      { status: "Interview", date: "2026-03-01", note: "Portfolio review" },
      { status: "Hired", date: "2026-03-12", note: "Joining May 1" },
    ],
  },
];

export const savedJobs = ["j3", "j6", "j8"];