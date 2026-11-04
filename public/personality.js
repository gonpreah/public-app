/*  Personality types — YWAM GP's own questionnaire, types, avatars and tips.

    The four preference pairs (Energy E/I, Information S/N, Decisions T/F,
    Structure J/P) and the sixteen four-letter codes are the same ones people
    know from Myers–Briggs, and those ideas are Jung's and long in the public
    domain. EVERYTHING ELSE here is written for this app: the forty statements,
    the type names, the descriptions, the tips and the avatars.

    That line matters and is easy to cross by accident. The official MBTI®
    questionnaire is copyrighted and "Myers-Briggs" and "MBTI" are trademarks of
    The Myers-Briggs Company; 16Personalities' test, their type names (the ones
    ending in -ist, -ate, -er …), their descriptions and their character art are
    theirs. Do not paste any of it in here, however close a match it looks — the
    screen may LOOK like theirs (a coloured group, a friendly character, a row
    of agree/disagree circles), but the words and pictures must stay ours.

    Plain script, no modules, like jobfocus.js: teams.html loads it with a
    <script> tag and reads the globals. Every string a person reads goes
    through t() at the point it is drawn, so it can be translated without
    touching this file (Khmer lives in km.js, split REVIEWED/PENDING as ever). */

/* ---------- the four groups ---------- */
/* color fills (avatars, bars, badges); ink is the same hue dark enough to be
   TEXT on the tint or on a card — the bright marigold is under 3:1 as text.
   Grouped by the middle two letters — what someone notices (S/N) and how they
   decide or relate (T/F for intuitives, J/P for sensors). The grouping itself is
   an old public idea; the names and colours are ours. */
var GP_PGROUPS = {
  minds:   { id: 'minds',   name: 'Minds',   blurb: 'Big-picture thinkers who love ideas, systems and getting things right.', color: '#7B4FA0', tint: '#EFE6F6', ink: '#5B3482' },
  hearts:  { id: 'hearts',  name: 'Hearts',  blurb: 'People-first idealists who see potential and care about meaning.',     color: '#1F8A6F', tint: '#E2F3EE', ink: '#11604D' },
  anchors: { id: 'anchors', name: 'Anchors', blurb: 'Steady, faithful people who hold a team together with care and order.', color: '#2D6CB0', tint: '#E3EDF8', ink: '#1D4C82' },
  movers:  { id: 'movers',  name: 'Movers',  blurb: 'Practical, present people who jump in and make things happen.',          color: '#C9800F', tint: '#FBF0DC', ink: '#7A4A04' }
};
function gpPGroupOf(type) {
  type = String(type || '');
  if (type.length !== 4) return null;
  var n = type.charAt(1) === 'N';
  if (n) return GP_PGROUPS[type.charAt(2) === 'T' ? 'minds' : 'hearts'];
  return GP_PGROUPS[type.charAt(3) === 'J' ? 'anchors' : 'movers'];
}

