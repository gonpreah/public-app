/*  Lordship: All In, Full of Joy — the teaching's words, kept apart from the screens so
    Uriah and Naomi can edit them in one place. Scripture is the World English Bible
    (public domain), so it can be shown in full. Links marked PLACEHOLDER need filling in. */

export const TEACHING = {
  id: 'lordship',
  title: 'Lordship',
  subtitle: 'All In, Full of Joy',
  by: 'Uriah & Naomi Lyford · GonPreah',
  translation: 'World English Bible (public domain)'
};

/* The week lives in James: one chapter a day (Uriah's Lordship Week slides, Nov 23–27 2026). */
export const WEEK = {
  memory: { ref: 'James 1:22', text: 'But be doers of the word, and not only hearers, deluding your own selves.' },
  anchor: 'This week we live in James: one chapter a day, read together in class. Underline one thing to do.',
  checkin: 'What did you lay down or take up since yesterday?',
  study: [['Say', 'What does it say? Who, what, where. Just the facts.'], ['Mean', 'What did it mean to them? What does it show us about God?'], ['Do', 'What do I do with this today? One honest answer.']]
};

export const DAYS = [
  {
    id: 'mon', dow: 1, name: 'Monday', title: 'Lordship as a Lifestyle', james: 1,
    sticky: 'Lordship doesn’t go away.',
    bigIdea: 'Is Jesus your Lord, or just your Savior? Most of us come to get; his love is so good we end up wanting to give everything back. And what we grumble about shows us what we haven’t surrendered.',
    scripture: [
      { ref: 'James 1:22', text: 'But be doers of the word, and not only hearers, deluding your own selves.' },
      { ref: 'Matthew 7:21', text: 'Not everyone who says to me, ‘Lord, Lord,’ will enter into the Kingdom of Heaven; but he who does the will of my Father who is in heaven.' },
      { ref: 'Ephesians 2:8–9 · James 2:17', text: 'For by grace you have been saved through faith, and that not of yourselves; it is the gift of God, not of works, that no one would boast. … Even so faith, if it has no works, is dead in itself.' },
      { ref: 'Acts 1:8', text: 'But you will receive power when the Holy Spirit has come upon you. You will be witnesses to me in Jerusalem, in all Judea and Samaria, and to the uttermost parts of the earth.' }
    ],
    study: null,
    questions: [
      'Why did you really come — to get, or to give? (Starting at “get” is OK. The disciples did too.)',
      'What’s one thing you’d never want God to ask you to give up?',
      'Where is Jesus already making ripples in your life — me, my community, my nation, the world?',
      'What do you catch yourself grumbling about? What might it show you haven’t surrendered?'
    ],
    listen: 'Jesus, where am I calling you Lord, but not letting you lead?',
    response: 'They weren’t pushed into Lordship; they were loved into it. Let your life line up with what you believe — not works-based, no judging, just your yes.',
    respond: [
      { tool: 'quiz', why: 'Warm up: what’s your Lordship profile? Show your neighbour.' },
      { tool: 'laydown', why: 'Where are my plan and God’s plan rubbing? (Grumbling is the clue.)' }
    ]
  },
  {
    id: 'tue', dow: 2, name: 'Tuesday', title: 'Lazy Lordship', james: 2,
    sticky: 'Plod, don’t sprint.',
    bigIdea: 'Saying yes isn’t the same as going. Lordship is a thousand small yeses on ordinary days — a pace you can keep for 40 years beats an intensity you can keep for 4 weeks.',
    scripture: [
      { ref: 'Matthew 21:28–31', text: '“But what do you think? A man had two sons, and he came to the first, and said, ‘Son, go work today in my vineyard.’ He answered, ‘I will not,’ but afterward he changed his mind, and went. He came to the second, and said the same thing. He answered, ‘I’m going, sir,’ but he didn’t go. Which of the two did the will of his father?” They said to him, “The first.”' },
      { ref: 'Luke 14:28–30', text: '“For which of you, desiring to build a tower, doesn’t first sit down and count the cost, to see if he has enough to complete it? Or perhaps, when he has laid a foundation, and is not able to finish, everyone who sees begins to mock him, saying, ‘This man began to build, and wasn’t able to finish.’”' },
      { ref: 'James 1:2–4', text: 'Count it all joy, my brothers, when you fall into various temptations, knowing that the testing of your faith produces endurance. Let endurance have its perfect work, that you may be perfect and complete, lacking in nothing.' }
    ],
    study: 'Matthew 21:28–31 · Luke 14:28–30',
    questions: [
      'Which son are you more like? Why?',
      'Where have you started something with God and not finished?',
      'What pace could you actually keep for the next 10 years?'
    ],
    listen: 'Holy Spirit, what’s one small step you’re asking of me?',
    response: 'Pick one daily act of obedience — small enough to do tomorrow and the next day — and track it in your habits. Tell your triad what you picked.',
    respond: [
      { tool: 'habits', why: 'Pick one daily act of obedience: 10 minutes in the Word, pray for a people group, encourage someone, say sorry first.' },
      { tool: 'people', why: 'Who will plod for the unreached? Pray for today’s people group.' }
    ]
  },
  {
    id: 'wed', dow: 3, name: 'Wednesday', title: 'Stay HOT · All In', james: 3,
    sticky: 'My grace is sufficient for you.',
    game: 'fire',
    bigIdea: 'Humble, Open, Transparent. If it’s “none of your business”, it’s probably a Lordship area. Hiding weakness doesn’t make us strong; it makes us alone. The goal: secure and teachable.',
    scripture: [
      { ref: 'James 3:2, 10–11', text: 'For in many things we all stumble. … Out of the same mouth comes blessing and cursing. My brothers, these things ought not to be so. Does a spring send out from the same opening fresh and bitter water?' },
      { ref: '1 John 1:7, 9', text: 'But if we walk in the light, as he is in the light, we have fellowship with one another, and the blood of Jesus Christ, his Son, cleanses us from all sin. … If we confess our sins, he is faithful and righteous to forgive us the sins, and to cleanse us from all unrighteousness.' },
      { ref: '2 Corinthians 12:9', text: 'He has said to me, “My grace is sufficient for you, for my power is made perfect in weakness.” Most gladly therefore I will rather glory in my weaknesses, that the power of Christ may rest on me.' },
      { ref: 'James 5:16', text: 'Confess your offenses to one another, and pray for one another, that you may be healed. The insistent prayer of a righteous person is powerfully effective.' },
      { ref: '1 Timothy 1:15', text: 'The saying is faithful and worthy of all acceptance, that Christ Jesus came into the world to save sinners; of whom I am chief.' }
    ],
    study: '1 John 1:5–9 · 2 Corinthians 12:9–10',
    questions: [
      'What area would you least want someone to ask about? (You don’t have to name it — just notice it.)',
      'Who knows your real struggles?',
      'How do you react to feedback, and where did you learn that?'
    ],
    listen: 'Holy Spirit, who are you inviting me to let in?',
    response: 'Draw your mentor map: a Paul ahead of you, a Barnabas beside you, a Timothy you pour into. Circle one name to invite in this month.',
    respond: [
      { tool: 'fire', why: 'Morning game: do these words burn or build? (James 3)' },
      { tool: 'hotpoll', why: 'Which is hardest for you: humble, open or transparent? No names.' },
      { tool: 'prone', why: 'Private: “I’m prone to…”, the new-creation verse beside it, and your MSP check-in.' },
      { tool: 'hot', why: 'The honesty check, then your mentor map: Paul, Barnabas, Timothy.' },
      { tool: 'questions', why: 'A question you’d rather ask privately? It’s anonymous.' }
    ]
  },
  {
    id: 'thu', dow: 4, name: 'Thursday', title: 'Here Am I, Send Me', james: 4,
    sticky: 'Make plans with open hands.',
    bigIdea: 'Explore, then commit. A calling is discovered through how God made you, your story, your burden and others’ confirmation. Then lay down the backup plan: burn the ships, burn the plow, break the jar.',
    scripture: [
      { ref: 'James 4:13–15', text: 'Come now, you who say, “Today or tomorrow let’s go into this city, and spend a year there, trade, and make a profit.” Whereas you don’t know what your life will be like tomorrow. … For you ought to say, “If the Lord wills, we will both live, and do this or that.”' },
      { ref: 'Isaiah 6:8', text: 'I heard the Lord’s voice, saying, “Whom shall I send, and who will go for us?” Then I said, “Here I am. Send me!”' },
      { ref: '1 Kings 19:19–21', text: 'Elisha left the oxen, and ran after Elijah… He returned from following him, and took the yoke of oxen, and killed them, and boiled their meat with the instruments of the oxen, and gave to the people, and they ate. Then he arose, and went after Elijah, and served him.' },
      { ref: 'Mark 14:3', text: 'A woman came having an alabaster jar of ointment of pure nard—very costly. She broke the jar, and poured it over his head.' }
    ],
    study: null,
    questions: [
      'Which identity status sounds most like you right now: drifting, borrowed, exploring or committed?',
      'Of the four places a calling is discovered — design, story, burden, confirmation — which is clearest for you? Which is still blank?',
      'Character, chemistry, competency: which do you most need to grow before you join a team?',
      'What’s your backup plan — the ship you keep ready in case God doesn’t come through?'
    ],
    listen: 'Holy Spirit, what is my backup plan, and what would it look like to make you my only plan?',
    response: 'Write your backup plan down. Tear it up. Pray: “Jesus, you’re my only plan.”',
    respond: [
      { tool: 'bingo', why: 'Morning game: tap every excuse you’ve used. Then “My excuse is…”' },
      { tool: 'calling', why: 'Where am I? Identity status, the four places a calling is found, the 3 C’s.' },
      { tool: 'backup', why: 'Burn the ships: write your backup plan, tear it up, pray.' },
      { tool: 'laydown', why: 'Plans with open hands: my plan next to his.' }
    ]
  },
  {
    id: 'fri', dow: 5, name: 'Friday', title: 'Lord of Every Sphere', james: 5,
    sticky: 'Easy to die for Jesus. Hard to live for him.',
    bigIdea: 'Jesus is Lord of every sphere — family, church, school, work, government, media, the arts. All week we’ve laid things down; today we pick up what he hands us: a plan for 2, 5 and 10 years, and the throw-down. A living sacrifice gets up off the altar every day.',
    scripture: [
      { ref: 'Romans 12:1', text: 'Therefore I urge you, brothers, by the mercies of God, to present your bodies a living sacrifice, holy, acceptable to God, which is your spiritual service.' },
      { ref: '2 Timothy 2:3–6', text: 'You therefore must endure hardship, as a good soldier of Christ Jesus. No soldier on duty entangles himself in the affairs of life, that he may please him who enrolled him as a soldier. Also, if anyone competes in athletics, he isn’t crowned unless he has competed by the rules. The farmer who labors must be the first to get a share of the crops.' },
      { ref: 'Luke 4:18 · John 5:19', text: '“The Spirit of the Lord is on me, because he has anointed me to preach good news to the poor.” … “The Son can do nothing of himself, but what he sees the Father doing.”' },
      { ref: 'James 5:17', text: 'Elijah was a man with a nature like ours, and he prayed earnestly that it might not rain, and it didn’t rain on the earth for three years and six months.' },
      { ref: 'Revelation 7:9 · John 20:21', text: 'A great multitude, which no man could count, out of every nation and of all tribes, peoples, and languages, standing before the throne and before the Lamb… “As the Father has sent me, even so I send you.”' },
      { ref: 'Numbers 6:24–26', text: 'Yahweh bless you, and keep you. Yahweh make his face to shine on you, and be gracious to you. Yahweh lift up his face toward you, and give you peace.' }
    ],
    nations: 'Vision 2033: 10% of Cambodia following Jesus by 2033. 65% of Cambodians are under 30 — a sending nation.',
    study: 'Romans 12:1–2 · 2 Timothy 2:3–6',
    questions: [
      'What is God asking you to pick up, not just lay down?',
      'Which part of your wheel is most out of line?',
      'What habit would change your next two years?'
    ],
    listen: 'Holy Spirit, what are you handing me to carry?',
    response: 'The throw-down: come forward, throw something down, and say out loud what you’re picking up — including what you’ll do for the nations.',
    respond: [
      { tool: 'spheres', why: 'Morning game: which sphere is each job in? Then the week recap.' },
      { tool: 'growth', why: 'Stay in YWAM. Keep growing: your 2 · 5 · 10 and one step in 30 days.' },
      { tool: 'commit', why: 'Your throw-down: what you’re picking up. Declare it.' },
      { tool: 'wheel', why: 'Heart, soul, mind, strength — which part is most out of line?' },
      { tool: 'scroll', why: 'God things vs good things: what’s on your scroll?' }
    ]
  }
];

