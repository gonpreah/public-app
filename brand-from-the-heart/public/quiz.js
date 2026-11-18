/* Brand From the Heart: "Which brand archetype are you?" Fourteen questions in three parts:
 * how you show up, what drives you, how you create. Scenarios more than hobbies, so the result
 * says something about character, not only taste.
 *
 * Khmer (km) is a draft by Claude, unreviewed: have a native speaker check it.
 * Logos are the property of their owners, shown unaltered for education only (see brands.js);
 * this file holds no logos.
 * Archetype ids match window.BFH_ARCHETYPES in brands.js; ties go to the one earlier there.
 * Balance: every option gives 2 to one archetype and usually 1 to another; each archetype leads
 * an option in 12 of the 14 questions and is a second in the other two, so each can reach 26.
 * Faith shows up in many answers: the "faith" archetype is about mission and calling, not about
 * being more Christian than the others.
 */
window.BFH_QUIZ_PARTS = [
  { id: 'show', emoji: '🪞', en: 'How you show up', km: 'របៀបដែលអ្នកបង្ហាញខ្លួន' },
  { id: 'drive', emoji: '🔥', en: 'What drives you', km: 'អ្វីដែលជំរុញអ្នក' },
  { id: 'create', emoji: '🎬', en: 'How you create', km: 'របៀបដែលអ្នកបង្កើត' }
];

