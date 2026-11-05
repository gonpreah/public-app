/* GonPreah's reminders, every hour (copied from the Impact app). Each person whose hour it
   is (Phnom Penh time, Me → Reminders) gets one notification with what applies to them —
   see "reminders: web push" in api.js, which does the work. An hour that already ran is
   not sent twice. A scheduled function can't be called by URL on the live site; Netlify's
   "Run now" on the function's page runs it. */
import { runReminders } from './api.js';

export const config = { schedule: '0 * * * *' };

export default async function () {
  try {
    const r = await runReminders();
    console.log('reminders', JSON.stringify(r));
  } catch (e) {
    console.error('reminders failed', e && e.message);
  }
}
