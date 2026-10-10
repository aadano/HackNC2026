import { formatDeadline } from "../src/utils/dateUtils.ts";
import { REMINDER_CHECK_MS, TIMEZONE } from "./config.ts";
import { dueForReminder, markReminded } from "./store.ts";

export type SendToSpace = (spaceId: string, text: string) => Promise<void>;

// Posts one reminder per overdue promise, in the chat where it was made.
export function startReminders(send: SendToSpace) {
  setInterval(async () => {
    for (const p of dueForReminder(new Date())) {
      try {
        await send(p.spaceId, `⏰ Reminder for ${p.promisor}: ${p.description} (due ${formatDeadline(p.deadline!, TIMEZONE)})`);
        markReminded(p.id);
      } catch (err) {
        console.error(`Reminder failed for ${p.id}:`, err);
      }
    }
  }, REMINDER_CHECK_MS);
}
