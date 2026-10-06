import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/lib/api";
import { Role, User } from "@/types/api";

export interface AuthResponse {
  user: User;
  token: string;
  requiresOtpVerification?: boolean;
  otpPurpose?: import("@/types/api").OtpPurpose;
}


// REGISTER
export const registerRequest = async (payload: {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
}) => {
  const { data } = await api.post<ApiEnvelope<AuthResponse>>(
    "/auth/register",
    payload
  );

  return data.data;
};


// LOGIN

export const loginRequest = async (payload: {
  email: string;
  password: string;
}) => {
  const { data } = await api.post<ApiEnvelope<AuthResponse>>(
    "/auth/login",
    payload
  );

  return data.data;
};

// GET PROFILE

export const getProfileRequest = async () => {
  const { data } = await api.get<ApiEnvelope<{ user: User }>>(
    "/auth/profile"
  );

  return data.data.user;
};


// UPDATE PROFILE


export interface UpdateProfilePayload {
  // Personal Information
  fullName?: string;
  phone?: string;

  // Company Information
  companyName?: string;
  companyWebsite?: string;
  industry?: string;
  companyLocation?: string;
  companyDescription?: string;

  // Recruiter Information
  jobTitle?: string;
  department?: string;
  yearsOfExperience?: number | string;
  linkedinProfile?: string;
}

const updateProfileRequest = async (
  payload: UpdateProfilePayload
) => {
  const { data } = await api.put<ApiEnvelope<{ user: User }>>(
    "/auth/profile",
    payload
  );

  return data.data.user;
};


// UPLOAD AVATAR

const uploadAvatarRequest = async (file: File) => {
  const form = new FormData();

  form.append("avatar", file);

  const { data } = await api.post<ApiEnvelope<{ user: User }>>(
    "/auth/avatar",
    form,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data.data.user;
};

// =========================
// REACT QUERY HOOKS
// =========================

export const useUpdateProfile = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateProfileRequest,

    onSuccess: () => {
      // Refresh logged-in user's profile
      qc.invalidateQueries({
        queryKey: ["profile"],
      });

      // Existing candidate profile query
      qc.invalidateQueries({
        queryKey: ["candidate-profile"],
      });
    },
  });
};

export const useUploadAvatar = () =>
  useMutation({
    mutationFn: uploadAvatarRequest,
  });