window.BFH_QUIZ = [
  /* --- how you show up --- */
  { id: 'q1', part: 'show',
    q: { en: 'A friend messages you late at night. They are hurting. You…', km: 'មិត្តម្នាក់ផ្ញើសារមកអ្នកយប់ជ្រៅ។ គាត់កំពុងឈឺចាប់។ អ្នក…' },
    hint: { en: 'Pick what you would really do first.', km: 'ជ្រើសអ្វីដែលអ្នកពិតជានឹងធ្វើមុនគេ។' },
    options: [
      { id: 'a', emoji: '📞', en: 'Call right away and just listen', km: 'តេទៅភ្លាម ហើយគ្រាន់តែស្ដាប់', points: { warm: 2, sage: 1 } },
      { id: 'b', emoji: '🙏', en: 'Pray with them and send a promise', km: 'អធិស្ឋានជាមួយគាត់ ហើយផ្ញើសេចក្ដីសន្យាមួយ', points: { faith: 2, warm: 1 } },
      { id: 'c', emoji: '🧠', en: 'Help them understand what is happening', km: 'ជួយគាត់ឱ្យយល់ពីអ្វីដែលកំពុងកើតឡើង', points: { sage: 2, simple: 1 } },
      { id: 'd', emoji: '🛵', en: 'Ride over and take them out', km: 'ជិះម៉ូតូទៅរក ហើយនាំគាត់ចេញដើរ', points: { explorer: 2, bold: 1 } },
      { id: 'e', emoji: '😂', en: 'Make them laugh first, then talk', km: 'ធ្វើឱ្យគាត់សើចសិន ទើបនិយាយគ្នា', points: { playful: 2, explorer: 1 } },
      { id: 'f', emoji: '💪', en: 'Tell them: "You are stronger than this"', km: 'ប្រាប់គាត់ថា៖ «អ្នកខ្លាំងជាងរឿងនេះ»', points: { bold: 2, faith: 1 } }
    ] },
  { id: 'q2', part: 'show',
    q: { en: 'When the camera is on, your energy is…', km: 'ពេលកាមេរ៉ាបើក ថាមពលរបស់អ្នកគឺ…' },
    options: [
      { id: 'a', emoji: '⚡', en: 'Big, loud and full of fire', km: 'ធំ ខ្លាំង និងពោរពេញដោយភ្លើង', points: { bold: 2, playful: 1 } },
      { id: 'b', emoji: '🫶', en: 'Calm and close, like talking to one friend', km: 'ស្ងប់ និងជិតស្និទ្ធ ដូចនិយាយជាមួយមិត្តម្នាក់', points: { warm: 2, sage: 1 } },
      { id: 'c', emoji: '🎥', en: 'Behind the camera, showing the place', km: 'នៅក្រោយកាមេរ៉ា បង្ហាញទីកន្លែង', points: { explorer: 2, simple: 1 } },
      { id: 'd', emoji: '🤪', en: 'Jokes, faces and quick cuts', km: 'កំប្លែង ធ្វើមុខ និងកាត់វីដេអូលឿនៗ', points: { playful: 2, warm: 1 } },
      { id: 'e', emoji: '🎯', en: 'Short, clear and to the point', km: 'ខ្លី ច្បាស់ និងចំគោលដៅ', points: { simple: 2, sage: 1 } },
      { id: 'f', emoji: '📣', en: 'Passionate, like sharing big news', km: 'ពោរពេញដោយចំណង់ ដូចប្រកាសដំណឹងធំ', points: { faith: 2, playful: 1 } }
    ] },
  { id: 'q3', part: 'show',
    q: { en: 'Which words would mean the most to you?', km: 'ពាក្យណាមួយមានន័យបំផុតសម្រាប់អ្នក?' },
    hint: { en: 'Imagine someone says this about you.', km: 'ស្រមៃថាមាននរណាម្នាក់និយាយបែបនេះអំពីអ្នក។' },
    options: [
      { id: 'a', emoji: '🏅', en: '"You never give up."', km: '«អ្នកមិនដែលបោះបង់ទេ។»', points: { bold: 2, explorer: 1 } },
      { id: 'b', emoji: '💎', en: '"You make things so clear."', km: '«អ្នកធ្វើឱ្យរឿងច្បាស់ណាស់។»', points: { simple: 2, sage: 1 } },
      { id: 'c', emoji: '🏠', en: '"I feel at home with you."', km: '«ខ្ញុំមានអារម្មណ៍ដូចនៅផ្ទះ ពេលនៅជាមួយអ្នក។»', points: { warm: 2 } },
      { id: 'd', emoji: '💡', en: '"You taught me something new."', km: '«អ្នកបានបង្រៀនខ្ញុំនូវរឿងថ្មីមួយ។»', points: { sage: 2 } },
      { id: 'e', emoji: '🕊️', en: '"You made me want to know God."', km: '«អ្នកធ្វើឱ្យខ្ញុំចង់ស្គាល់ព្រះ។»', points: { faith: 2, warm: 1 } },
      { id: 'f', emoji: '🎨', en: '"How do you think of these ideas?!"', km: '«តើអ្នកគិតគំនិតទាំងនេះបានយ៉ាងម៉េច?!»', points: { playful: 2, explorer: 1 } }
    ] },
  { id: 'q4', part: 'show',
    q: { en: 'Your team is losing at half-time. You…', km: 'ក្រុមរបស់អ្នកកំពុងចាញ់ ពេលសម្រាកពាក់កណ្ដាលម៉ោង។ អ្នក…' },
    options: [
      { id: 'a', emoji: '📢', en: 'Shout: "Come on, we can still win!"', km: 'ស្រែកថា៖ «តស៊ូ យើងនៅតែអាចឈ្នះ!»', points: { bold: 2, faith: 1 } },
      { id: 'b', emoji: '📋', en: 'Make one simple new plan', km: 'រៀបផែនការថ្មីសាមញ្ញមួយ', points: { simple: 2, bold: 1 } },
      { id: 'c', emoji: '🔍', en: 'Find out what is going wrong', km: 'ស្វែងរកថាអ្វីដែលខុស', points: { sage: 2, simple: 1 } },
      { id: 'd', emoji: '🤸', en: 'Do something silly to lift everyone', km: 'ធ្វើអ្វីកំប្លែងមួយ ដើម្បីលើកទឹកចិត្តគ្រប់គ្នា', points: { playful: 2, warm: 1 } },
      { id: 'e', emoji: '🤲', en: 'Gather everyone to pray together', km: 'ប្រមូលគ្នាអធិស្ឋានជាមួយគ្នា', points: { faith: 2, warm: 1 } },
      { id: 'f', emoji: '🔄', en: 'Try a wild new idea', km: 'សាកល្បងគំនិតថ្មីប្លែកមួយ', points: { explorer: 2, playful: 1 } }
    ] },
  { id: 'q5', part: 'show',
    q: { en: 'Be honest: your messy side is…', km: 'និយាយត្រង់ៗ៖ ចំណុចខ្សោយរបស់អ្នកគឺ…' },
    hint: { en: 'Everyone has one. It tells us a lot.', km: 'មនុស្សគ្រប់គ្នាមាន។ វាប្រាប់យើងច្រើន។' },
    options: [
      { id: 'a', emoji: '😤', en: 'I get impatient with slow people', km: 'ខ្ញុំអត់ធ្មត់មិនបាន ជាមួយមនុស្សយឺត', points: { bold: 2, simple: 1 } },
      { id: 'b', emoji: '🧊', en: 'I can seem cold or too quiet', km: 'ខ្ញុំអាចមើលទៅត្រជាក់ ឬស្ងាត់ពេក', points: { simple: 2, sage: 1 } },
      { id: 'c', emoji: '🥺', en: 'I say yes to everyone', km: 'ខ្ញុំឆ្លើយ «បាទ/ចាស» ទៅគ្រប់គ្នា', points: { warm: 2, faith: 1 } },
      { id: 'd', emoji: '🦋', en: 'I start things and get bored', km: 'ខ្ញុំចាប់ផ្ដើមរឿងច្រើន ហើយឆាប់ធុញ', points: { explorer: 2, playful: 1 } },
      { id: 'e', emoji: '🌀', en: 'I overthink everything', km: 'ខ្ញុំគិតច្រើនពេកលើគ្រប់រឿង', points: { sage: 2, warm: 1 } },
      { id: 'f', emoji: '🔥', en: 'I get upset when people do not care', km: 'ខ្ញុំខឹង ពេលមនុស្សមិនខ្វល់', points: { faith: 2, bold: 1 } }
    ] },

  /* --- what drives you --- */
  { id: 'q6', part: 'drive',
    q: { en: 'What makes you angry about the world?', km: 'អ្វីដែលធ្វើឱ្យអ្នកខឹងអំពីពិភពលោក?' },
    hint: { en: 'What you fight against shows what you love.', km: 'អ្វីដែលអ្នកប្រឆាំង បង្ហាញពីអ្វីដែលអ្នកស្រឡាញ់។' },
    options: [
      { id: 'a', emoji: '🥀', en: 'Young people giving up on their dreams', km: 'យុវជនបោះបង់ក្ដីស្រមៃរបស់ខ្លួន', points: { bold: 2, warm: 1 } },
      { id: 'b', emoji: '📢', en: 'Too much noise and fake content', km: 'សំឡេងរំខាន និងមាតិកាក្លែងក្លាយច្រើនពេក', points: { simple: 2, sage: 1 } },
      { id: 'c', emoji: '🫥', en: 'People who feel alone and unseen', km: 'មនុស្សដែលមានអារម្មណ៍ឯកា ហើយគ្មាននរណាឃើញ', points: { warm: 2, faith: 1 } },
      { id: 'd', emoji: '🧩', en: 'People believing lies without asking why', km: 'មនុស្សជឿការកុហក ដោយមិនសួរថាហេតុអ្វី', points: { sage: 2, explorer: 1 } },
      { id: 'e', emoji: '🌏', en: 'Places where no one has heard of Jesus', km: 'កន្លែងដែលគ្មាននរណាម្នាក់ធ្លាប់ឮអំពីព្រះយេស៊ូវ', points: { faith: 2, explorer: 1 } },
      { id: 'f', emoji: '🖍️', en: 'Kids with no space to play or create', km: 'ក្មេងៗគ្មានកន្លែងលេង ឬច្នៃប្រឌិត', points: { playful: 2, explorer: 1 } }
    ] },
  { id: 'q7', part: 'drive',
    q: { en: 'You must make a big choice. You…', km: 'អ្នកត្រូវធ្វើការសម្រេចចិត្តធំមួយ។ អ្នក…' },
    options: [
      { id: 'a', emoji: '⚡', en: 'Trust my gut and go', km: 'ទុកចិត្តលើអារម្មណ៍ខ្លួនឯង ហើយធ្វើតែម្ដង', points: { bold: 2, explorer: 1 } },
      { id: 'b', emoji: '📚', en: 'Read and compare everything first', km: 'អាន និងប្រៀបធៀបគ្រប់យ៉ាងជាមុនសិន', points: { sage: 2, simple: 1 } },
      { id: 'c', emoji: '🕯️', en: 'Pray and wait until I have peace', km: 'អធិស្ឋាន ហើយរង់ចាំរហូតមានសេចក្ដីសុខក្នុងចិត្ត', points: { faith: 2, sage: 1 } },
      { id: 'd', emoji: '☕', en: 'Talk it over with people I love', km: 'ពិភាក្សាជាមួយមនុស្សដែលខ្ញុំស្រឡាញ់', points: { warm: 2, faith: 1 } },
      { id: 'e', emoji: '📝', en: 'Write a short list: yes or no', km: 'សរសេរបញ្ជីខ្លីមួយ៖ ល្អ ឬមិនល្អ', points: { simple: 2, sage: 1 } },
      { id: 'f', emoji: '🧪', en: 'Try it small and see', km: 'សាកល្បងតិចៗសិន ហើយមើល', points: { explorer: 2, playful: 1 } }
    ] },
  { id: 'q8', part: 'drive',
    q: { en: 'Five years from now, success looks like…', km: 'ប្រាំឆ្នាំទៀត ភាពជោគជ័យមើលទៅដូចជា…' },
    options: [
      { id: 'a', emoji: '🏆', en: 'I reached a big goal I trained for', km: 'ខ្ញុំសម្រេចគោលដៅធំមួយ ដែលខ្ញុំបានហ្វឹកហាត់', points: { bold: 2, simple: 1 } },
      { id: 'b', emoji: '✈️', en: 'I have lived and served in new places', km: 'ខ្ញុំបានរស់នៅ និងបម្រើនៅកន្លែងថ្មីៗ', points: { explorer: 2, faith: 1 } },
      { id: 'c', emoji: '🏡', en: 'A strong, close community around me', km: 'សហគមន៍រឹងមាំ និងជិតស្និទ្ធនៅជុំវិញខ្ញុំ', points: { warm: 2 } },
      { id: 'd', emoji: '🎓', en: 'Many people learn from what I teach', km: 'មនុស្សជាច្រើនរៀនពីអ្វីដែលខ្ញុំបង្រៀន', points: { sage: 2, simple: 1 } },
      { id: 'e', emoji: '🔥', en: 'A ministry reaching young people in my province', km: 'ព័ន្ធកិច្ចមួយដែលទៅដល់យុវជននៅខេត្តរបស់ខ្ញុំ', points: { faith: 2, bold: 1 } },
      { id: 'f', emoji: '🎬', en: 'My own creative studio or channel', km: 'ស្ទូឌីយោ ឬឆានែលច្នៃប្រឌិតផ្ទាល់ខ្លួន', points: { playful: 2, explorer: 1 } }
    ] },
  { id: 'q9', part: 'drive',
    q: { en: 'The leader you would follow anywhere is…', km: 'អ្នកដឹកនាំដែលអ្នកនឹងដើរតាមគ្រប់ទីកន្លែងគឺ…' },
    options: [
      { id: 'a', emoji: '🥇', en: 'A coach who pushes you hard', km: 'គ្រូបង្វឹកម្នាក់ដែលជំរុញអ្នកយ៉ាងខ្លាំង', points: { bold: 2 } },
      { id: 'b', emoji: '🧭', en: 'A quiet leader with a clear vision', km: 'អ្នកដឹកនាំស្ងាត់ៗ ដែលមានចក្ខុវិស័យច្បាស់', points: { simple: 2, sage: 1 } },
      { id: 'c', emoji: '🤝', en: 'Someone who knows your name and story', km: 'អ្នកដែលស្គាល់ឈ្មោះ និងរឿងរ៉ាវរបស់អ្នក', points: { warm: 2, sage: 1 } },
      { id: 'd', emoji: '🏔️', en: 'A pioneer who goes first into new places', km: 'អ្នកត្រួសត្រាយដែលទៅមុនគេ ក្នុងកន្លែងថ្មីៗ', points: { explorer: 2, bold: 1 } },
      { id: 'e', emoji: '🌅', en: 'A dreamer with a God-sized vision', km: 'អ្នកមានក្ដីស្រមៃ ដែលមានចក្ខុវិស័យធំដូចព្រះ', points: { faith: 2, explorer: 1 } },
      { id: 'f', emoji: '🎸', en: 'A creative who breaks boring rules', km: 'អ្នកច្នៃប្រឌិត ដែលបំបែកច្បាប់គួរឱ្យធុញ', points: { playful: 2, simple: 1 } }
    ] },
  { id: 'q10', part: 'drive',
    q: { en: 'At the end of your life, you want people to say…', km: 'នៅចុងបញ្ចប់ជីវិត អ្នកចង់ឱ្យមនុស្សនិយាយថា…' },
    hint: { en: 'Think long. This one is deep.', km: 'គិតឱ្យវែង។ សំណួរនេះជ្រៅ។' },
    options: [
      { id: 'a', emoji: '🌿', en: '"Their life was simple and true."', km: '«ជីវិតរបស់គាត់សាមញ្ញ និងពិតប្រាកដ។»', points: { simple: 2, warm: 1 } },
      { id: 'b', emoji: '❤️', en: '"They loved people so well."', km: '«គាត់បានស្រឡាញ់មនុស្សយ៉ាងល្អ។»', points: { warm: 2, faith: 1 } },
      { id: 'c', emoji: '🗺️', en: '"They went where no one else would."', km: '«គាត់បានទៅកន្លែងដែលគ្មាននរណាហ៊ានទៅ។»', points: { explorer: 2, bold: 1 } },
      { id: 'd', emoji: '🦉', en: '"They helped us think and grow."', km: '«គាត់បានជួយយើងឱ្យចេះគិត និងរីកចម្រើន។»', points: { sage: 2, simple: 1 } },
      { id: 'e', emoji: '✝️', en: '"Because of them, many found Jesus."', km: '«ដោយសារគាត់ មនុស្សជាច្រើនបានស្គាល់ព្រះយេស៊ូវ។»', points: { faith: 2, bold: 1 } },
      { id: 'f', emoji: '🎈', en: '"Life was more fun with them."', km: '«ជីវិតសប្បាយជាង ពេលមានគាត់។»', points: { playful: 2, warm: 1 } }
    ] },

  /* --- how you create --- */
  { id: 'q11', part: 'create',
    q: { en: 'A free day and a phone. What do you film first?', km: 'ថ្ងៃទំនេរមួយ និងទូរស័ព្ទមួយ។ តើអ្នកថតអ្វីមុនគេ?' },
    options: [
      { id: 'a', emoji: '🏋️', en: 'A workout or sports challenge', km: 'ការហាត់ប្រាណ ឬការប្រកួតកីឡា', points: { bold: 2, playful: 1 } },
      { id: 'b', emoji: '🌤️', en: 'A slow, beautiful morning routine', km: 'ទម្លាប់ពេលព្រឹកយឺតៗ និងស្អាត', points: { simple: 2, warm: 1 } },
      { id: 'c', emoji: '🍜', en: 'A street food tour in a new town', km: 'ដើរភ្លក់អាហារតាមផ្លូវ នៅទីក្រុងថ្មីមួយ', points: { explorer: 2, playful: 1 } },
      { id: 'd', emoji: '⏱️', en: 'A one-minute lesson on what I know', km: 'មេរៀនមួយនាទី អំពីអ្វីដែលខ្ញុំដឹង', points: { sage: 2, simple: 1 } },
      { id: 'e', emoji: '🎤', en: 'My testimony, or a worship song', km: 'ទីបន្ទាល់របស់ខ្ញុំ ឬបទចម្រៀងថ្វាយបង្គំ', points: { faith: 2, playful: 1 } },
      { id: 'f', emoji: '🎭', en: 'A funny skit with my friends', km: 'ល្ខោនកំប្លែងខ្លីជាមួយមិត្តភក្ដិ', points: { playful: 2, bold: 1 } }
    ] },
  { id: 'q12', part: 'create',
    q: { en: 'Scrolling, which post do you save?', km: 'ពេលអូសមើល តើអ្នករក្សាទុកការបង្ហោះប្រភេទណា?' },
    options: [
      { id: 'a', emoji: '🚀', en: 'Motivation for a hard day', km: 'ពាក្យលើកទឹកចិត្តសម្រាប់ថ្ងៃពិបាក', points: { bold: 2, faith: 1 } },
      { id: 'b', emoji: '🤍', en: 'A clean, beautiful design', km: 'ការរចនាស្អាត និងសាមញ្ញ', points: { simple: 2, playful: 1 } },
      { id: 'c', emoji: '🥹', en: 'A real story that made me cry', km: 'រឿងពិតមួយដែលធ្វើឱ្យខ្ញុំយំ', points: { warm: 2, faith: 1 } },
      { id: 'd', emoji: '📍', en: 'A place I must visit', km: 'កន្លែងមួយដែលខ្ញុំត្រូវតែទៅ', points: { explorer: 2 } },
      { id: 'e', emoji: '📊', en: 'Tips, facts and how-tos', km: 'គន្លឹះ ការពិត និងរបៀបធ្វើ', points: { sage: 2, simple: 1 } },
      { id: 'f', emoji: '🤣', en: 'A clever meme or creative edit', km: 'មីមឆ្លាតៗ ឬការកាត់តវីដេអូច្នៃប្រឌិត', points: { playful: 2, explorer: 1 } }
    ] },
  { id: 'q13', part: 'create',
    q: { en: 'Your desk or room looks like…', km: 'តុ ឬបន្ទប់របស់អ្នកមើលទៅដូចជា…' },
    options: [
      { id: 'a', emoji: '👟', en: 'Gym bag, shoes and goals on the wall', km: 'កាបូបហាត់ប្រាណ ស្បែកជើង និងគោលដៅលើជញ្ជាំង', points: { bold: 2 } },
      { id: 'b', emoji: '🪴', en: 'Clean. Only what I need', km: 'ស្អាត។ មានតែអ្វីដែលខ្ញុំត្រូវការ', points: { simple: 2 } },
      { id: 'c', emoji: '🖼️', en: 'Photos of friends and a verse card', km: 'រូបថតមិត្តភក្ដិ និងកាតខគម្ពីរ', points: { warm: 2, faith: 1 } },
      { id: 'd', emoji: '🎒', en: 'A backpack, maps and things from trips', km: 'កាបូបស្ពាយ ផែនទី និងរបស់ពីដំណើរកម្សាន្ត', points: { explorer: 2, bold: 1 } },
      { id: 'e', emoji: '📚', en: 'Piles of books and notes', km: 'គំនរសៀវភៅ និងកំណត់ត្រា', points: { sage: 2, faith: 1 } },
      { id: 'f', emoji: '🎨', en: 'Colour, art things and a little chaos', km: 'ពណ៌ សម្ភារៈសិល្បៈ និងរញ៉េរញ៉ៃបន្តិច', points: { playful: 2, explorer: 1 } }
    ] },
  { id: 'q14', part: 'create',
    q: { en: 'Your post gets almost no likes. You…', km: 'ការបង្ហោះរបស់អ្នកស្ទើរតែគ្មានអ្នកចុចចូលចិត្ត។ អ្នក…' },
    hint: { en: 'How you handle a flop says a lot.', km: 'របៀបដែលអ្នកដោះស្រាយពេលបរាជ័យ ប្រាប់ច្រើន។' },
    options: [
      { id: 'a', emoji: '✂️', en: 'Cut it down and make it clearer', km: 'កាត់ឱ្យខ្លី ហើយធ្វើឱ្យច្បាស់ជាងមុន', points: { simple: 2, sage: 1 } },
      { id: 'b', emoji: '💬', en: 'Ask friends how it made them feel', km: 'សួរមិត្តភក្ដិថាពួកគេមានអារម្មណ៍យ៉ាងណា', points: { warm: 2 } },
      { id: 'c', emoji: '🔀', en: 'Try a totally different style', km: 'សាកល្បងរចនាប័ទ្មខុសគ្នាទាំងស្រុង', points: { explorer: 2, playful: 1 } },
      { id: 'd', emoji: '📈', en: 'Study the numbers and learn why', km: 'សិក្សាលេខស្ថិតិ ហើយរៀនពីមូលហេតុ', points: { sage: 2, bold: 1 } },
      { id: 'e', emoji: '🙌', en: 'Remember who I really post for', km: 'នឹកចាំថាខ្ញុំបង្ហោះសម្រាប់អ្នកណាពិតប្រាកដ', points: { faith: 2, warm: 1 } },
      { id: 'f', emoji: '😆', en: 'Laugh, make a meme, post again', km: 'សើច ធ្វើមីមមួយ ហើយបង្ហោះម្ដងទៀត', points: { playful: 2, bold: 1 } }
    ] }
];

