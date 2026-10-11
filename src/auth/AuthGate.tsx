import { Fragment, type ReactNode } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { LoginScreen } from "./LoginScreen";

function Gate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="auth-loading">Loading…</p>;
  if (!user) return <LoginScreen />;

  // key={uid} remounts the app if a different account signs in, so no state leaks between users.
  return <Fragment key={user.uid}>{children}</Fragment>;
}

// Wrap the whole app once in main.tsx. Everything inside only renders when signed in.
export function AuthGate({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Gate>{children}</Gate>
    </AuthProvider>
  );
}