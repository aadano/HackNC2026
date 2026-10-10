import { onRequest } from "firebase-functions/v2/https";
import { handleExtract } from "../../server/extract.ts";

// Firebase Hosting rewrites /api/** here (see firebase.json), so the website calls
// /api/extract on its own domain. The Gemini code in server/ is bundled in at build time.
// GEMINI_API_KEY comes from functions/.env, which `firebase deploy` uploads.
export const api = onRequest({ timeoutSeconds: 120, memory: "512MiB" }, async (req, res) => {
  try {
    if (req.method === "POST" && req.path === "/api/extract") {
      const result = await handleExtract(req.body);
      res.status(result.status).json(result.body);
      return;
    }
    res.status(404).json({ error: "Not found" });
  } catch (err) {
    console.error("Request failed:", err);
    res.status(500).json({ error: (err as Error).message });
  }
});
