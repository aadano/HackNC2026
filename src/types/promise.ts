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

export interface NewPromise {
  promisorPhone: string | null;
  promisorName: string;
  description: string;
  deadline: string | null;
  confidence: number;
}

// Returned by POST /api/extract. Gets an id when the website saves it.
export type PromiseDraft = Omit<TrackedPromise, "id"> & { id: null };
