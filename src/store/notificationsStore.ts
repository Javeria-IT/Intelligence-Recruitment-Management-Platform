import { createStore } from "./createStore";
import { candidateNotifications, recruiterNotifications, AppNotification } from "@/data/notifications";

export const candidateNotificationsStore = createStore<AppNotification[]>(
  [...candidateNotifications],
  "tn.candidateNotifications.v1"
);
export const recruiterNotificationsStore = createStore<AppNotification[]>(
  [...recruiterNotifications],
  "tn.recruiterNotifications.v1"
);

export const markNotificationRead = (
  store: typeof candidateNotificationsStore,
  id: string
) => store.set((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

export const markAllNotificationsRead = (store: typeof candidateNotificationsStore) =>
  store.set((prev) => prev.map((n) => ({ ...n, read: true })));

export const removeNotification = (
  store: typeof candidateNotificationsStore,
  id: string
) => store.set((prev) => prev.filter((n) => n.id !== id));