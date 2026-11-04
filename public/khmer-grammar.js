/* Learn Khmer — Grammar (Oct 2026, Andrew: "two separate areas, one for vocabulary, and one for grammar
   and sentence structure, like past, present, future and continuous"). Loaded on demand by the Learn
   Khmer page (teams/15-khmer.js), like khmer-vocab.js.

   Ten short lessons. Each has the idea in a line, how it works — `rule` for someone learning Khmer,
   `ruleEn` for someone learning English (the same sentences, the other language's grammar) — a
   pattern, and example sentences. An example is the English (`en`, as written; `enT` its words) and
   the Khmer as its words (`km`); `tl` is each Khmer word's reading, made by scripts/khmer-translit.mjs
   (run it after changing a sentence — tests/test-khmer-translit.mjs checks). `key` / `keyEn` are the words
   the lesson is about (shown marked); `extra` / `extraEn` is one word that does not belong, mixed into
   the tiles when you build the sentence.

   Written for YWAM GP, not from the KBC book; the Khmer has not been read by a native speaker yet
   (docs/khmer-needed.md §79). */
var GP_KHMER_GRAMMAR = {
  lessons: [
    { id: 'order', icon: '🧱', title: 'Word order', idea: 'Who, then the action, then what — the same as English.',
      rule: 'Khmer puts the person first, then the action, then the thing, just like English. The action never changes: ញ៉ាំ is eat, eats and ate.',
      ruleEn: 'English also goes person, action, thing. But the action changes with the person: I eat, she eats.',
      pattern: 'Person + action + thing', patternEn: 'Person + action + thing',
      key: [], keyEn: ['eats', 'drinks'], extra: '', extraEn: '',
      examples: [
        { en: 'I eat rice.', enT: ["I","eat","rice"], km: ["ខ្ញុំ","ញ៉ាំ","បាយ"], tl: ["khnhom","nham","bai"] },
        { en: 'She drinks water.', enT: ["She","drinks","water"], km: ["គាត់","ផឹក","ទឹក"], tl: ["koat","phoek","tuk"] },
        { en: 'We read the Bible.', enT: ["We","read","the","Bible"], km: ["យើង","អាន","ព្រះគម្ពីរ"], tl: ["yeung","an","preah kompi"] },
        { en: 'They play football.', enT: ["They","play","football"], km: ["ពួកគេ","លេង","បាល់ទាត់"], tl: ["puok ke","leng","bal-toat"] }
      ] },
    { id: 'describe', icon: '🎨', title: 'Describing words', idea: 'In Khmer the describing word comes after the thing.',
      rule: 'Say the thing first, then what it is like: ផ្ទះធំ is "house big". Put ណាស់ after a describing word for "very".',
      ruleEn: 'In English the describing word comes before the thing: a big house. "Very" goes before the describing word: very hot.',
      pattern: 'Thing + describing word (+ ណាស់)', patternEn: '(very +) describing word + thing',
      key: ['ធំ','ឆ្ងាញ់','ស្អាត','ណាស់'], keyEn: ['big','delicious','beautiful','very'], extra: '', extraEn: '',
      examples: [
        { en: 'A big house.', enT: ["A","big","house"], km: ["ផ្ទះ","ធំ"], tl: ["phteah","thum"] },
        { en: 'Delicious food.', enT: ["Delicious","food"], km: ["ម្ហូប","ឆ្ងាញ់"], tl: ["mhoup","chhnganh"] },
        { en: 'A beautiful country.', enT: ["A","beautiful","country"], km: ["ប្រទេស","ស្អាត"], tl: ["pra-teh","sa-at"] },
        { en: 'Very hot.', enT: ["Very","hot"], km: ["ក្តៅ","ណាស់"], tl: ["kdav","nah"] }
      ] },
    { id: 'now', icon: '⏳', title: 'Happening now', idea: 'កំពុង before the action means it is happening right now.',
      rule: 'Put កំពុង before the action for something going on right now, like English "-ing". Without it the sentence can mean now or usually.',
      ruleEn: 'For something going on right now, English uses am / is / are and the action with -ing: I am eating.',
      pattern: 'Person + កំពុង + action', patternEn: 'Person + am / is / are + action-ing',
      key: ['កំពុង'], keyEn: ['am','is','are','eating','studying','praying','raining'], extra: 'បាន', extraEn: 'was',
      examples: [
        { en: 'I am eating rice.', enT: ["I","am","eating","rice"], km: ["ខ្ញុំ","កំពុង","ញ៉ាំ","បាយ"], tl: ["khnhom","kam-pung","nham","bai"] },
        { en: 'He is studying Khmer.', enT: ["He","is","studying","Khmer"], km: ["គាត់","កំពុង","រៀន","ភាសាខ្មែរ"], tl: ["koat","kam-pung","rien","phie-sa-khmae"] },
        { en: 'We are praying.', enT: ["We","are","praying"], km: ["យើង","កំពុង","អធិស្ឋាន"], tl: ["yeung","kam-pung","athisthan"] },
        { en: 'It is raining.', enT: ["It","is","raining"], km: ["មេឃ","កំពុង","ភ្លៀង"], tl: ["mek","kam-pung","phlieng"] }
      ] },
    { id: 'past', icon: '⏪', title: 'The past', idea: 'The action stays the same — បាន, ហើយ or a time word says it is past.',
      rule: 'Khmer never changes the action for the past. Put បាន before it, or ហើយ ("already") at the end, or just say when: ម្សិលមិញ (yesterday).',
      ruleEn: 'English changes the action for the past: eat → ate, go → went, pray → prayed. "Already" goes before the action or at the end.',
      pattern: 'Person + បាន + action  ·  … + ហើយ', patternEn: 'Person + action in the past (ate, went, prayed)',
      key: ['បាន','ហើយ','ម្សិលមិញ'], keyEn: ['ate','already','went','prayed','Yesterday'], extra: 'នឹង', extraEn: 'will',
      examples: [
        { en: 'I ate rice.', enT: ["I","ate","rice"], km: ["ខ្ញុំ","បាន","ញ៉ាំ","បាយ"], tl: ["khnhom","ban","nham","bai"] },
        { en: 'I already ate.', enT: ["I","already","ate"], km: ["ខ្ញុំ","ញ៉ាំ","ហើយ"], tl: ["khnhom","nham","haeuy"] },
        { en: 'Yesterday I went to the market.', enT: ["Yesterday","I","went","to","the","market"], km: ["ម្សិលមិញ","ខ្ញុំ","បាន","ទៅ","ផ្សារ"], tl: ["msel menh","khnhom","ban","tov","phsa"] },
        { en: 'She prayed for me.', enT: ["She","prayed","for","me"], km: ["គាត់","បាន","អធិស្ឋាន","ឲ្យ","ខ្ញុំ"], tl: ["koat","ban","athisthan","aoy","khnhom"] }
      ] },
    { id: 'future', icon: '⏩', title: 'The future', idea: 'នឹង before the action, or a time word, says it is still to come.',
      rule: 'Put នឹង before the action for the future, or just say when: ស្អែក (tomorrow), សប្តាហ៍ក្រោយ (next week). The action stays the same.',
      ruleEn: 'English puts will before the action for the future: I will go. The action stays as it is after will.',
      pattern: 'Person + នឹង + action', patternEn: 'Person + will + action',
      key: ['នឹង','ស្អែក','សប្តាហ៍ក្រោយ'], keyEn: ['will','Tomorrow'], extra: 'បាន', extraEn: 'went',
      examples: [
        { en: 'I will go home.', enT: ["I","will","go","home"], km: ["ខ្ញុំ","នឹង","ទៅ","ផ្ទះ"], tl: ["khnhom","noeng","tov","phteah"] },
        { en: 'Tomorrow we will study.', enT: ["Tomorrow","we","will","study"], km: ["ស្អែក","យើង","នឹង","រៀន"], tl: ["sa-aek","yeung","noeng","rien"] },
        { en: 'He will come next week.', enT: ["He","will","come","next","week"], km: ["គាត់","នឹង","មក","សប្តាហ៍ក្រោយ"], tl: ["koat","noeng","mok","sap-da-kraoy"] },
        { en: 'I will pray for you.', enT: ["I","will","pray","for","you"], km: ["ខ្ញុំ","នឹង","អធិស្ឋាន","ឲ្យ","អ្នក"], tl: ["khnhom","noeng","athisthan","aoy","neak"] }
      ] },
    { id: 'not', icon: '🚫', title: 'Saying no', idea: 'មិន before the action and ទេ at the end.',
      rule: 'Put មិន before the action and ទេ at the end: ខ្ញុំមិនយល់ទេ. In everyday talk អត់ often takes the place of មិន.',
      ruleEn: 'English puts not after am / is / are (I am not hungry), and don\'t or doesn\'t before other actions (I don\'t understand).',
      pattern: 'Person + មិន / អត់ + action + ទេ', patternEn: 'Person + am / is not … · Person + don\'t / doesn\'t + action',
      key: ['មិន','អត់','ទេ'], keyEn: ['not','don\'t','doesn\'t'], extra: 'ណាស់', extraEn: 'very',
      examples: [
        { en: 'I am not hungry.', enT: ["I","am","not","hungry"], km: ["ខ្ញុំ","មិន","ឃ្លាន","ទេ"], tl: ["khnhom","min","khlien","te"] },
        { en: 'It is not far.', enT: ["It","is","not","far"], km: ["មិន","ឆ្ងាយ","ទេ"], tl: ["min","chhngay","te"] },
        { en: 'I don\'t understand.', enT: ["I","don't","understand"], km: ["ខ្ញុំ","មិន","យល់","ទេ"], tl: ["khnhom","min","yol","te"] },
        { en: 'He doesn\'t eat meat.', enT: ["He","doesn't","eat","meat"], km: ["គាត់","អត់","ញ៉ាំ","សាច់","ទេ"], tl: ["koat","ot","nham","sach","te"] }
      ] },
    { id: 'yesno', icon: '❔', title: 'Yes or no questions', idea: 'Put ទេ at the end to ask — or ហើយឬនៅ for "yet?".',
      rule: 'Add ទេ at the end to turn a sentence into a question. To ask "… yet?", end with ហើយឬនៅ — the everyday greeting is ញ៉ាំបាយហើយឬនៅ? Answer បាទ (a man) or ចាស (a woman).',
      ruleEn: 'English starts a yes or no question with Do, Are, Is or Have: Do you want …? Are you tired? "Yet" goes at the end.',
      pattern: '… + ទេ?  ·  … + ហើយឬនៅ?', patternEn: 'Do / Are / Is / Have + person + …?',
      key: ['ទេ','ហើយ','ឬ','នៅ'], keyEn: ['Do','Are','Have','Is','yet'], extra: 'អ្វី', extraEn: 'What',
      examples: [
        { en: 'Do you want to drink coffee?', enT: ["Do","you","want","to","drink","coffee"], km: ["អ្នក","ចង់","ផឹក","កាហ្វេ","ទេ"], tl: ["neak","chang","phoek","kafe","te"] },
        { en: 'Are you tired?', enT: ["Are","you","tired"], km: ["អ្នក","ហត់","ទេ"], tl: ["neak","hat","te"] },
        { en: 'Have you eaten yet?', enT: ["Have","you","eaten","yet"], km: ["ញ៉ាំ","បាយ","ហើយ","ឬ","នៅ"], tl: ["nham","bai","haeuy","rue","nov"] },
        { en: 'Is it far?', enT: ["Is","it","far"], km: ["ឆ្ងាយ","ទេ"], tl: ["chhngay","te"] }
      ] },
    { id: 'qwords', icon: '🔎', title: 'Question words', idea: 'What, where, how much — at the end in Khmer, at the front in English.',
      rule: 'The question word usually goes where the answer would be, often at the end: អ្វី (what), ណា (where), ប៉ុន្មាន (how much), ពេលណា (when).',
      ruleEn: 'English puts the question word first: What, Where, How much, When — then is / are / will and the person.',
      pattern: '… + អ្វី / ណា / ប៉ុន្មាន / ពេលណា?', patternEn: 'What / Where / How much / When + is / are / will + …?',
      key: ['អ្វី','ណា','ប៉ុន្មាន','ពេលណា'], keyEn: ['What','Where','How','much','When'], extra: 'ទេ', extraEn: 'Do',
      examples: [
        { en: 'What is your name?', enT: ["What","is","your","name"], km: ["អ្នក","ឈ្មោះ","អ្វី"], tl: ["neak","chhmuoh","avei"] },
        { en: 'Where are you going?', enT: ["Where","are","you","going"], km: ["អ្នក","ទៅ","ណា"], tl: ["neak","tov","na"] },
        { en: 'How much is this?', enT: ["How","much","is","this"], km: ["នេះ","ថ្លៃ","ប៉ុន្មាន"], tl: ["nih","thlai","ponman"] },
        { en: 'When will you come?', enT: ["When","will","you","come"], km: ["អ្នក","នឹង","មក","ពេលណា"], tl: ["neak","noeng","mok","pel-na"] }
      ] },
    { id: 'modal', icon: '💪', title: 'Want, can, must', idea: 'ចង់, អាច and ត្រូវ go before the action.',
      rule: 'Put ចង់ (want), អាច (can) or ត្រូវ (must, have to) before the action. "Can" is also said with បាន at the end: ខ្ញុំនិយាយខ្មែរបាន.',
      ruleEn: 'English puts want to, can or must before the action: I want to learn. I can speak. We must go.',
      pattern: 'Person + ចង់ / អាច / ត្រូវ + action', patternEn: 'Person + want to / can / must + action',
      key: ['ចង់','អាច','ត្រូវ','បាន'], keyEn: ['want','to','Can','can','must'], extra: 'នឹង', extraEn: 'will',
      examples: [
        { en: 'I want to learn Khmer.', enT: ["I","want","to","learn","Khmer"], km: ["ខ្ញុំ","ចង់","រៀន","ភាសាខ្មែរ"], tl: ["khnhom","chang","rien","phie-sa-khmae"] },
        { en: 'Can you help me?', enT: ["Can","you","help","me"], km: ["អ្នក","អាច","ជួយ","ខ្ញុំ","បាន","ទេ"], tl: ["neak","ach","chuoy","khnhom","ban","te"] },
        { en: 'I can speak a little Khmer.', enT: ["I","can","speak","a","little","Khmer"], km: ["ខ្ញុំ","និយាយ","ខ្មែរ","បាន","បន្តិច"], tl: ["khnhom","niyeay","khmae","ban","ban-tech"] },
        { en: 'We must go now.', enT: ["We","must","go","now"], km: ["យើង","ត្រូវ","ទៅ","ឥឡូវនេះ"], tl: ["yeung","trov","tov","eylov nih"] }
      ] },
    { id: 'ever', icon: '🌏', title: 'Ever and never', idea: 'ធ្លាប់ before the action means you have done it before.',
      rule: 'ធ្លាប់ before the action means you have done it at some time. មិនដែល … ទេ means never. Ask with ធ្លាប់ … ទេ?',
      ruleEn: 'English says I have been / I have eaten for something done before, Have you ever …? to ask, and never for not ever.',
      pattern: 'Person + ធ្លាប់ + action  ·  មិនដែល … ទេ', patternEn: 'Person + have + done …  ·  Have you ever …?',
      key: ['ធ្លាប់','មិនដែល','ទេ'], keyEn: ['have','Have','ever','never','been','eaten'], extra: 'កំពុង', extraEn: 'am',
      examples: [
        { en: 'I have been to Angkor Wat.', enT: ["I","have","been","to","Angkor","Wat"], km: ["ខ្ញុំ","ធ្លាប់","ទៅ","អង្គរវត្ត"], tl: ["khnhom","thloap","tov","angkor voat"] },
        { en: 'Have you ever eaten durian?', enT: ["Have","you","ever","eaten","durian"], km: ["អ្នក","ធ្លាប់","ញ៉ាំ","ធុរេន","ទេ"], tl: ["neak","thloap","nham","thu-ren","te"] },
        { en: 'I have never been to Phnom Penh.', enT: ["I","have","never","been","to","Phnom","Penh"], km: ["ខ្ញុំ","មិនដែល","ទៅ","ភ្នំពេញ","ទេ"], tl: ["khnhom","min-dael","tov","phnum-penh","te"] }
      ] }
  ]
};
