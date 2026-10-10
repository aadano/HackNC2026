import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";

// Sends you a DM so you can see which number the bot texts from.
// MY_PHONE must be E.164 (e.g. +19195551234) and registered under Users in the dashboard.
const app = await Spectrum({
  projectId: process.env.SPECTRUM_PROJECT_ID,
  projectSecret: process.env.SPECTRUM_PROJECT_SECRET,
  providers: [imessage.config()],
});

const im = imessage(app);
const me = await im.user(process.env.MY_PHONE!);
const dm = await im.space.create(me);
await dm.send("Hi from Promise Tracker 👋 Save this number.");

console.log("Sent. Check your phone.");
process.exit(0);
