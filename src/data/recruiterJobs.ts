export interface RecruiterJob {
  id: string;
  title: string;
  location: string;
  department:string;
  type: string;
  status: "Active" | "Closed" | "Draft";
  applicants: number;
  views: number;
  postedDate: string;
}

export const recruiterJobs: RecruiterJob[] = [
  { id: "rj1", title: "Senior Frontend Engineer", location: "San Francisco, CA",department:"IT", type: "Full-time", status: "Active", applicants: 124, views: 1840, postedDate: "2026-04-22" },
  { id: "rj2", title: "Backend Engineer", location: "Remote",department:"IT", type: "Remote", status: "Active", applicants: 87, views: 1200, postedDate: "2026-04-25" },
  { id: "rj3", title: "Product Designer", location: "New York, NY", department:"UI Designer",type: "Full-time", status: "Active", applicants: 203, views: 2400, postedDate: "2026-04-20" },
  { id: "rj4", title: "DevOps Engineer", location: "Remote",department:"Engineering", type: "Contract", status: "Closed", applicants: 64, views: 880, postedDate: "2026-03-28" },
  { id: "rj5", title: "Mobile Engineer", location: "Amsterdam",department:"Engineering", type: "Full-time", status: "Draft", applicants: 0, views: 0, postedDate: "2026-04-27" },
];
