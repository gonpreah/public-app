/*  The Lordship teaching as a self-contained module. A future GonPreah teaching hub can import
    several of these side by side: each brings its own content, tools, storage keys ("lordship.*")
    and coaching tool ids (server: netlify/functions/lib/prompts.js). */
import { TEACHING, DAYS } from './content.js';
import Wheel from './tools/Wheel.jsx';
import LayDown from './tools/LayDown.jsx';
import List from './tools/List.jsx';
import NotSo from './tools/NotSo.jsx';
import Hot from './tools/Hot.jsx';
import Scroll from './tools/Scroll.jsx';
import GodThing from './tools/GodThing.jsx';
import Habits from './tools/Habits.jsx';
import Commit from './tools/Commit.jsx';
import Questions from './tools/Questions.jsx';
import PeopleGroup from './tools/PeopleGroup.jsx';
import Connect from './tools/Connect.jsx';
import Day from './tools/Day.jsx';
import Help from './tools/Help.jsx';
import MyData from './tools/MyData.jsx';
import Sunday from './tools/Sunday.jsx';
import Week from './tools/Week.jsx';
import Game from './tools/Game.jsx';
import Quiz from './tools/Quiz.jsx';
import Me from './tools/Me.jsx';
import Rights from './tools/Rights.jsx';
import Growth from './tools/Growth.jsx';
import LivePoll from './tools/LivePoll.jsx';

const NeverPoll = ({ code }) => <LivePoll id="never" code={code} />;
const StaffPoll = ({ code }) => <LivePoll id="staff" code={code} />;
const FirePoll = ({ code }) => <LivePoll id="fire" code={code} />;
const HotPoll = ({ code }) => <LivePoll id="hotpoll" code={code} />;

const People = () => (<><h1>Pray for the unreached</h1><p className="muted">A new people group every day — most in Cambodia, Laos and South-East Asia.</p><PeopleGroup big /></>);

/* church: shown in the public church view; cls: shown to the class. */
export const TOOLS = [
  { id: 'laydown', emoji: '⚖️', title: 'My plan vs God’s plan', sub: 'Money, romance, future, where you live…', C: LayDown, church: true, cls: true },
  { id: 'wheel', emoji: '🎯', title: 'Heart, Soul, Mind & Strength', sub: 'Your wheel of life', C: Wheel, church: true, cls: true },
  { id: 'notso', emoji: '✋', title: '“Not so, Lord”', sub: 'A reflection', C: NotSo, church: true },
  { id: 'hot', emoji: '🔥', title: 'Stay HOT', sub: 'Honesty check + mentor map', C: Hot, cls: true, more: true },
  { id: 'scroll', emoji: '📜', title: 'My Scroll', sub: 'What God is calling you to', C: Scroll, cls: true, more: true },
  { id: 'godthing', emoji: '🧪', title: 'God thing or good thing?', sub: 'Weigh a decision', C: GodThing, cls: true, more: true },
  { id: 'habits', emoji: '✅', title: 'Daily habits', sub: 'Take-ups, every day', C: Habits, cls: true, more: true },
  { id: 'rights', emoji: '🤲', title: 'Lay down a right', sub: 'Wednesday', C: Rights, cls: true, more: true },
  { id: 'growth', emoji: '🌱', title: 'My 2 · 5 · 10', sub: 'Friday: foundations, change, frontiers', C: Growth, cls: true, more: true },
  { id: 'fire', emoji: '🔥', title: 'Fire or fountain?', sub: 'Wednesday game · James 3', C: FirePoll, cls: true, poll: true, day: 'wed' },
  { id: 'hotpoll', emoji: '🌡️', title: 'Which is hardest?', sub: 'Live poll · humble, open, transparent', C: HotPoll, cls: true, poll: true, day: 'wed' },
  { id: 'never', emoji: '🙅', title: '“Never, Lord”', sub: 'Live class poll · no names', C: NeverPoll, cls: true, poll: true },
  { id: 'staff', emoji: '🪄', title: 'Pick it back up', sub: 'Live class poll · Moses’ staff', C: StaffPoll, cls: true, poll: true },
  { id: 'commit', emoji: '🚩', title: 'Throw-down commitment', sub: 'Friday', C: Commit, cls: true },
  { id: 'questions', emoji: '❓', title: 'Anonymous question box', sub: 'Ask anything', C: Questions, cls: true },
  { id: 'list', emoji: '📝', title: 'My list', sub: 'Lay down / take up', C: List, church: true, cls: true, hidden: true },
  { id: 'people', emoji: '🌏', title: 'People group of the day', sub: 'Pray for the unreached', C: People, church: true, cls: true, more: true },
  { id: 'connect', emoji: '🤝', title: 'Connect', sub: 'Stay in touch', C: Connect, church: true },
  { id: 'quiz', emoji: '😂', title: 'Lordship profile quiz', sub: 'Netflix Martyr or Sahara Saint?', C: Quiz, church: true, cls: true },
  { id: 'game', emoji: '🎲', title: 'Day 1 game', sub: 'Who wrote this? + this or that', C: Game, cls: true },
  { id: 'me', emoji: '🙂', title: 'Me', sub: 'My account', C: Me, cls: true, hidden: true },
  { id: 'week', emoji: '📖', title: 'My Lordship week', sub: 'All I wrote, to share or print', C: Week, cls: true, more: true },
  { id: 'data', emoji: '💾', title: 'Save my work', sub: 'Back up with a code', C: MyData, church: true, cls: true, hiddenCls: true },
  { id: 'help', emoji: '💛', title: 'Need to talk to someone?', sub: 'Help, now', C: Help, church: true, cls: true, hidden: true },
  { id: 'screen', emoji: '📽️', title: 'Sunday screen', sub: 'For the projector', C: Sunday, church: true, hidden: true, bare: true }
];

export default { ...TEACHING, DAYS, TOOLS, Day };
