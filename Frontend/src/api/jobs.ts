import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/lib/api";
import { Application, Job, Pagination } from "@/types/api";

export interface JobPayload {
  title: string;
  company: string;
  location?: string;
  description: string;
  requiredSkills?: string[];
  experience?: string;
  salary?: string;
  deadline?: string;
  isActive?: boolean;
}

const listJobs = async (params: { mine?: boolean; page?: number; limit?: number }) => {
  const { data } = await api.get<ApiEnvelope<{ jobs: Job[]; pagination: Pagination }>>("/jobs", {
    params,
  });
  return data.data;
};

const getJob = async (id: string) => {
  const { data } = await api.get<ApiEnvelope<{ job: Job }>>(`/jobs/${id}`);
  return data.data.job;
};

const createJobRequest = async (payload: JobPayload) => {
  const { data } = await api.post<ApiEnvelope<{ job: Job }>>("/jobs", payload);
  return data.data.job;
};

const updateJobRequest = async ({ id, payload }: { id: string; payload: Partial<JobPayload> }) => {
  const { data } = await api.put<ApiEnvelope<{ job: Job }>>(`/jobs/${id}`, payload);
  return data.data.job;
};

const deleteJobRequest = async (id: string) => {
  await api.delete(`/jobs/${id}`);
  return id;
};

const getJobApplicantsRequest = async (id: string) => {
  const { data } = await api.get<
    ApiEnvelope<{ job: { id: string; title: string }; applicants: Application[] }>
  >(`/jobs/${id}/applicants`);
  return data.data;
};

export const useJobs = (params: { mine?: boolean; page?: number; limit?: number } = {}) =>
  useQuery({
    queryKey: ["jobs", params],
    queryFn: () => listJobs(params),
  });

export const useJob = (id?: string) =>
  useQuery({
    queryKey: ["job", id],
    queryFn: () => getJob(id as string),
    enabled: !!id,
  });

export const useJobApplicants = (id?: string) =>
  useQuery({
    queryKey: ["job-applicants", id],
    queryFn: () => getJobApplicantsRequest(id as string),
    enabled: !!id,
  });

export const useCreateJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createJobRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
};

export const useUpdateJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateJobRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
};

export const useDeleteJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteJobRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
};
