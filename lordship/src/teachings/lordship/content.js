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
  anchor: 'This week we live in James. One chapter a day. Five minutes. Underline one thing to do.',
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
    id: 'wed', dow: 3, name: 'Wednesday', title: 'Laying Down', james: 3,
    sticky: 'You can’t hold what he asks you to lay down.',
    bigIdea: 'A right is anything I believe I’m owed. Laying it down isn’t losing it — it’s handing it to someone I trust more than myself. Open hands can receive; closed hands can only hold on.',
    scripture: [
      { ref: 'Genesis 22:2, 14', text: '“Now take your son, your only son, whom you love, even Isaac, and go into the land of Moriah. Offer him there as a burnt offering on one of the mountains which I will tell you of.” … Abraham called the name of that place Yahweh Will Provide.' },
      { ref: 'Luke 9:23', text: 'He said to all, “If anyone desires to come after me, let him deny himself, take up his cross, and follow me.”' },
      { ref: 'Philippians 2:6–7', text: 'who, existing in the form of God, didn’t consider equality with God a thing to be grasped, but emptied himself, taking the form of a servant, being made in the likeness of men.' },
      { ref: 'James 4:7, 10', text: 'Be subject therefore to God. Resist the devil, and he will flee from you. … Humble yourselves in the sight of the Lord, and he will exalt you.' }
    ],
    study: 'Genesis 22:1–14 · Philippians 2:5–11',
    questions: [
      'Which right would be hardest for you to lay down?',
      'What’s your “never, Lord”?',
      'Have you ever laid something down and received more back?'
    ],
    listen: 'Holy Spirit, what are you asking me to put in your hands?',
    response: 'Write one right down. Bring it forward when you’re ready, and pray: “Jesus, this is yours.”',
    respond: [
      { tool: 'rights', why: 'Pick the right you’re laying down, and give it to Jesus.' },
      { tool: 'laydown', why: 'Lay your plans next to his — money, romance, your future, where you live.' }
    ]
  },
  {
    id: 'thu', dow: 4, name: 'Thursday', title: 'Stay HOT', james: 4,
    sticky: 'His power is amplified when my weakness is magnified.',
    bigIdea: 'Humble, Open, Transparent. If it’s “none of your business”, it’s probably a Lordship area. Hiding weakness doesn’t make us strong; it makes us alone. The goal: secure and teachable.',
    scripture: [
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
      { tool: 'hot', why: 'The honesty check, then your mentor map: Paul, Barnabas, Timothy.' },
      { tool: 'questions', why: 'A question you’d rather ask privately? It’s anonymous.' }
    ]
  },
  {
    id: 'fri', dow: 5, name: 'Friday', title: 'Taking Up', james: 5,
    sticky: 'Easy to die for Jesus. Hard to live for him.',
    bigIdea: 'All week we’ve laid things down; today we pick up what God hands us — habits, responsibility, a plan, and the nations. A living sacrifice gets up off the altar every day.',
    scripture: [
      { ref: 'Romans 12:1', text: 'Therefore I urge you, brothers, by the mercies of God, to present your bodies a living sacrifice, holy, acceptable to God, which is your spiritual service.' },
      { ref: '2 Timothy 2:3–6', text: 'You therefore must endure hardship, as a good soldier of Christ Jesus. No soldier on duty entangles himself in the affairs of life, that he may please him who enrolled him as a soldier. Also, if anyone competes in athletics, he isn’t crowned unless he has competed by the rules. The farmer who labors must be the first to get a share of the crops.' },
      { ref: 'Luke 4:18 · John 5:19', text: '“The Spirit of the Lord is on me, because he has anointed me to preach good news to the poor.” … “The Son can do nothing of himself, but what he sees the Father doing.”' },
      { ref: 'James 1:27', text: 'Pure religion and undefiled before our God and Father is this: to visit the fatherless and widows in their affliction, and to keep oneself unstained by the world.' }
    ],
    study: 'Romans 12:1–2 · 2 Timothy 2:3–6',
    questions: [
      'What is God asking you to pick up, not just lay down?',
      'Which part of your wheel is most out of line?',
      'What habit would change your next two years?'
    ],
    listen: 'Holy Spirit, what are you handing me to carry?',
    response: 'The throw-down: come forward, throw something down, and say out loud what you’re picking up — including what you’ll do for the nations.',
    respond: [
      { tool: 'commit', why: 'Your throw-down: what you’re picking up. Declare it.' },
      { tool: 'wheel', why: 'Heart, soul, mind, strength — which part is most out of line?' },
      { tool: 'growth', why: '2, 5, 10 years: firm foundations, force for change, frontier missions.' },
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
