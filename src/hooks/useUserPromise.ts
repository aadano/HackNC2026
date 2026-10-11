import { useEffect, useState } from "react";
import { useUser } from "../auth/AuthContext";
import { savePromises, subscribePromises, updateStatus } from "../services/firestoreStorage";
import type { PromiseDraft, PromiseStatus, TrackedPromise } from "../types/promise";

// The one place App talks to the database. Must be used behind <AuthGate>.
export function useUserPromises() {
  const user = useUser();
  const [promises, setPromises] = useState<TrackedPromise[]>([]);
  const [loaded, setLoaded] = useState(false); // false until the first Firestore response
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // subscribePromises returns an unsubscribe function, which React calls on cleanup.
    return subscribePromises(
      user.uid,
      (list) => {
        setPromises(list);
        setLoaded(true);
      },
      (err) => {
        console.error(err);
        setError("Couldn't load your promises.");
        setLoaded(true);
      },
    );
  }, [user.uid]);

  return {
    promises,
    loaded,
    error,
    addPromises: (drafts: PromiseDraft[]) => savePromises(user.uid, drafts),
    setStatus: (id: string, status: PromiseStatus) => updateStatus(user.uid, id, status),
  };
}