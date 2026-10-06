import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/lib/api";
import { Application, ApplicationStatus, RecruiterDashboard } from "@/types/api";

const getDashboardRequest = async () => {
  const { data } = await api.get<ApiEnvelope<RecruiterDashboard>>("/recruiter/dashboard");
  return data.data;
};

const shortlistRequest = async ({
  applicationId,
  shortlisted = true,
}: {
  applicationId: string;
  shortlisted?: boolean;
}) => {
  const { data } = await api.post<ApiEnvelope<{ application: Application }>>(
    `/recruiter/shortlist/${applicationId}`,
    { shortlisted }
  );
  return data.data.application;
};

const updateStatusRequest = async ({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) => {
  const { data } = await api.put<ApiEnvelope<{ application: Application }>>(
    `/recruiter/applications/${applicationId}/status`,
    { status }
  );
  return data.data.application;
};

const notifyCandidateRequest = async ({
  candidateId,
  title,
  message,
}: {
  candidateId: string;
  title: string;
  message: string;
}) => {
  const { data } = await api.post(`/recruiter/notify/${candidateId}`, { title, message });
  return data.data;
};

export const useRecruiterDashboard = () =>
  useQuery({ queryKey: ["recruiter-dashboard"], queryFn: getDashboardRequest });

export const useShortlistCandidate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shortlistRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-applicants"] });
      qc.invalidateQueries({ queryKey: ["recruiter-dashboard"] });
    },
  });
};

export const useUpdateApplicationStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateStatusRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-applicants"] });
      qc.invalidateQueries({ queryKey: ["recruiter-dashboard"] });
    },
  });
};

export const useNotifyCandidate = () => useMutation({ mutationFn: notifyCandidateRequest });