window.BFH_QUIZ_RESULTS = {
  bold: {
    title: { en: 'The Champion', km: 'ជើងឯក' },
    text: { en: 'You push people to be brave and keep going. You know that growing hurts sometimes, and you go first anyway. When you post, people feel they can run their race too.', km: 'អ្នកជំរុញមនុស្សឱ្យក្លាហាន និងបន្តទៅមុខ។ អ្នកដឹងថាការរីកចម្រើនពេលខ្លះឈឺចាប់ ប៉ុន្តែអ្នកនៅតែទៅមុនគេ។ ពេលអ្នកបង្ហោះ មនុស្សមានអារម្មណ៍ថាពួកគេក៏អាចរត់ការប្រណាំងរបស់ខ្លួនដែរ។' },
    strengths: [
      { en: 'Brave and full of energy', km: 'ក្លាហាន និងពោរពេញដោយថាមពល' },
      { en: 'Short, strong words that move people', km: 'ពាក្យខ្លី និងខ្លាំង ដែលរំជួលមនុស្ស' },
      { en: 'You help others not give up', km: 'អ្នកជួយអ្នកដទៃកុំឱ្យបោះបង់' }
    ],
    watch: { en: 'Not every post must be loud. Show your soft side and your weak days too: that is where people trust you.', km: 'មិនមែនគ្រប់ការបង្ហោះត្រូវតែខ្លាំងនោះទេ។ បង្ហាញផ្នែកទន់ និងថ្ងៃខ្សោយរបស់អ្នកផងដែរ៖ នោះហើយជាកន្លែងដែលមនុស្សទុកចិត្តអ្នក។' },
    brand: { en: 'Strong contrast: black, white and one hot colour like red or orange. Thick, bold letters. A voice that says "You can. Go."', km: 'ពណ៌ផ្ទុយគ្នាខ្លាំង៖ ខ្មៅ ស និងពណ៌ក្ដៅមួយ ដូចជាក្រហម ឬទឹកក្រូច។ អក្សរក្រាស់ៗ។ សំឡេងដែលនិយាយថា «អ្នកអាច។ ទៅ!»' },
    content: [
      { en: 'A 30-day challenge, filmed one short clip a day', km: 'ការប្រកួតប្រជែង ៣០ថ្ងៃ ថតវីដេអូខ្លីមួយរៀងរាល់ថ្ងៃ' },
      { en: 'The story of a time you almost quit, and why you did not', km: 'រឿងពេលដែលអ្នកស្ទើរតែបោះបង់ និងហេតុអ្វីអ្នកមិនបោះបង់' },
      { en: 'A sunrise run with one sentence of courage for the day', km: 'រត់ពេលព្រះអាទិត្យរះ ជាមួយប្រយោគក្លាហានមួយសម្រាប់ថ្ងៃនេះ' }
    ],
    blend: { en: 'with a streak of courage', km: 'ជាមួយភាពក្លាហានបន្តិច' },
    verse: 'Joshua 1:9'
  },
  simple: {
    title: { en: 'The Clear Voice', km: 'សំឡេងច្បាស់លាស់' },
    text: { en: 'You bring peace and order to a noisy world. You can take something messy and make it simple. People come to your page to breathe and see what really matters.', km: 'អ្នកនាំសន្តិភាព និងសណ្ដាប់ធ្នាប់ មកក្នុងពិភពលោកដែលពោរពេញដោយសំឡេង។ អ្នកអាចយករឿងរញ៉េរញ៉ៃ មកធ្វើឱ្យសាមញ្ញ។ មនុស្សមកទំព័ររបស់អ្នក ដើម្បីដកដង្ហើម និងមើលឃើញអ្វីដែលសំខាន់ពិតប្រាកដ។' },
    strengths: [
      { en: 'Clean, calm design', km: 'ការរចនាស្អាត និងស្ងប់' },
      { en: 'Few words, very clear', km: 'ពាក្យតិច ច្បាស់ណាស់' },
      { en: 'Steady and easy to trust', km: 'ខ្ជាប់ខ្ជួន និងងាយទុកចិត្ត' }
    ],
    watch: { en: 'Simple is good, but do not be cold. Let people see your heart and your face.', km: 'សាមញ្ញគឺល្អ ប៉ុន្តែកុំត្រជាក់។ ឱ្យមនុស្សឃើញចិត្ត និងមុខរបស់អ្នក។' },
    brand: { en: 'Lots of white space, one or two soft colours, clean thin letters. A calm voice: one idea per post.', km: 'ចន្លោះទំនេរច្រើន ពណ៌ស្រាលមួយ ឬពីរ អក្សរស្ដើងស្អាត។ សំឡេងស្ងប់៖ គំនិតមួយ ក្នុងការបង្ហោះមួយ។' },
    content: [
      { en: 'One Bible idea explained in three simple slides', km: 'គំនិតមួយពីព្រះគម្ពីរ ពន្យល់ក្នុងស្លាយសាមញ្ញបី' },
      { en: 'A quiet "how I start my day" video, no talking', km: 'វីដេអូស្ងាត់ «របៀបដែលខ្ញុំចាប់ផ្ដើមថ្ងៃ» គ្មាននិយាយ' },
      { en: 'Before and after: making a messy space calm', km: 'មុន និងក្រោយ៖ ធ្វើឱ្យកន្លែងរញ៉េរញ៉ៃក្លាយជាស្ងប់' }
    ],
    blend: { en: 'with a calm, clear eye', km: 'ជាមួយភ្នែកស្ងប់ និងច្បាស់' },
    verse: 'Psalm 46:10'
  },
  warm: {
    title: { en: 'The Friend', km: 'មិត្តល្អ' },
    text: { en: 'You make people feel welcome and loved. You notice the one who sits alone. On your page, people feel they belong, like at a family meal.', km: 'អ្នកធ្វើឱ្យមនុស្សមានអារម្មណ៍ថាត្រូវបានស្វាគមន៍ និងស្រឡាញ់។ អ្នកកត់សម្គាល់អ្នកដែលអង្គុយម្នាក់ឯង។ នៅលើទំព័ររបស់អ្នក មនុស្សមានអារម្មណ៍ថាជាផ្នែកមួយ ដូចនៅពេលញ៉ាំបាយជុំគ្រួសារ។' },
    strengths: [
      { en: 'Kind and caring', km: 'ចិត្តល្អ និងយកចិត្តទុកដាក់' },
      { en: 'Real and honest', km: 'ពិតប្រាកដ និងស្មោះត្រង់' },
      { en: 'You build community', km: 'អ្នកកសាងសហគមន៍' }
    ],
    watch: { en: 'You cannot please everyone. Say what is true, even when it is not easy, and rest when you need to.', km: 'អ្នកមិនអាចធ្វើឱ្យមនុស្សគ្រប់គ្នាពេញចិត្តបានទេ។ និយាយអ្វីដែលពិត ទោះបីវាមិនងាយក៏ដោយ ហើយសម្រាកពេលអ្នកត្រូវការ។' },
    brand: { en: 'Warm colours like cream, gold and soft brown. Round, friendly letters and real faces. A voice like a friend talking over coffee.', km: 'ពណ៌កក់ក្ដៅ ដូចជាពណ៌ក្រែម មាស និងត្នោតស្រាល។ អក្សរមូលៗ រួសរាយ និងមុខមនុស្សពិត។ សំឡេងដូចមិត្តភក្ដិនិយាយគ្នាពេលផឹកកាហ្វេ។' },
    content: [
      { en: 'Interview your grandma or grandpa about their life', km: 'សម្ភាសន៍យាយ ឬតា របស់អ្នកអំពីជីវិតរបស់គាត់' },
      { en: '"Thank you" posts for people who helped you', km: 'ការបង្ហោះ «អរគុណ» ដល់មនុស្សដែលបានជួយអ្នក' },
      { en: 'Ask your followers a real question and answer them on video', km: 'សួរអ្នកតាមដានសំណួរពិតមួយ ហើយឆ្លើយពួកគេជាវីដេអូ' }
    ],
    blend: { en: 'with a big, warm heart', km: 'ជាមួយចិត្តធំ និងកក់ក្ដៅ' },
    verse: 'Romans 12:10'
  },
  explorer: {
    title: { en: 'The Explorer', km: 'អ្នករុករក' },
    text: { en: 'You go and see, then you come back with stories. New places and new ideas make you come alive. You show people that the world is big and God is bigger.', km: 'អ្នកចេញទៅមើល ហើយត្រឡប់មកវិញជាមួយរឿងរ៉ាវ។ កន្លែងថ្មី និងគំនិតថ្មី ធ្វើឱ្យអ្នករស់រវើក។ អ្នកបង្ហាញមនុស្សថាពិភពលោកធំ ហើយព្រះធំជាងនេះទៅទៀត។' },
    strengths: [
      { en: 'Curious and brave', km: 'ចង់ដឹងចង់ឃើញ និងក្លាហាន' },
      { en: 'Great at photos and video', km: 'ពូកែថតរូប និងវីដេអូ' },
      { en: 'Your stories inspire others to go', km: 'រឿងរបស់អ្នកបំផុសអ្នកដទៃឱ្យចេញទៅ' }
    ],
    watch: { en: 'Adventure is not only far away. Finish what you start, and share the small daily stories at home too.', km: 'ការផ្សងព្រេងមិនមែនមានតែនៅឆ្ងាយទេ។ បញ្ចប់អ្វីដែលអ្នកចាប់ផ្ដើម ហើយចែករំលែករឿងតូចៗប្រចាំថ្ងៃនៅផ្ទះផងដែរ។' },
    brand: { en: 'Earth colours: forest green, sky blue, sand. Big photos, strong outdoor letters. A voice that says "Come and see."', km: 'ពណ៌ធម្មជាតិ៖ បៃតងព្រៃ ខៀវមេឃ ពណ៌ខ្សាច់។ រូបថតធំៗ អក្សររឹងមាំបែបក្រៅផ្ទះ។ សំឡេងដែលនិយាយថា «មកមើលទៅ!»' },
    content: [
      { en: 'A day in a province most people never visit', km: 'មួយថ្ងៃនៅខេត្តមួយ ដែលមនុស្សភាគច្រើនមិនដែលទៅ' },
      { en: 'Meet one person from an outreach and tell their story', km: 'ជួបមនុស្សម្នាក់ពីការចុះផ្សាយ ហើយប្រាប់រឿងរបស់គាត់' },
      { en: '"Things I learned from trying something new" series', km: 'ស៊េរី «អ្វីដែលខ្ញុំបានរៀន ពីការសាកល្បងរឿងថ្មី»' }
    ],
    blend: { en: 'with a streak of wonder', km: 'ជាមួយភាពភ្ញាក់ផ្អើលចង់ឃើញ' },
    verse: 'Isaiah 6:8'
  },
  sage: {
    title: { en: 'The Teacher', km: 'អ្នកបង្រៀន' },
    text: { en: 'You love to learn and to help others understand. You ask "why?" when others just scroll on. People leave your page a little wiser than before.', km: 'អ្នកចូលចិត្តរៀន និងជួយអ្នកដទៃឱ្យយល់។ អ្នកសួរថា «ហេតុអ្វី?» ពេលអ្នកដទៃគ្រាន់តែអូសកាត់។ មនុស្សចាកចេញពីទំព័ររបស់អ្នកដោយមានប្រាជ្ញាច្រើនជាងមុនបន្តិច។' },
    strengths: [
      { en: 'Deep thinker', km: 'អ្នកគិតជ្រៅ' },
      { en: 'You explain things clearly', km: 'អ្នកពន្យល់រឿងរ៉ាវបានច្បាស់' },
      { en: 'People trust your advice', km: 'មនុស្សទុកចិត្តដំបូន្មានរបស់អ្នក' }
    ],
    watch: { en: 'Do not only teach. Ask questions, listen, stay humble, and post before it is perfect.', km: 'កុំគ្រាន់តែបង្រៀន។ សួរសំណួរ ស្ដាប់ រក្សាភាពសុភាព ហើយបង្ហោះមុនពេលវាល្អឥតខ្ចោះ។' },
    brand: { en: 'Deep blue or green with paper tones, classic letters with serifs. A voice that is calm, careful and kind.', km: 'ពណ៌ខៀវចាស់ ឬបៃតងចាស់ ជាមួយពណ៌ក្រដាស អក្សរបុរាណមានជើង។ សំឡេងស្ងប់ ប្រុងប្រយ័ត្ន និងចិត្តល្អ។' },
    content: [
      { en: 'One book, three lessons, in one minute', km: 'សៀវភៅមួយ មេរៀនបី ក្នុងមួយនាទី' },
      { en: 'Answer one hard question young people ask about God', km: 'ឆ្លើយសំណួរពិបាកមួយ ដែលយុវជនសួរអំពីព្រះ' },
      { en: 'A simple how-to for a skill that helps people get work', km: 'របៀបធ្វើសាមញ្ញ សម្រាប់ជំនាញមួយដែលជួយមនុស្សរកការងារ' }
    ],
    blend: { en: 'with a thoughtful mind', km: 'ជាមួយគំនិតដែលគិតជ្រៅ' },
    verse: 'Proverbs 2:6'
  },
  faith: {
    title: { en: 'The Messenger', km: 'អ្នកនាំសារ' },
    text: { en: 'You carry a calling bigger than yourself, and you are not ashamed of it. You see people and places that need hope. Your page points people to Jesus with love, not pressure.', km: 'អ្នកមានការត្រាស់ហៅមួយធំជាងខ្លួនអ្នក ហើយអ្នកមិនខ្មាសនឹងវាទេ។ អ្នកឃើញមនុស្ស និងកន្លែងដែលត្រូវការសេចក្ដីសង្ឃឹម។ ទំព័ររបស់អ្នកនាំមនុស្សទៅរកព្រះយេស៊ូវ ដោយសេចក្ដីស្រឡាញ់ មិនមែនដោយការបង្ខិតបង្ខំទេ។' },
    strengths: [
      { en: 'A clear mission and a strong why', km: 'បេសកកម្មច្បាស់ និងហេតុផលរឹងមាំ' },
      { en: 'You pray and encourage', km: 'អ្នកអធិស្ឋាន និងលើកទឹកចិត្ត' },
      { en: 'Your testimony gives hope', km: 'ទីបន្ទាល់របស់អ្នកផ្ដល់សេចក្ដីសង្ឃឹម' }
    ],
    watch: { en: 'Not every post needs a Bible verse. Let people see your everyday life with God, and your questions too.', km: 'មិនមែនគ្រប់ការបង្ហោះត្រូវការខគម្ពីរនោះទេ។ ឱ្យមនុស្សឃើញជីវិតប្រចាំថ្ងៃរបស់អ្នកជាមួយព្រះ និងសំណួររបស់អ្នកផងដែរ។' },
    brand: { en: 'Light and deep colours together, like dawn: gold, white, deep blue. Strong, simple letters. A voice full of hope.', km: 'ពណ៌ភ្លឺ និងពណ៌ចាស់ជាមួយគ្នា ដូចពេលព្រលឹម៖ មាស ស ខៀវចាស់។ អក្សររឹងមាំ និងសាមញ្ញ។ សំឡេងពោរពេញដោយសេចក្ដីសង្ឃឹម។' },
    content: [
      { en: 'Your testimony in 60 seconds: before, meeting Jesus, now', km: 'ទីបន្ទាល់របស់អ្នកក្នុង ៦០វិនាទី៖ មុន ពេលជួបព្រះយេស៊ូវ និងឥឡូវ' },
      { en: 'Pray for your city on camera, one street at a time', km: 'អធិស្ឋានសម្រាប់ទីក្រុងរបស់អ្នក ជាវីដេអូ ម្ដងមួយផ្លូវ' },
      { en: 'Share one answer to prayer from this week', km: 'ចែករំលែកចម្លើយនៃការអធិស្ឋានមួយ ពីសប្ដាហ៍នេះ' }
    ],
    blend: { en: 'with a fire for mission', km: 'ជាមួយភ្លើងសម្រាប់បេសកកម្ម' },
    verse: 'Romans 1:16'
  },
  playful: {
    title: { en: 'The Joy-Maker', km: 'អ្នកនាំភាពរីករាយ' },
    text: { en: 'You bring colour, fun and fresh ideas. You see a funny or creative way where others see a wall. People smile at your posts, and joy opens hearts.', km: 'អ្នកនាំមកនូវពណ៌ ភាពសប្បាយ និងគំនិតថ្មីៗ។ អ្នកឃើញផ្លូវកំប្លែង ឬច្នៃប្រឌិត កន្លែងដែលអ្នកដទៃឃើញតែជញ្ជាំង។ មនុស្សញញឹមនឹងការបង្ហោះរបស់អ្នក ហើយអំណរបើកចិត្តមនុស្ស។' },
    strengths: [
      { en: 'Creative and full of ideas', km: 'ច្នៃប្រឌិត និងពោរពេញដោយគំនិត' },
      { en: 'Funny and easy to like', km: 'កំប្លែង និងងាយចូលចិត្ត' },
      { en: 'You make hard things easy', km: 'អ្នកធ្វើឱ្យរឿងពិបាកក្លាយជាងាយ' }
    ],
    watch: { en: 'Fun is a gift, but keep one clear message, so people know what you stand for. It is OK to be serious sometimes.', km: 'ភាពសប្បាយគឺជាអំណោយ ប៉ុន្តែរក្សាសារច្បាស់មួយ ដើម្បីឱ្យមនុស្សដឹងថាអ្នកឈរលើអ្វី។ ពេលខ្លះ ធ្វើជាមនុស្សម៉ឺងម៉ាត់ក៏មិនអីដែរ។' },
    brand: { en: 'Bright colours that clash in a fun way, playful hand-drawn letters, stickers. A voice full of jokes with a kind heart.', km: 'ពណ៌ភ្លឺៗ ដែលលាយគ្នាបែបសប្បាយ អក្សរសរសេរដោយដៃបែបលេងសើច ស្ទីកឃ័រ។ សំឡេងពោរពេញដោយការកំប្លែង ជាមួយចិត្តល្អ។' },
    content: [
      { en: 'A funny skit about a real youth-group moment', km: 'ល្ខោនកំប្លែងអំពីពេលពិតមួយក្នុងក្រុមយុវជន' },
      { en: 'Draw a Bible story as a quick comic', km: 'គូររឿងពីព្រះគម្ពីរ ជាតុក្កតារហ័សមួយ' },
      { en: 'A trend remix with a message of hope', km: 'កែច្នៃ trend មួយ ជាមួយសារនៃសេចក្ដីសង្ឃឹម' }
    ],
    blend: { en: 'with a spark of joy', km: 'ជាមួយផ្កាភ្លើងនៃអំណរ' },
    verse: 'Proverbs 17:22'
  }
};

