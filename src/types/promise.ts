export type PromiseStatus =
  | "pending"
  | "completed"
  | "cancelled";

export interface TrackedPromise {
  id: string;
  description: string;
  promisor: string;
  deadline: string | null;
  status: PromiseStatus;
  sourceText: string;
  createdAt: string;
}