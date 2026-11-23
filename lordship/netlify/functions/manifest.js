/*  The web app manifest, made per link, so "Add to Home Screen" opens straight into the right place:
    /app.webmanifest?class=CODE → the class (an iPhone's Home Screen app doesn't share Safari's storage,
    so the code has to travel in the start address); ?church=1 → church mode. */
export function manifestFor(params) {
  const code = String(params.get('class') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  const church = params.get('church') === '1';
  const start = code ? '/?class=' + code : church ? '/?church' : '/';
  return {
    id: '/',
    name: 'Lordship: All In, Full of Joy',
    short_name: 'Lordship',
    description: 'My plan or God’s plan? A five-day teaching by Uriah & Naomi Lyford.',
    start_url: start,
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#17150f',
    theme_color: '#17150f',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  };
}

export default async function (req) {
  const url = new URL(req.url);
  return new Response(JSON.stringify(manifestFor(url.searchParams)), {
    headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=300' }
  });
}

export const config = { path: '/app.webmanifest' };
