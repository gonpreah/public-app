/* Brand From the Heart: "Which brand archetype are you?" A 5-question warm-up.
 *
 * Khmer (km) is a draft by Claude, unreviewed: have a native speaker check it.
 * Logos are the property of their owners, shown unaltered for education only (see brands.js);
 * this file holds no logos.
 * Archetype ids match window.BFH_ARCHETYPES in brands.js; ties go to the one earlier there.
 */
window.BFH_QUIZ = [
  { id: 'q1', q: { en: 'Your perfect Saturday?', km: 'ថ្ងៃសៅរ៍ដ៏ល្អឥតខ្ចោះរបស់អ្នក?' },
    options: [
      { id: 'a', emoji: '🏃', en: 'A game of football or a run at sunrise', km: 'លេងបាល់ទាត់ ឬរត់ពេលព្រះអាទិត្យរះ', points: { bold: 2, explorer: 1 } },
      { id: 'b', emoji: '🏕️', en: 'A road trip to somewhere new', km: 'ធ្វើដំណើរទៅកន្លែងថ្មីមួយ', points: { explorer: 2, bold: 1 } },
      { id: 'c', emoji: '📚', en: 'A quiet café and a good book', km: 'ហាងកាហ្វេស្ងាត់ និងសៀវភៅល្អមួយ', points: { sage: 2, simple: 1 } },
      { id: 'd', emoji: '🙏', en: 'Serving at church or an outreach', km: 'បម្រើនៅព្រះវិហារ ឬចុះផ្សាយដំណឹងល្អ', points: { faith: 2, warm: 1 } },
      { id: 'e', emoji: '🎨', en: 'Making art or videos with friends', km: 'គូររូប ឬថតវីដេអូជាមួយមិត្តភក្ដិ', points: { playful: 2, warm: 1 } }
    ] },
  { id: 'q2', q: { en: 'Your phone\'s home screen looks…', km: 'អេក្រង់ដើមទូរស័ព្ទរបស់អ្នកមើលទៅ…' },
    options: [
      { id: 'a', emoji: '🤍', en: 'Clean. Few apps, all in order', km: 'ស្អាត។ កម្មវិធីតិច រៀបរយទាំងអស់', points: { simple: 2, sage: 1 } },
      { id: 'b', emoji: '🌈', en: 'Colourful! Stickers and fun icons', km: 'ចម្រុះពណ៌! ស្ទីកឃ័រ និងរូបតំណាងសប្បាយៗ', points: { playful: 2 } },
      { id: 'c', emoji: '👨‍👩‍👧', en: 'A photo of my family or friends', km: 'រូបថតគ្រួសារ ឬមិត្តភក្ដិរបស់ខ្ញុំ', points: { warm: 2, faith: 1 } },
      { id: 'd', emoji: '🗺️', en: 'A mountain, a beach, a trip photo', km: 'ភ្នំ ឆ្នេរ ឬរូបថតពីដំណើរកម្សាន្ត', points: { explorer: 2 } },
      { id: 'e', emoji: '🏆', en: 'My workout plan and goals', km: 'ផែនការហាត់ប្រាណ និងគោលដៅរបស់ខ្ញុំ', points: { bold: 2, simple: 1 } }
    ] },
  { id: 'q3', q: { en: 'Friends come to you when they need…', km: 'មិត្តភក្ដិមករកអ្នក ពេលពួកគេត្រូវការ…' },
    options: [
      { id: 'a', emoji: '💪', en: 'A push to not give up', km: 'កម្លាំងជំរុញ ដើម្បីកុំឱ្យបោះបង់', points: { bold: 2, faith: 1 } },
      { id: 'b', emoji: '🤗', en: 'Someone to listen', km: 'អ្នកណាម្នាក់ដែលស្ដាប់', points: { warm: 2 } },
      { id: 'c', emoji: '🧠', en: 'Wise advice', km: 'ដំបូន្មានដ៏មានប្រាជ្ញា', points: { sage: 2, simple: 1 } },
      { id: 'd', emoji: '😂', en: 'A good laugh', km: 'សើចឱ្យសប្បាយ', points: { playful: 2, warm: 1 } },
      { id: 'e', emoji: '🙏', en: 'Someone to pray with them', km: 'អ្នកណាម្នាក់អធិស្ឋានជាមួយពួកគេ', points: { faith: 2, warm: 1 } }
    ] },
  { id: 'q4', q: { en: 'Your dream post goes viral. It is…', km: 'ការបង្ហោះក្នុងក្ដីស្រមៃរបស់អ្នកល្បីភ្លាម។ វាគឺ…' },
    options: [
      { id: 'a', emoji: '🎬', en: 'An action video from a mission trip', km: 'វីដេអូសកម្មភាពពីដំណើរបេសកកម្ម', points: { explorer: 2, bold: 1 } },
      { id: 'b', emoji: '✨', en: 'One beautiful photo with few words', km: 'រូបថតស្អាតមួយ ជាមួយពាក្យតិចៗ', points: { simple: 2 } },
      { id: 'c', emoji: '💡', en: 'A short teaching that changes how people think', km: 'ការបង្រៀនខ្លីមួយ ដែលផ្លាស់ប្ដូររបៀបគិតរបស់មនុស្ស', points: { sage: 2, simple: 1 } },
      { id: 'd', emoji: '✝️', en: 'My testimony of what God did', km: 'ទីបន្ទាល់របស់ខ្ញុំអំពីអ្វីដែលព្រះបានធ្វើ', points: { faith: 2, warm: 1 } },
      { id: 'e', emoji: '🤪', en: 'A funny skit with my friends', km: 'ល្ខោនកំប្លែងខ្លីជាមួយមិត្តភក្ដិ', points: { playful: 2 } }
    ] },
  { id: 'q5', q: { en: 'Pick the vibe for your page', km: 'ជ្រើសរើសអារម្មណ៍សម្រាប់ទំព័ររបស់អ្នក' },
    options: [
      { id: 'a', emoji: '⚡', en: 'Loud and full of energy', km: 'ខ្លាំង និងពោរពេញដោយថាមពល', points: { bold: 2 } },
      { id: 'b', emoji: '🤍', en: 'Calm and clean', km: 'ស្ងប់ និងស្អាត', points: { simple: 2 } },
      { id: 'c', emoji: '💛', en: 'Warm and real', km: 'កក់ក្ដៅ និងពិតប្រាកដ', points: { warm: 2 } },
      { id: 'd', emoji: '🧭', en: 'Wild and free', km: 'ព្រៃ និងសេរី', points: { explorer: 2 } },
      { id: 'e', emoji: '🎉', en: 'Fun and colourful', km: 'សប្បាយ និងចម្រុះពណ៌', points: { playful: 2 } }
    ] }
];

