import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/lib/api";
import { Application, CandidateProfile, Education, Experience, Job, Pagination } from "@/types/api";

const getMyProfileRequest = async () => {
  const { data } = await api.get<ApiEnvelope<{ profile: CandidateProfile }>>("/candidate/profile");
  return data.data.profile;
};

export interface UpdateCandidateProfilePayload {
  fullName?: string;
  phone?: string;
  skills?: string[];
  education?: Education[];
  experience?: Experience[];
}

const updateMyProfileRequest = async (payload: UpdateCandidateProfilePayload) => {
  const { data } = await api.put<ApiEnvelope<{ profile: CandidateProfile }>>(
    "/candidate/profile",
    payload
  );
  return data.data.profile;
};

const uploadResumeRequest = async (file: File) => {
  const form = new FormData();
  form.append("resume", file);
  const { data } = await api.post<ApiEnvelope<{ profile: CandidateProfile }>>(
    "/candidate/uploadResume",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data.profile;
};

const browseJobsRequest = async (params: {
  search?: string;
  location?: string;
  skill?: string;
  page?: number;
  limit?: number;
}) => {
  const { data } = await api.get<ApiEnvelope<{ jobs: Job[]; pagination: Pagination }>>(
    "/candidate/jobs",
    { params }
  );
  return data.data;
};

const applyToJobRequest = async (jobId: string) => {
  const { data } = await api.post<ApiEnvelope<{ application: Application }>>(
    `/candidate/apply/${jobId}`
  );
  return data.data.application;
};

const getMyApplicationsRequest = async () => {
  const { data } = await api.get<ApiEnvelope<{ applications: Application[] }>>(
    "/candidate/applications"
  );
  return data.data.applications;
};

export const useMyCandidateProfile = () =>
  useQuery({ queryKey: ["candidate-profile"], queryFn: getMyProfileRequest });

export const useUpdateCandidateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateMyProfileRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidate-profile"] }),
  });
};

export const useUploadResume = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadResumeRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidate-profile"] }),
  });
};

const removeResumeRequest = async () => {
  const { data } =
    await api.delete<
      ApiEnvelope<{
        profile: CandidateProfile;
      }>
    >("/candidate/resume");

  return data.data.profile;
};

export const useRemoveResume = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: removeResumeRequest,

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["candidate-profile"],
      });
    },
  });
};

export const useBrowseJobs = (params: {
  search?: string;
  location?: string;
  skill?: string;
  page?: number;
  limit?: number;
} = {}) =>
  useQuery({
    queryKey: ["candidate-jobs", params],
    queryFn: () => browseJobsRequest(params),
  });

export const useApplyToJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: applyToJobRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-applications"] }),
  });
};

export const useMyApplications = () =>
  useQuery({ queryKey: ["my-applications"], queryFn: getMyApplicationsRequest });