/* ---------- the sixteen types ---------- */
var GP_PTYPES = {
  INTJ: { name: 'Strategist', tagline: 'Sees the long road and plans the route.',
    about: 'Strategists think in years, not days. They see where things are heading, notice what will not work long before anyone else does, and quietly build a plan to get somewhere better. They are independent, driven and hard to rattle, and they would much rather do a few things excellently than many things halfway.',
    strengths: ['Sees the big picture and plans ahead', 'Honest and clear about what needs to change', 'Keeps high standards and follows through'],
    watch: ['Can seem cold or critical when focused', 'May forget to explain the plan to everyone else', 'Can get impatient with people who move slowly'],
    workWith: ['Give them the goal and the room to work out the route.', 'Bring them a problem early — they would rather plan than rescue.'] },
  INTP: { name: 'Thinker', tagline: 'Asks why until the answer holds together.',
    about: 'Thinkers want to understand how things really work. They question assumptions, spot the flaw in an argument, and love a problem nobody has solved yet. Quiet and curious, they often have their best ideas alone, and they are happiest when they have time to think something all the way through.',
    strengths: ['Solves hard problems in fresh ways', 'Fair-minded and open to any good idea', 'Calm and objective under pressure'],
    watch: ['Can get lost in ideas and lose track of deadlines', 'May leave feelings unspoken or unnoticed', 'Can find routine tasks draining'],
    workWith: ['Ask for their thinking, not just their agreement.', 'Help them turn a good idea into a next step with a date on it.'] },
  ENTJ: { name: 'Director', tagline: 'Turns a vision into a plan and a plan into action.',
    about: 'Directors are natural leaders who see what could be done and organize people to do it. They are decisive, confident and energized by a challenge. They make hard calls, set clear goals and push the team forward, and they are at their best when there is something big to build.',
    strengths: ['Decisive and clear in a crisis', 'Organizes people and resources well', 'Brings energy and ambition to a team'],
    watch: ['Can push too hard and leave people behind', 'May decide before everyone has been heard', 'Can come across as blunt or demanding'],
    workWith: ['Be direct — they respect people who speak plainly.', 'Tell them how the team is feeling; they may not have noticed.'] },
  ENTP: { name: 'Innovator', tagline: 'Finds a new way through every old problem.',
    about: 'Innovators love new ideas and the debate that sharpens them. Quick-witted and curious, they see possibilities everywhere and enjoy questioning the way things have always been done. They bring energy to a brainstorm and are brilliant at finding a way around a problem that has everyone else stuck.',
    strengths: ['Creative and quick at finding solutions', 'Brings energy and humour to the team', 'Adapts easily when things change'],
    watch: ['Starts many things and finishes fewer', 'Can argue for fun and upset people without meaning to', 'May find details and routine boring'],
    workWith: ['Give them a real problem to crack, not just a task list.', 'Pair them with someone who loves to finish things.'] },
  INFJ: { name: 'Guide', tagline: 'Quietly sees who people could become.',
    about: 'Guides combine deep care for people with a clear sense of purpose. They notice what others are feeling, often before it is said, and they have a gift for helping people grow. Quiet but determined, they are driven by values and meaning, and they want their work to make a real difference in people\'s lives.',
    strengths: ['Deep insight into people', 'Committed to what is right and meaningful', 'Encourages others to grow'],
    watch: ['Takes on other people\'s burdens and burns out', 'Can be too hard on themselves', 'May hold back concerns to keep the peace'],
    workWith: ['Give them time to think before asking for an answer.', 'Check in on how they are doing — they rarely say when they are tired.'] },
  INFP: { name: 'Dreamer', tagline: 'Lives by deep values and hopes for a better world.',
    about: 'Dreamers are gentle, sincere people with a strong inner sense of right and wrong. They care deeply about people and about living with integrity. Creative and imaginative, they see the good in others and hope for a better world, and they give their whole heart to work that matters to them.',
    strengths: ['Compassionate and genuinely kind', 'Creative and full of imagination', 'Loyal to people and to their values'],
    watch: ['Takes criticism very personally', 'Can struggle with practical details and deadlines', 'May withdraw instead of addressing conflict'],
    workWith: ['Show them why the work matters, not just what to do.', 'Give feedback gently and in private.'] },
  ENFJ: { name: 'Encourager', tagline: 'Draws people together and calls out their best.',
    about: 'Encouragers are warm, inspiring people who bring out the best in those around them. They notice what each person needs, speak life into them, and naturally gather people around a shared purpose. They are at home leading, teaching and mentoring, and a team feels more united when they are in it.',
    strengths: ['Builds unity and team spirit', 'Speaks encouragement and vision', 'Reads people and situations well'],
    watch: ['Can overcommit to helping everyone', 'Takes it hard when people are unhappy with them', 'May neglect their own needs'],
    workWith: ['Thank them — encouragement fuels them too.', 'Help them say no to the extra thing.'] },
  ENFP: { name: 'Spark', tagline: 'Brings joy, ideas and possibility into the room.',
    about: 'Sparks are enthusiastic, creative people who light up a room. They love people, new ideas and new experiences, and they see possibility everywhere. They connect easily with almost anyone and bring warmth and hope to a team, especially when something new is starting.',
    strengths: ['Enthusiastic and full of ideas', 'Connects easily with all kinds of people', 'Brings hope and energy to a team'],
    watch: ['Gets distracted by the next exciting thing', 'Can find routine and follow-through hard', 'May overpromise and feel overwhelmed'],
    workWith: ['Let them start things and bring others in.', 'Agree on one or two things they will finish this week.'] },
  ISTJ: { name: 'Steward', tagline: 'Faithful with the details, dependable to the end.',
    about: 'Stewards are responsible, careful people who do what they say they will do. They respect order, keep good records and make sure things are done properly. Practical and loyal, they are the ones a team relies on to keep the basics running well — quietly, faithfully and without needing to be thanked.',
    strengths: ['Reliable and faithful with responsibility', 'Careful with details, money and records', 'Calm, steady and practical'],
    watch: ['Can resist change even when it is needed', 'May seem rigid about rules and process', 'Can keep stress inside until it builds up'],
    workWith: ['Explain changes early and give reasons.', 'Tell them clearly what is expected and by when.'] },
  ISFJ: { name: 'Carer', tagline: 'Serves quietly and remembers what matters to people.',
    about: 'Carers are warm, humble people who love to look after others. They remember the small details — someone\'s birthday, how they like their coffee, what they were worried about last week. Faithful and hardworking, they serve without fuss, and people feel safe and cared for around them.',
    strengths: ['Kind, patient and attentive', 'Faithful and hardworking', 'Remembers what matters to people'],
    watch: ['Finds it hard to say no', 'May not speak up about their own needs', 'Can feel unappreciated and quietly tired'],
    workWith: ['Notice and thank them for the unseen work.', 'Ask directly what they need — they will not always say.'] },
  ESTJ: { name: 'Organizer', tagline: 'Brings order, clear roles and follow-through.',
    about: 'Organizers are practical, decisive people who like things done well and on time. They set clear expectations, create structure and make sure everyone knows their part. Honest and hardworking, they get projects finished and keep a team moving when things could easily fall apart.',
    strengths: ['Organizes people and tasks well', 'Clear, honest and dependable', 'Gets things finished on time'],
    watch: ['Can be controlling or impatient', 'May miss how others are feeling', 'Can find it hard to adapt when plans change'],
    workWith: ['Be clear, prepared and on time.', 'Share the reasons behind a change, not just the change.'] },
  ESFJ: { name: 'Host', tagline: 'Makes everyone feel welcome and looked after.',
    about: 'Hosts are caring, sociable people who make a place feel like home. They notice who is left out, bring people together and make sure everyone has what they need. Loyal and practical, they love serving others and help a community stay warm, connected and well organized.',
    strengths: ['Welcoming and hospitable', 'Practical in caring for people', 'Builds harmony and belonging'],
    watch: ['Worries a lot about what others think', 'May avoid hard conversations', 'Can take on too much to keep everyone happy'],
    workWith: ['Show appreciation — it means a lot to them.', 'Include them in plans that affect people.'] },
  ISTP: { name: 'Fixer', tagline: 'Calm, hands-on and good in a crisis.',
    about: 'Fixers are practical, independent people who like to understand how things work and make them work better. Calm under pressure, they stay steady when others panic and are often the first to find a practical solution. They learn by doing and prefer action to long discussion.',
    strengths: ['Calm and capable in a crisis', 'Practical and good with their hands', 'Independent and adaptable'],
    watch: ['Can seem distant or hard to read', 'May dislike long meetings and heavy planning', 'Can take risks without telling others'],
    workWith: ['Give them a real problem and let them get on with it.', 'Keep meetings short and practical.'] },
  ISFP: { name: 'Artist', tagline: 'Gentle, present, and quietly creative.',
    about: 'Artists are gentle, sensitive people who notice beauty and live in the present moment. They express themselves through what they make and do more than through words. Warm and accepting, they care deeply about people, and they bring kindness and creativity to a team without needing the spotlight.',
    strengths: ['Kind and accepting of others', 'Creative and practical', 'Flexible and easy to work with'],
    watch: ['Can avoid conflict until it is too late', 'May struggle with long-term planning', 'Can feel hurt but not say so'],
    workWith: ['Give them freedom in how they do the work.', 'Ask for their opinion — they may not offer it.'] },
  ESTP: { name: 'Trailblazer', tagline: 'Jumps in, takes risks and gets things moving.',
    about: 'Trailblazers are bold, energetic people who love action. They think fast, read a situation quickly and are happy to try something new while others are still discussing it. Practical and confident, they bring momentum to a team and are at their best in the middle of things.',
    strengths: ['Quick to act and solve problems', 'Confident and persuasive', 'Adapts easily to change'],
    watch: ['Can act before thinking it through', 'May get bored with routine and details', 'Can be blunt without meaning harm'],
    workWith: ['Give them something to do, not just something to discuss.', 'Talk through the risks together before they launch.'] },
  ESFP: { name: 'Energizer', tagline: 'Lights up the room and lives in the moment.',
    about: 'Energizers are fun, warm and spontaneous. They love people, enjoy life and have a gift for making others feel welcome and happy. They are practical helpers who notice what someone needs right now, and a team is more joyful and more connected when they are around.',
    strengths: ['Brings joy and energy to a team', 'Warm, generous and practical', 'Great with people and new situations'],
    watch: ['Can avoid planning ahead', 'May find serious or slow tasks hard', 'Can struggle with long-term commitments'],
    workWith: ['Let them bring energy to events and welcoming.', 'Help them plan the next step before the excitement fades.'] }
};
var GP_PTYPE_CODES = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
function gpPIsType(code) { return GP_PTYPE_CODES.indexOf(String(code || '')) > -1; }

