import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// In a Firebase function, initializeApp() finds credentials itself.
// Locally, verifying ID tokens only needs the project id.
if (getApps().length === 0) {
  initializeApp(process.env.FIREBASE_PROJECT_ID ? { projectId: process.env.FIREBASE_PROJECT_ID } : undefined);
}

// Returns the signed-in user's uid, or null if the header is missing or the token is invalid.
export async function verifyAuthHeader(header: string | undefined): Promise<string | null> {
  if (!header?.startsWith("Bearer ")) return null;
  try {
    return (await getAuth().verifyIdToken(header.slice("Bearer ".length))).uid;
  } catch {
    return null;
  }
}