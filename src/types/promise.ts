export type PromiseStatus =
  | "pending"
  | "completed"
  | "cancelled";

export interface TrackedPromise {
  id: string;
  description: string;
  promisor: string;
  promisorPhone: string | null;
  deadline: string | null;
  status: PromiseStatus;
  sourceText: string;
  spaceId: string;
  remindedAt: string | null;
  createdAt: string;
}