/* ---------- the four pairs, as they read on the result bars ---------- */
var GP_PAXES = [
  { id: 'E', label: 'Energy',      a: 'E', aName: 'Extraverted', b: 'I', bName: 'Introverted' },
  { id: 'S', label: 'Information', a: 'S', aName: 'Sensing',     b: 'N', bName: 'Intuitive' },
  { id: 'T', label: 'Decisions',   a: 'T', aName: 'Thinking',    b: 'F', bName: 'Feeling' },
  { id: 'J', label: 'Structure',   a: 'J', aName: 'Judging',     b: 'P', bName: 'Perceiving' }
];

/* ---------- the questionnaire ---------- */
/* Forty statements, ten per pair, five keyed each way so nobody scores high
   just by agreeing with everything. Interleaved so the pairs never run in a
   block. Plain words on purpose: they have to survive translation into Khmer
   and still mean the same thing to someone reading them on a phone.
   key: the letter that AGREEING moves you toward. */
var GP_PQUESTIONS = [
  { id: 'q1',  key: 'E', text: 'I get energy from being around lots of people.' },
  { id: 'q2',  key: 'S', text: 'I trust what I have seen and done more than new ideas.' },
  { id: 'q3',  key: 'T', text: 'When I decide, logic matters more to me than feelings.' },
  { id: 'q4',  key: 'J', text: 'I like to plan my week in advance.' },
  { id: 'q5',  key: 'I', text: 'After a busy day with people, I need quiet time alone to recharge.' },
  { id: 'q6',  key: 'N', text: 'I often imagine how things could be in the future.' },
  { id: 'q7',  key: 'F', text: 'I think about how a decision will affect people\'s feelings.' },
  { id: 'q8',  key: 'P', text: 'I prefer to keep my options open rather than decide early.' },
  { id: 'q9',  key: 'E', text: 'I usually think best by talking things through out loud.' },
  { id: 'q10', key: 'S', text: 'I like clear, practical instructions.' },
  { id: 'q11', key: 'T', text: 'I can give honest criticism even when it is uncomfortable.' },
  { id: 'q12', key: 'J', text: 'I feel uneasy when plans change at the last minute.' },
  { id: 'q13', key: 'I', text: 'I prefer to think carefully before I speak in a group.' },
  { id: 'q14', key: 'N', text: 'I enjoy talking about ideas and possibilities, even if they are not practical yet.' },
  { id: 'q15', key: 'F', text: 'Keeping peace in the team is very important to me.' },
  { id: 'q16', key: 'P', text: 'I often do my best work close to a deadline.' },
  { id: 'q17', key: 'E', text: 'I enjoy meeting new people and starting conversations.' },
  { id: 'q18', key: 'S', text: 'I notice details that other people miss.' },
  { id: 'q19', key: 'T', text: 'Being fair and consistent matters more to me than making exceptions.' },
  { id: 'q20', key: 'J', text: 'I like to finish one task before starting another.' },
  { id: 'q21', key: 'I', text: 'I would rather have a few deep friendships than many casual ones.' },
  { id: 'q22', key: 'N', text: 'I see patterns and connections that others don\'t see.' },
  { id: 'q23', key: 'F', text: 'I easily feel what other people are feeling.' },
  { id: 'q24', key: 'P', text: 'I am comfortable not knowing exactly what will happen tomorrow.' },
  { id: 'q25', key: 'E', text: 'At a gathering, I talk with many different people.' },
  { id: 'q26', key: 'S', text: 'I would rather improve something that works than try something untested.' },
  { id: 'q27', key: 'T', text: 'I enjoy a good debate to find the best answer.' },
  { id: 'q28', key: 'J', text: 'My room or workspace is usually tidy and organized.' },
  { id: 'q29', key: 'I', text: 'I often enjoy working on my own more than in a group.' },
  { id: 'q30', key: 'N', text: 'I get bored doing the same task the same way every time.' },
  { id: 'q31', key: 'F', text: 'I find it hard to say no when someone asks me for help.' },
  { id: 'q32', key: 'P', text: 'I enjoy being spontaneous.' },
  { id: 'q33', key: 'E', text: 'Being alone for a long time leaves me restless.' },
  { id: 'q34', key: 'S', text: 'I remember facts and specific experiences well.' },
  { id: 'q35', key: 'T', text: 'In a conflict, I focus on the facts more than on people\'s emotions.' },
  { id: 'q36', key: 'J', text: 'I like making lists and ticking things off.' },
  { id: 'q37', key: 'I', text: 'People sometimes have to ask me what I am thinking.' },
  { id: 'q38', key: 'N', text: 'I often read between the lines to find the deeper meaning.' },
  { id: 'q39', key: 'F', text: 'I make decisions based on my values and what feels right.' },
  { id: 'q40', key: 'P', text: 'Rules and routines can feel limiting to me.' }
];
/* Which pair each key letter belongs to, and which side of it. */
var GP_PKEY = { E: ['E', 1], I: ['E', -1], S: ['S', 1], N: ['S', -1], T: ['T', 1], F: ['T', -1], J: ['J', 1], P: ['J', -1] };

