/* GonPreah's Telegram bot: Telegram posts each message to the bot here (the app points the bot at
   this address itself — setWebhook in api.js, "Telegram sign-in"). Only Telegram knows the secret
   header; anything else is turned away. The work is tgUpdate in api.js. */
import { tgUpdate, tgSecretOk } from './api.js';

export default async function (req) {
  if (req.method !== 'POST') return new Response('ok');
  if (!tgSecretOk(req.headers.get('x-telegram-bot-api-secret-token'))) return new Response('no', { status: 401 });
  let up = null;
  try { up = await req.json(); } catch (e) { return new Response('ok'); }
  try { await tgUpdate(up); } catch (e) { console.error('telegram', e && e.message); }
  return new Response('ok');
}
