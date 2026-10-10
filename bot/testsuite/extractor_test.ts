import { extract } from "../extractor.ts";

// Runs the Gemini extractor on fake chats; no phone needed. Add cases freely.
const cases = [
  [{ sender: "+15550000001", text: "I'll send you the notes tonight" }],
  [{ sender: "+15550000001", text: "we should hang out sometime" }],
  [
    { sender: "+15550000001", text: "can someone grab ice for saturday?" },
    { sender: "+15550000002", text: "I got it" },
  ],
  [{ sender: "+15550000002", text: "maybe I'll come if I finish work" }],
  [{ sender: "+15550000001", text: "Sam said he'd drive us Friday at 6" }],
];

for (const history of cases) {
  const result = await extract(history, []);
  console.log(`"${history.at(-1)!.text}"\n  ->`, JSON.stringify(result.newPromises), "\n");
}