/* Answers are -3 (strongly disagree) … +3 (strongly agree), one per question id.
   Returns { type, scores } where scores[axis] is the percentage toward that
   pair's FIRST letter (E, S, T, J). A dead-even 50 goes to the second letter —
   an arbitrary rule, but a fixed one, so the same answers always give the same
   type. Returns null until every question has an answer: a type built on gaps
   is a guess wearing a result's clothes. */
function gpPScore(answers) {
  answers = answers || {};
  var sum = { E: 0, S: 0, T: 0, J: 0 }, max = { E: 0, S: 0, T: 0, J: 0 };
  for (var i = 0; i < GP_PQUESTIONS.length; i++) {
    var q = GP_PQUESTIONS[i];
    var v = Number(answers[q.id]);
    if (answers[q.id] === undefined || answers[q.id] === null || isNaN(v) || v < -3 || v > 3) return null;
    var k = GP_PKEY[q.key];
    sum[k[0]] += v * k[1];
    max[k[0]] += 3;
  }
  var scores = {}, type = '';
  GP_PAXES.forEach(function (ax) {
    var pct = Math.round(50 + (sum[ax.id] / max[ax.id]) * 50);
    scores[ax.id] = pct;
    type += pct > 50 ? ax.a : ax.b;
  });
  return { type: type, scores: scores };
}

