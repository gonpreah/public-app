/* A local preview with a stand-in for Claude (no API key needed):
   node tests/serve.mjs [port]  → open the printed address. Teacher password: "teach". */
import { startServer } from './env.mjs';
const { base } = await startServer(Number(process.argv[2]) || 8899, { delay: 800 });
console.log('Brand From the Heart preview on ' + base + '  (teacher page: ' + base + '/teacher.html, password "teach")');