/* The Heart, Soul, Mind & Strength wheel (Mark 12:30). Each spoke has a question so 10 is always "healthy". */
export const GROUPS = [
  { id: 'heart', name: 'Heart', color: '#e0503d' },
  { id: 'soul', name: 'Soul', color: '#1f44ff' },
  { id: 'mind', name: 'Mind', color: '#7b4bd6' },
  { id: 'strength', name: 'Strength', color: '#e09a12' }
];
export const WHEEL_OUT = [
  { id: 'faith', name: 'Faith', g: 'soul', q: 'How alive is my walk with God day to day?' },
  { id: 'rest', name: 'Rest', g: 'strength', q: 'Do I rest, sabbath and have fun without guilt?' },
  { id: 'family', name: 'Family', g: 'heart', q: 'How healthy are things with my family?' },
  { id: 'romance', name: 'Marriage / romance', g: 'heart', q: 'How at peace am I in this area (single, dating or married)?' },
  { id: 'friends', name: 'Friendships', g: 'heart', q: 'Do I have friends who really know me?' },
  { id: 'learning', name: 'Learning', g: 'mind', q: 'Am I growing, reading, learning new things?' },
  { id: 'work', name: 'Work / role', g: 'strength', q: 'How do I feel about my role on the team or my work?' },
  { id: 'finances', name: 'Finances', g: 'strength', q: 'How settled am I with money — support, giving, debt?' },
  { id: 'health', name: 'Health', g: 'strength', q: 'How well am I caring for my body — sleep, food, exercise?' }
];
export const WHEEL_IN = [
  { id: 'joy', name: 'Joy', g: 'soul', q: 'How much joy do I actually feel?' },
  { id: 'peace', name: 'Peace', g: 'soul', q: 'How much peace do I have on the inside?' },
  { id: 'hope', name: 'Hope', g: 'soul', q: 'How hopeful am I about the future?' },
  { id: 'love', name: 'Love', g: 'heart', q: 'How loved do I feel — by God and by people?' },
  { id: 'lonely', name: 'Loneliness', g: 'heart', q: 'How connected do I feel? (10 = deeply known, not lonely)' },
  { id: 'pain', name: 'Pain', g: 'heart', q: 'How healed am I from past hurts? (10 = healed, little pain)' },
  { id: 'anxiety', name: 'Anxiety', g: 'mind', q: 'How free am I from worry? (10 = calm, little anxiety)' },
  { id: 'identity', name: 'Identity', g: 'mind', q: 'How secure am I in who God says I am?' },
  { id: 'patience', name: 'Patience', g: 'strength', q: 'How patient am I with people, God and myself?' }
];

/* My plan vs God's plan (it was "Lay Down, Take Up"): for each area, what I'm planning, what I sense God's plan is,
   how close they are, and what I'll lay down and take up. Each area has a verse (WEB) and prompts for both sides. */