/* ---------- where someone works ---------- */
/* The same type shows up differently in a café, a lecture room and a finance
   office, so the tips follow the kind of work a ministry is. Keyed by ministry
   first, then department, so a new ministry still lands somewhere sensible. */
var GP_PJOB = {
  people: 'front-line work with people all day',
  teach:  'teaching and discipling in a school',
  lead:   'leading people and the base',
  order:  'money, systems and details',
  hands:  'practical, hands-on service',
  create: 'creative work — media and worship',
  pray:   'prayer and intercession'
};
var GP_PJOB_BY_MINISTRY = {
  'Outreach Teams': 'people', 'Cafe': 'people', 'Evangelism': 'people', 'Church Partnerships': 'people',
  'Sports': 'people', 'Sry Noi': 'people', 'LTN': 'people',
  'GP Education': 'teach', 'Ponlork School': 'teach', 'YDC': 'teach',
  'GPDTS': 'teach', 'DBS': 'teach', 'SMS': 'teach', 'BCS': 'teach', 'SOMD': 'teach',
  'Intercession': 'pray',
  'GP Media': 'create', 'Worship': 'create',
  'Finances': 'order',
  'Hospitality': 'hands', 'Technical': 'hands', 'Culinary': 'hands'
};
var GP_PJOB_BY_DEPT = {
  'Community Service': 'people', 'Youth Education': 'people', 'Leadership Development': 'teach',
  'Skills Training': 'hands', 'Campus Leadership': 'lead'
};
function gpPJobOf(dept, ministry) {
  if (dept === 'Campus Leadership') return 'lead';
  return GP_PJOB_BY_MINISTRY[ministry] || GP_PJOB_BY_DEPT[dept] || 'people';
}

/* One tip per letter where that preference meets that kind of work in a way
   worth saying out loud. Not every pair has one — only the ones that matter. */
var GP_PJOB_TIPS = {
  people: {
    I: 'Your work is people all day. Plan real quiet time to recharge — it is not selfish, it is how you keep giving.',
    E: 'You are made for this kind of work. Just make sure the quieter people get heard too.',
    T: 'People here need warmth before solutions. Ask how someone is before you fix the problem.',
    F: 'You will feel people\'s struggles deeply. Share the weight with your team and your mentor.',
    J: 'People rarely run on schedule. Plan, but leave space for the conversation that could not wait.',
    P: 'Your flexibility is a gift here. Write down what you promised so nobody falls through the cracks.'
  },
  teach: {
    I: 'Teaching uses up your energy fast. Protect your preparation time and your recovery time.',
    E: 'Leave space in class for others to think and answer — silence can be where learning happens.',
    N: 'Your big ideas inspire students. Add examples and practical steps so everyone can follow.',
    S: 'Your clear, practical teaching helps people. Remember to share the why, not only the how.',
    T: 'Correct gently. Students need to feel safe with you before they can hear hard feedback.',
    F: 'You will care about every student. You cannot carry all of them — trust God and the team.'
  },
  lead: {
    I: 'People may not know what you are thinking. Say your thoughts and your appreciation out loud.',
    E: 'Before you decide, ask the quiet people in the room what they think.',
    N: 'Keep sharing the vision, and pair it with a clear next step for this week.',
    S: 'Your steadiness helps the base. Make room for people who see new possibilities.',
    T: 'Your clear decisions help. Explain them with care — people remember how they were treated.',
    F: 'You will want everyone happy. Some decisions are still right when they are hard.',
    J: 'Your plans give people security. Hold them loosely when God or the situation changes them.',
    P: 'Your flexibility keeps the base agile. Make sure decisions are written down and followed up.'
  },
  order: {
    N: 'Details can feel draining for you. Build simple checklists so the important things are never missed.',
    S: 'You are good with detail. Step back sometimes to explain the bigger picture to others.',
    T: 'Your accuracy protects the base. Soften how you point out other people\'s mistakes.',
    F: 'Saying no about money can feel hard. Remember that clear rules protect people too.',
    P: 'Set a regular time each week for records and receipts, so they never pile up.'
  },
  hands: {
    I: 'You may prefer to work quietly. Let people know what you did, so they can thank you and help.',
    N: 'Practical work can feel repetitive. Look for small ways to improve how it is done.',
    F: 'Your service is love in action. Ask for help before you are exhausted.',
    J: 'Unexpected jobs will come up. Leave a little room in your day for them.',
    P: 'You are great at handling what comes up. Keep a short list so the regular jobs still get done.'
  },
  create: {
    J: 'Creative work does not always fit a schedule. Plan the deadline, not every step on the way to it.',
    P: 'Ideas flow easily for you. Agree on deadlines early so the work gets finished and shared.',
    S: 'Your eye for detail makes the work excellent. Share drafts early instead of waiting for perfect.',
    F: 'Feedback on your work can feel personal. It is about the work, not about you.',
    T: 'Remember the people the work is for — let it move hearts as well as minds.'
  },
  pray: {
    E: 'You may pray best out loud and with others. Find a prayer partner as well as quiet time.',
    I: 'Long quiet prayer suits you. Share what you are sensing — the team needs to hear it.',
    N: 'You may sense big themes in prayer. Test them with others and keep them grounded.',
    F: 'You will carry people\'s pain in prayer. Remember to give it to God and not hold it yourself.',
    J: 'A prayer rhythm helps you. Leave room for the Spirit to change the plan.'
  }
};

