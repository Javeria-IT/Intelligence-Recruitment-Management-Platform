import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/lib/api";
import {
  ExperienceCheck,
  FraudCheck,
  RecruiterFraudAction,
  TimelineCheck,
} from "@/types/api";

// ---------- Recruiter/admin: run + fetch analyses ----------

const runFraudCheckRequest = async ({
  candidateId,
  applicationId,
}: {
  candidateId: string;
  applicationId?: string;
}) => {
  const { data } = await api.post<ApiEnvelope<{ fraudCheck: FraudCheck }>>(
    `/fraud/check/${candidateId}`,
    applicationId ? { applicationId } : {}
  );
  return data.data.fraudCheck;
};

const getFraudByCandidateRequest = async (candidateId: string) => {
  const { data } = await api.get<ApiEnvelope<{ fraudCheck: FraudCheck }>>(
    `/fraud/candidate/${candidateId}`
  );
  return data.data.fraudCheck;
};

const getFraudByApplicationRequest = async (applicationId: string) => {
  const { data } = await api.get<ApiEnvelope<{ fraudCheck: FraudCheck }>>(
    `/fraud/application/${applicationId}`
  );
  return data.data.fraudCheck;
};

const getFraudReportRequest = async (candidateId: string) => {
  const { data } = await api.get<ApiEnvelope<{ report: FraudCheck }>>(
    `/fraud/report/${candidateId}`
  );
  return data.data.report;
};

const recordRecruiterActionRequest = async ({
  candidateId,
  action,
  note,
}: {
  candidateId: string;
  action: RecruiterFraudAction;
  note?: string;
}) => {
  const { data } = await api.put<ApiEnvelope<{ fraudCheck: FraudCheck }>>(
    `/fraud/review/${candidateId}`,
    { action, note }
  );
  return data.data.fraudCheck;
};

export const useRunFraudCheck = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: runFraudCheckRequest,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["fraud-check", vars.candidateId] });
      if (vars.applicationId) {
        qc.invalidateQueries({ queryKey: ["fraud-check-application", vars.applicationId] });
      }
    },
  });
};

// By application: used from the Applicants list where we only have the
// applicationId handy; the backend lazily runs the analysis on first view.
export const useFraudCheckByApplication = (applicationId?: string) =>
  useQuery({
    queryKey: ["fraud-check-application", applicationId],
    queryFn: () => getFraudByApplicationRequest(applicationId as string),
    enabled: !!applicationId,
  });

export const useFraudCheckByCandidate = (candidateId?: string) =>
  useQuery({
    queryKey: ["fraud-check", candidateId],
    queryFn: () => getFraudByCandidateRequest(candidateId as string),
    enabled: !!candidateId,
    retry: false, // 404 = "no check run yet", not a transient error
  });

export const useFraudReport = (candidateId?: string, enabled = true) =>
  useQuery({
    queryKey: ["fraud-report", candidateId],
    queryFn: () => getFraudReportRequest(candidateId as string),
    enabled: !!candidateId && enabled,
    retry: false,
  });

export const useRecordRecruiterAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recordRecruiterActionRequest,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["fraud-check", vars.candidateId] });
      qc.invalidateQueries({ queryKey: ["fraud-report", vars.candidateId] });
    },
  });
};

// ---------- Candidate: submit verification data ----------
// Certificate upload now lives in api/certificates.ts (POST /api/certificates)
// and GitHub verification in api/github.ts (POST /api/github/verify) —
// both standalone resources rather than nested under /fraud. Kept here:
// the timeline/experience-only re-analysis, which stays a fraud-module concern.

const analyzeExperienceRequest = async (candidateId: string) => {
  const { data } = await api.post<
    ApiEnvelope<{ experienceChecks: ExperienceCheck[]; timelineCheck: TimelineCheck }>
  >(`/fraud/experience/${candidateId}`);
  return data.data;
};

export const useAnalyzeExperience = () =>
  useMutation({ mutationFn: analyzeExperienceRequest });
