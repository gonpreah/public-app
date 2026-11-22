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
import Growth from './tools/Growth.jsx';
import Habits from './tools/Habits.jsx';
import Commit from './tools/Commit.jsx';
import Questions from './tools/Questions.jsx';
import PeopleGroup from './tools/PeopleGroup.jsx';
import Connect from './tools/Connect.jsx';
import Day from './tools/Day.jsx';
import Help from './tools/Help.jsx';
import MyData from './tools/MyData.jsx';
import Sunday from './tools/Sunday.jsx';

const People = () => (<><h1>Pray for the unreached</h1><p className="muted">A new people group every day — most in Cambodia, Laos and South-East Asia.</p><PeopleGroup big /></>);

/* church: shown in the public church view; cls: shown to the class. */
export const TOOLS = [
  { id: 'laydown', emoji: '⚖️', title: 'My plan vs God’s plan', sub: 'Money, romance, future, where you live…', C: LayDown, church: true, cls: true },
  { id: 'wheel', emoji: '🎯', title: 'Heart, Soul, Mind & Strength', sub: 'Your wheel of life', C: Wheel, church: true, cls: true },
  { id: 'notso', emoji: '✋', title: '“Not so, Lord”', sub: 'A reflection', C: NotSo, church: true, cls: true },
  { id: 'hot', emoji: '🔥', title: 'Stay HOT', sub: 'Honesty check + mentor map', C: Hot, cls: true },
  { id: 'scroll', emoji: '📜', title: 'My Scroll', sub: 'What God is calling you to', C: Scroll, cls: true },
  { id: 'godthing', emoji: '🧪', title: 'God thing or good thing?', sub: 'Weigh a decision', C: GodThing, cls: true },
  { id: 'growth', emoji: '🌱', title: 'Self-Development Plan', sub: '2, 5 and 10 years', C: Growth, cls: true },
  { id: 'habits', emoji: '✅', title: 'Daily habits', sub: 'Take-ups, every day', C: Habits, cls: true },
  { id: 'commit', emoji: '🚩', title: 'Throw-down commitment', sub: 'Friday', C: Commit, cls: true },
  { id: 'questions', emoji: '❓', title: 'Anonymous question box', sub: 'Ask anything', C: Questions, cls: true },
  { id: 'list', emoji: '📝', title: 'My list', sub: 'Lay down / take up', C: List, church: true, cls: true },
  { id: 'people', emoji: '🌏', title: 'People group of the day', sub: 'Pray for the unreached', C: People, church: true, cls: true },
  { id: 'connect', emoji: '🤝', title: 'Connect', sub: 'Stay in touch', C: Connect, church: true },
  { id: 'data', emoji: '💾', title: 'Save my work', sub: 'Back up with a code', C: MyData, church: true, cls: true },
  { id: 'help', emoji: '💛', title: 'Need to talk to someone?', sub: 'Help, now', C: Help, church: true, cls: true, hidden: true },
  { id: 'screen', emoji: '📽️', title: 'Sunday screen', sub: 'For the projector', C: Sunday, church: true, hidden: true, bare: true }
];

export default { ...TEACHING, DAYS, TOOLS, Day };
