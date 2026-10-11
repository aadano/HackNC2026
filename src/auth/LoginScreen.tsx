import { useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../services/firebase";
import "./LoginScreen.css";

function friendlyError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Wrong email or password.";
      case "auth/email-already-in-use":
        return "An account with that email already exists.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/invalid-email":
        return "That email address isn't valid.";
      case "auth/too-many-requests":
        return "Too many attempts. Try again in a bit.";
      case "auth/popup-closed-by-user":
        return ""; // user closed the popup; nothing to report
    }
  }
  return "Something went wrong. Please try again.";
}

export function LoginScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      // No redirect needed: AuthProvider sees the new user and AuthGate swaps screens.
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    run(() =>
      mode === "signin"
        ? signInWithEmailAndPassword(auth, email, password)
        : createUserWithEmailAndPassword(auth, email, password),
    );
  }

  return (
    <main className="login">
      <div className="login-card">
        <h1>Promise Tracker</h1>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </label>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" className="login-primary" disabled={busy}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          className="login-secondary"
          disabled={busy}
          onClick={() => run(() => signInWithPopup(auth, new GoogleAuthProvider()))}
        >
          Continue with Google
        </button>

        <button
          type="button"
          className="login-link"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
          }}
        >
          {mode === "signin" ? "No account? Create one" : "Have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}