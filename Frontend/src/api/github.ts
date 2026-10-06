import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/lib/api";
import { GithubVerificationSnapshot } from "@/types/api";

const verifyGithubRequest = async (githubUrl: string) => {
  const { data } = await api.post<ApiEnvelope<{ githubCheck: GithubVerificationSnapshot }>>(
    "/github/verify",
    { githubUrl }
  );
  return data.data.githubCheck;
};

const getGithubVerificationRequest = async (candidateId: string) => {
  const { data } = await api.get<
    ApiEnvelope<{ githubUrl: string; githubCheck: GithubVerificationSnapshot | null }>
  >(`/github/${candidateId}`);
  return data.data;
};

export const useVerifyGithub = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: verifyGithubRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["github-verification"] });
      qc.invalidateQueries({ queryKey: ["candidate-profile"] });
      qc.invalidateQueries({ queryKey: ["fraud-check"] });
    },
  });
};

export const useGithubVerification = (candidateId?: string) =>
  useQuery({
    queryKey: ["github-verification", candidateId],
    queryFn: () => getGithubVerificationRequest(candidateId as string),
    enabled: !!candidateId,
  });