export const PLAN_VERSE = { ref: 'Proverbs 16:9', text: 'A man’s heart plans his course, but Yahweh directs his steps.' };
export const PLAN_VERSE2 = { ref: 'Isaiah 55:8–9', text: '“For my thoughts are not your thoughts, and your ways are not my ways,” says Yahweh. “For as the heavens are higher than the earth, so are my ways higher than your ways, and my thoughts than your thoughts.”' };
export const LIFE_AREAS = [
  { id: 'future', name: 'My future', emoji: '🧭', hint: 'Where your life is heading in the next few years.',
    mine: ['In 5 years I want to be…', 'The life I picture is…', 'What I’m most afraid of missing out on…'],
    gods: ['What I sense God has made me for…', 'What keeps coming up when I pray…', 'What others see God doing in me…'],
    verse: { ref: 'Ephesians 2:10', text: 'For we are his workmanship, created in Christ Jesus for good works, which God prepared before that we would walk in them.' } },
  { id: 'money', name: 'Money', emoji: '💸', hint: 'Support raising, spending, giving, saving, what you want to own.',
    mine: ['I’m saving for…', 'I feel secure when…', 'What I’d spend more on if I could…'],
    gods: ['Where my treasure should be…', 'What generosity would look like…', 'Where I need to trust him to provide…'],
    verse: { ref: 'Matthew 6:21, 33', text: 'For where your treasure is, there your heart will be also. … But seek first God’s Kingdom, and his righteousness; and all these things will be given to you as well.' } },
  { id: 'romance', name: 'Romance', emoji: '💛', hint: 'Singleness, dating, marriage, hopes, timelines.',
    mine: ['My timeline is…', 'The kind of person I want…', 'What I’m doing to make it happen…'],
    gods: ['What God might be saying about this season…', 'What it would look like to trust him with it…', 'What wise people have told me…'],
    verse: { ref: 'Psalm 37:4–5', text: 'Also delight yourself in Yahweh, and he will give you the desires of your heart. Commit your way to Yahweh. Trust also in him.' } },
  { id: 'health', name: 'Health', emoji: '🏃', hint: 'Sleep, food, exercise, screens, rhythms.',
    mine: ['My habits right now are…', 'What I use to cope…', 'What I keep meaning to change…'],
    gods: ['How God sees my body…', 'What rest he might be inviting me into…', 'One rhythm that would honour him…'],
    verse: { ref: '1 Corinthians 6:19–20', text: 'Or don’t you know that your body is a temple of the Holy Spirit who is in you, whom you have from God? You are not your own, for you were bought with a price. Therefore glorify God in your body and in your spirit, which are God’s.' } },
  { id: 'home', name: 'Where I live', emoji: '🏠', hint: 'Your country, city, home, being near family.',
    mine: ['Where I plan to live…', 'What I’d never want to give up…', 'Why that place matters to me…'],
    gods: ['Where God might be sending me…', 'Who he might want me near…', 'What it would cost to go — or to stay…'],
    verse: { ref: 'Acts 17:26–27', text: 'He made from one blood every nation of men to dwell on all the surface of the earth, having determined appointed seasons, and the boundaries of their dwellings, that they should seek the Lord, if perhaps they might reach out for him and find him, though he is not far from each one of us.' } },
  { id: 'team', name: 'My role on team', emoji: '🤝', hint: 'Position, title, being seen, serving behind the scenes.',
    mine: ['The role I want…', 'Where I want to be noticed…', 'What I’d rather not do…'],
    gods: ['Where he might want me to serve…', 'Who I could make great…', 'What hidden faithfulness looks like…'],
    verse: { ref: 'Mark 10:43–45', text: 'Whoever wants to become great among you shall be your servant. Whoever of you wants to become first among you, shall be bondservant of all. For the Son of Man also came not to be served, but to serve, and to give his life as a ransom for many.' } },
  { id: 'education', name: 'Education & work', emoji: '🎓', hint: 'Degrees, plans, the career you pictured.',
    mine: ['The study or career I planned…', 'Why I want it…', 'What others expect of me…'],
    gods: ['How it could serve his purposes…', 'What he might be asking me to add — or drop…', 'Who I’d be doing it for…'],
    verse: { ref: 'Colossians 3:23', text: 'And whatever you do, work heartily, as for the Lord, and not for men.' } },
  { id: 'time', name: 'My time', emoji: '⏳', hint: 'Phone, free time, weekends, what fills your days.',
    mine: ['Where my hours actually go…', 'What I do when I’m bored…', 'What I’d protect at all costs…'],
    gods: ['What he’d want more of in my week…', 'Where I could make room for people…', 'What I’d stop if I counted my days…'],
    verse: { ref: 'Psalm 90:12', text: 'So teach us to count our days, that we may gain a heart of wisdom.' } },
  { id: 'mentors', name: 'Mentors', emoji: '🗣️', hint: 'Who speaks into your life, and whether you let them.',
    mine: ['Who I go to (and who I avoid)…', 'What I don’t let anyone see…', 'How I make big decisions…'],
    gods: ['Who God has put around me…', 'What I need to bring into the light…', 'Who I could ask to walk with me…'],
    verse: { ref: 'Proverbs 15:22', text: 'Where there is no counsel, plans fail; but in a multitude of counselors they are established.' } }
];
export const ALIGN = ['', 'Far apart', 'Some overlap', 'Getting closer', 'Mostly the same', 'One plan'];

