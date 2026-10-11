import type { User } from "firebase/auth";
import { signInWithGoogle, signOutUser } from "../services/auth";

// Signed out: "Sign in with Google". Signed in: who you are + "Sign out".
export function SignIn({ user }: { user: User | null }) {
  if (!user) {
    return (
      <button className="complete-button" onClick={() => signInWithGoogle().catch(console.error)}>
        Sign in with Google
      </button>
    );
  }

  return (
    <p className="subtitle">
      Signed in as {user.displayName ?? user.email}{" "}
      <button className="complete-button" onClick={() => signOutUser()}>
        Sign out
      </button>
    </p>
  );
}
