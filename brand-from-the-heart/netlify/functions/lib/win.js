/* The data files are browser scripts that write to window.* — on the server, window is globalThis. */
if (typeof globalThis.window === 'undefined') globalThis.window = globalThis;