/* HOT check: 1 (not me) – 5 (very me). */
export const HOT = [
  { l: 'H', name: 'Humble', items: ['I can say "I was wrong" without a long explanation.', 'I ask for help before I’m desperate.', 'I’m genuinely glad when others are praised instead of me.'] },
  { l: 'O', name: 'Open', items: ['I invite people to speak into my life, even when it stings.', 'I’m teachable when I’m corrected.', 'I listen to understand, not just to reply.'] },
  { l: 'T', name: 'Transparent', items: ['At least one person knows my real struggles right now.', 'I don’t hide things I would be embarrassed to have found out.', 'What people see of me matches who I am in private.'] }
];
/* Friday's plan: "Stay in YWAM. Keep growing." (Uriah's Day 5 deck and the App Sync doc). */
export const PLAN10 = [
  { id: 'y2', years: 'Years 1–2', title: 'Firm foundations', hint: 'A two-year commitment, schools to staff, a language to start, a degree begun.', fields: [
    { id: 'where', label: 'My two-year commitment: where?', ph: 'e.g. YWAM Siem Reap', ideas: ['YWAM Siem Reap', 'My home base', 'Still praying'] },
    { id: 'staff', label: 'Schools I’ll staff', ph: 'e.g. the next DTS', ideas: ['DTS', 'SBS', 'DBS', 'SOMD'] },
    { id: 'lang', label: 'A language to start', ph: 'e.g. Khmer', ideas: ['Khmer', 'English', 'Thai', 'Lao'] },
    { id: 'degree', label: 'A two-year degree or credits', ph: 'e.g. UofN credits toward the LPU pathway', ideas: ['UofN credits', 'LPU pathway'] }
  ] },
  { id: 'y5', years: 'Years 3–5', title: 'Skilled up', hint: 'Finish a bachelor’s, get fluent, go deep in one skill.', fields: [
    { id: 'bachelor', label: 'Finish a bachelor’s', ph: 'e.g. LPU, Ministry & Leadership' },
    { id: 'fluent', label: 'Fluent in a language', ph: 'e.g. Khmer' },
    { id: 'skill', label: 'One skill to go deep in', ph: 'e.g. video, teaching, counselling', ideas: ['Media & design', 'Teaching', 'Counselling', 'Leadership', 'Business'] },
    { id: 'online', label: 'Online courses', ph: 'e.g. Coursera, Udemy', ideas: ['Coursera', 'Udemy', 'Media / design course'] },
    { id: 'selfdev', label: 'My self-development plan', ph: 'e.g. read 12 books a year, a coach' }
  ] },
  { id: 'y10', years: 'Years 6–10', title: 'All in, planted', hint: 'Five years growing, five years planting.', fields: [
    { id: 'launch', label: 'What will you launch?', ph: 'e.g. a school, a ministry, a base' },
    { id: 'people', label: 'Which people or nation?', ph: 'e.g. the Kuy of northern Cambodia' },
    { id: 'work', label: 'A long-term work among the lost', ph: 'e.g. church planting in Laos' }
  ] }
];
export const LOCK_IN = [['bachelor', 'A bachelor’s degree'], ['skill', 'A solid skill'], ['language', 'At least one fluent language'], ['family', 'A healthy marriage and family (if God leads) or a healthy community'], ['support', 'A strong support team'], ['longterm', 'A long-term work in the nations']];
export const PRONE = ['sleeping in', 'being a bit lazy', 'being judgy', 'getting angry fast', 'getting frustrated', 'spilling the tea', 'games I shouldn’t play', 'R-rated movies', 'doom-scrolling', 'people-pleasing', 'sarcasm', 'overspending', 'exaggerating', 'comparing'];
export const NEW_CREATION = [
  { ref: '2 Corinthians 5:17', text: 'If anyone is in Christ, he is a new creation. The old things have passed away. Behold, all things have become new.' },
  { ref: 'Romans 8:1', text: 'There is therefore now no condemnation to those who are in Christ Jesus.' },
  { ref: 'Ephesians 2:10', text: 'For we are his workmanship, created in Christ Jesus for good works.' },
  { ref: 'Romans 6:11', text: 'Consider yourselves also to be dead to sin, but alive to God in Christ Jesus our Lord.' },
  { ref: 'Galatians 2:20', text: 'I have been crucified with Christ, and it is no longer I that live, but Christ lives in me.' },
  { ref: 'Galatians 5:24', text: 'Those who belong to Christ have crucified the flesh with its passions and lusts.' }
];
/* Thursday: where am I? (Marcia's identity statuses, the four places a calling is discovered, the 3 C's) — private. */
export const IDENTITY = [
  ['diffusion', '🌫️', 'Drifting', 'Not exploring, not committed. “Whatever happens.”'],
  ['foreclosure', '📦', 'Borrowed', 'Committed, but to someone else’s plan — I never really explored.'],
  ['moratorium', '🧭', 'Exploring', 'Actively searching and trying things. Not committed yet.'],
  ['achievement', '⚓', 'Committed', 'I explored, then chose. I know what I’m giving my life to.']
];
export const CALLING_FOUND = [
  ['design', 'Design', 'How God made me: gifts, personality, what I’m good at.'],
  ['story', 'Story', 'What I’ve lived through — the hard and the good.'],
  ['burden', 'Burden', 'What breaks my heart, and won’t leave me alone.'],
  ['confirmation', 'Confirmation', 'What wise people who know me see and say.']
];
export const THREE_CS = [
  ['character', 'Character', 'A crack at home becomes a Grand Canyon on the field.'],
  ['chemistry', 'Chemistry', 'Find the right fit — the team and leader you flourish with.'],
  ['competency', 'Competency', 'Bring something to the table.']
];
export const MENTOR_ROLES = [['paul', 'Paul', 'ahead of me, speaks into my life'], ['barnabas', 'Barnabas', 'beside me, knows my real stuff'], ['timothy', 'Timothy', 'I’m pouring into them']];
export const RIGHTS = [
  { id: 'future', name: 'Future & plans', ref: 'Mark 1:16–20' }, { id: 'reputation', name: 'Reputation', ref: 'Mark 1:40–42' },
  { id: 'money', name: 'Money & status', ref: 'Mark 2:13–14' }, { id: 'family', name: 'Family', ref: 'Mark 3:31–34' },
  { id: 'marriage', name: 'Marriage', ref: 'Who and when' }, { id: 'comfort', name: 'Comfort', ref: 'Where I live' },
  { id: 'control', name: 'Control', ref: 'Knowing the plan' }, { id: 'dream', name: 'My dream', ref: 'The role I want' }
];
export const DAILY_OBEDIENCE = ['10 minutes in the Word', 'Pray for one people group', 'Encourage one person', 'Say sorry first', 'Read today’s chapter of James'];
export const MENTOR_AREAS = ['Faith', 'Finances', 'Romance', 'Struggles', 'Leadership', 'Calling / career', 'Health'];

/* Self-development plan. */
export const GROWTH_AREAS = [
  { id: 'skills', name: 'Skills', ideas: ['AI tools for ministry', 'Video / design', 'Teaching & preaching', 'Leading a small team', 'Counselling basics'] },
  { id: 'language', name: 'Language', ideas: ['Khmer with a tutor', 'Lao or Thai', 'An online language app daily', 'Language exchange with a local friend'] },
  { id: 'education', name: 'Education', ideas: ['LPU partnership degree', 'A local university', 'Online courses (Coursera, edX)', 'A YWAM secondary school'] },
  { id: 'health', name: 'Health', ideas: ['Run a 5 km', 'Sleep 7+ hours', 'Weekly sabbath', 'Counselling check-in each year'] }
];
export const HORIZONS = [
  { id: 'y2', name: '2 years', title: 'Firm foundations', hint: 'Finish school. DTS plus one skill area.', ideas: ['Finish school', 'DTS', 'One skill area', 'Staff a school', 'Read 12 books'] },
  { id: 'y5', name: '5 years', title: 'Force for change', hint: 'A degree and one language. Further schools. Leadership.', ideas: ['A degree (LPU)', 'One language', 'DBS / SBS', 'SOMD', 'BCC', 'Udemy courses', 'Lead a team'] },
  { id: 'y10', name: '10 years', title: 'Frontier missions', hint: 'Pioneer a ministry or a base.', ideas: ['Pioneer a ministry', 'Start a base', 'Live among an unreached people', 'Raise up leaders'] }
];

/* Question box topics. */
export const TOPICS = [
  { id: 'romance', name: 'Romance' }, { id: 'sexuality', name: 'Sexuality' }, { id: 'finances', name: 'Finances' },
  { id: 'struggles', name: 'Struggles' }, { id: 'faith', name: 'Faith' }, { id: 'calling', name: 'Calling' }, { id: 'other', name: 'Other' }
];

/* One unreached people group a day. Wording kept general; check joshuaproject.net for current figures.
   Photos: openly licensed (CC BY / CC BY-SA, found through Openverse, from Flickr), resized, credited on the card.
   Some show the place a group lives rather than its people. */