/* ---------- the season someone is in ---------- */
/* Picked by the person — the app cannot know whether a school has started or
   someone is carrying something heavy. Kept private to them: a season is how
   they are doing, and that is not a directory fact. */
var GP_PSEASONS = [
  { id: 'ordinary',   name: 'Ordinary rhythm',     blurb: 'Normal weeks on base.' },
  { id: 'school',     name: 'A school is running', blurb: 'Lecture phase — teaching and pastoral care are heavy.' },
  { id: 'outreach',   name: 'Outreach',            blurb: 'Travel, change and living as a team.' },
  { id: 'transition', name: 'Between seasons',     blurb: 'Debriefing, planning and changing roles.' },
  { id: 'holidays',   name: 'Holidays & hosting',  blurb: 'Khmer New Year, Pchum Ben, Christmas, visitors.' },
  { id: 'stretched',  name: 'A stretched season',  blurb: 'Tired, under pressure, or carrying something heavy.' }
];
var GP_PSEASON_TIPS = {
  ordinary: {
    all: 'A good week to build habits that will carry you through busier seasons.',
    J: 'Use the calm to plan ahead — the next busy season will be easier for it.',
    P: 'Try one new idea while you have the space for it.'
  },
  school: {
    all: 'The students need you. So does your own soul — keep your own time with God.',
    I: 'Students will want your time constantly. Plan an hour a day that is yours.',
    E: 'You may love this season. Watch that you still rest on your day off.',
    F: 'Pastoral needs will be heavy. You are not everyone\'s counselor — refer people on when you need to.',
    T: 'Students can be fragile in this season. Lead with encouragement, then correction.'
  },
  outreach: {
    all: 'Outreach tests everyone. Grace for your team — and for yourself.',
    I: 'There is little time alone on outreach. Protect twenty quiet minutes a day.',
    E: 'You will bring energy to the team. Notice who needs a quieter day.',
    J: 'Plans change daily on outreach. Decide the one or two things that must happen, and hold the rest loosely.',
    P: 'You will adapt well. Help the planners on the team by confirming details early.',
    S: 'Unfamiliar places can wear you down. Keep a few small routines that feel like home.',
    N: 'Your ideas can inspire the team. Make sure everyone understands the plan for today.'
  },
  transition: {
    all: 'Endings and beginnings are both hard. Take time to reflect and to grieve what is finishing.',
    J: 'Not having a clear plan yet may unsettle you. Write down what you do know.',
    P: 'You may enjoy the open space. Set a few deadlines so the next season actually starts.',
    S: 'Change can feel unsettling. Hold on to what is staying the same.',
    N: 'You may already be dreaming about what is next. Finish this season well first.'
  },
  holidays: {
    all: 'Rest is part of the rhythm God gave us. Enjoy it without guilt.',
    I: 'Holidays can mean more people, not fewer. Plan quiet time within the celebrations.',
    E: 'Enjoy the gatherings. Rest still counts, even when you love being with people.',
    F: 'Family time can bring up feelings. Be kind to yourself.',
    J: 'Holidays rarely go to plan. Choose what matters most and let the rest go.'
  },
  stretched: {
    all: 'Tell your mentor how you are really doing. This season will not last forever.',
    I: 'Under stress you may pull away. Let at least one person in.',
    E: 'Under stress you may keep busy so you do not have to stop. Make space to stop.',
    S: 'Under stress you may fix small details instead of the real problem. Name the real problem.',
    N: 'Under stress you may imagine the worst. Write down what is actually true.',
    T: 'Under stress you may become harsh or critical. Be gentle with people, and with yourself.',
    F: 'Under stress you may take everything personally. Not every problem is yours to carry.',
    J: 'Under stress you may try to control more. Let go of one thing this week.',
    P: 'Under stress you may avoid decisions. Make one small decision today.'
  }
};

/* The "for you, right now" list: the season's own line, then the tips where a
   letter of this person's type meets their season and their work. Capped, so it
   reads as advice rather than a lecture. */
function gpPTipsFor(type, job, season) {
  if (!gpPIsType(type)) return [];
  var letters = type.split('');
  var out = [];
  var st = GP_PSEASON_TIPS[season] || GP_PSEASON_TIPS.ordinary;
  if (st.all) out.push({ kind: 'season', text: st.all });
  letters.forEach(function (l) { if (st[l]) out.push({ kind: 'season', text: st[l] }); });
  var jt = GP_PJOB_TIPS[job] || {};
  letters.forEach(function (l) { if (jt[l]) out.push({ kind: 'job', text: jt[l] }); });
  /* season lines first (they change with time), then the job, at most five */
  return out.slice(0, 5);
}

