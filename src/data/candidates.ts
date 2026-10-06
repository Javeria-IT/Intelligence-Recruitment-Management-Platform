export interface Candidate {
  id: string;
  name: string;
  email: string;
  avatar: string;
  title: string;
  experience: string;
  experienceYears: number;
  location: string;
  skills: string[];
  education: string;
  status: "Applied" | "Shortlisted" | "Interview" | "Rejected" | "Hired";
  appliedFor: string;
  appliedJobId: string;
  resumeUrl: string;
  pastProjects?: string[];
}

export const candidates: Candidate[] = [
  { id: "c1", name: "Sarah Ahmad", email: "sarah.ahmad@email.com", avatar: "https://i.pravatar.cc/150?img=1", title: "Senior Frontend Engineer", experience: "6 years", experienceYears: 6, location: "San Francisco, CA", skills: ["React", "TypeScript", "Next.js", "GraphQL"], education: "BS Computer Science, Stanford", status: "Interview", appliedFor: "Senior Frontend Engineer", appliedJobId: "j1", resumeUrl: "#", pastProjects: ["Design system at Stripe", "GraphQL gateway migration", "SSR rewrite in Next.js"] },
  { id: "c2", name: "Moshin Khan", email: "moshinkhan23@email.com", avatar: "https://i.pravatar.cc/150?img=12", title: "Full-Stack Developer", experience: "4 years", experienceYears: 4, location: "Austin, TX", skills: ["MongoDB", "Express", "React", "Node.js"], education: "BS Software Engineering, UT Austin", status: "Shortlisted", appliedFor: "Full-Stack Developer (MERN)", appliedJobId: "j2", resumeUrl: "#", pastProjects: ["MERN booking platform", "Realtime chat with Socket.io"] },
  { id: "c3", name: "Priya Patel", email: "priya.p@email.com", avatar: "https://i.pravatar.cc/150?img=5", title: "Product Designer", experience: "5 years", experienceYears: 5, location: "New York, NY", skills: ["Figma", "Design Systems", "Prototyping"], education: "MFA Design, RISD", status: "Applied", appliedFor: "Product Designer", appliedJobId: "j3", resumeUrl: "#", pastProjects: ["Banking app redesign", "Design system for SaaS"] },
  { id: "c4", name: "Junaid Ali", email: "junaidali45@email.com", avatar: "https://i.pravatar.cc/150?img=14", title: "Backend Engineer", experience: "3 years", experienceYears: 3, location: "Remote", skills: ["Node.js", "PostgreSQL", "AWS"], education: "BS CS, Georgia Tech", status: "Applied", appliedFor: "Backend Engineer", appliedJobId: "j4", resumeUrl: "#", pastProjects: ["Payments microservice", "AWS Lambda data pipeline"] },
  { id: "c5", name: "Esha Rana", email: "esha.r@email.com", avatar: "https://i.pravatar.cc/150?img=9", title: "Junior Frontend Developer", experience: "1 year", experienceYears: 1, location: "Toronto, Canada", skills: ["React", "JavaScript", "CSS"], education: "BS CS, University of Toronto", status: "Shortlisted", appliedFor: "Junior React Developer", appliedJobId: "j7", resumeUrl: "#", pastProjects: ["Portfolio site", "React dashboard for class project"] },
  { id: "c6", name: "Daud Kareem", email: "daud.k@email.com", avatar: "https://i.pravatar.cc/150?img=15", title: "iOS Engineer", experience: "4 years", experienceYears: 4, location: "Amsterdam, NL", skills: ["Swift", "iOS", "SwiftUI"], education: "BS CS, Seoul National University", status: "Hired", appliedFor: "Mobile Engineer (iOS)", appliedJobId: "j8", resumeUrl: "#", pastProjects: ["Banking iOS app", "SwiftUI component library"] },
  { id: "c7", name: "Alya Khan", email: "alya.k@email.com", avatar: "https://i.pravatar.cc/150?img=20", title: "DevOps Engineer", experience: "6 years", experienceYears: 6, location: "Remote", skills: ["Kubernetes", "Terraform", "AWS"], education: "BS CS, IIT Bombay", status: "Rejected", appliedFor: "DevOps Engineer", appliedJobId: "j6", resumeUrl: "#", pastProjects: ["K8s migration for fintech", "Multi-region Terraform setup"] },
];