import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/lib/api";
import { Certificate } from "@/types/api";

const uploadCertificateRequest = async (file: File) => {
  const form = new FormData();
  form.append("certificate", file);
  const { data } = await api.post<ApiEnvelope<{ certificate: Certificate }>>(
    "/certificates",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data.certificate;
};

const getCertificatesRequest = async (candidateId?: string) => {
  const { data } = await api.get<ApiEnvelope<{ certificates: Certificate[] }>>("/certificates", {
    params: candidateId ? { candidateId } : undefined,
  });
  return data.data.certificates;
};

const reverifyCertificateRequest = async (certificateId: string) => {
  const { data } = await api.post<ApiEnvelope<{ certificate: Certificate }>>(
    `/certificates/${certificateId}/verify`
  );
  return data.data.certificate;
};

export const useCertificates = (candidateId?: string, enabled = true) =>
  useQuery({
    queryKey: ["certificates", candidateId ?? "self"],
    queryFn: () => getCertificatesRequest(candidateId),
    enabled,
  });

export const useUploadCertificate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadCertificateRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certificates"] });
      qc.invalidateQueries({ queryKey: ["fraud-check"] });
    },
  });
};

export const useReverifyCertificate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reverifyCertificateRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certificates"] }),
  });
};
