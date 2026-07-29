import { createStore } from "./createStore";
import { recruiterJobs as initialRecruiterJobs, RecruiterJob } from "@/data/recruiterJobs";
import { jobs as initialJobs, Job } from "@/data/jobs";

export const recruiterJobsStore = createStore<RecruiterJob[]>([...initialRecruiterJobs], "tn.recruiterJobs.v1");
export const jobsStore = createStore<Job[]>([...initialJobs], "tn.jobs.v1");

export const addRecruiterJob = (job: RecruiterJob) =>
  recruiterJobsStore.set((prev) => [job, ...prev]);

export const removeRecruiterJob = (id: string) =>
  recruiterJobsStore.set((prev) => prev.filter((j) => j.id !== id));

export const addJob = (job: Job) => jobsStore.set((prev) => [job, ...prev]);