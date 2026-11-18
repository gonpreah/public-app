/*  The one place that talks to Claude.
    ANTHROPIC_API_KEY lives only in Netlify's environment — never on the page.
    BFH_MODEL can name another model (default claude-opus-5-5). BFH_WORKSPACE_ID names the workspace for a
    key that isn't scoped to one (sent as the anthropic-workspace-id header).
    Structured outputs (output_config.format) make the answer valid JSON for our schema.
    Server-side refusal fallbacks are on (BFH_FALLBACKS=off turns them off). */
import Anthropic from '@anthropic-ai/sdk';

export const MODEL = () => process.env.BFH_MODEL || 'claude-opus-5-5';
let client = null;

export async function callClaude(system, user, schema, maxTokens) {
  if (globalThis.__bfhClaude) return globalThis.__bfhClaude(system, user, schema, maxTokens);   // tests
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('NO_KEY');
  // An organization key that isn't scoped to a workspace must name one on every request.
  client = client || new Anthropic(Object.assign({ maxRetries: 3 }, process.env.BFH_WORKSPACE_ID ? { defaultHeaders: { 'anthropic-workspace-id': process.env.BFH_WORKSPACE_ID } } : {}));
  const params = {
    model: MODEL(),
    max_tokens: maxTokens || 16000,
    output_config: { effort: process.env.BFH_EFFORT || 'medium', format: { type: 'json_schema', schema } },
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }]
  };
  let msg;
  const useFallbacks = process.env.BFH_FALLBACKS !== 'off';
  try {
    msg = useFallbacks
      ? await client.beta.messages.stream(Object.assign({ betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }, params)).finalMessage()
      : await client.messages.stream(params).finalMessage();
  } catch (e) {
    // An account or model that doesn't take refusal fallbacks: try once without them.
    if (useFallbacks && e instanceof Anthropic.BadRequestError && /fallback/i.test(e.message || '')) {
      msg = await client.messages.stream(params).finalMessage();
    } else throw e;
  }
  if (msg.stop_reason === 'refusal') throw new Error('REFUSED');
  if (msg.stop_reason === 'max_tokens') throw new Error('TOO_LONG');
  const text = (msg.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  try { return JSON.parse(text); } catch (e) { throw new Error('BAD_JSON'); }
}
