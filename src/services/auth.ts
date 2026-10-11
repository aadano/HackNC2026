import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "./firebase";

export function signInWithGoogle(): Promise<unknown> {
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}

// The signed-in user (null if signed out). `loading` is true until Firebase has checked,
// so the app doesn't flash the sign-in screen for users who are already signed in.
export function useAuthUser(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (next) => {
        setUser(next);
        setLoading(false);
      }),
    [],
  );

  return { user, loading };
}
