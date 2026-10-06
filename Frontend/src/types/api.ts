// Types that mirror the backend Mongoose models & API responses exactly
// (see backend/models/*.js and backend/controllers/*.js).

export type Role = "candidate" | "recruiter" ;

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: Role;

  // Personal Information
  phone?: string;
  profileImage?: string;

  // Company Information
  companyName?: string;
  companyWebsite?: string;
  industry?: string;
  companyLocation?: string;
  companyDescription?: string;

  // Recruiter Information
  jobTitle?: string;
  department?: string;
  yearsOfExperience?: number;

  linkedinProfile?: string;

  // Account Information
  isActive: boolean;
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Education {
  degree?: string;
  institution?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
}

export interface Experience {
  title?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

export interface ParsedResume {
  rawText?: string;
  extractedSkills?: string[];
  extractedEducation?: string[];
  extractedExperience?: string[];
  certifications?: string[];
  email?: string;
  phone?: string;
}

export type VerificationStatus =
  | "Verified"
  | "Passed"
  | "Needs Review"
  | "Unable to Verify"
  | "Contradiction Found"
  | "Suspicious";

export type CertificateStatus = "Verified" | "Needs Manual Review" | "Unable to Verify" | "Contradiction Found";

export interface CertificateExtracted {
  candidateName?: string;
  certificateName?: string;
  certificateTitle?: string;
  issuingOrganization?: string;
  certificateId?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialUrl?: string;
  verificationUrl?: string;
  rawText?: string;
}

// Certificates are now a standalone collection (/api/certificates),
// referenced by candidateId rather than embedded on CandidateProfile.
export interface Certificate {
  _id: string;
  candidateId: string;
  fileUrl: string;
  originalFileName?: string;
  uploadedAt: string;
  extracted?: CertificateExtracted;
  verificationStatus: CertificateStatus;
  evidence: string[];
  isDuplicate?: boolean;
  duplicateOf?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GithubVerificationSnapshot {
  profileUrl: string;
  username: string;
  exists: boolean | null;
  profileName?: string;
  publicRepos: number;
  followers: number;
  accountCreatedAt?: string;
  topLanguages: string[];
  recentActivity: boolean;
  supportingEvidence: string[];
  claimsRequiringReview: string[];
  status: string;
  checkedAt?: string;
}

export interface CandidateProfile {
  _id: string;
  userId: string | Pick<User, "_id" | "fullName" | "email" | "phone" | "profileImage">;
  skills: string[];
  education: Education[];
  experience: Experience[];
  resumeURL: string;
  parsedResume?: ParsedResume;
  AI_score: number;
  status: "active" | "inactive" | "suspended";
  // Fraud Detection & Verification module additions
  githubUrl?: string;
  githubVerification?: GithubVerificationSnapshot;
  createdAt: string;
  updatedAt: string;
}

export type JobType = "Full-time" | "Part-time" | "Contract" | "Internship" | "Remote";

export interface Job {
  _id: string;
  recruiterId: string | Pick<User, "_id" | "fullName" | "email">;
  title: string;
  company: string;
  location: string;
  description: string;
  requiredSkills: string[];
  experience: string;
  salary: string;
  deadline?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus =
  | "applied"
  | "under_review"
  | "shortlisted"
  | "interview"
  | "rejected"
  | "selected";

export type InterviewStatus = "not_scheduled" | "scheduled" | "completed" | "cancelled";

export interface ScoreBreakdown {
  skillMatch: number;
  experienceMatch: number;
  educationMatch: number;
  certificationMatch: number;
  keywordSimilarity: number;
}

export interface Application {
  _id: string;
  candidateId: string | Pick<User, "_id" | "fullName" | "email">;
  jobId: string | Pick<Job, "_id" | "title" | "company" | "location" | "salary" | "deadline">;
  resume: string;
  AI_score: number;
  scoreBreakdown?: ScoreBreakdown;
  shortlisted: boolean;
  interviewStatus: InterviewStatus;
  applicationStatus: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AIQuestion {
  question: string;
  skillTag?: string;
  candidateAnswer?: string;
  answerScore?: number | null;
}

export interface Interview {
  _id: string;
  applicationId:
    | string
    | (Pick<Application, "_id"> & {
        candidateId?: Pick<User, "_id" | "fullName" | "email">;
        jobId?: Pick<Job, "_id" | "title" | "company">;
      });
  date: string;
  meetingLink?: string;
  interviewer?: string;
  AIQuestions: AIQuestion[];
  score?: number | null;
  feedback?: string;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | "new_application"
  | "shortlisted"
  | "interview_scheduled"
  | "rejected"
  | "selected"
  | "general";

export interface AppNotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
}

export interface RecruiterDashboard {
  totalJobs: number;
  totalCandidates: number;
  shortlisted: number;
  interviews: number;
  hired: number;
}

export interface AdminReports {
  users: { total: number; recruiters: number; candidates: number };
  jobs: { total: number; active: number };
  applications: {
    total: number;
    shortlisted: number;
    selected: number;
    rejected: number;
    averageAIScore: number;
  };
  interviews: { total: number };
}

// ============================================================
// AI Candidate Fraud Detection & Verification module
// (mirrors backend/models/FraudCheck.js exactly)
// ============================================================

export type RiskLevel = "Low Risk" | "Needs Review" | "Suspicious" | "High Risk";

export interface CertificateCheck {
  certificateId?: string;
  certificateTitle: string;
  issuingOrganization: string;
  status: VerificationStatus;
  evidence: string[];
  verificationSource?: string;
}

export interface ExperienceCheck {
  title: string;
  company: string;
  startDate?: string;
  endDate?: string;
  durationMonths: number;
  flags: string[];
  status: VerificationStatus;
}

export interface TimelineOverlap {
  companyA: string;
  companyB: string;
  overlapStartDate?: string;
  overlapEndDate?: string;
  overlapMonths: number;
  possibleReasons: string[];
}

export interface TimelineCheck {
  hasOverlap: boolean;
  overlaps: TimelineOverlap[];
  overlappingJobsCount: number;
  status: VerificationStatus;
  note?: string;
}

export interface GithubCheck {
  profileUrl: string;
  username: string;
  exists: boolean | null;
  profileName?: string;
  publicRepos: number;
  followers: number;
  accountCreatedAt?: string;
  topLanguages: string[];
  recentActivity: boolean;
  supportingEvidence: string[];
  claimsRequiringReview: string[];
  status: VerificationStatus;
  checkedAt?: string;
}

export interface ConsistencyIssue {
  field: string;
  issue: string;
  evidence: string;
  severity: "low" | "medium" | "high";
}

export interface FraudScoreBreakdown {
  certificateVerification: number;
  experienceConsistency: number;
  timelineConsistency: number;
  githubEvidence: number;
  resumeProfileConsistency: number;
}

export type RecruiterFraudAction =
  | "reviewed"
  | "verification_requested"
  | "marked_reviewed"
  | "flag_ignored"
  | "candidate_rejected";

export interface RecruiterReviewAction {
  action: RecruiterFraudAction;
  performedBy?: string;
  note?: string;
  at: string;
}

export interface FraudCheck {
  _id: string;
  candidateId: string | Pick<User, "_id" | "fullName" | "email" | "profileImage">;
  resumeId?: string;
  applicationId?: string;
  certificateChecks: CertificateCheck[];
  experienceChecks: ExperienceCheck[];
  timelineChecks: TimelineCheck;
  githubCheck: GithubCheck;
  consistencyChecks: ConsistencyIssue[];
  fraudRiskScore: number;
  riskLevel: RiskLevel;
  verificationStatus: VerificationStatus;
  scoreBreakdown: FraudScoreBreakdown;
  flags: string[];
  evidence: string[];
  recommendations: string[];
  recruiterReview: {
    status: "pending" | "in_review" | "verification_requested" | "reviewed" | "flag_ignored" | "rejected";
    actions: RecruiterReviewAction[];
  };
  checkedAt: string;
  createdAt: string;
  updatedAt: string;
  // Read-only aliases exposed by the backend (FraudCheck virtuals) for
  // compatibility with the riskScore/status/reviewedBy/reviewerNotes
  // naming used elsewhere in the spec.
  riskScore?: number;
  status?: VerificationStatus;
  reviewedBy?: string;
  reviewerNotes?: string;
}

// ============================================================
// OTP Verification module
// ============================================================

export type OtpPurpose = "registration" | "login" | "password_reset";

export interface OtpStatus {
  hasActiveOtp: boolean;
  isExpired?: boolean;
  attemptsRemaining?: number;
  isVerified: boolean;
  expiresAt?: string;
}

export interface OtpDispatchResult {
  expiresInMinutes: number;
  devMode?: boolean;
  note?: string;
}
