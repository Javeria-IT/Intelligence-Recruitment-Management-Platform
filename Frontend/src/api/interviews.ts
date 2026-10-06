import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/lib/api";
import { Interview } from "@/types/api";

export interface ScheduleInterviewPayload {
  applicationId: string;
  date: string;
  meetingLink?: string;
  interviewer?: string;
}

const scheduleInterviewRequest = async (payload: ScheduleInterviewPayload) => {
  const { data } = await api.post<ApiEnvelope<{ interview: Interview }>>(
    "/interview/schedule",
    payload
  );
  return data.data.interview;
};

const getInterviewRequest = async (id: string) => {
  const { data } = await api.get<ApiEnvelope<{ interview: Interview }>>(`/interview/${id}`);
  return data.data.interview;
};

const submitAnswersRequest = async ({
  id,
  answers,
}: {
  id: string;
  answers: { index: number; candidateAnswer: string }[];
}) => {
  const { data } = await api.put<ApiEnvelope<{ interview: Interview }>>(
    `/interview/${id}/answers`,
    { answers }
  );
  return data.data.interview;
};

const submitFeedbackRequest = async ({
  id,
  score,
  feedback,
}: {
  id: string;
  score: number;
  feedback: string;
}) => {
  const { data } = await api.put<ApiEnvelope<{ interview: Interview }>>(
    `/interview/${id}/feedback`,
    { score, feedback }
  );
  return data.data.interview;
};

export const useInterview = (id?: string) =>
  useQuery({
    queryKey: ["interview", id],
    queryFn: () => getInterviewRequest(id as string),
    enabled: !!id,
  });

export const useScheduleInterview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: scheduleInterviewRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-applicants"] });
      qc.invalidateQueries({ queryKey: ["my-applications"] });
      qc.invalidateQueries({ queryKey: ["my-interviews"] });
      qc.invalidateQueries({ queryKey: ["recruiter-interviews"] });
    },
  });
};

export const useSubmitAnswers = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitAnswersRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-interviews"] });
      qc.invalidateQueries({ queryKey: ["recruiter-interviews"] });
    },
  });
};

export const useSubmitFeedback = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitFeedbackRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-interviews"] });
      qc.invalidateQueries({ queryKey: ["recruiter-interviews"] });
      qc.invalidateQueries({ queryKey: ["my-applications"] });
    },
  });
};

// GET /api/candidate/interviews
const getMyInterviewsRequest = async () => {
  const { data } = await api.get<ApiEnvelope<{ interviews: Interview[] }>>("/candidate/interviews");
  return data.data.interviews;
};

export const useMyInterviews = () =>
  useQuery({ queryKey: ["my-interviews"], queryFn: getMyInterviewsRequest });

// GET /api/recruiter/interviews
const getRecruiterInterviewsRequest = async () => {
  const { data } = await api.get<ApiEnvelope<{ interviews: Interview[] }>>("/recruiter/interviews");
  return data.data.interviews;
};

export const useRecruiterInterviews = () =>
  useQuery({ queryKey: ["recruiter-interviews"], queryFn: getRecruiterInterviewsRequest });
