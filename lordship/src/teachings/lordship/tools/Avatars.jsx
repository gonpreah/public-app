/* A little cartoon for each Lordship profile — drawn here as SVG, no images to load. */
const INK = '#17150f';
const P = {
  netflix: { bg: '#e0503d', skin: '#f1c27d', shirt: '#5b6b8c', hair: '#3b2414' },
  bentley: { bg: '#1f44ff', skin: '#c68642', shirt: '#17150f', hair: '#17150f' },
  ring: { bg: '#f06aa0', skin: '#ffdbac', shirt: '#ffffff', hair: '#6b3a1e' },
  sahara: { bg: '#ffb323', skin: '#8d5524', shirt: '#e8dcc4', hair: '#e8dcc4' },
  gym: { bg: '#7b4bd6', skin: '#e0ac69', shirt: '#ef5b2a', hair: '#2b1a0e' },
  wifi: { bg: '#14a39a', skin: '#f1c27d', shirt: '#ffb323', hair: '#17150f' },
  planner: { bg: '#3d8b4f', skin: '#c68642', shirt: '#dfe8ff', hair: '#17150f' },
  pleaser: { bg: '#ff8a3d', skin: '#ffdbac', shirt: '#7b4bd6', hair: '#d9a441' }
};

const eyes = <><circle cx="51" cy="56" r="3.2" fill={INK} /><circle cx="69" cy="56" r="3.2" fill={INK} /></>;
const smile = <path d="M52 66 Q60 73 68 66" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />;
const heart = (x, y, s, c) => <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 3 C0 -1 -6 -1 -6 3 C-6 6 0 10 0 10 C0 10 6 6 6 3 C6 -1 0 -1 0 3Z" fill={c} />;