window.BFH_QUIZ_RESULTS = {
  bold: {
    title: { en: 'The Champion', km: 'ជើងឯក' },
    text: { en: 'You push people to be brave and keep going. When you post, people feel they can run their race too.', km: 'អ្នកជំរុញមនុស្សឱ្យក្លាហាន និងបន្តទៅមុខ។ ពេលអ្នកបង្ហោះ មនុស្សមានអារម្មណ៍ថាពួកគេក៏អាចរត់ការប្រណាំងរបស់ខ្លួនដែរ។' },
    strengths: [
      { en: 'Brave and full of energy', km: 'ក្លាហាន និងពោរពេញដោយថាមពល' },
      { en: 'Short, strong words', km: 'ពាក្យខ្លី និងខ្លាំង' },
      { en: 'You help others not give up', km: 'អ្នកជួយអ្នកដទៃកុំឱ្យបោះបង់' }
    ],
    watch: { en: 'Not every post must be loud. Show your soft side and your weak days too.', km: 'មិនមែនគ្រប់ការបង្ហោះត្រូវតែខ្លាំងនោះទេ។ បង្ហាញផ្នែកទន់ និងថ្ងៃខ្សោយរបស់អ្នកផងដែរ។' }
  },
  simple: {
    title: { en: 'The Clear Voice', km: 'សំឡេងច្បាស់លាស់' },
    text: { en: 'You bring peace and order. People come to your page to breathe and see what really matters.', km: 'អ្នកនាំមកនូវសន្តិភាព និងសណ្ដាប់ធ្នាប់។ មនុស្សមកទំព័ររបស់អ្នក ដើម្បីដកដង្ហើម និងមើលឃើញអ្វីដែលសំខាន់ពិតប្រាកដ។' },
    strengths: [
      { en: 'Clean, calm design', km: 'ការរចនាស្អាត និងស្ងប់' },
      { en: 'Few words, very clear', km: 'ពាក្យតិច ច្បាស់ណាស់' },
      { en: 'Steady and easy to trust', km: 'ខ្ជាប់ខ្ជួន និងងាយទុកចិត្ត' }
    ],
    watch: { en: 'Simple is good, but do not be cold. Let people see your heart and your face.', km: 'សាមញ្ញគឺល្អ ប៉ុន្តែកុំត្រជាក់។ ឱ្យមនុស្សឃើញចិត្ត និងមុខរបស់អ្នក។' }
  },
  warm: {
    title: { en: 'The Friend', km: 'មិត្តល្អ' },
    text: { en: 'You make people feel welcome and loved. On your page, people feel they belong, like at a family meal.', km: 'អ្នកធ្វើឱ្យមនុស្សមានអារម្មណ៍ថាត្រូវបានស្វាគមន៍ និងស្រឡាញ់។ នៅលើទំព័ររបស់អ្នក មនុស្សមានអារម្មណ៍ថាជាផ្នែកមួយ ដូចនៅពេលញ៉ាំបាយជុំគ្រួសារ។' },
    strengths: [
      { en: 'Kind and caring', km: 'ចិត្តល្អ និងយកចិត្តទុកដាក់' },
      { en: 'Real and honest', km: 'ពិតប្រាកដ និងស្មោះត្រង់' },
      { en: 'You build community', km: 'អ្នកកសាងសហគមន៍' }
    ],
    watch: { en: 'You cannot please everyone. Say what is true, even when it is not easy.', km: 'អ្នកមិនអាចធ្វើឱ្យមនុស្សគ្រប់គ្នាពេញចិត្តបានទេ។ និយាយអ្វីដែលពិត ទោះបីវាមិនងាយក៏ដោយ។' }
  },
  explorer: {
    title: { en: 'The Explorer', km: 'អ្នករុករក' },
    text: { en: 'You go and see, then you come back with stories. You show people that the world is big and God is bigger.', km: 'អ្នកចេញទៅមើល ហើយត្រឡប់មកវិញជាមួយរឿងរ៉ាវ។ អ្នកបង្ហាញមនុស្សថាពិភពលោកធំ ហើយព្រះធំជាងនេះទៅទៀត។' },
    strengths: [
      { en: 'Curious and brave', km: 'ចង់ដឹងចង់ឃើញ និងក្លាហាន' },
      { en: 'Great at photos and video', km: 'ពូកែថតរូប និងវីដេអូ' },
      { en: 'Your stories inspire others to go', km: 'រឿងរបស់អ្នកបំផុសអ្នកដទៃឱ្យចេញទៅ' }
    ],
    watch: { en: 'Adventure is not only far away. Share the small, daily stories at home too.', km: 'ការផ្សងព្រេងមិនមែនមានតែនៅឆ្ងាយទេ។ ចែករំលែករឿងតូចៗប្រចាំថ្ងៃនៅផ្ទះផងដែរ។' }
  },
  sage: {
    title: { en: 'The Teacher', km: 'អ្នកបង្រៀន' },
    text: { en: 'You love to learn and to help others understand. People leave your page a little wiser than before.', km: 'អ្នកចូលចិត្តរៀន និងជួយអ្នកដទៃឱ្យយល់។ មនុស្សចាកចេញពីទំព័ររបស់អ្នកដោយមានប្រាជ្ញាច្រើនជាងមុនបន្តិច។' },
    strengths: [
      { en: 'Deep thinker', km: 'អ្នកគិតជ្រៅ' },
      { en: 'You explain things clearly', km: 'អ្នកពន្យល់រឿងរ៉ាវបានច្បាស់' },
      { en: 'People trust your advice', km: 'មនុស្សទុកចិត្តដំបូន្មានរបស់អ្នក' }
    ],
    watch: { en: 'Do not only teach. Ask questions and listen, and stay humble.', km: 'កុំគ្រាន់តែបង្រៀន។ សួរសំណួរ ហើយស្ដាប់ ហើយរក្សាភាពសុភាព។' }
  },
  faith: {
    title: { en: 'The Messenger', km: 'អ្នកនាំសារ' },
    text: { en: 'You carry good news and you are not ashamed of it. Your page points people to Jesus with love, not pressure.', km: 'អ្នកនាំដំណឹងល្អ ហើយអ្នកមិនខ្មាសនឹងវាទេ។ ទំព័ររបស់អ្នកនាំមនុស្សទៅរកព្រះយេស៊ូវ ដោយសេចក្ដីស្រឡាញ់ មិនមែនដោយការបង្ខិតបង្ខំទេ។' },
    strengths: [
      { en: 'Strong faith and a clear message', km: 'ជំនឿរឹងមាំ និងសារច្បាស់លាស់' },
      { en: 'You pray and encourage', km: 'អ្នកអធិស្ឋាន និងលើកទឹកចិត្ត' },
      { en: 'Your testimony gives hope', km: 'ទីបន្ទាល់របស់អ្នកផ្ដល់សេចក្ដីសង្ឃឹម' }
    ],
    watch: { en: 'Not every post needs a Bible verse. Let people see your everyday life with God too.', km: 'មិនមែនគ្រប់ការបង្ហោះត្រូវការខគម្ពីរនោះទេ។ ឱ្យមនុស្សឃើញជីវិតប្រចាំថ្ងៃរបស់អ្នកជាមួយព្រះផងដែរ។' }
  },
  playful: {
    title: { en: 'The Joy-Maker', km: 'អ្នកនាំភាពរីករាយ' },
    text: { en: 'You bring colour, fun and fresh ideas. People smile at your posts, and joy opens hearts.', km: 'អ្នកនាំមកនូវពណ៌ ភាពសប្បាយ និងគំនិតថ្មីៗ។ មនុស្សញញឹមនឹងការបង្ហោះរបស់អ្នក ហើយអំណរបើកចិត្តមនុស្ស។' },
    strengths: [
      { en: 'Creative and full of ideas', km: 'ច្នៃប្រឌិត និងពោរពេញដោយគំនិត' },
      { en: 'Funny and easy to like', km: 'កំប្លែង និងងាយចូលចិត្ត' },
      { en: 'You make hard things easy', km: 'អ្នកធ្វើឱ្យរឿងពិបាកក្លាយជាងាយ' }
    ],
    watch: { en: 'Fun is a gift, but keep one clear message, so people know what you stand for.', km: 'ភាពសប្បាយគឺជាអំណោយ ប៉ុន្តែរក្សាសារច្បាស់មួយ ដើម្បីឱ្យមនុស្សដឹងថាអ្នកឈរលើអ្វី។' }
  }
};

/* answers: { q1: 'a', q2: 'c', ... } → { top, second, scores }. Missing answers count 0.
 * Ties are broken by the order of BFH_ARCHETYPES (earlier wins). */
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
  return { top: ranked[0], second: ranked[1], scores: scores };
};
