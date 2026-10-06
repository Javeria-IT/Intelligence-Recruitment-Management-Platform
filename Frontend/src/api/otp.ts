import { useMutation, useQuery } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/lib/api";
import { OtpDispatchResult, OtpPurpose, OtpStatus, User } from "@/types/api";

const sendOtpRequest = async (purpose: OtpPurpose = "registration") => {
  const { data } = await api.post<ApiEnvelope<OtpDispatchResult>>("/auth/send-otp", { purpose });
  return data.data;
};

const resendOtpRequest = async (purpose: OtpPurpose = "registration") => {
  const { data } = await api.post<ApiEnvelope<OtpDispatchResult>>("/auth/resend-otp", { purpose });
  return data.data;
};

const verifyOtpRequest = async ({ otp, purpose = "registration" }: { otp: string; purpose?: OtpPurpose }) => {
  const { data } = await api.post<ApiEnvelope<{ user: User }>>("/auth/verify-otp", { otp, purpose });
  return data.data.user;
};

const getOtpStatusRequest = async (purpose: OtpPurpose = "registration") => {
  const { data } = await api.get<ApiEnvelope<OtpStatus>>("/auth/otp-status", { params: { purpose } });
  return data.data;
};

export const useSendOtp = () => useMutation({ mutationFn: sendOtpRequest });
export const useResendOtp = () => useMutation({ mutationFn: resendOtpRequest });
export const useVerifyOtp = () => useMutation({ mutationFn: verifyOtpRequest });

export const useOtpStatus = (purpose: OtpPurpose = "registration", enabled = true) =>
  useQuery({
    queryKey: ["otp-status", purpose],
    queryFn: () => getOtpStatusRequest(purpose),
    enabled,
    retry: false,
  });
