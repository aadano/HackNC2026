import { addDoc, collection, doc, onSnapshot, updateDoc, type Unsubscribe } from "firebase/firestore";
import type { PromiseDraft, TrackedPromise } from "../types/promise";
import { db } from "./firebase";

// Each user's promises live at users/{uid}/promises/{promiseId} (see firestore.rules).
function promisesOf(uid: string) {
  return collection(db, "users", uid, "promises");
}

// Saves a confirmed draft and returns the id Firestore generated for it.
export async function savePromise(uid: string, draft: PromiseDraft): Promise<string> {
  const { id: _draftId, ...data } = draft;
  const ref = await addDoc(promisesOf(uid), data);
  return ref.id;
}

export function completePromise(uid: string, promiseId: string): Promise<void> {
  return updateDoc(doc(promisesOf(uid), promiseId), { status: "completed" });
}

// Calls onChange now and after every change. Returns a function that stops listening.
export function watchPromises(uid: string, onChange: (promises: TrackedPromise[]) => void): Unsubscribe {
  return onSnapshot(
    promisesOf(uid),
    (snapshot) => {
      onChange(snapshot.docs.map((d) => ({ ...(d.data() as Omit<TrackedPromise, "id">), id: d.id })));
    },
    (err) => console.error("Couldn't load promises:", err),
  );
}
