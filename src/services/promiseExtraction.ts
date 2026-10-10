import type { PromiseDraft } from "../types/promise";

export async function extractPromises(
  text: string,
): Promise<PromiseDraft[]> {
  const response = await fetch("/api/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to extract promises");
  }

  return data.promises;
}