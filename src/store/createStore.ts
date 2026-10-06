import { useSyncExternalStore } from "react";

export function createStore<T>(initial: T, persistKey?: string) {
  let state = initial;
  if (persistKey && typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(persistKey);
      if (raw) state = JSON.parse(raw) as T;
    } catch {}
  }
  const listeners = new Set<() => void>();
  const get = () => state;
  const set = (next: T | ((prev: T) => T)) => {
    state = typeof next === "function" ? (next as (p: T) => T)(state) : next;
    if (persistKey && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(persistKey, JSON.stringify(state));
      } catch {}
    }
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  const useStore = () => useSyncExternalStore(subscribe, get, get);
  return { get, set, subscribe, useStore };
}