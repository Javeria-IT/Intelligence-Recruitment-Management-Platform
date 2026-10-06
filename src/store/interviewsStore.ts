import { createStore } from "./createStore";
import { candidateInterviews as initialCandidate, recruiterInterviews as initialRecruiter, Interview } from "@/data/interviews";

export const candidateInterviewsStore = createStore<Interview[]>([...initialCandidate], "tn.candidateInterviews.v1");
export const recruiterInterviewsStore = createStore<Interview[]>([...initialRecruiter], "tn.recruiterInterviews.v1");

export const addCandidateInterview = (iv: Interview) =>
  candidateInterviewsStore.set((prev) => [iv, ...prev]);

export const addRecruiterInterview = (iv: Interview) =>
  recruiterInterviewsStore.set((prev) => [iv, ...prev]);