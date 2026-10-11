import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { PromiseDraft, PromiseStatus, TrackedPromise } from "../types/promise";

// Each user's promises live at users/{uid}/promises/{promiseId}.
const promisesRef = (uid: string) => collection(db, "users", uid, "promises");

// Live listener: fires once with current data, then again on every change.
export function subscribePromises(
  uid: string,
  onData: (promises: TrackedPromise[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    promisesRef(uid),
    (snapshot) => onData(snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as TrackedPromise)),
    onError,
  );
}

// Saves drafts (id: null) in one atomic batch, assigning each a Firestore id.
export async function savePromises(uid: string, drafts: PromiseDraft[]): Promise<void> {
  const batch = writeBatch(db);
  for (const draft of drafts) {
    const ref = doc(promisesRef(uid)); // no argument = auto-generated unique id
    batch.set(ref, { ...draft, id: ref.id });
  }
  await batch.commit();
}

export function updateStatus(uid: string, id: string, status: PromiseStatus): Promise<void> {
  return updateDoc(doc(db, "users", uid, "promises", id), { status });
}