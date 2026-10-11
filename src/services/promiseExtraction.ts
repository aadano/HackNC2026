import { auth } from "./firebase";
import type { PromiseDraft } from "../types/promise";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string); // "data:image/png;base64,..." as server/extract.ts expects
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function extractPromises(text: string, image?: File | null): Promise<PromiseDraft[]> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in required.");

  const body: { text?: string; image?: string } = {};
  if (text.trim()) body.text = text;
  if (image) body.image = await fileToDataUrl(image);

  const response = await fetch("/api/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? "Failed to extract promises");
  }

  return data.promises;
}