/* answers: { q1: 'a', q2: 'c', ... } → { top, second, scores, pct }. Missing answers count 0.
 * pct: each archetype's share of all points, 0–100, rounded. Ties are broken by the order of
 * BFH_ARCHETYPES (earlier wins). */
window.BFH_quizScore = function (answers) {
  answers = answers || {};
  var order = (window.BFH_ARCHETYPES || []).map(function (a) { return a.id; });
  if (!order.length) order = ['bold', 'simple', 'warm', 'explorer', 'sage', 'faith', 'playful'];
  var scores = {};
  order.forEach(function (id) { scores[id] = 0; });
  (window.BFH_QUIZ || []).forEach(function (q) {
    var pick = answers[q.id];
    if (!pick) return;
    var opt = null;
    for (var i = 0; i < q.options.length; i++) if (q.options[i].id === pick) opt = q.options[i];
    if (!opt) return;
    Object.keys(opt.points || {}).forEach(function (k) {
      if (k in scores) scores[k] += opt.points[k];
    });
  });
  var ranked = order.slice().sort(function (a, b) {
    return (scores[b] - scores[a]) || (order.indexOf(a) - order.indexOf(b));
  });
  var total = 0;
  order.forEach(function (id) { total += scores[id]; });
  var pct = {};
  order.forEach(function (id) { pct[id] = total ? Math.round(scores[id] * 100 / total) : 0; });
  return { top: ranked[0], second: ranked[1], scores: scores, pct: pct };
};
