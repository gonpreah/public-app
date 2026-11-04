/* A local preview: node tests/serve.mjs [port] — the app with a test store.
   Sign in with any name: Google is stood in for (window.__gpaGoogle is set on the page). */
import { startServer } from './env.mjs';
const { base } = await startServer(Number(process.argv[2]) || 8888);
console.log('GonPreah preview on ' + base);
