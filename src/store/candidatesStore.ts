import { createStore } from "./createStore";
import { candidates as initialCandidates, Candidate } from "@/data/candidates";

export const candidatesStore = createStore<Candidate[]>([...initialCandidates], "tn.candidates.v1");

export const updateCandidateStatus = (id: string, status: Candidate["status"]) =>
  candidatesStore.set((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));

export const addCandidate = (c: Candidate) =>
  candidatesStore.set((prev) => [c, ...prev]);
