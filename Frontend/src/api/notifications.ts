import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/lib/api";
import { AppNotification } from "@/types/api";

const getMyNotificationsRequest = async () => {
  const { data } = await api.get<
    ApiEnvelope<{ notifications: AppNotification[]; unreadCount: number }>
  >("/notifications");
  return data.data;
};

const markAsReadRequest = async (id: string) => {
  const { data } = await api.put<ApiEnvelope<{ notification: AppNotification }>>(
    `/notifications/read/${id}`
  );
  return data.data.notification;
};

const markAllAsReadRequest = async () => {
  await api.put("/notifications/read-all");
};

export const useMyNotifications = () =>
  useQuery({
    queryKey: ["notifications"],
    queryFn: getMyNotificationsRequest,
    refetchInterval: 30000,
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAsReadRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllAsReadRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
};
