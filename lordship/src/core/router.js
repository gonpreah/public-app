/* A tiny hash router: #/class, #/day/mon, #/t/wheel, #/church/wheel, #/admin. */
import { useEffect, useState } from 'react';

export function useRoute() {
  const get = () => (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
  const [r, setR] = useState(get);
  useEffect(() => {
    const on = () => { setR(get()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return r;
}
export const go = (path) => { location.hash = '#/' + path.replace(/^\/+/, ''); };
