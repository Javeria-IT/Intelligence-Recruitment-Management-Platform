import { useCallback, useSyncExternalStore } from "react";

// NOTE: The backend has no "saved jobs" endpoint (no route/model for it).
// Until POST/GET/DELETE /api/candidate/saved-jobs exist, this is kept as a
// genuine local (per-browser) preference rather than fake server data.
const STORAGE_KEY = "savedJobIds";

const readIds = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

let ids = readIds();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

const writeIds = (next: string[]) => {
  ids = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useSavedJobs = () => {
  const savedIds = useSyncExternalStore(subscribe, () => ids, () => ids);

  const isSaved = useCallback((jobId: string) => savedIds.includes(jobId), [savedIds]);
  const save = useCallback((jobId: string) => {
    if (!ids.includes(jobId)) writeIds([...ids, jobId]);
  }, []);
  const unsave = useCallback((jobId: string) => {
    writeIds(ids.filter((id) => id !== jobId));
  }, []);
  const toggle = useCallback((jobId: string) => {
    ids.includes(jobId) ? unsave(jobId) : save(jobId);
  }, [save, unsave]);

  return { savedIds, isSaved, save, unsave, toggle };
};
