/* Learn Khmer — the words of "KBC Vocabulary" by Phy Chum and Andrew Potter, as the app's flashcards.
   Loaded on demand by the Learn Khmer page (teams/15-khmer.js), like library.js.
   Three levels (the book's three sections), each a set of word lists; a word is [english, khmer]
   or [english, khmer, note]. Keep the book's order inside a list. */
var GP_KHMER_VOCAB = {
  levels: [
    { id: 0, name: 'The script', blurb: 'The 33 consonants in their two series, the vowels and the independent vowels — the letters before the words.' },
    { id: 1, name: 'Essentials', blurb: 'Numbers, time, family, the verbs you use every day — the words everything else is built on.' },
    { id: 2, name: 'Daily life', blurb: 'Home, the market, the city, YWAM life, the restaurant, the hospital.' },
    { id: 3, name: 'Deeper talk', blurb: 'Small talk that goes somewhere — work, weather, faith, history — and the words of the Bible.' }
  ],
  cats: [
    { id: 'consonants', level: 0, script: true, name: 'Consonants', tip: 'Each consonant belongs to one of two series, and the series decides how the vowel after it sounds: first series (a), second series (o).', words: [
      ['kâ · first series', 'ក', '', 'kâ'], ['khâ · first series', 'ខ', '', 'khâ'], ['kô · second series', 'គ', '', 'kô'], ['khô · second series', 'ឃ', '', 'khô'],
      ['ngô · second series', 'ង', '', 'ngô'], ['châ · first series', 'ច', '', 'châ'], ['chhâ · first series', 'ឆ', '', 'chhâ'], ['chô · second series', 'ជ', '', 'chô'],
      ['chhô · second series', 'ឈ', '', 'chhô'], ['nhô · second series', 'ញ', '', 'nhô'], ['dâ · first series', 'ដ', '', 'dâ'], ['thâ · first series', 'ឋ', '', 'thâ'],
      ['dô · second series', 'ឌ', '', 'dô'], ['thô · second series', 'ឍ', '', 'thô'], ['nâ · first series', 'ណ', '', 'nâ'], ['tâ · first series', 'ត', '', 'tâ'],
      ['thâ · first series (t)', 'ថ', '', 'thâ'], ['tô · second series', 'ទ', '', 'tô'], ['thô · second series (t)', 'ធ', '', 'thô'], ['nô · second series', 'ន', '', 'nô'],
      ['bâ · first series', 'ប', '', 'bâ'], ['phâ · first series', 'ផ', '', 'phâ'], ['pô · second series', 'ព', '', 'pô'], ['phô · second series', 'ភ', '', 'phô'],
      ['mô · second series', 'ម', '', 'mô'], ['yô · second series', 'យ', '', 'yô'], ['rô · second series', 'រ', '', 'rô'], ['lô · second series', 'ល', '', 'lô'],
      ['vô · second series', 'វ', '', 'vô'], ['sâ · first series', 'ស', '', 'sâ'], ['hâ · first series', 'ហ', '', 'hâ'], ['lâ · first series', 'ឡ', '', 'lâ'],
      ['’â · first series', 'អ', '', '’â']
    ] },
    { id: 'vowels', level: 0, script: true, name: 'Vowels', tip: 'A vowel sign attaches to a consonant and sounds one way after a first-series consonant, another after a second-series one: first / second.', words: [
      ['a / ie', '◌ា', '', 'a / ie'], ['e / i', '◌ិ', '', 'e / i'], ['ei / i', '◌ី', '', 'ei / i'], ['œ / œ', '◌ឹ', '', 'œ / œ'], ['œ / œu', '◌ឺ', '', 'œ / œu'],
      ['o / u', '◌ុ', '', 'o / u'], ['ou / u', '◌ូ', '', 'ou / u'], ['uo / uo', '◌ួ', '', 'uo / uo'], ['aeu / eu', '◌ើ', '', 'aeu / eu'], ['eua / eua', '◌ឿ', '', 'eua / eua'],
      ['ie / ie', '◌ៀ', '', 'ie / ie'], ['ei / e', '◌េ', '', 'ei / e'], ['ae / ê', '◌ែ', '', 'ae / ê'], ['ai / ey', '◌ៃ', '', 'ai / ey'], ['ao / ou', '◌ោ', '', 'ao / ou'],
      ['au / ov', '◌ៅ', '', 'au / ov'], ['om / um', '◌ុំ', '', 'om / um'], ['am / um', '◌ំ', '', 'am / um'], ['am / oam', '◌ាំ', '', 'am / oam'],
      ['ah / eah', '◌ះ', '', 'ah / eah'], ['eh / ih', '◌ិះ', '', 'eh / ih'], ['oh / uh', '◌ុះ', '', 'oh / uh'], ['eh / ih (e)', '◌េះ', '', 'eh / ih (e)'],
      ['aoh / uoh', '◌ោះ', '', 'aoh / uoh']
    ] },
    { id: 'indvowels', level: 0, script: true, name: 'Independent vowels', tip: 'These stand on their own, without a consonant.', words: [
      ['e', 'ឥ', '', 'e'], ['ei', 'ឦ', '', 'ei'], ['o', 'ឧ', '', 'o'], ['ou', 'ឩ', '', 'ou'], ['au', 'ឪ', '', 'au'], ['rœ', 'ឫ', '', 'rœ'], ['rœu', 'ឬ', '', 'rœu'],
      ['lœ', 'ឭ', '', 'lœ'], ['lœu', 'ឮ', '', 'lœu'], ['ae', 'ឯ', '', 'ae'], ['ai', 'ឰ', '', 'ai'], ['ao', 'ឱ', '', 'ao'], ['ao (ឲ)', 'ឲ', '', 'ao (ឲ)'],
      ['au (ឳ)', 'ឳ', '', 'au (ឳ)']
    ] },
    { id: 'abc', level: 0, script: true, en: true, name: 'The ABCs', tip: 'The 26 letters of the English alphabet, with how each is said.', words: [
      ['A', 'អេ', '', ''], ['B', 'ប៊ី', '', ''], ['C', 'ស៊ី', '', ''], ['D', 'ឌី', '', ''], ['E', 'អ៊ី', '', ''], ['F', 'អេហ្វ', '', ''], ['G', 'ជី', '', ''], ['H', 'អេច', '', ''],
      ['I', 'អាយ', '', ''], ['J', 'ជេ', '', ''], ['K', 'ខេ', '', ''], ['L', 'អែល', '', ''], ['M', 'អិម', '', ''], ['N', 'អិន', '', ''], ['O', 'អូ', '', ''], ['P', 'ភី', '', ''],
      ['Q', 'ឃ្យូ', '', ''], ['R', 'អា', '', ''], ['S', 'អេស', '', ''], ['T', 'ធី', '', ''], ['U', 'យូ', '', ''], ['V', 'វី', '', ''], ['W', 'ដាប់ប៊ែលយូ', '', ''],
      ['X', 'អិចស៍', '', ''], ['Y', 'វ៉ាយ', '', ''], ['Z', 'ហ្ស៊ី', '', '']
    ] },
    { id: 'abclower', level: 0, script: true, en: true, name: 'Small letters', tip: 'The same 26 letters, as they look most of the time.', words: [
      ['a', 'អេ', '', ''], ['b', 'ប៊ី', '', ''], ['c', 'ស៊ី', '', ''], ['d', 'ឌី', '', ''], ['e', 'អ៊ី', '', ''], ['f', 'អេហ្វ', '', ''], ['g', 'ជី', '', ''], ['h', 'អេច', '', ''],
      ['i', 'អាយ', '', ''], ['j', 'ជេ', '', ''], ['k', 'ខេ', '', ''], ['l', 'អែល', '', ''], ['m', 'អិម', '', ''], ['n', 'អិន', '', ''], ['o', 'អូ', '', ''], ['p', 'ភី', '', ''],
      ['q', 'ឃ្យូ', '', ''], ['r', 'អា', '', ''], ['s', 'អេស', '', ''], ['t', 'ធី', '', ''], ['u', 'យូ', '', ''], ['v', 'វី', '', ''], ['w', 'ដាប់ប៊ែលយូ', '', ''],
      ['x', 'អិចស៍', '', ''], ['y', 'វ៉ាយ', '', ''], ['z', 'ហ្ស៊ី', '', '']
    ] },
    { id: 'numbers', level: 1, name: 'Numbers', words: [
      ['1', 'មួយ', '១', 'muoy'], ['2', 'ពីរ', '២', 'pi'], ['3', 'បី', '៣', 'bei'], ['4', 'បួន', '៤', 'buon'], ['5', 'ប្រាំ', '៥', 'pram'], ['6', 'ប្រាំមួយ', '៦', 'pram muoy'],
      ['7', 'ប្រាំពីរ', '៧', 'pram pi'], ['8', 'ប្រាំបី', '៨', 'pram bei'], ['9', 'ប្រាំបួន', '៩', 'pram buon'], ['10', 'ដប់', '១០', 'dap'], ['20', 'ម្ភៃ', '២០', 'mphey'],
      ['30', 'សាមសិប', '៣០', 'sam seb'], ['40', 'សែសិប', '៤០', 'sae seb'], ['50', 'ហាសិប', '៥០', 'ha seb'], ['60', 'ហុកសិប', '៦០', 'hok seb'], ['70', 'ចិតសិប', '៧០', 'chet seb'],
      ['80', 'ប៉ែតសិប', '៨០', 'paet seb'], ['90', 'កៅសិប', '៩០', 'kav seb'], ['100', 'មួយរយ', '១០០', 'muoy roy'], ['1,000', 'មួយពាន់', '១០០០', 'muoy poan'],
      ['10,000', 'មួយម៉ឺន', '', 'muoy meun'], ['100,000', 'មួយសែន', '', 'muoy saen'], ['1,000,000', 'មួយលាន', '', 'muoy lean'], ['0', 'សូន្យ', '០', 'soun']
    ] },
    { id: 'prepositions', level: 1, name: 'Prepositions', words: [
      ['At / side', 'នៅ / ខាង', '', 'nov / khang'], ['In', 'ក្នុង', '', 'knong'], ['Out', 'ក្រៅ', '', 'krau'], ['On / above', 'ខាងលើ', '', 'khang-leu'],
      ['Forward', 'ទៅមុខ', '', 'tov-muk'], ['Left', 'ខាងឆ្វេង', '', 'khang-chhveing'], ['Right', 'ខាងស្តាំ', '', 'khang-stam'], ['Front', 'ខាងមុខ', '', 'khang-muk'],
      ['Behind', 'ខាងក្រោយ', '', 'khang-kraoy'], ['Below', 'ខាងក្រោម', '', 'khang-kraom'], ['Near', 'នៅជិត', '', 'nov-chit'], ['Beside', 'នៅក្បែរ', '', 'nov-kbae'],
      ['Close', 'នៅក្បែរ', '', 'nov-kbae'], ['Around', 'ជុំវិញ', '', 'chum-vinh'], ['Among', 'ក្នុងចំណោម', '', 'knong-cham-naom'], ['This', 'នេះ', '', 'nih'],
      ['That', 'នោះ', '', 'nuoh'], ['Here', 'នៅទីនេះ', '', 'nov-ti-nih'], ['There', 'នៅទីនោះ', '', 'nov-ti-nuoh']
    ] },
    { id: 'colors', level: 1, name: 'Colours', words: [
      ['White', 'ពណ៌ស', '', 'poa sor'], ['Black', 'ពណ៌ខ្មៅ', '', 'poa khmav'], ['Green', 'ពណ៌បៃតង', '', 'poa baitang'], ['Brown', 'ពណ៌ត្នោត', '', 'poa tnaot'],
      ['Red', 'ពណ៌ក្រហម', '', 'poa krohom'], ['Blue', 'ពណ៌ខៀវ', '', 'poa khiev'], ['Yellow', 'ពណ៌លឿង', '', 'poa lueng'], ['Gray', 'ពណ៌ប្រផេះ', '', 'poa propheh'],
      ['Purple', 'ពណ៌ស្វាយ', '', 'poa svay'], ['Orange', 'ពណ៌ទឹកក្រូច', '', 'poa tuk krouch'], ['Pink', 'ពណ៌ផ្កាឈូក', '', 'poa phka chhouk']
    ] },
    { id: 'time', level: 1, name: 'Time', words: [
      ['Time', 'ពេលវេលា', '', 'pel-ve-lie'], ['Before', 'ពីមុន', '', 'pi-mun'], ['Now', 'ឥឡូវនេះ', '', 'eylov nih'], ['Later', 'ពេលក្រោយ', '', 'pel-kraoy'],
      ['Yesterday', 'ម្សិលមិញ', '', 'msel menh'], ['Today', 'ថ្ងៃនេះ', '', 'thngai nih'], ['Tomorrow', 'ថ្ងៃស្អែក', '', 'thngai sa-aek'], ['Past', 'អតីតកាល', '', 'a-teyt-kal'],
      ['Present', 'បច្ចុប្បន្ន', '', 'bach-chop-nno'], ['Future', 'អនាគត', '', 'a-niek-ta'], ['Second', 'វិនាទី', '', 'vi-nie-ti'], ['Minute', 'នាទី', '', 'nie-ti'],
      ['Hour', 'ម៉ោង', '', 'maong'], ['Day', 'ថ្ងៃ', '', 'thngai'], ['Week', 'សប្តាហ៍ / អាទិត្យ', '', 'sap-da / a-tit'], ['Weekend', 'ចុងសប្តាហ៍', '', 'chong-sap-da'],
      ['Month', 'ខែ', '', 'khae'], ['Year', 'ឆ្នាំ', '', 'chhnam'], ['Monday', 'ថ្ងៃច័ន្ទ', '', 'thngai-chan'], ['Tuesday', 'ថ្ងៃអង្គារ', '', 'thngai-ang-kie'],
      ['Wednesday', 'ថ្ងៃពុធ', '', 'thngai-put'], ['Thursday', 'ថ្ងៃព្រហស្បតិ៍', '', 'thngai-proh-sba-te'], ['Friday', 'ថ្ងៃសុក្រ', '', 'thngai-sok'],
      ['Saturday', 'ថ្ងៃសៅរ៍', '', 'thngai-sau'], ['Sunday', 'ថ្ងៃអាទិត្យ', '', 'thngai-a-tit'], ['January', 'ខែមករា', 'ខែ១', 'khae-mok-rie'],
      ['February', 'ខែកុម្ភៈ', 'ខែ២', 'khae-kom-pheak'], ['March', 'ខែមីនា', 'ខែ៣', 'khae-mi-nie'], ['April', 'ខែមេសា', 'ខែ៤', 'khae-me-sa'],
      ['May', 'ខែឧសភា', 'ខែ៥', 'khae-o-sa-phie'], ['June', 'ខែមិថុនា', 'ខែ៦', 'khae-mi-tho-nie'], ['July', 'ខែកក្កដា', 'ខែ៧', 'khaek-kka-da'],
      ['August', 'ខែសីហា', 'ខែ៨', 'khae-sey-ha'], ['September', 'ខែកញ្ញា', 'ខែ៩', 'khaek-nhnhie'], ['October', 'ខែតុលា', 'ខែ១០', 'khae-to-lie'],
      ['November', 'ខែវិច្ឆិកា', 'ខែ១១', 'khae-vich-chhe-ka'], ['December', 'ខែធ្នូ', 'ខែ១២', 'khae-thnu'], ['Mostly', 'ភាគច្រើន', '', 'phiek-chraeun'],
      ['Will (future)', 'នឹង', '', 'noeng'], ['Was (past)', 'បាន', '', 'ban'], ['Is (continuous)', 'កំពុង', '', 'kam-pung'], ['In general', 'ជាទូទៅ', '', 'chie-tu-tov'],
      ['A moment', 'មួយភ្លែត', '', 'muoy-phlaet'], ['First', 'ដំបូង', '', 'dam-boung'], ['Sometimes', 'ពេលខ្លះ', '', 'pel-khlah'], ['Always', 'តែងតែ', '', 'taeng-tae'],
      ['Never', 'មិនដែល', '', 'min-dael'], ['Constantly', 'រហូត', '', 'ro-hout'], ['Normally', 'ជាធម្មតា', '', 'chiet-mmo-ta'], ['Once in a while', 'ម្តងម្កាល', '', 'mtang-mkal'],
      ['Eternally', 'អស់កល្បជានិច្ច', '', 'ah-kal-chie-nich'], ['Frequently', 'ញឹកញាប់', '', 'nhuek-nhiep'], ['Morning', 'ព្រឹក', '', 'pruek'],
      ['Afternoon', 'រសៀល', '', 'ro-siel'], ['Evening', 'ល្ងាច', '', 'lngiech'], ['Night', 'យប់', '', 'yop'], ['Breakfast', 'អាហារពេលព្រឹក', '', 'a-ha-pel-pruek'],
      ['Lunch', 'អាហារថ្ងៃត្រង់', '', 'a-ha-thngai-trang'], ['Dinner', 'អាហារពេលល្ងាច', '', 'a-ha-pel-lngiech'], ['How many?', 'ប៉ុន្មាន?', '', 'ponman?'],
      ['What time is it?', 'តើម៉ោងប៉ុន្មាន?', '', 'taeu-maong-ponman?'], ['While', 'ខណៈពេលដែល', '', 'kha-nak-pel-dael'], ['Duration', 'រយៈពេល', '', 'ro-yeak-pel']
    ] },
    { id: 'family', level: 1, name: 'Honour titles & family', words: [
      ['Younger brother / sister', 'ប្អូនប្រុស / ប្អូនស្រី', 'younger than you', 'poun-proh / poun-srey'],
      ['Older brother / sister', 'បងប្រុស / បងស្រី', 'older than you', 'bang-proh / bang-srey'], ['Younger uncle', 'ពូ', 'much older than you, younger than your parents', 'pu'],
      ['Younger aunt', 'មីង', 'much older than you, younger than your parents', 'ming'],
      ['Older uncle / aunt', 'អ៊ុំប្រុស / អ៊ុំស្រី', 'older than your parents', 'um-proh / um-srey'], ['Grandpa', 'លោកតា', '', 'louk-ta'], ['Grandma', 'លោកយាយ', '', 'louk-yiey'],
      ['Mother', 'ម្តាយ', '', 'mdai'], ['Father', 'ឪពុក', '', 'ovpuk'], ['Siblings', 'បងប្អូន', '', 'bang-poun'], ['Child', 'កូន', '', 'koun'],
      ['Friend', 'មិត្តភក្តិ', '', 'mit pheak'], ['Husband', 'ប្តី', '', 'pdey'], ['Wife', 'ប្រពន្ធ', '', 'prapun'], ['Parents', 'ឪពុកម្តាយ', '', 'ovpuk-mdai'],
      ['Teacher', 'គ្រូបង្រៀន', '', 'krou-bang-rien'], ['Male teacher', 'លោកគ្រូ', '', 'louk-krou'], ['Female teacher', 'អ្នកគ្រូ', '', 'neak-krou']
    ] },
    { id: 'pronouns', level: 1, name: 'Pronouns', words: [
      ['You', 'អ្នក', '', 'neak'], ['Me', 'ខ្ញុំ', '', 'khnhom'], ['It', 'វា', '', 'vie'], ['They', 'ពួកគេ', '', 'puok ke'], ['He / she', 'គាត់', '', 'koat'],
      ['She', 'នាង', '', 'neang'], ['We', 'ពួកយើង', '', 'puok yeung'], ['Everyone', 'ទាំងអស់គ្នា', '', 'teang os knie'], ['Myself', 'ខ្លួនឯង', '', 'khluon aeng'],
      ['Yourself', 'បងឯង', '', 'bang-ae-ngo'], ['Mine', 'របស់ខ្ញុំ', '', 'robos khnhom'], ['Yours', 'របស់អ្នក', '', 'robos neak'], ['Theirs', 'របស់គេ', '', 'rop-sa-ke'],
      ['Ours', 'របស់យើង', '', 'rop-sa-yeung'], ['Everyone (in church)', 'បងប្អូនទាំងអស់គ្នា', 'brothers and sisters, all of you', 'bang-poun-teang os knie']
    ] },
    { id: 'verbs', level: 1, name: 'Important verbs', words: [
      ['Walk around / hang out', 'ដើរលេង', '', 'daeu-leng'], ['To like', 'ចូលចិត្ត', '', 'choul chet'], ['To love', 'ស្រឡាញ់', '', 'srolanh'], ['To do', 'ធ្វើ', '', 'thveu'],
      ['To feel', 'មានអារម្មណ៍', '', 'mien-arom'], ['To think', 'គិត', '', 'kit'], ['Go', 'ទៅ', '', 'tov'], ['Try', 'ព្យាយាម', '', 'pyie-yiem'],
      ['Practice', 'អនុវត្ត', '', 'a-nuv-tta'], ['Grow', 'រីកចម្រើន', '', 'rik-cham-reun'], ['Learn', 'រៀន', '', 'rien'], ['Come', 'មក', '', 'mok'], ['Enter', 'ចូល', '', 'choul'],
      ['Leave', 'ចាកចេញ', '', 'chak-cheinh'], ['Have', 'មាន', '', 'mien'], ['Bring', 'នាំមក', '', 'noam-mok'], ['Can', 'អាច', '', 'ach'], ['Put', 'ដាក់', '', 'dak'],
      ['Take', 'យក', '', 'yok'], ['Clean', 'សម្អាត', '', 'sam-at'], ['Start', 'ចាប់ផ្តើម', '', 'chap-phtaeum'], ['Give', 'ផ្តល់ឱ្យ', '', 'phtal-ao-yo'],
      ['Want (to do)', 'ចង់', '', 'chang'], ['Want (a thing)', 'ចង់បាន', '', 'chang-ban'], ['Want (someone to)', 'ចង់ឱ្យ', '', 'chang-ao-yo'], ['Know (how to)', 'ចេះ', '', 'cheh'],
      ['Know (a fact)', 'ដឹង', '', 'deng'], ['Know (a person or place)', 'ស្គាល់', '', 'skoal'], ['Rest', 'សម្រាក', '', 'sam-riek'], ['Help', 'ជួយ', '', 'chuoy'],
      ['Use', 'ប្រើ', '', 'praeu'], ['Eat', 'ហូប', '', 'houp'], ['Sleep', 'គេង', '', 'keng'], ['Study', 'សិក្សា', '', 'sek-sa'],
      ['To be', 'គឺជា / ជា / គឺ', '', 'kue-chie / chie / kue'], ['See', 'ឃើញ', '', 'kheunh'], ['Look', 'មើល', '', 'meul'], ['Hear', 'ឮ', '', 'lue'],
      ['Listen', 'ស្តាប់', '', 'sdap'], ['Laugh', 'សើច', '', 'saeuch'], ['Need', 'ត្រូវការ', '', 'trov-ka'], ['Wait', 'រង់ចាំ', '', 'rong-cham'],
      ['Remind', 'រំលឹក', '', 'rum-luek'], ['Either', 'មួយណាក៏បាន', '', 'muoy-na-kor-ban'], ['Work', 'ធ្វើការ', '', 'thveu-ka'], ['Receive', 'ទទួល', '', 'to-tuol'],
      ['Say', 'និយាយ', '', 'niyeay'], ['Read', 'អាន', '', 'an'], ['Make', 'ធ្វើ', '', 'thveu'], ['Close / turn off', 'បិទ', '', 'bet'], ['Open / turn on', 'បើក', '', 'baeuk'],
      ['Cry', 'យំ', '', 'yum'], ['Search', 'ស្វែងរក', '', 'svaeng-rok'], ['Remember', 'ចងចាំ', '', 'chang-cham'], ['Have to', 'ត្រូវតែ', '', 'trov-tae'],
      ['Both', 'ទាំងពីរ', '', 'toamng-pi'], ['Walk', 'ដើរ', '', 'daeu'], ['Run', 'រត់', '', 'rot'], ['Sit', 'អង្គុយ', '', 'angkuy'], ['Stand', 'ឈរ', '', 'chho'],
      ['Jump', 'លោត', '', 'lout'], ['Dance', 'រាំ', '', 'roam'], ['Bite', 'ខាំ', '', 'kham'], ['Tell', 'ប្រាប់', '', 'prap'], ['Forget', 'ភ្លេច', '', 'phlech'],
      ['Explain', 'ពន្យល់', '', 'pon-lo'], ['Describe', 'ពិពណ៌នា', '', 'pip-na-nie']
    ] },
    { id: 'connectives', level: 1, name: 'Connective words', words: [
      ['If', 'ប្រសិនបើ / ប្រសិនជា / បើ', '', 'pra-sen-baeu / pra-sen-chie / baeu'], ['So', 'ដូច្នេះ', '', 'doch-neh'], ['That / which', 'ដែល', '', 'dael'],
      ['When', 'ពេល', '', 'pel'], ['Because', 'ពីព្រោះ / ព្រោះ / ដោយសារ', '', 'pi-pruoh / pruoh / daoy-sa'], ['For', 'សម្រាប់', '', 'sam-riep'], ['About', 'អំពី', '', 'am-pi'],
      ['And', 'ហើយនិង / ហើយ / និង', '', 'haeuy-ning / haeuy / ning'], ['Until', 'រហូតដល់', '', 'ro-hout-dal'], ['With', 'ជាមួយ', '', 'chie-muoy'],
      ['After', 'បន្ទាប់ពី', '', 'ban-tiep-pi'], ['Then', 'បន្ទាប់មក', '', 'ban-tiep-mok'], ['Since', 'ចាប់តាំងពី', '', 'chap-tamng-pi'], ['Should', 'គួរ', '', 'kuo'],
      ['Ever', 'ធ្លាប់', '', 'thloap'], ['In order to', 'ដើម្បី', '', 'daeum-bey'], ['But', 'ប៉ុន្តែ', '', 'pon-tae'], ['Even though', 'ទោះបីជា', '', 'tuoh-bei-chie'],
      ['Like (similar to)', 'ដូចជា', '', 'douch-chie'], ['Maybe', 'ប្រហែល', '', 'pra-hael'], ['For example', 'ឧទាហរណ៍', '', 'o-tieh-ro'],
      ['Especially', 'ជាពិសេស', '', 'chie-pi-seih'], ['Too / also', 'ផងដែរ', '', 'phang-dae'], ['Similar', 'ស្រដៀងគ្នា', '', 'sra-dieng-knie'],
      ['Different', 'ខុសគ្នា', '', 'khoh-knie'], ['Same', 'ដូចគ្នា', '', 'douch-knie'], ['More (comparative)', 'ជាង', '', 'chieng'], ['Second', 'ទីពីរ', '', 'ti-pi'],
      ['Finally', 'ទីបំផុត', '', 'ti-bam-phot'], ['For (towards)', 'ចំពោះ', '', 'cham-puoh']
    ] },
    { id: 'questions', level: 1, name: 'Question words', tip: 'A yes/no question: put តើ at the start and អត់ or ទេ at the end. តើបងចូលចិត្តកន្លែងនេះអត់? — Do you like this place?', words: [
      ['Why?', 'ហេតុអ្វី? / ហេតុអ្វីបានជា?', '', 'haet avei? / haet avei-ban-chie?'], ['What?', 'អីគេ? / អ្វី?', '', 'ey-ke? / avei?'],
      ['Where?', 'នៅណា? / កន្លែងណា? / នៅឯណា?', '', 'nov-na? / kan-laeng-na? / nov-ae-na?'], ['When?', 'ពេលណា?', '', 'pel-na?'],
      ['Who?', 'អ្នកណា? / ណាគេ? / នរណា?', '', 'neak na? / na-ke? / no-na?'], ['Which?', 'មួយណា?', '', 'muoy-na?'], ['How many?', 'ប៉ុន្មាន?', '', 'ponman?'],
      ['How? (how do you do that)', 'ដោយរបៀបណា?', '', 'daoy-ro-biep-na?'], ['How was it?', 'ម៉េចដែរ?', '', 'meich-dae?'],
      ['How is it going?', 'ទៅជាយ៉ាងណា?', '', 'tov-chie-yang-na?'], ['What? (open question)', 'អ្វីខ្លះ?', '', 'avei-khlah?'],
      ['Can…?', 'អាច…បានអត់ / ទេ?', '', 'ach-…-ban-ot / te?'], ['Can you help me?', 'តើបងអាចជួយខ្ញុំបានអត់?', '', 'taeup-ngo-ach-chuoy-khnhom-ban-ot?'],
      ['Do you like this place?', 'តើបងចូលចិត្តកន្លែងនេះអត់?', '', 'taeup-ngo-choul-chet-kan-laeng-nih-ot?'], ['What time is it?', 'តើម៉ោងប៉ុន្មាន?', '', 'taeu-maong-ponman?'],
      ['What year?', 'ឆ្នាំណា?', '', 'chhnam-na?'], ['What month?', 'ខែណា?', '', 'khae-na?'], ['What day?', 'ថ្ងៃណា?', '', 'thngai na?'],
      ['How? (which way)', 'របៀបណា?', '', 'ro-biep-na?']
    ] },
    { id: 'intro', level: 2, name: 'Self-introduction', words: [
      ['Name', 'ឈ្មោះ', '', 'chhmuoh'], ['Country', 'ប្រទេស', '', 'pra-teh'], ['Age', 'អាយុ', '', 'a-yu'], ['Have', 'មាន', '', 'mien'],
      ['Nationality', 'ជនជាតិ', '', 'chon-chie-te'], ['Hometown', 'ស្រុកកំណើត', '', 'srok-kam-naeut'], ['Introduce', 'ការណែនាំ', '', 'ka-nae-noam'],
      ['Number of people', 'នាក់', '', 'niek'], ['Reason', 'ហេតុផល', '', 'hei-top-lo'], ['From', 'មកពី', '', 'mok-pi'], ['Siblings', 'បងប្អូន', '', 'bang-poun']
    ] },
    { id: 'home', level: 2, name: 'Home nouns', words: [
      ['Bathroom', 'បន្ទប់ទឹក', '', 'ban-ba-tuk'], ['Stairs', 'ជណ្តើរ', '', 'chon-taeu'], ['Door', 'ទ្វារ', '', 'tvie'], ['Table', 'តុ', '', 'to'],
      ['The roof', 'ដំបូល', '', 'dam-boul'], ['Spoon', 'ស្លាបព្រា', '', 'slap-prie'], ['Garden', 'សួន', '', 'suon'], ['Kitchen', 'ផ្ទះបាយ', '', 'phteah-bai'],
      ['Living room', 'បន្ទប់ទទួលភ្ញៀវ', '', 'ban-bat-tuol-phnhiev'], ['Napkin', 'ក្រដាសជូតមាត់', '', 'kra-dah-chut-miet'], ['Bedroom', 'បន្ទប់គេង', '', 'ban-ba-keng'],
      ['Chair', 'កៅអី', '', 'kau-ey'], ['Shower', 'ងូតទឹក', '', 'ngut-tuk'], ['Toothbrush', 'ច្រាសដុសធ្មេញ', '', 'chrah-doh-thmenh'], ['House', 'ផ្ទះ', '', 'phteah'],
      ['Couch', 'សាឡុង', '', 'sa-long'], ['Comb', 'ក្រាស់', '', 'krah'], ['Fork', 'សម', '', 'sam'], ['Soap', 'សាប៊ូ', '', 'sa-bu'], ['Toilet', 'បង្គន់', '', 'bang-no'],
      ['Toilet paper', 'ក្រដាសជូតគូទ', '', 'kra-dah-chut-kut'], ['Plate', 'ចាន', '', 'chan'], ['Mirror', 'កញ្ចក់', '', 'kanh-ka'], ['Refrigerator', 'ទូរទឹកកក', '', 'tu-tuk-kak'],
      ['Bed', 'គ្រែ', '', 'krae'], ['Blanket', 'ភួយ', '', 'phuoy'], ['Building', 'អាគារ', '', 'a-kie'], ['Cup', 'កែវ', '', 'kaev'], ['Curtains', 'វាំងនន', '', 'veang non'],
      ['Knife', 'កាំបិត', '', 'kam-bet'], ['Light', 'អំពូលភ្លើង', '', 'am-pul-phleung'], ['Mattress', 'ពូក', '', 'puk'], ['Pillow', 'ខ្នើយ', '', 'khnaeuy'],
      ['Stove', 'ចង្ក្រាន', '', 'chang-kran'], ['Towel', 'កន្សែងពោះគោ', '', 'kan-saeng-puoh-ko'], ['TV', 'ទូរទស្សន៍', '', 'tu-toh-no'], ['Pot', 'ឆ្នាំង', '', 'chhnamng'],
      ['Shampoo', 'សាប៊ូកក់សក់', '', 'sa-buk-kah-ka'], ['Wall', 'ជញ្ជាំង', '', 'chonh-choamng'], ['Detergent', 'សាប៊ូបោកខោអាវ', '', 'sa-bu-baok-khao-av'],
      ['Window', 'បង្អួច', '', 'bang-uoch'], ['Lightbulb', 'អំពូល', '', 'am-pul']
    ] },
    { id: 'homeacts', level: 2, name: 'Home activities', words: [
      ['To cook', 'ធ្វើម្ហូប', '', 'thveu-mhoup'], ['To clean', 'សំអាត', '', 'sam-at'], ['Use the bathroom', 'ចូលបន្ទប់ទឹក', '', 'choul-ban-ba-tuk'],
      ['Take a shower', 'ងូតទឹក', '', 'ngut-tuk'], ['Wash face', 'លុបមុខ', '', 'lup-muk'], ['Comb hair', 'សិតសក់', '', 'set-sak'], ['Wash dishes', 'លាងចាន', '', 'lieng-chan'],
      ['Wash hands', 'លាងដៃ', '', 'lieng-dai'], ['Put makeup on', 'ផាត់មុខ', '', 'phat-muk'], ['Eat dinner', 'ញ៉ាំបាយ', '', 'nham-bai'],
      ['Watch movies', 'មើលរឿង', '', 'meul-reuang'], ['Read a book', 'អានសៀវភៅ', '', 'an-siev-phov'], ['Play games', 'លេងហ្គេម', '', 'leng-hkem'],
      ['Do the hair', 'ធ្វើសក់', '', 'thveu-sak'], ['Wash hair', 'សំអាតសក់', '', 'sam-at-sak'], ['Have guests', 'មានភ្ញៀវ', '', 'mien-phnhiev'],
      ['Welcome', 'សូមស្វាគមន៍', '', 'soum-sva-kom-no'], ['Get out of bed', 'ក្រោកពីដេក', '', 'kraok-pi-deik'], ['Sleep', 'ដេក', '', 'deik'],
      ['Hang out', 'អង្គុយលេង', '', 'angkuy-leng'], ['Wash clothes', 'បោកខោអាវ', '', 'baok-khao-av'], ['Hang clothes', 'ហាលខោអាវ', '', 'hal-khao-av']
    ] },
    { id: 'market', level: 2, name: 'Market', words: [
      ['Market', 'ផ្សារ', '', 'phsa'], ['Buy', 'ទិញ', '', 'tinh'], ['Sell', 'លក់', '', 'luk'], ['Seller', 'អ្នកលក់', '', 'neak-luk'], ['Buyer', 'អ្នកទិញ', '', 'neak-tinh'],
      ['How much?', 'ថ្លៃប៉ុន្មាន?', '', 'thlai-ponman?'], ['Expensive', 'ថ្លៃ', '', 'thlai'], ['Cheap', 'ថោក', '', 'thaok'], ['Rip off!', 'ហែក', '', 'haek'],
      ['Discount', 'បញ្ចុះតម្លៃ', '', 'banh-choht-mley'], ['Salt', 'អំបិល', '', 'am-bel'], ['Sugar', 'ស្ករ', '', 'ska'], ['MSG', 'ប៊ីចេង', '', 'bi-cheing'],
      ['Oil', 'ប្រេងឆា', '', 'preing-chha'], ['Pepper', 'ម្រេច', '', 'mrech'], ['Fruit', 'ផ្លែឈើ', '', 'phlae-chheu'], ['Mango', 'ស្វាយ', '', 'svay'],
      ['Watermelon', 'ឪឡឹក', '', 'au-loek'], ['Apple', 'ផ្លែប៉ោម', '', 'phlae-paom'], ['Orange', 'ផ្លែក្រូច', '', 'phlae-krouch'],
      ['Grapes', 'ផ្លែទំពាំងបាយជូរ', '', 'phlae-tum-poamng-bai-chu'], ['Banana', 'ចេក', '', 'chek'], ['Coconut', 'ដូង', '', 'doung'], ['Papaya', 'ល្ហុង', '', 'lhong'],
      ['Pineapple', 'ម្នាស់', '', 'mnieh'], ['Passion fruit', 'ផ្លែជាស់ស៊ិន', '', 'phlae-chieh-sin'], ['Lime', 'ក្រូចឆ្មា', '', 'krouch-chhma'],
      ['Dragon fruit', 'ផ្លែស្រកានាគ', '', 'phlaeh-ka-niek'], ['Jackfruit', 'ផ្លែខ្នុរ', '', 'phlae-khno'], ['Avocado', 'ផ្លែបឺរ', '', 'phlae-boe'],
      ['Vegetable', 'បន្លែ', '', 'ban-lae'], ['Corn', 'ពោត', '', 'pout'], ['Potato', 'ដំឡូងបារាំង', '', 'dam-loung-ba-roamng'], ['Tomato', 'ប៉េងប៉ោះ', '', 'peing-paoh'],
      ['Garlic', 'ខ្ទឹម', '', 'khtuem'], ['Chili pepper', 'ម្ទេសប្លោក', '', 'mteh-plaok'], ['Onion', 'ខ្ទឹមបារាំង', '', 'khtuem-ba-roamng'], ['Lettuce', 'សាឡាត់', '', 'sa-lat'],
      ['Ginger', 'ខ្ញី', '', 'khnhey'], ['Meat', 'សាច់', '', 'sach'], ['Chicken', 'សាច់មាន់', '', 'sach-moan'], ['Pork', 'សាច់ជ្រូក', '', 'sach-chrouk'],
      ['Beef', 'សាច់គោ', '', 'sach-ko'], ['Fish', 'ត្រី', '', 'trey'], ['Lamb', 'សាច់ចៀម', '', 'sach-chiem']
    ] },
    { id: 'morning', level: 2, name: 'Morning routine', words: [
      ['Exercise', 'ហាត់ប្រាណ', '', 'hat-pran'], ['Spend time with God', 'ចំណាយពេលជាមួយព្រះ', '', 'cham-nay-pel-chie-muoy-preah'], ['Read the Bible', 'អានគម្ពីរ', '', 'an-kom-pi'],
      ['Drink water', 'ផឹកទឹក', '', 'phoek-tuk'], ['Go for a walk', 'ចេញដើរលេង', '', 'cheinh-daeu-leng'], ['Go for a run', 'ទៅរត់', '', 'tov-rot'],
      ['Look at the phone', 'មើលទូរសព្ទ', '', 'meul-tu-sap'], ['Plan the day', 'រៀបគម្រោង', '', 'riep-kom-roung'], ['Ride a bike', 'ជិះកង់', '', 'chih-kang'],
      ['Write in a journal', 'សរសេរកំណត់ហេតុ', '', 'sa-sei-kamn-ta-hei-to'], ['Make your bed', 'រៀបចំគ្រែ', '', 'riep-cham-krae']
    ] },
    { id: 'relnouns', level: 2, name: 'Relationships — people', words: [
      ['Girlfriend / boyfriend', 'សង្សារ', '', 'sang-sa'], ['Human', 'មនុស្ស', '', 'monuh'], ['Roommate', 'មិត្តរួមបន្ទប់', '', 'mit-ruom-ban-ba'],
      ['Fiancé(e)', 'គូដណ្តឹង', '', 'kut-ntoeng']
    ] },
    { id: 'relverbs', level: 2, name: 'Relationships — verbs', words: [
      ['Marry', 'រៀបការ', '', 'riep-ka'], ['Become engaged', 'ភ្ជាប់ពាក្យ', '', 'phchiep-piek'], ['Encourage', 'លើកទឹកចិត្ត', '', 'leuk-tuk-chet'], ['Kiss', 'ថើប', '', 'thaeup'],
      ['Have a crush', 'លួចស្រឡាញ់', '', 'luoch-srolanh'], ['To like', 'ចូលចិត្ត', '', 'choul chet'], ['Hug', 'អោប', '', 'aop'], ['Break up', 'បែកគ្នា', '', 'baek-knie'],
      ['To love', 'ស្រឡាញ់', '', 'srolanh']
    ] },
    { id: 'physical', level: 2, name: 'Describing looks', words: [
      ['Muscular', 'មានសាច់ដុំ', '', 'mien-sach-dom'], ['Handsome', 'សង្ហា', '', 'sang-ha'], ['Beautiful', 'ស្អាត', '', 'sa-at'], ['Sexy', 'សិចស៊ី', '', 'sech-si'],
      ['Tall', 'ខ្ពស់', '', 'khpoh'], ['Blue eyes', 'ភ្នែកខៀវ', '', 'phnek-khiev'], ['Short', 'ទាប', '', 'tiep'], ['Fat', 'ធាត់', '', 'thiet'], ['Skinny', 'ស្គម', '', 'skom'],
      ['White skin', 'ស្បែកស', '', 'sbaek-sa'], ['Dark skin', 'ស្បែកខ្មៅ', '', 'sbaek-khmau'], ['Brown eyes', 'ភ្នែកខ្មៅ', '', 'phnek-khmau'],
      ['Long hair', 'សក់វែង', '', 'sak-vaeng'], ['Short hair', 'សក់ខ្លី', '', 'sak-khley'], ['Bald', 'ក្បាលត្រងោល', '', 'kbal-tra-ngoul'],
      ['Curly hair', 'សក់រួញ', '', 'sak-ruonh'], ['Straight hair', 'សក់ត្រង់', '', 'sak-trang'], ['Chubby', 'ធាត់ៗ', '', 'thiet']
    ] },
    { id: 'character', level: 2, name: 'Describing character', words: [
      ['Kind', 'ចិត្តល្អ', '', 'chet-la-or'], ['Smart', 'ឆ្លាត', '', 'chhlat'], ['Funny', 'កំប្លែង', '', 'kam-plaeng'],
      ['Interesting', 'គួរឱ្យចាប់អារម្មណ៍', '', 'kuo-ao-yo-chap-arom'], ['Gentle', 'សុភាព', '', 'so-phiep'], ['Happy', 'សប្បាយ', '', 'sabbay'], ['Rude', 'ឈ្លើយ', '', 'chhleuy'],
      ['Poor', 'ក្រ', '', 'kra'], ['Shy', 'អៀន', '', 'ien'], ['Amazing', 'អស្ចារ្យ', '', 'ah-cha'], ['Humble', 'បន្ទាបខ្លួន', '', 'ban-tiep-khluon'],
      ['Brave', 'ក្លាហាន', '', 'kla-han'], ['Honest / faithful', 'ស្មោះត្រង់', '', 'smaoht-ngo'], ['Prideful', 'ក្រអឺតក្រទម', '', 'kra-oet-krat-mo'],
      ['Angry', 'ខឹង', '', 'khoeng'], ['Talented / good at', 'ពូកែ', '', 'pu-kae'], ['Calm', 'ស្ងប់ចិត្ត', '', 'sngap-chet'], ['Wise', 'មានប្រាជ្ញា', '', 'mien-prach-nhie'],
      ['Selfish', 'អាត្មានិយម', '', 'a-tma-niy-mo'], ['Generous', 'សប្បុរស', '', 'sap-bo-sa'], ['Creative', 'ច្នៃប្រឌិត', '', 'chnaip-dit'], ['Lazy', 'ខ្ជិល', '', 'khchil'],
      ['Cute', 'គួរឱ្យស្រឡាញ់', '', 'kuo-ao-yo-srolanh'], ['Frustrated', 'ម៉ូម៉ៅ', '', 'mou-mau'], ['Rich', 'មាន', '', 'mien'], ['Lonely', 'ឯកកោ', '', 'ae-ka-kao']
    ] },
    { id: 'city', level: 2, name: 'In the city', words: [
      ['Road', 'ផ្លូវ', '', 'phlov'], ['Moto', 'ម៉ូតូ', '', 'moto'], ['Ride', 'ជិះ', '', 'chih'], ['Follow the road', 'ទៅតាមផ្លូវ', '', 'tov-tam-phlov'],
      ['Go straight', 'ទៅត្រង់', '', 'tov-trang'], ['Bike mechanic', 'ជាងកង់', '', 'chieng-kang'], ['Park', 'សួន', '', 'suon'], ['Place', 'ទីកន្លែង', '', 'tik-nlaeng'],
      ['Problem', 'បញ្ហា', '', 'banh-ha'], ['Broken', 'ខូច', '', 'khouch'], ['City', 'ទីក្រុង', '', 'ti krong'], ['Bicycle', 'កង់', '', 'kang'],
      ['Bus', 'ឡានក្រុង', '', 'lan-krong'], ['Turn left', 'បត់ឆ្វេង', '', 'bat-chhveing'], ['Stop', 'ឈប់', '', 'chhop'], ['Car mechanic', 'ជាងឡាន', '', 'chieng-lan'],
      ['Hospital', 'មន្ទីរពេទ្យ', '', 'muntipet'], ['Fix', 'ជួសជុល', '', 'chuoh-chul'], ['Gas', 'សាំង', '', 'samng'], ['Coffee shop', 'ហាងកាហ្វេ', '', 'hang-kafe'],
      ['Car', 'ឡាន', '', 'lan'], ['Drive', 'បើក', '', 'baeuk'], ['Supermarket', 'ផ្សារទំនើប', '', 'phsa-tum-neup'], ['Turn right', 'បត់ស្តាំ', '', 'bat-stam'],
      ['Moto mechanic', 'ជាងម៉ូតូ', '', 'chieng-moto'], ['Restaurant', 'ហាងបាយ', '', 'hang bai'], ['Farm', 'ចម្ការ', '', 'cham-ka'],
      ['Gas station', 'កន្លែងចាក់សាំង', '', 'kan-laeng-chak-samng'], ['Fill it up', 'ចាក់ឱ្យពេញ', '', 'chak-ao-yo-penh']
    ] },
    { id: 'ywam', level: 2, name: 'YWAM life', words: [
      ['Staff', 'បុគ្គលិក', '', 'bokkolik'], ['Meeting', 'ប្រជុំ', '', 'pro-chum'], ['Class', 'ថ្នាក់រៀន', '', 'thnak rien'], ['Bible', 'ព្រះគម្ពីរ', '', 'preah kompi'],
      ['Campus', 'ទីស្នាក់ការ', '', 'ti-snak-ka'], ['Church planting', 'ដាំដុះក្រុមជំនុំ', '', 'dam-doh-krom chumnum'], ['Church (the building)', 'ព្រះវិហារ', '', 'preah vihie'],
      ['Church (the people)', 'ក្រុមជំនុំ', '', 'krom chumnum'], ['Community night', 'រាត្រីសហគមន៍', '', 'rie-trey-sah-kom-no'], ['Base', 'មូលដ្ឋាន', '', 'mul-dthan'],
      ['Ministry', 'ព័ន្ធកិច្ច', '', 'poan kech'], ['Mercy ministry', 'ព័ន្ធកិច្ចមេត្តាករុណា', '', 'poan kech-met-tak-ru-na'], ['School', 'សាលារៀន', '', 'sala rien'],
      ['Director', 'នាយកសាលា', '', 'niey-ka-sa-lie'], ['Department', 'នាយកដ្ឋាន', '', 'niey-kat-than'], ['Director team', 'ក្រុមនាយក', '', 'krom-niey-ka'],
      ['Elder team', 'ក្រុមចាស់ទុំ', '', 'krom-chah-tum'], ['Leader', 'អ្នកដឹកនាំ', '', 'neak doek noam'], ['Worship', 'ថ្វាយបង្គំ', '', 'thvay bangkum'],
      ['Intercession', 'អធិស្ឋានទូលអង្វរ', '', 'athisthan-tul-ang-ro'], ['Work duties', 'ការងារប្រចាំថ្ងៃ', '', 'ka ngie-pra-cham-thngai'],
      ['Jesus', 'ព្រះយេស៊ូវ', '', 'preah yesu'], ['God', 'ព្រះអង្គ', '', 'preah ang'], ['Holy Spirit', 'ព្រះវិញ្ញាណបរិសុទ្ធ', '', 'preah vinhnhean borisot'],
      ['Lead', 'ដឹកនាំ', '', 'doek-noam'], ['Discuss', 'ពិភាក្សា', '', 'pi-phiek-sa'], ['Announcements', 'សេចក្តីប្រកាស', '', 'seich-kteyp-kah'],
      ['Classroom', 'ថ្នាក់រៀន', '', 'thnak rien'], ['Map', 'ផែនទី', '', 'phaen-ti'], ['Pioneer', 'ការត្រួសត្រាយ', '', 'ka-truoh-tray'], ['Student', 'សិស្ស', '', 'seh'],
      ['Are you ready?', 'ត្រៀមខ្លួននៅ?', '', 'triem-khluon-nov?'], ['On time', 'ទាន់ពេល', '', 'tien-pel'], ['Certificate', 'សញ្ញាប័ត្រ', '', 'sanhnhabat'],
      ['Graduation', 'ទទួលសញ្ញាប័ត្រ', '', 'to-tuol-sanhnhabat'], ['DTS', 'សាលាបណ្តុះបណ្តាលភាពជាសាវ័ក', '', 'sa-liep-ntohp-ntal-phiep-chie-sa-voak'],
      ['SBS', 'សាលាសិក្សាព្រះគម្ពីរ', '', 'sa-lie-sek-sa-preah kompi'], ['SOMD', 'សាលាបណ្តុះបណ្តាលខ្លួនសម្រាប់ព័ន្ធកិច្ច', '', 'sa-liep-ntohp-ntal-khluon-sam-riep-poan kech'],
      ['Titus', 'សាលាបង្រៀនព្រះគម្ពីរ', '', 'sa-liep-ngrien-preah kompi'], ['Small group', 'ក្រុមតូច', '', 'krom-touch'], ['One on one', 'មួយទល់មួយ', '', 'muoy-tol-muoy'],
      ['Morning chores', 'ការងារពេលព្រឹក', '', 'ka ngie-pel-pruek'], ['Continue on', 'បន្តទៀត', '', 'ban-tiet'], ['Grow', 'លូតលាស់', '', 'lut-lieh'], ['Meet', 'ជួប', '', 'chuop'],
      ['Snack', 'អាហារសំរន់', '', 'a-ha-sam-no'], ['Rest', 'សម្រាក', '', 'sam-riek'], ['Program', 'កម្មវិធី', '', 'kam-vi-thi'], ['Join in', 'ចូលរួម', '', 'choul-ruom'],
      ['Unity', 'ការរួបរួម', '', 'ka-ruop-ruom'], ['Prayer room', 'បន្ទប់អធិស្ឋាន', '', 'ban-ba-athisthan'], ['Believe', 'ជឿ', '', 'chuea'],
      ['Faith', 'សេចក្តីជំនឿ', '', 'sechkdei chumnuea'], ['Society', 'សង្គម', '', 'sangkum'], ['Cafeteria', 'កន្លែងញ៉ាំបាយ', '', 'kan-laeng-nham-bai'],
      ['Hut', 'ខ្ទម', '', 'khtom'], ['Soccer field', 'កន្លែងលេងបាល់', '', 'kan-laeng-leng-bal'], ['Finish', 'ចប់', '', 'chap'], ['Stage', 'ឆាក', '', 'chhak'],
      ['Media', 'ប្រព័ន្ធផ្សព្វផ្សាយ', '', 'pra-poan-phsap-phsay'], ['New sound', 'សំលេងថ្មី', '', 'sam-leng-thmey'], ['Party', 'ជប់លៀង', '', 'chop-lieng'],
      ['Interrupt', 'រំខាន', '', 'rum-khan'], ['Family circle', 'រង្វង់គ្រួសារ', '', 'rong-ngok-ruo-sa'], ['Home circle', 'រង្វង់គ្រួសារ', '', 'rong-ngok-ruo-sa'],
      ['Office', 'ការិយាល័យ', '', 'ka-ri-yie-loay'], ['Gateway circle', 'ច្រកចេញចូល', '', 'chrak-cheinh-choul'], ['Community life', 'ជីវិតសហគមន៍', '', 'chi-vit-sah-kom-no'],
      ['Community', 'សហគមន៍', '', 'sah-kom-no'], ['Security', 'សន្តិសុខ', '', 'san-te-sok'], ['Influence', 'ជះឥទ្ធិពល', '', 'cheah-e-tthip-lo'],
      ['Outreach', 'បេសកកម្ម', '', 'be-sak-kam'], ['Missionary', 'បេសកជន', '', 'beih-kach-no'], ['Evangelism', 'ផ្សាយដំណឹងល្អ', '', 'phsay-dam-noeng-la-or'],
      ['Bring (people)', 'នាំ', '', 'noam'], ['Conference', 'សន្និសីទ', '', 'san-ni-seyt'], ['International', 'អន្តរជាតិ', '', 'an-ro-chie-te'], ['Global', 'សកល', '', 'sak-lo'],
      ['Foreigner', 'ជនបរទេស', '', 'chon-ba-teh'], ['Out of something', 'អស់', '', 'ah'], ['Out of money', 'អស់លុយហើយ', '', 'ah-luy-haeuy'], ['Finances', 'ថវិកា', '', 'tha-vi-ka'],
      ['Culture', 'វប្បធម៌', '', 'vop-thom'], ['Fundraising', 'រៃអង្គាសថវិកា', '', 'rey-ngkieh-tha-vi-ka'], ['Volunteer', 'អ្នកស្ម័គ្រចិត្ត', '', 'neak-smak-chet'],
      ['Religion', 'សាសនា', '', 'sah-nie'], ['Try it out', 'សាកល្បង', '', 'sak-lbang'], ['Christian', 'គ្រីស្ទាន', '', 'kri-stien'], ['Topic', 'ប្រធានបទ', '', 'pra-thien-bat'],
      ['Explain', 'ពន្យល់', '', 'pon-lo'], ['Story', 'រឿង', '', 'reuang'], ['Achieve', 'សម្រេច', '', 'sam-rech'], ['Process', 'ដំណើរការ', '', 'dam-naeu-ka'],
      ['Through', 'តាមរយៈ', '', 'tam-ro-yeak'], ['Busy', 'រវល់', '', 'rov-lo'], ['Problem', 'បញ្ហា', '', 'banh-ha'], ['Tired', 'អស់កម្លាំង', '', 'ah-kam-loamng'],
      ['Times (how many times)', 'ដង', '', 'dang'], ['Really?', 'មែន?', '', 'maen?'], ['Last night', 'យប់មិញ', '', 'yop-minh'], ['This morning', 'ព្រឹកមិញ', '', 'pruek-minh'],
      ['Enter', 'ចូល', '', 'choul'], ['Exit', 'ចេញ', '', 'cheinh'], ['What did you do?', 'ធ្វើអ្វី?', '', 'thveu-avei?']
    ] },
    { id: 'classroom', level: 2, name: 'In the classroom', words: [
      ['Chair', 'កៅអី', '', 'kau-ey'], ['Table', 'តុ', '', 'to'], ['Marker', 'ហ្វឺត', '', 'hvoet'], ['Whiteboard', 'ក្តារខៀន', '', 'kta-khien'], ['Book', 'សៀវភៅ', '', 'siev-phov'],
      ['Mop (the thing)', 'ប្រដាប់ជូតផ្ទះ', '', 'pra-dap-chut-phteah'], ['Teacher', 'គ្រូបង្រៀន', '', 'krou-bang-rien'], ['Remember?', 'ចាំ?', '', 'cham?'],
      ['Forget', 'ភ្លេច', '', 'phlech'], ['Plants', 'រុក្ខជាតិ', '', 'ruk-chie-te'], ['Water the plants', 'ស្រោចផ្កា', '', 'sraoch-phka'], ['Point', 'ចង្អុល', '', 'chang-ol'],
      ['Broom', 'អំបោស', '', 'am-baoh'], ['Teach', 'បង្រៀន', '', 'bang-rien'], ['Make coffee', 'ឆុងកាហ្វេ', '', 'chhong-kafe'], ['Pen', 'ប៊ិច', '', 'bich'],
      ['Pencil', 'ខ្មៅដៃ', '', 'khmau-dai'], ['Bag', 'កាបូប', '', 'ka-boup'], ['Sweep', 'បោស', '', 'baoh'], ['Mop (the action)', 'ជូត', '', 'chut'],
      ['Garbage', 'សំរាម', '', 'sam-riem']
    ] },
    { id: 'adjectives', level: 2, name: 'Helpful adjectives', words: [
      ['Big', 'ធំ', '', 'thum'], ['Small', 'តូច', '', 'touch'], ['Heavy', 'ធ្ងន់', '', 'thngon'], ['Light', 'ស្រាល', '', 'sral'], ['Slippery', 'រអិល', '', 'ro-el'],
      ['Itchy', 'រមាស់', '', 'ro-mieh'], ['Scared', 'ខ្លាច', '', 'khlach'], ['Busy', 'រវល់', '', 'rov-lo'], ['Old', 'ចាស់', '', 'chah'], ['A little', 'តិច', '', 'tech'],
      ['A lot', 'ច្រើន', '', 'chraeun'], ['Soft', 'ទន់', '', 'ton'], ['Hard', 'រឹង', '', 'rueng'], ['Ticklish', 'រសើប', '', 'ro-saeup'], ['Hot', 'ក្តៅ', '', 'kdav'],
      ['Nervous', 'ភ័យ', '', 'phoay'], ['Excited', 'សប្បាយ', '', 'sabbay'], ['New', 'ថ្មី', '', 'thmey'], ['Difficult', 'ពិបាក', '', 'pi-bak'], ['Easy', 'ស្រួល', '', 'sruol'],
      ['Fast', 'លឿន', '', 'leuan'], ['Slow', 'យឺត', '', 'yuet'], ['Boring', 'ធុញ', '', 'thunh'], ['Cold', 'ត្រជាក់', '', 'trocheak'], ['Sleepy', 'ងុយដេក', '', 'nguy-deik'],
      ['Tired', 'ហត់', '', 'hat'], ['Young', 'ក្មេង', '', 'kmeing'], ['Cool', 'ឡូយ', '', 'louy'], ['Good', 'ល្អ', '', 'la-or'], ['Bad', 'អាក្រក់', '', 'ak-ka'],
      ['Positive', 'វិជ្ជមាន', '', 'vich-mien'], ['Negative', 'អវិជ្ជមាន', '', 'a-vich-mien'], ['Bored', 'អផ្សុក', '', 'ap-sok']
    ] },
    { id: 'restaurant', level: 2, name: 'At a restaurant', words: [
      ['Waiter', 'អ្នករត់តុ', '', 'neak-rot-to'], ['Order', 'កម្មង់', '', 'kam-ngo'], ['Split the bill', 'បង់លុយផ្សេងគ្នា', '', 'bang-luy-phseing-knie'],
      ['Pay', 'បង់លុយ', '', 'bang-luy'], ['Sorry', 'សុំទោស', '', 'som toh'], ['Please', 'សូម', '', 'soum'], ['Taxes', 'ពន្ធ', '', 'pon'], ['Restaurant', 'ហាងបាយ', '', 'hang bai'],
      ['Tip', 'ឱ្យលុយក្រៅ', '', 'ao-yo-luy-krau'], ['Alcohol', 'ស្រា', '', 'sra'], ['Wine', 'ស្រាក្រហម', '', 'sra-krah-mo'], ['Butter', 'ប៊ឺ', '', 'bue'],
      ['Chef', 'ចុងភៅ', '', 'chong-phov'], ['Ingredients', 'គ្រឿង', '', 'kreuang'], ['Money', 'លុយ', '', 'luy'],
      ['Menu', 'បញ្ជីឈ្មោះម្ហូប / ម៉ឺនុយ', '', 'banh-chi-chhmuoh-mhoup / moe-nuy'], ['Drinks', 'ភេសជ្ជៈ', '', 'pheh-chcheak'], ['Hungry', 'ឃ្លាន', '', 'khlien'],
      ['Drink', 'ផឹក', '', 'phoek'], ['Bubble tea', 'តែគុជ', '', 'tae-kuch'], ['Pack the food (to go)', 'រៀបចំម្ហូប', '', 'riep-cham-mhoup'], ['Coffee', 'កាហ្វេ', '', 'kafe'],
      ['Special', 'ពិសេស', '', 'pi-seih'], ['Cake', 'នំខេក', '', 'num-kheik'], ['Bitter', 'ល្វីង', '', 'lving'], ['Beer', 'ស្រាបៀរ', '', 'sra-bie'],
      ['Sauce', 'ទឹកជ្រលក់', '', 'tuk-chro-luk'], ['French fries', 'ដំឡូងបំពង', '', 'dam-loung-bamp-ngo'], ['Water', 'ទឹក', '', 'tuk'], ['Meal', 'អាហារ', '', 'a-ha'],
      ['Check, please', 'គិតលុយ', '', 'kit-luy'], ['Thirsty', 'ស្រេកទឹក', '', 'sreik-tuk'], ['Full', 'ឆ្អែត', '', 'chh-aet'], ['Dessert', 'បង្អែម', '', 'bang-aem'],
      ['Flavour', 'រសជាតិ', '', 'roh-chie-te'], ['Spicy', 'ហឹរ', '', 'hel'], ['Salty', 'ប្រៃ', '', 'prai'], ['Sweet', 'ផ្អែម', '', 'ph-aem'], ['Sour', 'ជូរ', '', 'chu'],
      ['Bread', 'នំប៉័ង', '', 'num pang'], ['Grilled meat', 'សាច់អាំង', '', 'sach-amng'], ['Ice', 'ទឹកកក', '', 'tuk-kak'], ['Soup', 'សម្ល', '', 'samlo']
    ] },
    { id: 'problems', level: 2, name: 'House & moto problems', words: [
      ['Rent', 'ជួល', '', 'chuol'], ['Problem', 'បញ្ហា', '', 'banh-ha'], ['Water leak', 'លេចទឹក', '', 'lech-tuk'], ['Headlights', 'ភ្លើង', '', 'phleung'],
      ['Brakes', 'ហ្វ្រាំង', '', 'hvroamng'], ['Doesn\'t work', 'អត់ដំណើរការ', '', 'ot-dam-naeu-ka'], ['Landlord', 'ម្ចាស់ផ្ទះ', '', 'mchah-phteah'],
      ['Won\'t start (moto)', 'ដេរអត់ឆេះ', '', 'dei-ot-chheh']
    ] },
    { id: 'hospital', level: 2, name: 'At the hospital', words: [
      ['Pain', 'ឈឺ', '', 'chheu'], ['Cut', 'កាត់', '', 'kat'], ['Headache', 'ឈឺក្បាល', '', 'chheu-kbal'], ['Symptom', 'អាការៈ', '', 'a-ka-reak'], ['Head', 'ក្បាល', '', 'kbal'],
      ['Face', 'មុខ', '', 'muk'], ['Ears', 'ត្រចៀក', '', 'tra-chiek'], ['Eyes', 'ភ្នែក', '', 'phnek'], ['Blood', 'ឈាម', '', 'chhiem'],
      ['Diabetes', 'ជំងឺទឹកនោមផ្អែម', '', 'chum-ngue-tuk-noum-ph-aem'], ['Health', 'សុខភាព', '', 'sokhapheap'], ['Doctor', 'គ្រូពេទ្យ', '', 'kru pet'],
      ['Nurse', 'ពេទ្យ', '', 'pet'], ['Bone', 'ឆ្អឹង', '', 'chhoeng'], ['Body', 'ខ្លួន', '', 'khluon'], ['Arms', 'ដៃ', '', 'dai'], ['Legs', 'ជើង', '', 'cheung'],
      ['Emergency', 'បន្ទាន់', '', 'ban-tien'], ['Ambulance', 'ឡានសង្គ្រោះបន្ទាន់', '', 'lan-sang-kruohp-ntien'], ['Brain', 'ខួរក្បាល', '', 'khuo-kbal'],
      ['Disease', 'មេរោគ / ជំងឺ', '', 'me-rouk / chum-ngue'], ['Teeth', 'ធ្មេញ', '', 'thmenh'], ['Broken bone', 'បាក់ឆ្អឹង', '', 'bak-chhoeng'],
      ['Fever', 'គ្រុនក្តៅ', '', 'krun-kdav'], ['Common cold', 'ផ្តាសាយធម្មតា', '', 'phta-say-thom-ta'], ['Throw up', 'ក្អួត', '', 'kuot'], ['Cancer', 'មហារីក', '', 'mo-ha-rik'],
      ['Allergy', 'ប្រតិកម្ម', '', 'pra-tek-mmo'], ['Medicine', 'ថ្នាំពេទ្យ', '', 'thnam-pet'], ['Take medicine', 'លេបថ្នាំ', '', 'lep-thnam'], ['Bruise', 'ជាំ', '', 'choam'],
      ['Get a vaccine', 'ចាក់វ៉ាក់សាំង', '', 'chak-vak-samng'], ['Broken tooth', 'បាក់ធ្មេញ', '', 'bak-thmenh']
    ] },
    { id: 'animals', level: 2, name: 'Animals', words: [
      ['Dog', 'ឆ្កែ', '', 'chkae'], ['Buffalo', 'ក្របី', '', 'kra-bei'], ['Duck', 'ទា', '', 'tie'], ['Fish', 'ត្រី', '', 'trey'], ['Tiger', 'ខ្លា', '', 'khla'],
      ['Lizard', 'តុកកែ', '', 'tok-kae'], ['Snake', 'ពស់', '', 'poh'], ['Bug', 'សត្វល្អិត', '', 'sat-let'], ['Frog', 'កង្កែប', '', 'kang-kaep'], ['Cat', 'ឆ្មា', '', 'chhma'],
      ['Bird', 'ចាប', '', 'chap'], ['Chicken', 'មាន់', '', 'moan'], ['Elephant', 'ដំរី', '', 'damrey'], ['Monkey', 'ស្វា', '', 'sva'], ['Alligator', 'ក្រពើ', '', 'kra-peu'],
      ['Bear', 'ខ្លាឃ្មុំ', '', 'khla-khmum'], ['Butterfly', 'មេអំបៅ', '', 'me-am-bau'], ['Toad', 'គីង្គក់', '', 'king-ka'], ['Horse', 'សេះ', '', 'seh'], ['Cow', 'គោ', '', 'ko'],
      ['Pig', 'ជ្រូក', '', 'chrouk'], ['Lion', 'តោ', '', 'tao'], ['Sheep', 'ចៀម', '', 'chiem'], ['Crocodile', 'ក្រពើ', '', 'kra-peu'], ['Mouse / rat', 'កណ្តុរ', '', 'kan-to'],
      ['Worm', 'ដង្កូវ', '', 'dang-kouv']
    ] },
    { id: 'landscapes', level: 2, name: 'Landscapes', words: [
      ['Nature', 'ធម្មជាតិ', '', 'thom-chie-te'], ['Ocean', 'សមុទ្រ', '', 'samot'], ['Lake', 'បឹង', '', 'boeng'], ['Plains', 'វាលទំនាប', '', 'vie-lo-tum-niep'],
      ['Rice field', 'វាលស្រែ', '', 'vie-loh-rae'], ['Island', 'កោះ', '', 'kaoh'], ['Mountain', 'ភ្នំ', '', 'phnum'], ['River', 'ទន្លេ', '', 'tonle'],
      ['Stream', 'ស្ទឹង', '', 'stueng'], ['Wet', 'សើម', '', 'saeum'], ['Land', 'ដី', '', 'dey'], ['Waterfall', 'ទឹកធ្លាក់', '', 'tuk-thliek'], ['Forest', 'ព្រៃ', '', 'prey'],
      ['Desert', 'ទីរហោស្ថាន', '', 'ti-hao-sthan'], ['Landscape', 'ទេសភាព', '', 'te-sa-phiep'], ['Dry', 'ស្ងួត', '', 'snguot'], ['Beach', 'ឆ្នេរសមុទ្រ', '', 'chhnei-samot'],
      ['Shade', 'ម្លប់', '', 'mlop']
    ] },
    { id: 'body', level: 2, name: 'Bodily functions', words: [
      ['Itchy', 'រមាស់', '', 'ro-mieh'], ['Sleepy', 'ងុយដេក', '', 'nguy-deik'], ['Ticklish', 'រសើប', '', 'ro-saeup'], ['Laughter', 'សើច', '', 'saeuch'],
      ['Blinking', 'ព្រិចភ្នែក', '', 'prich-phnek'], ['Pooping', 'បន្ទោបង់', '', 'ban-toup-ngo'], ['Peeing', 'នោម', '', 'noum'], ['Swallow', 'លេប', '', 'lep'],
      ['Fart', 'ផោម', '', 'phaom'], ['Sweating', 'បែកញើស', '', 'baek-nheuh'], ['Runny nose', 'ហៀរសំបោរ', '', 'hie-sam-bao'], ['Chewing', 'ទំពា', '', 'tum-pie'],
      ['Biting', 'ខាំ', '', 'kham'], ['Cough', 'ក្អក', '', 'kak'], ['Sneeze', 'កណ្តាស់', '', 'kan-tah'], ['Burp', 'ភើ', '', 'pheu'], ['Yawn', 'ស្ងាប', '', 'sngap']
    ] },
    { id: 'shapes', level: 2, name: 'Shapes', words: [
      ['Circle', 'រង្វង់', '', 'rong-ngo'], ['Square', 'ការ៉េ', '', 'ka-rei'], ['Triangle', 'ត្រីកោណ', '', 'trey-kaon'], ['Octagon', 'អដ្ឋកោណ', '', 'at-kaon'],
      ['Rectangle', 'ចតុកោណកែង', '', 'cha-to-kaon-kaeng'], ['Shape', 'រូបរាង', '', 'rup-rieng']
    ] },
    { id: 'classifiers', level: 2, name: 'Classifiers', tip: 'The word that follows a number: two people is ពីរនាក់, three bottles is បីដប.', words: [
      ['People', 'នាក់', '', 'niek'], ['Eggs / seeds / tablets', 'គ្រាប់', '', 'kriep'], ['Plates / dishes', 'ចាន', '', 'chan'], ['Bottles', 'ដប', '', 'dap'],
      ['Books', 'ក្បាល', '', 'kbal'], ['Machines', 'គ្រឿង', '', 'kreuang'], ['Monks / gods', 'អង្គ', '', 'ang'], ['Images / statues', 'រូប', '', 'rup'],
      ['Barrels', 'ធុង', '', 'thung'], ['Boxes', 'ប្រអប់', '', 'pra-ba'], ['Glasses', 'កែវ', '', 'kaev'], ['Packets', 'កញ្ចប់', '', 'kanh-ba'],
      ['Skewers', 'ចង្កាក់', '', 'chang-kak'], ['Bunches / clusters', 'ចង្កោម', '', 'chang-kaom'], ['Sheaves / bundles', 'បាច់', '', 'bach'], ['Lines', 'ជួរ', '', 'chuo'],
      ['Groups', 'ក្រុម', '', 'krom'], ['Pairs', 'គូ', '', 'ku'], ['Scoops', 'វែក', '', 'vaek'], ['Sets', 'ឈុត', '', 'chhut'], ['Words', 'ម៉ាត់', '', 'mat'],
      ['Bunches of bananas', 'ស្និត', '', 'snet'], ['Sheets / leaves (paper)', 'សន្លឹក', '', 'san-luek'], ['Leaves', 'ស្លឹក', '', 'sloek'], ['Trees / plants', 'ដើម', '', 'daeum'],
      ['Cans', 'កំប៉ុង', '', 'kam-pong'], ['Dozens', 'ឡូ', '', 'lou'], ['Sentences', 'ឃ្លា', '', 'khlie'], ['Pieces', 'ដុំ', '', 'dom']
    ] },
    { id: 'work', level: 3, name: 'Small talk — work', words: [
      ['Work', 'ការងារ', '', 'ka ngie'], ['Teacher', 'គ្រូ', '', 'krou'], ['Farmer', 'អ្នកស្រែ', '', 'neak-srae'], ['Doctor', 'គ្រូពេទ្យ', '', 'kru pet'],
      ['Construction worker', 'ជាងសំណង់', '', 'chieng-samn-ngo'], ['Mechanic', 'ជាង', '', 'chieng'], ['Farm', 'ចម្ការ', '', 'cham-ka'], ['Cook', 'ធ្វើម្ហូប', '', 'thveu-mhoup'],
      ['Technology', 'បច្ចេកវិទ្យា', '', 'bach-cheik-vit-yie'], ['Missionary', 'បេសកជន', '', 'beih-kach-no'], ['Accountant', 'គណនេយ្យករ', '', 'kon-ney-ka'],
      ['Electrician', 'ជាងអគ្គិសនី', '', 'chieng-ak-kih-ni'], ['Plumber', 'ជាងទឹក', '', 'chieng-tuk'], ['Engineer', 'វិស្វករ', '', 'vih-ka'],
      ['Architect', 'អ្នកគូសប្លង់', '', 'neak-kuh-plang'], ['Hospital', 'មន្ទីរពេទ្យ', '', 'muntipet'], ['Work in the field', 'ធ្វើការនៅស្រែ', '', 'thveu-ka-nov-srae'],
      ['Art', 'សិល្បៈ', '', 'sel-bak'], ['Agriculture', 'កសិកម្ម', '', 'ka-sek-mmo'], ['Education', 'ការអប់រំ', '', 'ka-ap-rum'],
      ['Government', 'រដ្ឋាភិបាល', '', 'rot-tha-phi-bal'], ['Healthcare', 'ការថែទាំសុខភាព', '', 'ka-thae-toam-sokhapheap'], ['Salary', 'ប្រាក់ខែ', '', 'prak-khae'],
      ['Chef', 'ចុងភៅ', '', 'chong-phov'], ['School', 'សាលារៀន', '', 'sala rien'], ['Business', 'ជំនួញ', '', 'chum-nuonh'],
      ['Place of work', 'កន្លែងធ្វើការ', '', 'kan-laeng-thveu-ka']
    ] },
    { id: 'hobbies', level: 3, name: 'Small talk — hobbies', words: [
      ['Sports', 'កីឡា', '', 'key-la'], ['Basketball', 'បាល់បោះ', '', 'bal-baoh'], ['Soccer', 'បាល់ទាត់', '', 'bal-toat'], ['Volleyball', 'បាល់ទះ', '', 'bal-teah'],
      ['Swimming', 'ហែលទឹក', '', 'hael-tuk'], ['Exercise', 'ហាត់ប្រាណ', '', 'hat-pran'], ['Art', 'សិល្បៈ', '', 'sel-bak'], ['Dancing', 'រាំ', '', 'roam'],
      ['Photography', 'ថតរូប', '', 'that-rup'], ['Gardening', 'ដាំដំណាំ', '', 'dam-dam-nam'], ['Sewing', 'ដេរខោអាវ', '', 'dei-khao-av'],
      ['Reading', 'អានសៀវភៅ', '', 'an-siev-phov'], ['Watching movies', 'មើលរឿង', '', 'meul-reuang'], ['Listening to music', 'ស្តាប់ចម្រៀង', '', 'sdap-cham-rieng'],
      ['Fighting', 'ច្របាច់គ្នា', '', 'chra-bach-knie'], ['Riding a bike', 'ជិះកង់', '', 'chih-kang'], ['Hiking', 'ឡើងភ្នំ', '', 'laeung-phnum'],
      ['Camping', 'បោះតង់', '', 'baoht-ngo'], ['Fishing', 'ស្ទូចត្រី', '', 'stuch-trey'], ['Playing games', 'លេងហ្គេម', '', 'leng-hkem'],
      ['Playing an instrument', 'លេងភ្លេង', '', 'leng-phleng'], ['Woodworking', 'ធ្វើឈើ', '', 'thveu-chheu'], ['Language learning', 'រៀនភាសា', '', 'rien-phie-sa'],
      ['Volunteering', 'ការងារស្ម័គ្រចិត្ត', '', 'ka ngie-smak-chet']
    ] },
    { id: 'weather', level: 3, name: 'Small talk — weather', words: [
      ['Cold', 'ត្រជាក់', '', 'trocheak'], ['Hot', 'ក្តៅ', '', 'kdav'], ['Warm', 'ក្តៅអ៊ុនៗ', '', 'kdav-un'], ['Wind', 'ខ្យល់', '', 'khyal'], ['Rain', 'ភ្លៀង', '', 'phlieng'],
      ['Storm', 'ព្យុះ', '', 'pyuh'], ['Snow', 'ព្រិល', '', 'pril'], ['Cloud', 'ពពក', '', 'pop-ka'], ['Thunder', 'ផ្គរលាន់', '', 'phko-lien'],
      ['Lightning', 'ផ្លេកបន្ទោរ', '', 'phleik-ban-tou'], ['Fog', 'ចុះអាប់', '', 'choh-ap'], ['Smoke', 'ផ្សែង', '', 'phsaeng'], ['Humidity', 'ក្តៅសើម', '', 'kdav-saeum'],
      ['Temperature', 'សីតុណ្ហភាព', '', 'sey-ton-phiep'], ['Flood', 'ទឹកជំនន់', '', 'tuk-chumn-no'], ['Rainbow', 'ឥន្ទធនូ', '', 'e-ntot-nu'],
      ['Weather', 'អាកាសធាតុ', '', 'a-kah-thie-to'], ['Fire', 'ភ្លើង', '', 'phleung']
    ] },
    { id: 'travel', level: 3, name: 'Small talk — travel', words: [
      ['Travel', 'ធ្វើដំណើរ', '', 'thveu-dam-naeu'], ['Airplane', 'យន្តហោះ', '', 'yon-haoh'], ['Country', 'ប្រទេស', '', 'pra-teh'], ['Tourism', 'ទេសចរណ៍', '', 'te-sach-ro'],
      ['District', 'ស្រុក', '', 'srok'], ['Province', 'ខេត្ត', '', 'kheit'], ['Continent', 'ទ្វីប', '', 'tvip'], ['State', 'រដ្ឋ', '', 'rot'],
      ['Train', 'រថភ្លើង', '', 'rot-phleung']
    ] },
    { id: 'politics', level: 3, name: 'Small talk — politics', words: [
      ['Politics', 'នយោបាយ', '', 'no-you-bai'], ['News', 'ព័ត៌មាន', '', 'poat-mien'], ['Economics', 'សេដ្ឋកិច្ច', '', 'seit-kech'], ['Public', 'សាធារណៈ', '', 'sa-thie-nak'],
      ['Private', 'ឯកជន', '', 'ae-kach-no'], ['President', 'ប្រធានាធិបតី', '', 'pra-thie-nie-thip-tey'], ['Mayor', 'អភិបាលក្រុង', '', 'a-phi-bal-krong'],
      ['Corruption', 'អំពើពុករលួយ', '', 'am-peu-puk-ro-luoy'], ['System', 'ប្រព័ន្ធ', '', 'pra-poan'], ['Prime minister', 'នាយករដ្ឋមន្ត្រី', '', 'niey-ka-dtham-ntri'],
      ['Governor', 'អភិបាល', '', 'a-phi-bal'], ['Government', 'រដ្ឋាភិបាល', '', 'rot-tha-phi-bal'], ['Capital city', 'រាជធានី', '', 'riech-thie-ni']
    ] },
    { id: 'agriculture', level: 3, name: 'Small talk — agriculture', words: [
      ['Farm', 'ចម្ការ', '', 'cham-ka'], ['Farmer', 'អ្នកចម្ការ', '', 'neak-cham-ka'], ['Tree', 'ដើមឈើ', '', 'daeum-chheu'], ['Planting a tree', 'ដាំដើមឈើ', '', 'dam-daeum-chheu'],
      ['Watering', 'ស្រោចទឹក', '', 'sraoch-tuk'], ['Fruits', 'ផ្លែឈើ', '', 'phlae-chheu'], ['Plants', 'ដំណាំ', '', 'dam-nam'], ['Seeds', 'គ្រាប់', '', 'kriep'],
      ['Rice field', 'វាលស្រែ', '', 'vie-loh-rae'], ['Raw rice', 'អង្ករ', '', 'ang-ro'], ['Storing', 'ជង្រុក', '', 'chong-ruk'], ['Tractor', 'ត្រាក់ទ័រ', '', 'trak-toa'],
      ['Harvest', 'ប្រមូលផល', '', 'pra-mul-phal'], ['Roots', 'ឫស', '', 'roe-sa'], ['Weeds', 'ស្មៅ', '', 'smau'], ['Grass', 'ស្មៅ', '', 'smau'], ['Growth', 'ដុះ', '', 'doh'],
      ['Pruning', 'ការកាត់ចេញ', '', 'ka-kat-cheinh']
    ] },
    { id: 'religion', level: 3, name: 'Small talk — religion', words: [
      ['Religion', 'សាសនា', '', 'sah-nie'], ['Temple', 'វត្ត', '', 'vot'], ['Faith', 'ជំនឿ', '', 'chum-neua'], ['Self-reliance', 'ខ្លួនទីពឹងខ្លួន', '', 'khluon-ti-pueng-khluon'],
      ['Buddhism', 'ព្រះពុទ្ធសាសនា', '', 'preah-put-sah-nie'], ['Christianity', 'គ្រិស្តសាសនា', '', 'krih-sah-nie'], ['Believe', 'ជឿ', '', 'chuea'],
      ['Earning merit', 'ធ្វើបុណ្យ', '', 'thveu-bon'], ['Monks', 'លោកសង្ឃ', '', 'louk-sang'], ['Hinduism', 'ព្រហ្មញ្ញសាសនា', '', 'proh-nhnho-sah-nie'],
      ['Buddha', 'ព្រះពុទ្ធ', '', 'preah-put'], ['Holy book', 'សៀវភៅធម៌', '', 'siev-phovt-mo']
    ] },
    { id: 'history', level: 3, name: 'Small talk — history', words: [
      ['History', 'ប្រវត្តិសាស្ត្រ', '', 'prav-tte-sa-stro'], ['Past', 'អតីតកាល', '', 'a-teyt-kal'], ['Khmer Rouge', 'សម័យពលពត', '', 'sa-moay-pol-pot'],
      ['Independence', 'ឯករាជ្យ', '', 'ae-ka-riech'], ['Education', 'ការអប់រំ', '', 'ka-ap-rum'], ['Swords', 'ដាវ', '', 'dav'], ['Tanks', 'រថក្រោះ', '', 'rot-kraoh'],
      ['Border', 'ព្រំដែន', '', 'prum-daen'], ['King', 'ស្តេច', '', 'steich'], ['Century', 'សតវត្ស', '', 'sat-vot'], ['War', 'សង្គ្រាម', '', 'sang-kriem'],
      ['Ancestors', 'ដូនតា', '', 'doun-ta'], ['Empire', 'អាណាចក្រ', '', 'a-nach-kra'], ['Guns', 'កាំភ្លើង', '', 'kam-phleung'], ['Refugees', 'ជនភៀសខ្លួន', '', 'chon-phieh-khluon'],
      ['Flee the country', 'រត់ភៀសខ្លួន', '', 'rot-phieh-khluon'], ['Emperor', 'អធិរាជ', '', 'a-thi-riech'], ['Era', 'សម័យ', '', 'sa-moay'],
      ['Division', 'ការបែងចែក', '', 'ka-baeng-chaek'], ['Genealogy', 'ពូជពង្ស', '', 'puch-pong'], ['Battle', 'សង្គ្រាម', '', 'sang-kriem'],
      ['Bombs', 'គ្រាប់បែក', '', 'kriep-baek'], ['Refugee camp', 'ជំរំជនភៀសខ្លួន', '', 'chum-rumch-no-phieh-khluon'], ['Fighting', 'វ៉ៃគ្នា', '', 'vai-knie']
    ] },
    { id: 'education', level: 3, name: 'Small talk — education', words: [
      ['Education', 'ការអប់រំ', '', 'ka-ap-rum'], ['High school', 'វិទ្យាល័យ', '', 'vit-yie-loay'], ['University', 'សកលវិទ្យាល័យ', '', 'sak-lo-vit-yie-loay'],
      ['Pre-school', 'សាលាមត្តេយ្យ', '', 'sa-liem-tteiy'], ['Pass the test', 'ប្រឡងជាប់', '', 'pral-ngo-chiep'], ['Points on a test', 'ពិន្ទុ', '', 'pin-tu'],
      ['Master\'s degree', 'ថ្នាក់អនុបណ្ឌិត', '', 'thnak-a-nup-ndit'], ['Math', 'គណិតវិទ្យា', '', 'ko-net-vit-yie'], ['Science', 'វិទ្យាសាស្ត្រ', '', 'vit-yie-sa-stro'],
      ['Study', 'រៀន', '', 'rien'], ['Improve', 'កែលម្អ', '', 'kael-ma'], ['Fail the test', 'ប្រឡងធ្លាក់', '', 'pral-ngot-liek'],
      ['Graduate', 'ទទួលសញ្ញាប័ត្រ', '', 'to-tuol-sanhnhabat'], ['Doctorate', 'បណ្ឌិត', '', 'ban-dit'], ['Subject', 'មុខវិជ្ជា', '', 'muk-vich-chie'],
      ['Principal', 'នាយកសាលា', '', 'niey-ka-sa-lie'], ['Discipline', 'វិន័យ', '', 'vi-noay'], ['Exam / test', 'ប្រឡង', '', 'pral-ngo'], ['Level', 'កម្រិត', '', 'kam-rit'],
      ['Bachelor\'s degree', 'បរិញ្ញាបត្រ', '', 'ba-rinh-nhiep-tra'], ['Develop', 'អភិវឌ្ឍ', '', 'a-phiv-dtho']
    ] },
    { id: 'spheres', level: 3, name: 'Seven spheres of society', words: [
      ['Seven spheres of society', 'វិស័យប្រាំពីរនៃសង្គម', '', 'vi-say-pram pi-ney-sangkum'], ['Government', 'រដ្ឋាភិបាល', '', 'rot-tha-phi-bal'],
      ['Media', 'ប្រព័ន្ធផ្សព្វផ្សាយ', '', 'pra-poan-phsap-phsay'], ['Family', 'គ្រួសារ', '', 'kruo-sa'], ['Religion', 'សាសនា', '', 'sah-nie'],
      ['Celebration', 'ធ្វើកម្មវិធី', '', 'thveu-kam-vi-thi'], ['Economics', 'សេដ្ឋកិច្ច', '', 'seit-kech'], ['Education', 'ការអប់រំ', '', 'ka-ap-rum'],
      ['Society', 'សង្គម', '', 'sangkum']
    ] },
    { id: 'deeper', level: 3, name: 'Deeper problems', words: [
      ['Smoking', 'ជក់បារី', '', 'chok-ba-ri'], ['Drug addiction', 'ញៀនថ្នាំ', '', 'nhien-thnam'], ['Abuse', 'រំលោភបំពាន', '', 'rum-loup-bam-pien'],
      ['Rape', 'រំលោភ', '', 'rum-loup'], ['Not good enough', 'មិនល្អ', '', 'min-la-or'], ['Beating', 'វាយ', '', 'viey'], ['Yelling', 'ស្រែក', '', 'sraek'],
      ['Addiction', 'ញៀន', '', 'nhien'], ['Partying', 'ជប់លៀង', '', 'chop-lieng'], ['Violence', 'ឈ្លោះគ្នា', '', 'chhluoh-knie'], ['Divorce', 'លែងគ្នា', '', 'laeng-knie'],
      ['Hurt', 'ឈឺចាប់', '', 'chheu-chap'], ['Gambling', 'លេងល្បែង', '', 'leng-lbaeng'], ['Counselling', 'ការប្រឹក្សាយោបល់', '', 'ka-proek-sa-youp-lo'],
      ['Drunk', 'ស្រវឹង', '', 'sra-vueng'], ['Porn', 'អាសអាភាស', '', 'ah-a-phieh'], ['Hitting', 'វ៉ៃគ្នា', '', 'vai-knie'], ['Shooting', 'បាញ់', '', 'banh'],
      ['Hurt someone', 'ធ្វើបាបគេ', '', 'thveu-bap-ke'], ['Suicide', 'សម្លាប់ខ្លួន', '', 'sam-liep-khluon']
    ] },
    { id: 'christian', level: 3, name: 'Faith — Christian words', tip: 'The Christian words from the book. Church life, God & the Bible and every book of the Bible follow in the next three lists.', words: [
      ['Prayer', 'អធិស្ឋាន', '', 'athisthan'], ['Resurrection', 'រស់ឡើងវិញ', '', 'roh-laeung-vinh'], ['Jesus', 'ព្រះយេស៊ូវ', '', 'preah yesu'],
      ['Intercession', 'អធិស្ឋានទូលអង្វរ', '', 'athisthan-tul-ang-ro'], ['Cross', 'ឈើឆ្កាង', '', 'chheu-chhkang'], ['God', 'ព្រះអង្គ', '', 'preah ang'],
      ['Baptism', 'ជ្រមុជទឹក', '', 'chro-much-tuk'], ['Die on the cross', 'សុគតលើឈើឆ្កាង', '', 'sok-ta-leu-chheu-chhkang'],
      ['Holy Spirit', 'ព្រះវិញ្ញាណបរិសុទ្ធ', '', 'preah vinhnhean borisot'], ['God the Father', 'ព្រះវរបិតា', '', 'preah-vo-be-ta'],
      ['God the Son', 'ព្រះរាជបុត្រា', '', 'preah-riech-bo-tra'], ['God the Holy Spirit', 'ព្រះវិញ្ញាណបរិសុទ្ធ', '', 'preah vinhnhean borisot'],
      ['The Trinity', 'ព្រះត្រីឯក', '', 'preah-trey-ae-ka'], ['Apostle', 'សាវ័ក', '', 'sa-voak'], ['Disciple', 'សិស្ស', '', 'seh'],
      ['Born again', 'កើតជាថ្មី', '', 'kaeut-chie-thmey'], ['New life', 'ជីវិតថ្មី', '', 'chi-vit-thmey'], ['Salvation', 'សេចក្តីសង្គ្រោះ', '', 'seich-kteyh-ngkruoh'],
      ['Denomination', 'និកាយ', '', 'ni-kay'], ['Sin', 'អំពើបាប', '', 'am-peu-bap'], ['Confess', 'សារភាព', '', 'sa-phiep'], ['Repent', 'លន់តួ', '', 'lon-tuo'],
      ['Anger', 'ខឹង', '', 'khoeng'], ['Mercy', 'មេត្តា', '', 'met-ta'], ['Forgiveness', 'អត់ទោស', '', 'ot-touh'], ['Soul', 'ព្រលឹង', '', 'pro-lueng'],
      ['Joy', 'អំណរ', '', 'amn-ro'], ['Love', 'សេចក្តីស្រឡាញ់', '', 'seich-ktey-srolanh'], ['Peace', 'សន្តិភាព', '', 'san-te-phiep'], ['Patience', 'អត់ធ្មត់', '', 'ot-thmot'],
      ['Kindness', 'ចិត្តល្អ', '', 'chet-la-or'], ['Goodness', 'ចិត្តល្អ', '', 'chet-la-or'], ['Heal', 'ព្យាបាល', '', 'pyie-bal'],
      ['Will / heart of God', 'ព្រះទ័យព្រះ', '', 'preah-toay-preah'], ['Goal', 'គោលដៅ', '', 'ko-lo-dau'], ['Evil', 'ចិត្តអាក្រក់', '', 'chet-ak-ka'],
      ['The enemy', 'សត្រូវ', '', 'sat-ruv'], ['LORD', 'ព្រះអម្ចាស់', '', 'preah-am-chah'], ['Angel', 'ទេវតា', '', 'te-vo-ta'],
      ['Death (of people)', 'សេចក្តីស្លាប់', '', 'seich-ktey-slap'], ['Death (of a king)', 'ការសុគត', '', 'ka-sok-ta'], ['Church', 'ព្រះវិហារ', '', 'preah vihie'],
      ['Heaven', 'ឋានសួគ៌', '', 'than-suok'], ['Hell', 'ឋាននរក', '', 'than-no-ka'], ['Gospel', 'ដំណឹងល្អ', '', 'dam-noeng-la-or'],
      ['Evangelism', 'ផ្សាយដំណឹងល្អ', '', 'phsay-dam-noeng-la-or'], ['Glory', 'សិរីល្អ', '', 'se-ri-la-or'], ['Eternal life', 'ជីវិតអស់កល្ប', '', 'chi-vit-ah-kal'],
      ['Grace', 'ព្រះគុណ', '', 'preah-kun'], ['Respect', 'គោរព', '', 'ko-rop'], ['Focus', 'ផ្តោត', '', 'phtaot'], ['Quality', 'គុណភាព', '', 'kun-phiep'],
      ['Perfect', 'ល្អឥតខ្ចោះ', '', 'la-or-e-tak-chaoh'], ['Chapter', 'ជំពូក', '', 'chum-puk'], ['New Testament', 'សញ្ញាថ្មី', '', 'sanh-nhie-thmey'],
      ['Old Testament', 'សញ្ញាចាស់', '', 'sanh-nhie-chah'], ['Verse', 'ខ', '', 'kha'], ['Second coming', 'យាងមកលើកទី២', '', 'yieng-mok-leuk-ti-2'],
      ['Gentile', 'សាសន៍ដទៃ', '', 'sah-not-tey'], ['Jew', 'សាសន៍យូដា', '', 'sah-no-yu-da'], ['Jerusalem', 'ក្រុងយេរូសាឡិម', '', 'krong-ye-ru-sa-lem'],
      ['Israel', 'អ៊ីស្រាអែល', '', 'i-sra-ael'], ['Circumcision', 'ការកាត់ស្បែក', '', 'ka-kat-sbaek'], ['Change', 'ផ្លាស់ប្តូរ', '', 'phlah-ptou'],
      ['Tradition', 'ប្រពៃណី', '', 'pra-pey-ney'], ['Prophet', 'ហោរា', '', 'hao-rie'], ['Fasting', 'តម', '', 'tam'], ['Preach', 'អធិប្បាយ', '', 'a-thip-bay'],
      ['Worship', 'ថ្វាយបង្គំ', '', 'thvay bangkum'], ['Honour', 'កិត្តិយស', '', 'ket-tey-sa'], ['Bible', 'ព្រះគម្ពីរ', '', 'preah kompi'],
      ['The lost', 'អ្នកបាត់បង់', '', 'neak-bat-bang'], ['Holy', 'បរិសុទ្ធ', '', 'ba-ri-sot'], ['Bless', 'ប្រទានពរ', '', 'pra-tien-po'],
      ['The best', 'ល្អបំផុត', '', 'la-or-bam-phot'], ['Congregation', 'ក្រុមជំនុំ', '', 'krom chumnum'], ['Pastor', 'គ្រូគង្វាល', '', 'krou-kong-viel'],
      ['Kneel', 'ក្រាប', '', 'krap'], ['Counselling', 'ប្រឹក្សាយោបល់', '', 'proek-sa-youp-lo'], ['More / the most', 'ជាង / ជាងគេ', '', 'chieng / chieng-ke'],
      ['Small group', 'ក្រុមតូច', '', 'krom-touch']
    ] },
    { id: 'church', level: 3, name: 'Faith — church life', tip: 'Words for a service, a small group and the rhythm of a church week.', words: [
      ['Amen', 'អាម៉ែន', '', 'a-maen'], ['Hallelujah', 'ហាលេលូយ៉ា', '', 'ha-le-lu-ya'], ['Praise', 'សរសើរតម្កើង', '', 'sa-saeu-tam-kaeung'],
      ['Give thanks', 'អរព្រះគុណ', '', 'a-preah-kun'], ['Testimony', 'ទីបន្ទាល់', '', 'ti-bon-toal'], ['Sermon', 'សេចក្ដីអធិប្បាយ', '', 'seich-kdey-a-thip-bay'],
      ['Worship song', 'បទចម្រៀងថ្វាយបង្គំ', '', 'bat-cham-rieng-thvay bangkum'], ['Choir', 'ក្រុមចម្រៀង', '', 'krom-cham-rieng'], ['Offering', 'តង្វាយ', '', 'tang-viey'],
      ['Tithe', 'ដង្វាយមួយភាគដប់', '', 'dang-viey-muoy-phiek-dap'], ['Communion / the Lord’s Supper', 'ពិធីលៀងព្រះអម្ចាស់', '', 'pi-thi-lieng-preah-am-chah'],
      ['Fellowship', 'ការប្រកបគ្នា', '', 'ka-pra-kop-knea'], ['Quiet time / devotions', 'ពេលស្ងាត់ជាមួយព្រះ', '', 'pel-sngat-chie-muoy-preah'],
      ['Bible study', 'សិក្សាព្រះគម្ពីរ', '', 'sek-sa-preah kompi'], ['Discipleship', 'ការបង្កើតសិស្ស', '', 'ka-bang-kaeut-seh'],
      ['Outreach', 'ការចេញទៅផ្សាយដំណឹងល្អ', '', 'ka-cheinh-tov-phsay-dam-noeng-la-or'], ['Missions', 'បេសកកម្ម', '', 'be-sak-kam'],
      ['Prayer meeting', 'ការជួបជុំអធិស្ឋាន', '', 'ka-chuop-chum-athisthan'], ['Sunday service', 'ការថ្វាយបង្គំថ្ងៃអាទិត្យ', '', 'ka-thvay bangkum-thngai-a-tit'],
      ['Sunday school', 'សាលាថ្ងៃអាទិត្យ', '', 'sa-lie-thngai-a-tit'], ['Youth group', 'ក្រុមយុវជន', '', 'krom-yu-veak-chon'],
      ['Church leader', 'អ្នកដឹកនាំក្រុមជំនុំ', '', 'neak doek noam-krom chumnum'], ['Worship leader', 'អ្នកដឹកនាំថ្វាយបង្គំ', '', 'neak doek noam-thvay bangkum'],
      ['Elder (in the church)', 'ចាស់ទុំ', '', 'chah-tum'], ['Believer', 'អ្នកជឿ', '', 'neak-chuea'], ['Non-believer', 'អ្នកមិនជឿ', '', 'neak-min-chuea'],
      ['Pray for someone', 'អធិស្ឋានឲ្យ', '', 'athisthan-aoy'], ['Lay hands on', 'ដាក់ដៃលើ', '', 'dak-dai-leu'],
      ['In Jesus’ name', 'ក្នុងព្រះនាមព្រះយេស៊ូវ', '', 'knong-preah-niem-preah yesu'],
      ['Give your life to Jesus', 'ប្រគល់ជីវិតឲ្យព្រះយេស៊ូវ', '', 'pra-kol-chi-vit-aoy-preah yesu'], ['Serve', 'បម្រើ', '', 'bam-reu'],
      ['Servant', 'អ្នកបម្រើ', '', 'neak-bam-reu'], ['Humble', 'បន្ទាបខ្លួន', '', 'ban-tiep-khluon'], ['Obey', 'ស្ដាប់បង្គាប់', '', 'sdap-bang-koap'],
      ['Christmas', 'បុណ្យណូអែល', '', 'bon-nou-ael'], ['Easter', 'បុណ្យរស់ឡើងវិញ', '', 'bon-roh-laeung-vinh'], ['Pentecost', 'បុណ្យទី៥០', '', 'bon-ti-ha-sep'],
      ['Sabbath', 'ថ្ងៃសប្ប័ទ', '', 'thngai-sap-bat']
    ] },
    { id: 'godbible', level: 3, name: 'Faith — God & the Bible', tip: 'Who God is, and the words the Bible uses — the ones a sermon or a Bible study leans on.', words: [
      ['God, the Lord', 'ព្រះជាម្ចាស់', '', 'preah-chie-mchah'], ['Saviour', 'ព្រះអង្គសង្គ្រោះ', '', 'preah ang-sang-kruoh'],
      ['Christ / Messiah', 'ព្រះគ្រីស្ទ', '', 'preah-krist'], ['King of kings', 'ស្ដេចលើអស់ទាំងស្ដេច', '', 'sdach-leu-ah-teang-sdach'],
      ['Creator', 'ព្រះអាទិករ', '', 'preah-a-ti-ko'], ['Creation', 'ការបង្កើតពិភពលោក', '', 'ka-bang-kaeut-pi-phop-louk'], ['Kingdom of God', 'នគរព្រះ', '', 'no-ko-preah'],
      ['Glory to God', 'សិរីល្អដល់ព្រះ', '', 'se-ri-la-or-dal-preah'], ['Covenant', 'សេចក្ដីសញ្ញា', '', 'seich-kdey-sanh-nya'], ['Promise', 'ការសន្យា', '', 'ka-san-yie'],
      ['Miracle', 'ការអស្ចារ្យ', '', 'ka-ah-cha'], ['Blessing', 'ព្រះពរ', '', 'preah-po'], ['Curse', 'បណ្ដាសា', '', 'ban-da-sa'], ['Temptation', 'ការល្បួង', '', 'ka-lbuong'],
      ['The devil / Satan', 'អារក្ស / សាតាំង', '', 'a-rak / sa-tamng'], ['Demon', 'វិញ្ញាណអាក្រក់', '', 'vinh-nhien-ak-ka'],
      ['Spiritual warfare', 'សង្គ្រាមខាងវិញ្ញាណ', '', 'sang-kriem-khang-vinh-nhien'], ['Deliverance', 'ការរំដោះ', '', 'ka-rum-daoh'],
      ['Anoint', 'ចាក់ប្រេងតាំង', '', 'chak-preing-tamng'], ['Calling', 'ការត្រាស់ហៅ', '', 'ka-trah-hau'], ['Shepherd', 'អ្នកគង្វាល', '', 'neak-kong-viel'],
      ['Sheep', 'ចៀម', '', 'chiem'], ['Lamb of God', 'កូនចៀមរបស់ព្រះ', '', 'koun-chiem-rop-sa-preah'], ['Parable', 'រឿងប្រៀបប្រដូច', '', 'reuang-priep-pra-douch'],
      ['Commandment', 'បញ្ញត្តិ', '', 'banh-nhat'], ['The Law (of Moses)', 'ក្រឹត្យវិន័យ', '', 'kret-vi-ney'], ['Judgement', 'ការជំនុំជម្រះ', '', 'ka-chum-num-chum-reah'],
      ['Wisdom', 'ប្រាជ្ញា', '', 'prach-nhie'], ['Truth', 'សេចក្ដីពិត', '', 'seich-kdey-pit'], ['Righteousness', 'សេចក្ដីសុចរិត', '', 'seich-kdey-soch-rit'],
      ['Hope', 'សេចក្ដីសង្ឃឹម', '', 'seich-kdey-sang-khoem'], ['Faithfulness', 'ភាពស្មោះត្រង់', '', 'phiep-smaoh-trang'],
      ['Fruit of the Spirit', 'ផលនៃព្រះវិញ្ញាណ', '', 'phal-ney-preah-vinh-nhien'], ['Gifts of the Spirit', 'អំណោយទាននៃព្រះវិញ្ញាណ', '', 'am-naoy-tien-ney-preah-vinh-nhien'],
      ['Prophecy', 'ទំនាយ', '', 'tum-niey'], ['Speak in tongues', 'និយាយភាសាដទៃ', '', 'niyeay-phie-sa-da-tey'], ['Revelation (from God)', 'ការបើកសម្ដែង', '', 'ka-baeuk-sam-daeng'],
      ['Eternal', 'អស់កល្បជានិច្ច', '', 'ah-kal-chie-nich'], ['Scripture', 'បទគម្ពីរ', '', 'bat-kom-pi'], ['Idol', 'រូបព្រះ', '', 'rup-preah'], ['Altar', 'អាសនៈ', '', 'a-sa-nak'],
      ['Sacrifice', 'យញ្ញបូជា', '', 'yonh-bou-chie'], ['Temple', 'ព្រះវិហារបរិសុទ្ធ', '', 'preah vihie-ba-ri-sot'], ['Priest', 'បូជាចារ្យ', '', 'bou-chie-cha']
    ] },
    { id: 'bible', level: 3, name: 'Faith — books of the Bible', tip: 'In the order of the Bible: the 39 books of the Old Testament, then the 27 of the New. Names as the Khmer Standard Version has them.', words: [
      ['Genesis', 'លោកុប្បត្តិ', 'Old Testament', 'lou-kop-bat'], ['Exodus', 'និក្ខមនំ', 'Old Testament', 'nik-kha-ma-nom'],
      ['Leviticus', 'លេវីវិន័យ', 'Old Testament', 'le-vi-vi-noay'], ['Numbers', 'ជនគណនា', 'Old Testament', 'chon-kon-nie'],
      ['Deuteronomy', 'ចោទិយកថា', 'Old Testament', 'chao-ti-yak-ka-tha'], ['Joshua', 'យ៉ូស្វេ', 'Old Testament', 'you-svei'],
      ['Judges', 'ពួកចៅហ្វាយ', 'Old Testament', 'puok-chau-hvay'], ['Ruth', 'នាងរស់', 'Old Testament', 'neang-roh'],
      ['1 Samuel', 'សាំយូអែលទី១', 'Old Testament', 'sam-yu-ael-ti-1'], ['2 Samuel', 'សាំយូអែលទី២', 'Old Testament', 'sam-yu-ael-ti-2'],
      ['1 Kings', 'ពង្សាវតារក្សត្រទី១', 'Old Testament', 'pong-sa-va-da-ksat-ti-1'], ['2 Kings', 'ពង្សាវតារក្សត្រទី២', 'Old Testament', 'pong-sa-va-da-ksat-ti-2'],
      ['1 Chronicles', 'របាក្សត្រទី១', 'Old Testament', 'ro-bak-sat-ti-1'], ['2 Chronicles', 'របាក្សត្រទី២', 'Old Testament', 'ro-bak-sat-ti-2'],
      ['Ezra', 'អែសរ៉ា', 'Old Testament', 'ae-sa-ra'], ['Nehemiah', 'នេហេមា', 'Old Testament', 'ne-hei-mie'], ['Esther', 'នាងអេសធើរ', 'Old Testament', 'neang-eih-theu'],
      ['Job', 'យ៉ូប', 'Old Testament', 'youp'], ['Psalms', 'ទំនុកតម្កើង', 'Old Testament', 'tum-nuk-tam-kaeung'], ['Proverbs', 'សុភាសិត', 'Old Testament', 'so-phie-set'],
      ['Ecclesiastes', 'សាស្ដា', 'Old Testament', 'sa-sda'], ['Song of Songs', 'បទចម្រៀង', 'Old Testament', 'bat-cham-rieng'], ['Isaiah', 'អេសាយ', 'Old Testament', 'ei-say'],
      ['Jeremiah', 'យេរេមា', 'Old Testament', 'ye-re-mie'], ['Lamentations', 'បរិទេវ', 'Old Testament', 'ba-ri-tev'], ['Ezekiel', 'អេសេគាល', 'Old Testament', 'ei-sei-kiel'],
      ['Daniel', 'ដានីយ៉ែល', 'Old Testament', 'da-ni-yael'], ['Hosea', 'ហូសេ', 'Old Testament', 'hou-sei'], ['Joel', 'យ៉ូអែល', 'Old Testament', 'you-ael'],
      ['Amos', 'អាម៉ុស', 'Old Testament', 'a-moh'], ['Obadiah', 'អូបាឌា', 'Old Testament', 'ou-ba-die'], ['Jonah', 'យ៉ូណាស', 'Old Testament', 'you-nah'],
      ['Micah', 'មីកា', 'Old Testament', 'mi-ka'], ['Nahum', 'ណាហ៊ុម', 'Old Testament', 'na-hum'], ['Habakkuk', 'ហាបាគុក', 'Old Testament', 'ha-ba-kuk'],
      ['Zephaniah', 'សេផានា', 'Old Testament', 'sei-pha-nie'], ['Haggai', 'ហាកាយ', 'Old Testament', 'ha-kay'], ['Zechariah', 'សាការី', 'Old Testament', 'sa-ka-ri'],
      ['Malachi', 'ម៉ាឡាគី', 'Old Testament', 'ma-la-ki'], ['Matthew', 'ម៉ាថាយ', 'New Testament', 'ma-thay'], ['Mark', 'ម៉ាកុស', 'New Testament', 'ma-koh'],
      ['Luke', 'លូកា', 'New Testament', 'lu-ka'], ['John', 'យ៉ូហាន', 'New Testament', 'you-han'], ['Acts', 'កិច្ចការ', 'New Testament', 'kech-cha-ka'],
      ['Romans', 'រ៉ូម', 'New Testament', 'roum'], ['1 Corinthians', 'កូរិនថូសទី១', 'New Testament', 'kou-rin-thouh-ti-1'],
      ['2 Corinthians', 'កូរិនថូសទី២', 'New Testament', 'kou-rin-thouh-ti-2'], ['Galatians', 'កាឡាទី', 'New Testament', 'ka-la-ti'],
      ['Ephesians', 'អេភេសូរ', 'New Testament', 'ei-phe-sou'], ['Philippians', 'ភីលីព', 'New Testament', 'phi-lip'], ['Colossians', 'កូល៉ុស', 'New Testament', 'kou-loh'],
      ['1 Thessalonians', 'ថែស្សាឡូនីចទី១', 'New Testament', 'thaeh-sa-lou-nich-ti-1'], ['2 Thessalonians', 'ថែស្សាឡូនីចទី២', 'New Testament', 'thaeh-sa-lou-nich-ti-2'],
      ['1 Timothy', 'ធីម៉ូថេទី១', 'New Testament', 'thi-mou-thei-ti-1'], ['2 Timothy', 'ធីម៉ូថេទី២', 'New Testament', 'thi-mou-thei-ti-2'],
      ['Titus', 'ទីតុស', 'New Testament', 'ti-toh'], ['Philemon', 'ភីលេម៉ូន', 'New Testament', 'phi-le-moun'], ['Hebrews', 'ហេព្រើរ', 'New Testament', 'hei-preu'],
      ['James', 'យ៉ាកុប', 'New Testament', 'ya-kop'], ['1 Peter', 'ពេត្រុសទី១', 'New Testament', 'pe-troh-ti-1'], ['2 Peter', 'ពេត្រុសទី២', 'New Testament', 'pe-troh-ti-2'],
      ['1 John', 'យ៉ូហានទី១', 'New Testament', 'you-han-ti-1'], ['2 John', 'យ៉ូហានទី២', 'New Testament', 'you-han-ti-2'], ['3 John', 'យ៉ូហានទី៣', 'New Testament', 'you-han-ti-3'],
      ['Jude', 'យូដាស', 'New Testament', 'yu-dah'], ['Revelation', 'វិវរណៈ', 'New Testament', 'vi-vo-ra-nak']
    ] }
  ]
};
