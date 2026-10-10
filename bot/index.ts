import { randomUUID } from "node:crypto";
import { Spectrum, type Space } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import type { TrackedPromise } from "../src/types/promise.ts";
import { formatDeadline, isValidDate } from "../src/utils/dateUtils.ts";
import { MIN_CONFIDENCE, TIMEZONE } from "./config.ts";
import { extract } from "./extractor.ts";
import { remember } from "./history.ts";
import { startReminders } from "./reminders.ts";
import { addPromise, pendingInSpace, setStatus } from "./store.ts";

const HELP = `Hey! I'm Promise Tracker 🤝 I keep track of what people promise and remind them.

Tell me something like "I'll send Sam the notes by Friday", or add me to a group chat and I'll listen for promises.

Text "list" to see open promises, "done 2" to close #2.`;

// Credentials come from SPECTRUM_PROJECT_ID / SPECTRUM_PROJECT_SECRET in .env.
const app = await Spectrum({ providers: [imessage.config()] });
const im = imessage(app);

startReminders(async (spaceId, text) => {
  const space = await im.space.get(spaceId);
  await space.send(text);
});

console.log("Promise Tracker is listening.");

for await (const [space, message] of app.messages) {
  if (message.direction !== "inbound" || message.content.type !== "text") continue;

  const sender = message.sender?.id ?? "unknown";
  const text = message.content.text;
  console.log(`[${space.id}] ${sender}: ${text}`);

  // Tapback first so the sender knows it arrived, even if Gemini fails afterwards.
  try {
    await message.react("✅");
  } catch (err) {
    console.error("Failed to react:", err);
  }

  try {
    const handled = (await runCommand(space, text)) || (await trackPromises(space, sender, text));
    // Groups: stay quiet unless there's something to say. DMs: always answer.
    if (!handled && imessage(space).type === "dm") {
      await space.send(HELP);
    }
  } catch (err) {
    console.error("Failed to handle message:", err);
  }
}

function describe(p: TrackedPromise): string {
  const due = p.deadline ? ` (due ${formatDeadline(p.deadline, TIMEZONE)})` : "";
  return `${p.promisor} → ${p.description}${due}`;
}

// "list" shows open promises in this chat, "done 2" closes the 2nd one.
async function runCommand(space: Space, text: string): Promise<boolean> {
  const cmd = text.trim().toLowerCase();
  const pending = pendingInSpace(space.id);

  if (cmd === "list") {
    const lines = pending.map((p, i) => `${i + 1}. ${describe(p)}`);
    await space.send(lines.length ? lines.join("\n") : "No open promises here 🎉");
    return true;
  }

  const done = cmd.match(/^done (\d+)$/);
  if (done) {
    const p = pending[Number(done[1]) - 1];
    if (!p) {
      await space.send('No promise with that number. Text "list" to see them.');
      return true;
    }
    setStatus(p.id, "completed");
    await space.send(`✅ Done: ${describe(p)}`);
    return true;
  }

  return false;
}

// Returns true if anything was tracked or completed.
async function trackPromises(space: Space, sender: string, text: string): Promise<boolean> {
  const history = remember(space.id, { sender, text });
  const pending = pendingInSpace(space.id);
  const result = await extract(history, pending);
  let changed = false;

  for (const id of result.completedPromiseIds) {
    const p = pending.find((p) => p.id === id);
    if (!p) continue;
    setStatus(p.id, "completed");
    await space.send(`✅ Done: ${describe(p)}`);
    changed = true;
  }

  for (const np of result.newPromises) {
    if (np.confidence < MIN_CONFIDENCE) continue;
    const p: TrackedPromise = {
      id: randomUUID(),
      description: np.description,
      promisor: np.promisorName,
      promisorPhone: np.promisorPhone,
      deadline: isValidDate(np.deadline) ? np.deadline : null,
      status: "pending",
      sourceText: text,
      spaceId: space.id,
      remindedAt: null,
      createdAt: new Date().toISOString(),
    };
    addPromise(p);
    await space.send(`📌 ${describe(p)}`);
    changed = true;
  }

  return changed;
}
