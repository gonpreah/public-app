/*  The one place that talks to Claude (the same setup as Brand From the Heart's lib/claude.js).
    ANTHROPIC_API_KEY lives only in Netlify's environment — never on the page.
    LS_MODEL names another model (default claude-opus-5-5). LS_WORKSPACE_ID names the workspace for a
    key that isn't scoped to one (sent as the anthropic-workspace-id header).
    With a schema, structured outputs make the answer valid JSON; without one, the reply is plain text.
    Server-side refusal fallbacks are on (LS_FALLBACKS=off turns them off). */
import Anthropic from '@anthropic-ai/sdk';

export const MODEL = () => process.env.LS_MODEL || 'claude-opus-5-5';
let client = null;

export async function callClaude(system, messages, schema, opts) {
  if (globalThis.__lsClaude) return globalThis.__lsClaude(system, messages, schema, opts);   // tests
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('NO_KEY');
  client = client || new Anthropic(Object.assign({ maxRetries: 3 },
    process.env.LS_WORKSPACE_ID ? { defaultHeaders: { 'anthropic-workspace-id': process.env.LS_WORKSPACE_ID } } : {}));
  const output_config = { effort: (opts && opts.effort) || process.env.LS_EFFORT || 'low' };
  if (schema) output_config.format = { type: 'json_schema', schema };
  const params = {
    model: MODEL(),
    max_tokens: (opts && opts.maxTokens) || 4000,
    output_config,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages
  };
  let msg;
  const useFallbacks = process.env.LS_FALLBACKS !== 'off';
  try {
    msg = useFallbacks
      ? await client.beta.messages.stream(Object.assign({ betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }, params)).finalMessage()
      : await client.messages.stream(params).finalMessage();
  } catch (e) {
    if (useFallbacks && e instanceof Anthropic.BadRequestError && /fallback/i.test(e.message || '')) {
      msg = await client.messages.stream(params).finalMessage();
    } else throw e;
  }
  if (msg.stop_reason === 'refusal') throw new Error('REFUSED');
  if (msg.stop_reason === 'max_tokens') throw new Error('TOO_LONG');
  const text = (msg.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  if (!schema) return text;
  try { return JSON.parse(text); } catch (e) { throw new Error('BAD_JSON'); }
}
