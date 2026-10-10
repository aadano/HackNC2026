import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";

// Logs one line per incoming message. In a group, send "ping" to check the bot can reply there too.
const app = await Spectrum({
  projectId: process.env.SPECTRUM_PROJECT_ID,
  projectSecret: process.env.SPECTRUM_PROJECT_SECRET,
  providers: [imessage.config()],
});

console.log("Listening... send messages in the group.");

for await (const [space, message] of app.messages) {
  const text = message.content.type === "text" ? message.content.text : `<${message.content.type}>`;
  console.log(`[${space.type}] ${space.id} | from ${message.sender.id} | ${text}`);

  if (space.type === "group" && text.trim().toLowerCase() === "ping") {
    try {
      await space.send("pong 🏓 (I can talk in groups)");
      console.log("  -> replied in group");
    } catch (err) {
      console.log("  -> reply FAILED:", (err as Error).message);
    }
  }
}
