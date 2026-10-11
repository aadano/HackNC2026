import { useAuth } from "./AuthContext";

// Drop this into Header.tsx
export function SignOutButton() {
  const { user, logOut } = useAuth();
  return (
    <button type="button" onClick={logOut} title={user?.email ?? undefined}>
      Sign out
    </button>
  );
}