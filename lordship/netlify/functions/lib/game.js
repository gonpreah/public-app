/* Day 1 game: "this or that" polls (counts only) and "Who wrote this?" rounds from the fun facts students
   shared when they joined (a correct guess scores a point). The admin drives it from the projector. */
export const POLLS = [
  { q: 'Your ideal Saturday?', opts: ['Adventure', 'Couch + snacks', 'Coffee with friends', 'Serving somewhere'] },
  { q: 'Coffee or tea?', opts: ['Coffee', 'Tea', 'Neither — water', 'Both, always'] },
  { q: 'Superpower?', opts: ['Fly', 'Speak every language', 'Teleport', 'Never need sleep'] },
  { q: 'Which son are you more like today? (Matthew 21)', opts: ['Said no, then went', 'Said yes, then didn’t', 'Honestly, both'] },
  { q: 'How do you make big decisions?', opts: ['Pray and wait', 'Pros and cons list', 'Ask friends', 'Go with my gut'] },
  { q: 'Hardest to hand over to God?', opts: ['Romance', 'Career', 'Comfort', 'Control'] },
  { q: 'Sunrise or sunset?', opts: ['Sunrise', 'Sunset'] },
  { q: 'If God said “go” tomorrow…', opts: ['Somewhere hot', 'Somewhere cold', 'Back home', 'Anywhere, honestly'] },
  { q: 'Most likely to hold onto?', opts: ['My money', 'My plans', 'My phone', 'My reputation'] }
];

/* The next round: alternate a poll and a "who wrote this?" while facts last; then whatever is left. */
export function nextRound(g, facts) {
  const used = new Set((g.rounds || []).filter(r => r.kind === 'who').map(r => r.sid));
  const pollsUsed = (g.rounds || []).filter(r => r.kind === 'poll').length;
  const left = facts.filter(f => !used.has(f.sid));
  const last = (g.rounds || [])[g.rounds.length - 1];
  const wantWho = left.length && (!last || last.kind === 'poll' || pollsUsed >= POLLS.length);
  if (wantWho) {
    const f = left[Math.floor(Math.random() * left.length)];
    return { kind: 'who', sid: f.sid, fact: f.text };
  }
  if (pollsUsed < POLLS.length) return Object.assign({ kind: 'poll' }, POLLS[pollsUsed]);
  return null;
}

/* The Lordship profile quiz: the profile ids a phone may post (texts live in the app's content.js). */
export const PROFILE_IDS = ['netflix', 'bentley', 'ring', 'sahara', 'gym', 'wifi', 'planner', 'pleaser'];
