/* A local preview with the real functions on an in-memory store and a stand-in coach.
   npm run preview → http://localhost:8890  (class code TEST1, admin password "admin") */
import { memStore, fakeClaude, serve } from './env.mjs';
globalThis.__lsStore = memStore();
globalThis.__lsClaude = fakeClaude();
process.env.LS_CLASS_CODE = process.env.LS_CLASS_CODE || 'TEST1';
process.env.LS_ADMIN_PASSWORD = process.env.LS_ADMIN_PASSWORD || 'admin';
await serve(8890);
console.log('http://localhost:8890  · class code ' + process.env.LS_CLASS_CODE + ' · admin password ' + process.env.LS_ADMIN_PASSWORD);