export const PEOPLE_GROUPS = [
  { name: 'Cham', photo: { src: '/people/cham.jpg', pos: '50% 18%', caption: 'Masjid Rahmah, a Cham village in Kampong Cham', by: 'Adam Jones, Ph.D. - Global Photo Archive', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', link: 'https://www.flickr.com/photos/41000732@N04/48345359536' },  where: 'Cambodia & Vietnam', about: 'A Muslim people with a long history along the Mekong and Tonlé Sap, often fishing and trading. Very few Cham follow Jesus.', pray: 'Pray for Cham families to see Jesus in the lives of Christian neighbours, and for Cham believers to have courage and community.' },
  { name: 'Khmer', photo: { src: '/people/khmer.jpg', caption: 'Rice fields and a village in Cambodia', by: 'Ersu', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', link: 'https://www.flickr.com/photos/95179573@N00/10852767755' },  where: 'Cambodia', about: 'Cambodia’s majority people, mostly Buddhist, with a young population still carrying the wounds of the Khmer Rouge years. The church is growing but small.', pray: 'Pray for healing from generational trauma, and for young Khmer believers to be sent to every province.' },
  { name: 'Kuy', photo: { src: '/people/kuy.jpg', caption: 'Preah Vihear, northern Cambodia, where many Kuy live', by: 'spiderman (Frank)', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/', link: 'https://www.flickr.com/photos/26163384@N00/6585429581' },  where: 'Cambodia, Laos & Thailand', about: 'A rural people who mix Buddhism with spirit worship, many farming rice in the north of Cambodia.', pray: 'Pray for freedom from fear of spirits, and for Bible stories in the Kuy heart language.' },
  { name: 'Lao', photo: { src: '/people/lao.jpg', caption: 'A village in Laos', by: 'sweet_redbird', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/', link: 'https://www.flickr.com/photos/18261299@N00/4652580632' },  where: 'Laos', about: 'The largest group in Laos, deeply Theravada Buddhist. Following Jesus can cost family and village standing.', pray: 'Pray for Lao believers facing pressure to stand firm, and for whole families to come to Jesus together.' },
  { name: 'Tai Dam (Black Tai)', photo: { src: '/people/taidam.jpg', caption: 'Vieng Xai, northern Laos', by: 'Adam Jones, Ph.D. - Global Photo Archive', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/', link: 'https://www.flickr.com/photos/41000732@N04/3774684004' },  where: 'Laos & Vietnam', about: 'Known for ancestor worship and rich weaving traditions, living in the northern hills.', pray: 'Pray for the Tai Dam to know the Father who adopts, and for faithful workers to live among them.' },
  { name: 'Tampuan', photo: { src: '/people/tampuan.jpg', caption: 'A Tampuan woman, north-east Cambodia', by: 'paularps', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', link: 'https://www.flickr.com/photos/21160385@N02/6659908479' },  where: 'Ratanakiri, Cambodia', about: 'A highland people of the north-east forests, whose land and way of life are changing fast.', pray: 'Pray for protection for Tampuan communities, and for the good news to come in ways that honour their culture.' },
  { name: 'Brao', photo: { src: '/people/brao.jpg', caption: 'A river in Ratanakiri', by: 'Photasia', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', link: 'https://www.flickr.com/photos/56480710@N03/5337976807' },  where: 'Cambodia & Laos', about: 'A small highland people living along rivers near the Lao border, mostly following traditional spirit beliefs.', pray: 'Pray for health workers, teachers and Jesus-followers to bring hope and practical help.' },
  { name: 'Vietnamese in Cambodia', photo: { src: '/people/viet.jpg', caption: 'A floating village on the Tonlé Sap', by: 'criticalmas101', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/', link: 'https://www.flickr.com/photos/129592470@N02/16184238196' },  where: 'Cambodia', about: 'Many live on floating villages and the edges of cities, often without papers and facing prejudice.', pray: 'Pray for dignity, legal status and safety, and for churches that welcome them as family.' },
  { name: 'Isan (Northeastern Thai)', photo: { src: '/people/isan.jpg', caption: 'Rice fields', by: 'Bangkok Witchcraft', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', link: 'https://www.flickr.com/photos/10849262@N02/3941100313' },  where: 'Thailand', about: 'Lao-speaking people of north-east Thailand, many working in Bangkok or overseas to support families.', pray: 'Pray for migrant workers far from home to meet Jesus, and for churches in Isan villages.' },
  { name: 'Central Thai', photo: { src: '/people/thai.jpg', caption: 'Flower garlands at a Bangkok market', by: 'icathing', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/', link: 'https://www.flickr.com/photos/35034346679@N01/283168074' },  where: 'Thailand', about: 'The majority people of Thailand, mostly Buddhist, warm and hospitable. Few have heard the gospel clearly.', pray: 'Pray for Thai believers to share naturally in their workplaces and families.' },
  { name: 'Malay', photo: { src: '/people/malay.jpg', caption: 'Ketupat, made for Hari Raya', by: 'Sham Hardy', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/', link: 'https://www.flickr.com/photos/33991563@N00/3933543064' },  where: 'Malaysia, Singapore & Indonesia', about: 'A Muslim people for whom faith and identity are tightly joined; one of the largest unreached groups in the region.', pray: 'Pray for Malay people to dream dreams of Jesus, and for wisdom and love among the churches around them.' },
  { name: 'Rohingya', photo: { src: '/people/rohingya.jpg', caption: 'Kutupalong refugee camp, Bangladesh', by: 'DFID - UK Department for International Development', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', link: 'https://www.flickr.com/photos/14214150@N02/37930256914' },  where: 'Myanmar, Bangladesh & Malaysia', about: 'A stateless Muslim people, many living as refugees, including in Malaysia.', pray: 'Pray for safety, education and a future for Rohingya children, and for Christians to love them practically.' },
  { name: 'Acehnese', photo: { src: '/people/aceh.jpg', caption: 'Baiturrahman Grand Mosque, Banda Aceh', by: 'Peter Fortner', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', link: 'https://www.flickr.com/photos/46325181@N07/5464735056' },  where: 'Indonesia', about: 'A strongly Muslim people at the northern tip of Sumatra, still remembered for the 2004 tsunami.', pray: 'Pray for peace, for good work and families, and for the Acehnese to hear of Jesus.' },
  { name: 'Mon', photo: { src: '/people/mon.jpg', caption: 'The Golden Rock, Mon State, Myanmar', by: 'james_antrobus', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', link: 'https://www.flickr.com/photos/96862558@N03/15006073689' },  where: 'Myanmar & Thailand', about: 'An ancient Buddhist people who helped shape the culture of the region, now a minority.', pray: 'Pray for the Mon church to grow, and for peace in Myanmar.' }
];

/* "Need to talk to someone now?" — shown from every coaching screen. Naomi's numbers fill in from LINKS.contact. */
export const HELP = {
  intro: 'You don’t have to carry this alone. If something is heavy right now, please talk to a real person today.',
  staff: 'In the DTS: find any staff member or your small-group leader — tonight is not too soon. You won’t be in trouble for asking for help.',
  emergency: [
    { where: 'If you are in danger right now', text: 'Call local emergency services — Cambodia: 117 (police), 119 (ambulance). Malaysia: 999.' },
    { where: 'Malaysia — someone to talk to', text: 'Befrienders Kuala Lumpur, 24 hours: 03-7627 2929 (befrienders.org.my).' }
  ]
};

/* Church mode. */
export const CHURCH = {
  affirm: 'We so value what you’re already doing as Christians in Malaysia and in hosting YWAM Experience Asia, and we want to see it multiplied everywhere, especially among unreached peoples.',
  join: [
    { emoji: '🙏', title: 'Pray for a people group', text: 'Pray for today’s people group this week — at a meal, on your commute, with your kids.' },
    { emoji: '💬', title: 'Share Jesus with a friend', text: 'Ask God for one name. Pray for them daily and look for a natural moment to share your story.' },
    { emoji: '🎁', title: 'Give', text: 'Support a Cambodian leader who is reaching their own people.' }
  ],
  notSo: {
    ref: 'Acts 10:13–15',
    text: 'A voice came to him, “Rise, Peter, kill and eat!” But Peter said, “Not so, Lord; for I have never eaten anything that is common or unclean.” A voice came to him again the second time, “What God has cleansed, you must not call unclean.”',
    questions: [
      'Where do I call Jesus "Lord" and also say "not so"?',
      'What am I afraid I’d lose if I said yes?',
      'What might God be inviting me into that I’ve called "not for me"?'
    ]
  }
};

/* Connect page. Any href still containing PLACEHOLDER is hidden on the page until it's filled in. */
export const LINKS = {
  support: { label: 'Support a Cambodian Leader', href: 'https://ywamsiemreap.org/give/staff/' },
  instagram: [
    { label: 'YWAM Siem Reap', href: 'https://www.instagram.com/ywamsiemreap/' },
    { label: 'YWAM Experience Asia', href: 'https://www.instagram.com/ywamea/' }
  ],
  people: [
    { name: 'Uriah', links: [{ label: 'Instagram', href: 'https://www.instagram.com/you_ry_khmer/' }, { label: 'Facebook', href: 'https://www.facebook.com/pouyoury' },
      { label: 'YouTube', href: 'https://youtube.com/user/uriahlyford' }, { label: 'TikTok', href: 'https://www.tiktok.com/@uriahlyford' }] },
    { name: 'Naomi', links: [{ label: 'Instagram', href: 'https://instagram.com/PLACEHOLDER_naomi' }, { label: 'Facebook', href: 'https://facebook.com/PLACEHOLDER_naomi' }] }
  ],
  contact: [
    { label: 'WhatsApp (Naomi)', href: 'https://wa.me/PLACEHOLDER' },
    { label: 'Telegram (Naomi)', href: 'https://t.me/PLACEHOLDER' },
    { label: 'Email (Naomi)', href: 'mailto:PLACEHOLDER@example.org' }
  ],
  gonpreah: { label: 'gonpreah.org', href: 'https://gonpreah.org' }
};

/* "What's your Lordship profile?" — a funny day-one quiz. Each answer points to a profile; the most points wins.
   Every profile is a joke with a true edge: the thing we'd die for Jesus for, except… */
export const PROFILES = {
  netflix: { emoji: '📺', name: 'The Netflix Martyr', tag: 'I’ll die for Jesus — just don’t touch my Netflix.',
    about: 'Ready for the cross, not ready to cancel the subscription. Comfort is your quiet little god.',
    notso: 'Not so, Lord… not my evenings.', down: 'One night of comfort a week', up: 'Something hard and holy instead', ref: 'Luke 9:23' },
  bentley: { emoji: '🚗', name: 'The Bentley Believer', tag: 'Use me, Lord… in a nice car.',
    about: 'You want to serve God and look good doing it. Money and nice things whisper “security”.',
    notso: 'Not so, Lord… not my savings.', down: 'Needing stuff to feel secure', up: 'Give something away this week', ref: 'Matthew 6:21' },
  ring: { emoji: '💍', name: 'Ring by Spring', tag: 'Give me a spouse or give me death.',
    about: 'You trust God with everything except the timeline of your love life.',
    notso: 'Not so, Lord… not my timeline.', down: 'My romance deadline', up: 'Trust him with the waiting', ref: 'Psalm 37:4–5' },
  sahara: { emoji: '🐪', name: 'The Sahara Saint', tag: 'Send me to the desert. Today. Alone. Barefoot.',
    about: 'All in — maybe a bit too fast. Watch for pride, burnout, and skipping the people right next to you.',
    notso: 'Not so, Lord… not slow and ordinary.', down: 'Needing it to be dramatic', up: 'Faithful in the small, boring things', ref: 'Luke 16:10' },
  gym: { emoji: '🏋️', name: 'The Gym-Exempt Missionary', tag: 'Ready to die for Jesus. Not ready for leg day.',
    about: 'Spirit willing, flesh on the couch. Your body is a temple — currently under renovation.',
    notso: 'Not so, Lord… not my sleep-in.', down: 'Snooze and snacks', up: 'One rhythm for your body', ref: '1 Corinthians 6:19–20' },
  wifi: { emoji: '📶', name: 'The Wi-Fi Warrior', tag: 'I’ll go anywhere, Lord — as long as there’s Wi-Fi.',
    about: 'Your phone is your third hand. Lordship might mean a little more airplane mode.',
    notso: 'Not so, Lord… not my screen time.', down: 'The scroll before bed', up: 'Phone-free time with God', ref: 'Psalm 90:12' },
  planner: { emoji: '📋', name: 'Plan A Planner', tag: 'I’ve planned my life to 2047. God can sign off.',
    about: 'Twelve kids, a farmhouse and a career path — you just need God’s signature at the bottom.',
    notso: 'Not so, Lord… not my plan.', down: 'Gripping the five-year plan', up: 'Pray “your will” and mean it', ref: 'Proverbs 16:9' },
  pleaser: { emoji: '🙏', name: 'The People-Pleaser Prophet', tag: 'Whatever you want, Lord… and also everyone else.',
    about: 'You hear God fine — and your mum, your leader and the group chat a bit louder.',
    notso: 'Not so, Lord… not if they’ll be upset.', down: 'Needing everyone’s approval', up: 'Obey God first, kindly', ref: 'Galatians 1:10' }
};
export const QUIZ = [
  { q: 'God says “Go.” Your first thought?', opts: [['Is there Wi-Fi?', 'wifi'], ['Tonight? I’m mid-season…', 'netflix'], ['Already packed. Barefoot.', 'sahara'], ['Let me check it fits my 5-year plan', 'planner']] },
  { q: 'Your dream ministry ride:', opts: [['A Bentley, for God’s glory', 'bentley'], ['A camel', 'sahara'], ['Whatever my leader thinks is best', 'pleaser'], ['A minivan for my future 12 kids', 'planner']] },
  { q: 'It’s 6 a.m. prayer meeting. You…', opts: [['Pray from bed (it counts)', 'gym'], ['Were up at 4 already', 'sahara'], ['Go, because everyone else is', 'pleaser'], ['Scroll first, pray later', 'wifi']] },
  { q: 'The hardest thing to lay down:', opts: [['My savings account', 'bentley'], ['My future spouse (I’ve named them)', 'ring'], ['My streaming queue', 'netflix'], ['My phone', 'wifi']] },
  { q: 'Outreach is in a village with no power. You:', opts: [['Pack a power bank. Or six.', 'wifi'], ['Ask what’s for dinner — and is it spicy?', 'gym'], ['Finally. Real ministry.', 'sahara'], ['Hope someone cute is on the team', 'ring']] },
  { q: 'Your Sabbath looks like:', opts: [['Couch. Blanket. Episode 9.', 'netflix'], ['Colour-coding next week', 'planner'], ['Saying yes to everyone who asks', 'pleaser'], ['Online shopping “just looking”', 'bentley']] },
  { q: 'Fasting week! Your survival plan:', opts: [['I’ll fast… from the gym', 'gym'], ['Fast from social media (sobbing)', 'wifi'], ['Already on day 40', 'sahara'], ['Only if my small group is', 'pleaser']] },
  { q: 'Your prayer request, honestly:', opts: [['A husband/wife by spring', 'ring'], ['Financial breakthrough (a Bentley)', 'bentley'], ['That God approves my plan', 'planner'], ['More hours in the day for shows', 'netflix']] }
];

/* Live polls for a room or a Zoom call (?poll=<id>): no names, no sign-in — one tap per question, results live on
   #/poll-results/<id>. Option ids must match LIVE_POLL_IDS in netlify/functions/lib/game.js (tests/test-data.mjs checks). */
const OPTS_NEVER = [
        ['plans', '📅', 'My plans & timeline'], ['money', '💸', 'Money & what I own'], ['phone', '📱', 'My phone & screen time'],
        ['marry', '💍', 'Who I’ll marry (and when)'], ['home', '🏠', 'Where I’ll live'], ['family', '👨‍👩‍👧', 'What my family expects'],
        ['dream', '🎯', 'My dream or career'], ['comfort', '🛋️', 'My comfort'], ['image', '🙂', 'What people think of me'],
        ['control', '🎛️', 'Being in control'], ['hurt', '🩹', 'An old hurt I’m holding'], ['other', '🤫', 'Something just between me and God']
      ];

const FF = [['fire', '🔥', 'Fire'], ['fount', '⛲', 'Fountain']];

const RECAP = [['tue', '🐢', 'Plod, don’t sprint.'], ['fri', '⚔️', 'Easy to die for Jesus. Hard to live for him.'], ['mon', '♾️', 'Lordship doesn’t go away.'], ['thu', '🖐️', 'Make plans with open hands.'], ['wed', '💪', '“My grace is sufficient for you.”']];
const YN = [['y', '✓', 'Used it'], ['n', '', 'Not me']];
export const EXCUSES = [
  ['who', 'Who am I?', 'moses'], ['say', 'What do I say?', 'moses'], ['believe', 'They won’t believe me', 'moses'], ['speaker', 'I’m not a good speaker', 'moses'], ['else', 'Send someone else', 'moses'],
  ['young', 'Too young'], ['money', 'No money'], ['english', 'My English isn’t good'], ['parents', 'My parents won’t let me'], ['spiritual', 'Not spiritual enough'],
  ['ready', 'I’m not ready'], ['better', 'Someone else is better'], ['later', 'I’ll go later'], ['scared', 'Too scared'], ['where', 'I don’t know where'], ['provide', 'I have to provide for my family']
];
export const SPHERE7 = [['family', '🏡', 'Family'], ['church', '⛪', 'Church'], ['education', '🎓', 'Education'], ['government', '🏛️', 'Government'], ['media', '📱', 'Media'], ['arts', '🎨', 'Arts & entertainment'], ['business', '💼', 'Business']];

export const LIVE_POLLS = {
  bingo: {
    title: 'Excuse bingo',
    kind: 'bingo',
    verse: { ref: 'Exodus 3:11–12', text: 'Moses said to God, “Who am I, that I should go to Pharaoh…?” He said, “Certainly I will be with you.”' },
    intro: 'Moses had five excuses. We have a few more. Tap every excuse you’ve used — get four in a row and shout BINGO. No names.',
    qs: EXCUSES.map(([id, q]) => ({ id, q, opts: YN })),
    cloud: { id: 'excuse', q: 'My excuse is…', max: 4 },
    done: { text: '“Certainly I will be with you.”', ref: 'Exodus 3:12', prayer: 'Here am I. Send me!' }
  },
  spheres: {
    title: 'Sphere sorter',
    kind: 'sort',
    verse: { ref: 'Romans 12:1–2', text: 'Present your bodies a living sacrifice… Don’t be conformed to this world, but be transformed by the renewing of your mind.' },
    intro: 'A review of yesterday’s sphere walk: ten real jobs. Which sphere is each one in? Often more than one answer is good — go with your gut.',
    qs: [
      { q: 'A Khmer worship songwriter', opts: SPHERE7 }, { q: 'A village teacher', opts: SPHERE7 },
      { q: 'A TikTok creator sharing the gospel', opts: SPHERE7 }, { q: 'An NGO accountant', opts: SPHERE7 },
      { q: 'A church planter', opts: SPHERE7 }, { q: 'A health worker', opts: SPHERE7 },
      { q: 'A government official fighting corruption', opts: SPHERE7 }, { q: 'A coffee shop owner hiring at-risk youth', opts: SPHERE7 },
      { q: 'A Bible translator for a minority language', opts: SPHERE7 }, { q: 'A foster parent', opts: SPHERE7 }
    ],
    next: 'recap',
    done: { text: 'Jesus is Lord of every sphere — and he sends his people into all of them.', ref: 'Romans 12:1–2', prayer: 'Lord, wherever you put me, I’m yours there too. Amen.' }
  },
  recap: {
    title: 'Week recap',
    kind: 'quiz',
    verse: { ref: 'James 1:22', text: 'But be doers of the word, and not only hearers, deluding your own selves.' },
    intro: 'Five days, five lines. Match each day to its line.',
    qs: [
      { q: 'Monday · Lordship as a Lifestyle', opts: RECAP, correct: 'mon' },
      { q: 'Tuesday · Lazy Lordship', opts: RECAP, correct: 'tue' },
      { q: 'Wednesday · Stay HOT · All In', opts: RECAP, correct: 'wed' },
      { q: 'Thursday · Here Am I, Send Me', opts: RECAP, correct: 'thu' },
      { q: 'Friday · Lord of Every Sphere', opts: RECAP, correct: 'fri' }
    ],
    done: { text: 'But be doers of the word, and not only hearers.', ref: 'James 1:22', prayer: 'Jesus, all in, full of joy. Amen.' }
  },

  fire: {
    title: 'Fire or fountain?',
    kind: 'swipe',
    verse: { ref: 'James 3:6, 10–11', text: 'And the tongue is a fire. … Out of the same mouth comes blessing and cursing. My brothers, these things ought not to be so. Does a spring send out from the same opening fresh and bitter water?' },
    intro: 'Words pop up. Tap 🔥 if they burn, ⛲ if they build. Go with your gut — no names, just the class’s totals.',
    seconds: 10,
    qs: [
      { q: '“You always mess this up.”', opts: FF, is: 'fire' },
      { q: '“I was wrong. I’m sorry.”', opts: FF, is: 'fount' },
      { q: '“Did you hear what she did?”', opts: FF, is: 'fire' },
      { q: '“I saw God use you today.”', opts: FF, is: 'fount' },
      { q: '“I’m just being honest…”', opts: FF, is: 'fire' },
      { q: '“Can I pray for you right now?”', opts: FF, is: 'fount' },
      { q: '“Wow. Great job.” (with an eye roll)', opts: FF, is: 'fire' },
      { q: '“I’m struggling with this. Can we talk?”', opts: FF, is: 'fount' },
      { q: '“Whatever. I don’t care.”', opts: FF, is: 'fire' },
      { q: '“Thank you for being patient with me.”', opts: FF, is: 'fount' },
      { q: '“Don’t tell anyone, but…”', opts: FF, is: 'fire' },
      { q: '“You’re not alone. I’m here.”', opts: FF, is: 'fount' }
    ],
    verses: [
      { is: 'fire', ref: 'James 3:5–6', text: 'See how a small fire can spread to a large forest! And the tongue is a fire.' },
      { is: 'fount', ref: 'James 3:9–11', text: 'Out of the same mouth comes blessing and cursing. My brothers, these things ought not to be so. Does a spring send out from the same opening fresh and bitter water?' },
      { is: 'wise', ref: 'James 3:17', text: 'But the wisdom that is from above is first pure, then peaceful, gentle, reasonable, full of mercy and good fruits, without partiality, and without hypocrisy.' }
    ],
    next: 'hotpoll',
    done: { text: 'Does a spring send out from the same opening fresh and bitter water?', ref: 'James 3:11', prayer: 'Lord, make my mouth a fountain. Set a guard over my words today. Amen.' }
  },
  hotpoll: {
    title: 'Stay HOT',
    verse: { ref: '2 Corinthians 12:9', text: '“My grace is sufficient for you, for my power is made perfect in weakness.”' },
    intro: 'Humble, open, transparent. Most of us run warm in some and cold in others. No names — be honest.',
    qs: [
      { q: 'Which is hardest for you?', opts: [
        ['h', '🙇', 'Humble — I don’t have it all together'], ['o', '👂', 'Open — I let people speak into my life'], ['t', '🪟', 'Transparent — the people closest to me know my real struggles']
      ] }
    ],
    done: { text: 'If we walk in the light, as he is in the light, we have fellowship with one another.', ref: '1 John 1:7', prayer: 'Jesus, I don’t have to hide. Show me one person to let in. Amen.' }
  },

  never: {
    title: '“Never, Lord”',
    verse: { ref: 'Matthew 16:22', text: 'Peter took him aside, and began to rebuke him, saying, “Far be it from you, Lord! This will never be done to you.”' },
    intro: 'Peter loved Jesus — and still said “Never, Lord.” Most of our “nevers” aren’t scandals. They’re ordinary, good things we quietly keep for ourselves. No names. Just be honest.',
    qs: [
      { q: 'Where might you be saying “Never, Lord”?', sub: 'Pick the one that tugs at you most.', opts: OPTS_NEVER },
      { q: 'If Jesus asked you for it today, you’d honestly say…', sub: 'Peter’s “never” wasn’t the end of his story.', opts: [
        ['never', '🙅', '“Never, Lord”'], ['think', '🤔', '“Let me think about it”'], ['slowly', '😬', '“Yes… slowly”'], ['yes', '🙌', '“Yes, Lord”']
      ] }
    ],
    done: { text: '“Lord, you know everything. You know that I love you.”', ref: 'John 21:17 — the same Peter, later', prayer: 'Jesus, this is the place I’ve been holding on. I’m opening my hand — even a little. Amen.' }
  },
  staff: {
    title: 'Pick it back up',
    verse: { ref: 'Exodus 4:2–4', text: 'Yahweh said to him, “What is that in your hand?” He said, “A rod.” He said, “Throw it on the ground.” He threw it on the ground, and it became a snake; and Moses ran away from it. Yahweh said to Moses, “Stretch out your hand, and take it by the tail.” He stretched out his hand, and took hold of it, and it became a rod in his hand.' },
    intro: 'Moses laid his staff down — and then God told him to pick it back up. Same stick. But now it was “God’s rod” (Exodus 4:20). Laying something down isn’t running from it forever. It’s handing it to God so you can pick it back up his way.',
    from: 'never',
    qs: [
      { q: 'What’s in your hand?', sub: 'The thing you laid down. Same thing — now let’s pick it back up.', opts: OPTS_NEVER },
      { q: 'How will you pick it back up this week?', sub: 'One small way is enough.', pickup: true, opts: [
        ['ask', '🙏', 'Ask God how he sees it'], ['step', '👣', 'One small change, starting this week'], ['talk', '🤝', 'Talk it through with someone I trust'],
        ['word', '📖', 'Find what Scripture says about it'], ['thanks', '💛', 'Thank God for it as a gift']
      ] }
    ],
    done: { text: 'Moses took God’s rod in his hand.', ref: 'Exodus 4:20', prayer: 'God, I gave this to you. Now I take it back as yours — show me how to carry it well. Amen.' }
  }
};

/* Moses' staff: each "Never, Lord" area picked back up God's way — not something to be ashamed of or run from,
   but the same thing, redeemed. Our own words; the verses are the WEB. */
export const PICK_UP = {
  plans: { habit: 'Pray over my plans with open hands', up: 'Plan — with open hands', how: 'Planning isn’t the problem; gripping the plan is. Keep dreaming and writing it down, then hold it loosely and let God edit.', ask: 'God, what would you add, change or cross out?', step: 'Write your next 12 months on one page — then pray over it with an open hand.', ref: 'Proverbs 16:3', text: 'Commit your deeds to Yahweh, and your plans shall succeed.' },
  money: { habit: 'Check my spending with God', up: 'Make and manage money with God', how: 'Money isn’t evil to run from. God gives the power to earn it. Pick it back up as a steward: earn honestly, give first, save some, enjoy some, owe no one.', ask: 'God, how do you want me to earn, give, save and spend?', step: 'Make a simple budget this week, and decide what you’ll give first.', ref: 'Deuteronomy 8:18', text: 'But you shall remember Yahweh your God, for it is he who gives you power to get wealth…' },
  phone: { habit: 'No phone for the first 20 minutes', up: 'Make your phone serve you', how: 'Your phone can scatter you or connect you. Pick it back up on purpose: for people, for learning, for worship — not as the first and last thing in your day.', ask: 'God, what would a faithful use of my phone look like?', step: 'Pick one rule: no phone for the first 20 minutes of the day, or put it away at meals.', ref: 'Ephesians 5:15–16', text: 'Therefore watch carefully how you walk, not as unwise, but as wise; redeeming the time…' },
  marry: { habit: 'Delight in God before my desires', up: 'Desire marriage, trust the timing', how: 'Wanting a spouse is a good desire God put there. Pick it back up by becoming someone worth marrying, and trusting God with the who and the when.', ask: 'God, who are you shaping me to be while I wait?', step: 'Name one way to grow in character this month — and one friendship to invest in.', ref: 'Psalm 37:4', text: 'Also delight yourself in Yahweh, and he will give you the desires of your heart.' },
  home: { habit: 'Pray for my street or city', up: 'Seek the good of wherever you are', how: 'Where you live matters to God — not as a cage or a trophy, but a place to bless. Pick it back up: plant roots where you are and stay open to where he sends.', ask: 'God, how can I bless the place I’m in right now?', step: 'Pray for your street or city this week, and do one kind thing for a neighbour.', ref: 'Jeremiah 29:7', text: 'Seek the peace of the city where I have caused you to be carried away captive, and pray to Yahweh for it; for in its peace you will have peace.' },
  family: { habit: 'Pray for my family by name', up: 'Honour your family — and be yourself', how: 'You don’t have to obey every expectation or run from your family. Pick it back up with honour and love: secure in God’s love, close to them, and still able to say a kind, clear “this is my calling.”', ask: 'God, how do I honour them and still follow you?', step: 'Call or message a parent this week just to say thank you — no agenda.', ref: 'Exodus 20:12 · Ephesians 4:15', text: '“Honor your father and your mother…” … speaking truth in love, we may grow up in all things into him.' },
  dream: { habit: 'One real step toward my dream', up: 'Work hard — for him', how: 'Your gifts and dreams aren’t selfish; God gave them. Pick them back up as worship: do the work with all your heart, for his name, not yours.', ask: 'God, how could my dream serve you and people?', step: 'Take one real step toward it this month: a class, an email, a conversation.', ref: 'Colossians 3:23', text: 'And whatever you do, work heartily, as for the Lord, and not for men.' },
  comfort: { habit: 'Real rest, and one hard holy thing', up: 'Rest well, then go', how: 'Jesus told his friends to rest. Comfort as a god keeps you small; rest as a gift makes you strong. Pick it back up: real rest, so you can do hard and holy things.', ask: 'God, where do I need real rest — and where am I just hiding?', step: 'Plan one real Sabbath this week — and one hard, holy thing.', ref: 'Mark 6:31', text: 'He said to them, “You come apart into a deserted place, and rest awhile.”' },
  image: { habit: 'One good deed no one sees', up: 'Let your light shine — for his glory', how: 'Being seen isn’t wrong. Pick it back up: live so people see good things and thank God — not so they clap for you.', ask: 'God, what do you say about me, before anyone else does?', step: 'Do one good thing this week that no one will ever know about.', ref: 'Matthew 5:16', text: 'Even so, let your light shine before men; that they may see your good works, and glorify your Father who is in heaven.' },
  control: { habit: 'Give God what isn’t mine to hold', up: 'From control to faithful stewardship', how: 'Your drive to lead and organise is a gift. Pick it back up as stewardship: be faithful with what’s yours, and let God hold what isn’t.', ask: 'God, what’s mine to steward, and what’s yours to hold?', step: 'Write two lists: “mine to do” and “God’s to hold.” Pray over the second.', ref: 'Matthew 25:21', text: '“Well done, good and faithful servant. You have been faithful over a few things, I will set you over many things.”' },
  hurt: { habit: 'Pray “I choose to forgive”', up: 'Let God redeem the story', how: 'You don’t have to pretend it didn’t happen or keep carrying it alone. Pick it back up with God: what was meant for harm, he can turn for good — including helping others.', ask: 'God, what do you want to heal here, and who could I forgive?', step: 'Tell one safe person the story, or pray a first small “I choose to forgive.”', ref: 'Genesis 50:20', text: 'As for you, you meant evil against me, but God meant it for good…' },
  other: { habit: 'Tell God honestly what’s in my hand', up: 'Bring it into the light, with God', how: 'You don’t have to name it here. Just don’t run from it. God isn’t ashamed of you; he wants to lead you in the way that’s life.', ask: 'God, search me — what do you want me to pick up here?', step: 'Tell God honestly, then consider one trusted person to tell.', ref: 'Psalm 139:23–24', text: 'Search me, God, and know my heart. … lead me in the everlasting way.' }
};