/* ---------- the avatars ---------- */
/* A small flat character, drawn from parts: the group sets the colour, the sex
   sets the hair and outfit cut, and the type picks a hairstyle and the object
   in the badge. Thirty-two different people from about forty shapes, all ours.
   Returns an SVG string; size is the rendered width in px. */
var GP_PPROPS = {
  INTJ: 'compass', INTP: 'magnifier', ENTJ: 'flag', ENTP: 'bulb',
  INFJ: 'flame', INFP: 'flower', ENFJ: 'heart', ENFP: 'star',
  ISTJ: 'key', ISFJ: 'cup', ESTJ: 'check', ESFJ: 'house',
  ISTP: 'wrench', ISFP: 'brush', ESTP: 'bolt', ESFP: 'note'
};
function gpPShade(hex, amt) {
  var n = parseInt(hex.slice(1), 16);
  var r = Math.max(0, Math.min(255, (n >> 16) + amt));
  var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  var b = Math.max(0, Math.min(255, (n & 255) + amt));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function gpPPropSvg(prop, c) {
  /* each drawn in a 24x24 box, centred on (12,12) */
  var s = 'fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  var f = 'fill="' + c + '"';
  switch (prop) {
    case 'compass':   return '<circle cx="12" cy="12" r="8" ' + s + '/><path d="M12 6l2.5 6-2.5 6-2.5-6z" ' + f + '/>';
    case 'magnifier': return '<circle cx="10.5" cy="10.5" r="5.5" ' + s + '/><path d="M15 15l5 5" ' + s + '/>';
    case 'flag':      return '<path d="M6 21V4" ' + s + '/><path d="M6 4h11l-2.5 4 2.5 4H6" ' + f + '/>';
    case 'bulb':      return '<path d="M9 17h6M10 20h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" ' + s + '/>';
    case 'flame':     return '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2.3-4.8.3 1.4 1 2.2 1.9 2.6C11 8.3 11.6 5.4 12 3z" ' + f + '/>';
    case 'flower':    return '<circle cx="12" cy="7" r="3" ' + f + '/><circle cx="7" cy="11" r="3" ' + f + '/><circle cx="17" cy="11" r="3" ' + f + '/><circle cx="9" cy="16" r="3" ' + f + '/><circle cx="15" cy="16" r="3" ' + f + '/><circle cx="12" cy="12" r="2.4" fill="#fff"/>';
    case 'heart':     return '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" ' + f + '/>';
    case 'star':      return '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" ' + f + '/>';
    case 'key':       return '<circle cx="8" cy="12" r="4" ' + s + '/><path d="M12 12h9M18 12v3M21 12v2" ' + s + '/>';
    case 'cup':       return '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" ' + f + '/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" ' + s + '/><path d="M9 3.5c.8 1 .8 2 0 3M12.5 3.5c.8 1 .8 2 0 3" ' + s + '/>';
    case 'check':     return '<rect x="5" y="4" width="14" height="17" rx="2" ' + s + '/><path d="M9 12.5l2.2 2.2L15.5 10" ' + s + '/>';
    case 'house':     return '<path d="M4 11.5L12 5l8 6.5V20H4z" ' + f + '/><rect x="10" y="14" width="4" height="6" fill="#fff"/>';
    case 'wrench':    return '<path d="M15.5 3.5a5 5 0 0 0-4.8 6.4L4 16.6a2.1 2.1 0 1 0 3 3l6.7-6.7a5 5 0 0 0 6.4-4.8l-3 3-3-.6-.6-3z" ' + f + '/>';
    case 'brush':     return '<path d="M18.5 4.5l1 1-8 8-1-1z" ' + f + '/><path d="M9.5 14c-2 0-3.5 1.5-3.5 3.5 0 1-1 2-2 2 3 1.5 7 0 7-3.5" ' + f + '/>';
    case 'bolt':      return '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" ' + f + '/>';
    case 'note':      return '<path d="M9 17V6l10-2v11" ' + s + '/><circle cx="7" cy="17" r="2.5" ' + f + '/><circle cx="17" cy="15" r="2.5" ' + f + '/>';
  }
  return '';
}
/* bare: leave off the badge — for small round frames, where the frame's own
   circle would clip it and a type chip usually sits alongside anyway. */
function gpPAvatar(type, sex, size, bare) {
  var g = gpPGroupOf(type);
  if (!g) return '';
  size = size || 96;
  var idx = GP_PTYPE_CODES.indexOf(type);
  var variant = idx % 4;                         // which of four looks within the group
  var female = sex === 'female';
  var skin = '#D9A273', skinShade = '#C68B5C', hair = '#2A1C15';
  var outfit = gpPShade(g.color, [0, -18, 14, -30][variant]);
  var collar = gpPShade(outfit, 38);
  var uid = 'pa' + type + (female ? 'f' : 'm') + Math.floor(size) + (bare ? 'b' : '');

  var svg = '<svg class="pAvatar" width="' + size + '" height="' + size + '" viewBox="0 0 100 100" role="img" aria-label="' + type + '">';
  svg += '<defs><clipPath id="' + uid + '"><circle cx="50" cy="50" r="50"/></clipPath></defs>';
  svg += '<g clip-path="url(#' + uid + ')">';
  svg += '<circle cx="50" cy="50" r="50" fill="' + g.tint + '"/>';
  svg += '<circle cx="50" cy="50" r="38" fill="' + gpPShade(g.tint, -14) + '" opacity=".55"/>';

  /* long hair sits behind the head and shoulders */
  if (female && (variant === 0 || variant === 2)) {
    svg += '<path d="M29 44c0-14 9-24 21-24s21 10 21 24v24c0 5-6 8-21 8s-21-3-21-8z" fill="' + hair + '"/>';
  }
  /* shoulders and outfit — a rounder neckline for female, a collar for male */
  svg += '<path d="M14 104c0-20 16-31 36-31s36 11 36 31z" fill="' + outfit + '"/>';
  if (female) svg += '<path d="M40 74c3 5 17 5 20 0" fill="none" stroke="' + collar + '" stroke-width="3" stroke-linecap="round"/>';
  else svg += '<path d="M41 73l9 9 9-9" fill="none" stroke="' + collar + '" stroke-width="3" stroke-linejoin="round"/>';
  /* neck and head */
  svg += '<rect x="44" y="58" width="12" height="15" rx="5" fill="' + skinShade + '"/>';
  svg += '<ellipse cx="31.5" cy="45" rx="3.2" ry="4.2" fill="' + skinShade + '"/><ellipse cx="68.5" cy="45" rx="3.2" ry="4.2" fill="' + skinShade + '"/>';
  svg += '<ellipse cx="50" cy="43" rx="18" ry="20" fill="' + skin + '"/>';

  /* hair on top */
  if (female) {
    if (variant === 0) svg += '<path d="M31 40c1-12 9-19 19-19s18 7 19 19c-7-2-13-6-17-11-4 6-12 10-21 11z" fill="' + hair + '"/>';
    if (variant === 1) svg += '<circle cx="50" cy="19" r="8" fill="' + hair + '"/><path d="M31 41c0-12 8-20 19-20s19 8 19 20c-5-5-12-8-19-8s-14 3-19 8z" fill="' + hair + '"/>';
    if (variant === 2) svg += '<path d="M31 42c0-13 8-21 19-21s19 8 19 21c-4-6-10-9-14-9-3 3-9 6-24 9z" fill="' + hair + '"/>';
    if (variant === 3) svg += '<path d="M29 58c-3-22 5-37 21-37s24 15 21 37c-2 5-5 7-8 7 1-8 1-17-2-24-7 1-17-2-22-8-3 6-4 16-2 32-4 0-7-3-8-7z" fill="' + hair + '"/>';
  } else {
    if (variant === 0) svg += '<path d="M32 38c0-11 8-17 18-17s18 6 18 17c-3-4-8-7-18-7s-15 3-18 7z" fill="' + hair + '"/>';
    if (variant === 1) svg += '<path d="M32 40c-1-12 7-19 18-19 12 0 19 7 18 18-6-1-13-4-17-9-3 5-10 8-19 10z" fill="' + hair + '"/>';
    if (variant === 2) svg += '<g fill="' + hair + '"><circle cx="37" cy="30" r="6"/><circle cx="46" cy="25" r="6.5"/><circle cx="56" cy="25" r="6.5"/><circle cx="64" cy="31" r="6"/><circle cx="33" cy="38" r="4.5"/><circle cx="67" cy="38" r="4.5"/></g>';
    if (variant === 3) svg += '<path d="M32 40c-1-11 5-19 14-21 5-5 16-5 21 1 3 3 3 8 1 12-4-4-10-6-17-6-8 0-14 5-19 14z" fill="' + hair + '"/>';
  }

  /* face */
  svg += '<ellipse cx="43" cy="46" rx="2.2" ry="2.6" fill="' + hair + '"/><ellipse cx="57" cy="46" rx="2.2" ry="2.6" fill="' + hair + '"/>';
  svg += '<circle cx="39" cy="52" r="3" fill="#E98A7A" opacity=".35"/><circle cx="61" cy="52" r="3" fill="#E98A7A" opacity=".35"/>';
  svg += '<path d="M44.5 53.5c3 3 8 3 11 0" fill="none" stroke="' + hair + '" stroke-width="2" stroke-linecap="round"/>';
  /* the Minds get glasses — a small nod to how much they read */
  if (g.id === 'minds' && variant % 2 === 0) {
    svg += '<g fill="none" stroke="' + hair + '" stroke-width="1.6"><circle cx="43" cy="46" r="5"/><circle cx="57" cy="46" r="5"/><path d="M48 46h4"/></g>';
  }
  svg += '</g>';

  /* the badge: what this type tends to carry */
  if (!bare) {
    svg += '<circle cx="80" cy="80" r="15" fill="#fff" stroke="' + g.color + '" stroke-width="2.5"/>';
    svg += '<g transform="translate(68.5 68.5) scale(.96)">' + gpPPropSvg(GP_PPROPS[type], g.color) + '</g>';
  }
  svg += '</svg>';
  return svg;
}
