import { extract, extractFromConversation } from "../gemini.ts";

// Runs both Gemini modes on fake input; no phone or server needed. Add cases freely.

console.log("=== Live chat mode (newest message only)\n");
const chats = [
  [{ sender: "+15550000001", text: "I'll send you the notes tonight" }],
  [{ sender: "+15550000001", text: "we should hang out sometime" }],
  [
    { sender: "+15550000001", text: "can someone grab ice for saturday?" },
    { sender: "+15550000002", text: "I got it" },
  ],
  [{ sender: "+15550000002", text: "maybe I'll come if I finish work" }],
  [{ sender: "+15550000001", text: "Sam said he'd drive us Friday at 6" }],
];
for (const history of chats) {
  const result = await extract(history, []);
  console.log(`"${history.at(-1)!.text}"\n  ->`, JSON.stringify(result.newPromises), "\n");
}

console.log("=== Pasted conversation mode (whole conversation)\n");
const pasted = [
  `Jordan: can you send me the lab report by tomorrow?
You: yeah I'll send it tonight
Jordan: also I still owe you $20, I'll venmo you friday
You: lol we should get boba sometime`,
  `Mom: did you call grandma?
You: not yet, I'll call her this weekend
Mom: and don't forget the dentist on the 14th`,
];
for (const text of pasted) {
  const found = await extractFromConversation({ text });
  console.log(text, "\n  ->", JSON.stringify(found, null, 2), "\n");
}