const EXTRA = {
  netflix: {
    hair: <path d="M34 50 Q36 26 60 27 Q84 26 86 50 Q80 38 72 42 Q66 34 58 40 Q48 34 42 44 Q38 40 34 50Z" />,
    face: <><path d="M47 57 h8 M65 57 h8" stroke={INK} strokeWidth="2.6" strokeLinecap="round" /><path d="M54 67 Q60 70 66 67" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <text x="80" y="40" fontSize="11" fontWeight="700" fill={INK}>z</text><text x="88" y="31" fontSize="8" fontWeight="700" fill={INK}>z</text></>,
    front: <><path d="M20 120 Q22 84 60 86 Q98 84 100 120Z" fill="#8fa0c8" /><path d="M26 98 L94 108 M24 110 L96 118" stroke="#6f80a8" strokeWidth="3" />
      <g transform="translate(78 84)"><path d="M0 4 L18 4 L15 30 L3 30Z" fill="#fff" /><path d="M3 4 L5 30 M9 4 V30 M15 4 L13 30" stroke="#e0503d" strokeWidth="2.4" />
        <circle cx="4" cy="3" r="4" fill="#ffe08a" /><circle cx="10" cy="1" r="4.5" fill="#fff3c4" /><circle cx="15" cy="3" r="4" fill="#ffe08a" /></g></>
  },
  bentley: {
    hair: <path d="M34 50 Q34 26 62 28 Q86 30 86 48 Q74 34 50 38 Q40 40 34 50Z" />,
    face: <><rect x="42" y="50" width="16" height="10" rx="3" fill={INK} /><rect x="62" y="50" width="16" height="10" rx="3" fill={INK} /><path d="M58 54 h4" stroke={INK} strokeWidth="2.5" />
      <path d="M45 52 l4 0" stroke="#fff" strokeWidth="1.6" opacity=".7" /><path d="M54 67 Q62 71 69 64" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" /></>,
    front: <><path d="M40 92 Q60 112 80 92" stroke="#ffd34d" strokeWidth="4" fill="none" strokeDasharray="4 2" /><circle cx="60" cy="104" r="5" fill="#ffd34d" />
      <path d="M92 20 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3Z" fill="#fff" /><path d="M24 30 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2Z" fill="#fff" /></>
  },
  ring: {
    hair: <path d="M32 74 Q26 30 60 28 Q94 30 88 74 Q86 52 80 44 Q66 40 50 42 Q38 48 36 60 Z" />,
    face: <>{heart(51, 51, 0.9, '#e0234e')}{heart(69, 51, 0.9, '#e0234e')}<circle cx="45" cy="65" r="4" fill="#ff9bb5" opacity=".7" /><circle cx="75" cy="65" r="4" fill="#ff9bb5" opacity=".7" />
      <path d="M52 66 Q60 75 68 66 Z" fill={INK} /></>,
    front: <><g transform="translate(88 70)"><circle r="9" fill="none" stroke="#ffd34d" strokeWidth="4" /><path d="M-6 -10 L0 -18 L6 -10 L0 -7Z" fill="#bfe9ff" stroke="#fff" strokeWidth="1" /></g>
      {heart(26, 30, 1.2, '#fff')}{heart(94, 24, 0.8, '#fff')}</>
  },
  sahara: {
    hair: <path d="M30 70 Q28 26 60 26 Q92 26 90 70 L84 72 Q86 44 60 42 Q34 44 36 72Z" />,
    face: <><path d="M46 52 l9 2 M74 52 l-9 2" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />{eyes}<path d="M53 67 h14" stroke={INK} strokeWidth="2.6" strokeLinecap="round" /></>,
    front: <><path d="M36 38 h48" stroke="#c0392b" strokeWidth="5" /><circle cx="96" cy="24" r="10" fill="#fff2a8" />
      <g stroke="#fff2a8" strokeWidth="2.5" strokeLinecap="round"><path d="M96 8 v-4 M110 24 h4 M106 14 l3 -3 M106 34 l3 3" /></g>
      <path d="M18 120 V96 Q18 90 22 90 Q26 90 26 96 V104 Q30 104 30 98 Q30 94 33 94 Q36 94 36 98 V108 Q36 112 26 112 V120Z" fill="#2f8a4a" /></>
  },
  gym: {
    hair: <path d="M35 48 Q36 28 60 28 Q84 28 85 48 Q76 36 60 37 Q44 36 35 48Z" />,
    face: <><rect x="34" y="40" width="52" height="7" rx="3" fill="#fff" /><path d="M34 43.5 h52" stroke="#ef5b2a" strokeWidth="2" />
      <path d="M47 57 q4 -4 8 0 M65 57 q4 -4 8 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M52 68 q4 -3 8 0 q4 3 8 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" /><path d="M84 52 q4 6 0 9 q-4 -3 0 -9Z" fill="#7fd3ff" /></>,
    front: <g transform="translate(60 112) rotate(-8)"><rect x="-26" y="-3" width="52" height="6" rx="3" fill="#bbb" /><rect x="-34" y="-11" width="10" height="22" rx="3" fill={INK} /><rect x="24" y="-11" width="10" height="22" rx="3" fill={INK} />
      <text x="-12" y="-8" fontSize="9" fontWeight="800" fill="#fff">200kg</text></g>
  },
  wifi: {
    hair: <path d="M34 52 Q32 26 60 27 Q88 26 86 52 L82 46 L78 52 L72 44 L66 50 L60 42 L54 50 L48 44 L42 52 L38 46Z" />,
    face: <><circle cx="51" cy="60" r="3.2" fill={INK} /><circle cx="69" cy="60" r="3.2" fill={INK} /><path d="M55 69 h10" stroke={INK} strokeWidth="2.6" strokeLinecap="round" /></>,
    front: <><g fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><path d="M44 18 Q60 6 76 18" /><path d="M49 23 Q60 15 71 23" /></g><circle cx="60" cy="27" r="3" fill="#fff" />
      <rect x="48" y="94" width="24" height="26" rx="4" fill={INK} /><rect x="51" y="97" width="18" height="18" rx="1.5" fill="#7fd3ff" /></>
  },
  planner: {
    hair: <path d="M34 50 Q34 27 60 27 Q86 27 86 50 Q86 38 70 36 L52 36 Q40 38 34 50Z" />,
    face: <><circle cx="51" cy="56" r="7" fill="none" stroke={INK} strokeWidth="2.4" /><circle cx="69" cy="56" r="7" fill="none" stroke={INK} strokeWidth="2.4" /><path d="M58 56 h4" stroke={INK} strokeWidth="2.4" />
      {eyes}{smile}<path d="M84 34 l10 -14" stroke="#ffd34d" strokeWidth="4" strokeLinecap="round" /></>,
    front: <g transform="translate(72 88) rotate(8)"><rect width="30" height="36" rx="3" fill="#a0703c" /><rect x="3" y="5" width="24" height="29" fill="#fff" /><rect x="10" y="1" width="10" height="6" rx="2" fill="#bbb" />
      <path d="M6 13 l2 2 4 -4 M6 21 l2 2 4 -4 M6 29 l2 2 4 -4" stroke="#3d8b4f" strokeWidth="1.8" fill="none" /><path d="M15 13 h9 M15 21 h9 M15 29 h9" stroke="#999" strokeWidth="1.6" /></g>
  },
  pleaser: {
    hair: <path d="M34 52 Q30 24 60 26 Q90 24 86 52 Q84 40 74 36 Q62 44 46 38 Q38 42 34 52Z" />,
    face: <><path d="M46 48 q5 -4 10 0 M64 48 q5 -4 10 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />{eyes}
      <path d="M48 64 Q60 80 72 64 Z" fill={INK} /><path d="M52 65 h16" stroke="#fff" strokeWidth="2.4" /><path d="M86 48 q4 6 0 9 q-4 -3 0 -9Z" fill="#7fd3ff" /></>,
    front: <g transform="translate(76 8)"><path d="M0 0 h34 a6 6 0 0 1 6 6 v14 a6 6 0 0 1 -6 6 h-22 l-8 7 v-7 h-4 a6 6 0 0 1 -6 -6 v-14 a6 6 0 0 1 6 -6Z" fill="#fff" transform="translate(-6 0)" />
      <text x="0" y="18" fontSize="12" fontWeight="800" fill={INK}>Yes!</text></g>
  }
};

export default function Avatar({ id, size = 96, className = '' }) {
  const c = P[id], x = EXTRA[id];
  if (!c || !x) return null;
  return (
    <svg className={'avatar ' + className} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="">
      <defs><clipPath id={'av-' + id}><circle cx="60" cy="60" r="60" /></clipPath></defs>
      <g clipPath={`url(#av-${id})`}>
        <rect width="120" height="120" fill={c.bg} />
        <path d="M22 120 Q22 88 60 88 Q98 88 98 120Z" fill={c.shirt} />
        <rect x="53" y="76" width="14" height="14" fill={c.skin} />
        <circle cx="60" cy="56" r="26" fill={c.skin} />
        <g fill={c.hair}>{x.hair}</g>
        {x.face}
        {x.front}
      </g>
    </svg>
  );
}
