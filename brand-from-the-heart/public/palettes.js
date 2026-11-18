/* Brand From the Heart — the colour library. Hand-built palettes, grouped by mood.
 *
 * 9 moods, 56 palettes (6 a mood, 8 for 'khmer'). Each palette has five roles:
 *   primary    — the main brand colour (≥ 3:1 against the background)
 *   secondary  — a partner colour
 *   accent     — a pop, used sparingly
 *   background — where most designs sit (8 palettes are dark)
 *   text       — body text on the background (≥ 7:1, WCAG AAA)
 * Hex is #RRGGBB, uppercase. BFH_COLOR (below) gives tints, shades, contrast and mixing.
 *
 * The Khmer (km) in this file is a draft by Claude, unreviewed — have a native speaker check it.
 */
window.BFH_MOODS = [
  { id: 'warm', en: 'Warm', km: 'កក់ក្ដៅ' },
  { id: 'earthy', en: 'Earthy', km: 'ពណ៌ដី' },
  { id: 'bold', en: 'Bold', km: 'ដិតខ្លាំង' },
  { id: 'calm', en: 'Calm', km: 'ស្ងប់ស្ងាត់' },
  { id: 'joyful', en: 'Joyful', km: 'រីករាយ' },
  { id: 'sacred', en: 'Sacred', km: 'ពិសិដ្ឋ' },
  { id: 'modern', en: 'Modern', km: 'ទំនើប' },
  { id: 'khmer', en: 'Khmer-inspired', km: 'បែបខ្មែរ' },
  { id: 'gentle', en: 'Gentle', km: 'ទន់ភ្លន់' }
];

window.BFH_PALETTES = [
  /* ---- warm ---- */
  { id: 'warm-sunrise-market', mood: 'warm', name: { en: 'Sunrise Market', km: 'ផ្សារពេលព្រឹក' },
    colors: { primary: '#C8553D', secondary: '#F28F3B', accent: '#588B8B', background: '#FFF5E9', text: '#2B2118' },
    feel: { en: 'Busy, friendly and full of life', km: 'មមាញឹក រួសរាយ ពោរពេញដោយជីវិត' } },
  { id: 'warm-cinnamon-tea', mood: 'warm', name: { en: 'Cinnamon Tea', km: 'តែស៊ីណាម៉ូន' },
    colors: { primary: '#A0522D', secondary: '#D9A066', accent: '#6B8E23', background: '#FBF3E8', text: '#2E1D12' },
    feel: { en: 'A cozy talk with a good friend', km: 'ជជែកលេងកក់ក្ដៅជាមួយមិត្តល្អ' } },
  { id: 'warm-golden-hour', mood: 'warm', name: { en: 'Golden Hour', km: 'ពន្លឺពេលល្ងាច' },
    colors: { primary: '#C4621B', secondary: '#F4B860', accent: '#3D5A80', background: '#FFF8EC', text: '#2A1E14' },
    feel: { en: 'Soft light at the end of the day', km: 'ពន្លឺទន់ៗ ពេលថ្ងៃលិច' } },
  { id: 'warm-terracotta-home', mood: 'warm', name: { en: 'Terracotta Home', km: 'ផ្ទះក្បឿងក្រហម' },
    colors: { primary: '#B5543A', secondary: '#E7A977', accent: '#2F6F6A', background: '#FAF1EA', text: '#2B1B14' },
    feel: { en: 'Welcoming, like coming home', km: 'ស្វាគមន៍ ដូចត្រឡប់មកផ្ទះវិញ' } },
  { id: 'warm-mango-sticky-rice', mood: 'warm', name: { en: 'Mango Sticky Rice', km: 'បាយដំណើបស្វាយ' },
    colors: { primary: '#C2620F', secondary: '#F6C445', accent: '#7A9E3B', background: '#FFFBEF', text: '#33220F' },
    feel: { en: 'Sweet, sunny and fun', km: 'ផ្អែម ភ្លឺស្រឡះ និងសប្បាយ' } },
  { id: 'warm-hearth-fire', mood: 'warm', name: { en: 'Hearth Fire', km: 'ភ្លើងចង្ក្រាន' },
    colors: { primary: '#9E2A2B', secondary: '#E09F3E', accent: '#335C67', background: '#FFF3E0', text: '#2A1414' },
    feel: { en: 'Deep warmth that brings people together', km: 'ភាពកក់ក្ដៅ ដែលនាំមនុស្សមកជួបគ្នា' } },

  /* ---- earthy ---- */
  { id: 'earthy-forest-floor', mood: 'earthy', name: { en: 'Forest Floor', km: 'ដីក្នុងព្រៃ' },
    colors: { primary: '#5B6B3A', secondary: '#A68A64', accent: '#C26A3D', background: '#F5F1E8', text: '#23261A' },
    feel: { en: 'Grounded and real', km: 'រឹងមាំ និងពិតប្រាកដ' } },
  { id: 'earthy-clay-pot', mood: 'earthy', name: { en: 'Clay Pot', km: 'ឆ្នាំងដី' },
    colors: { primary: '#8C4F33', secondary: '#C9A27E', accent: '#4F7C6B', background: '#F7EFE6', text: '#2A1E16' },
    feel: { en: 'Handmade and honest', km: 'ធ្វើដោយដៃ និងស្មោះត្រង់' } },
  { id: 'earthy-mountain-tea', mood: 'earthy', name: { en: 'Mountain Tea', km: 'តែលើភ្នំ' },
    colors: { primary: '#4A6B4F', secondary: '#9DB39A', accent: '#B5813C', background: '#F3F4EC', text: '#1F2A21' },
    feel: { en: 'Fresh air and quiet strength', km: 'ខ្យល់ស្រស់ និងកម្លាំងស្ងប់ៗ' } },
  { id: 'earthy-coffee-bean', mood: 'earthy', name: { en: 'Coffee Bean', km: 'គ្រាប់កាហ្វេ' },
    colors: { primary: '#6F4E37', secondary: '#B08968', accent: '#D98E32', background: '#F8F2EA', text: '#2B1D14' },
    feel: { en: 'Rich, warm and steady', km: 'ក្រអូប កក់ក្ដៅ និងនឹងនរ' } },
  { id: 'earthy-river-stone', mood: 'earthy', name: { en: 'River Stone', km: 'ថ្មមាត់ទន្លេ' },
    colors: { primary: '#5E6B6E', secondary: '#A3A08F', accent: '#B8664A', background: '#F4F2EE', text: '#222829' },
    feel: { en: 'Calm, patient and lasting', km: 'ស្ងប់ អត់ធ្មត់ និងនៅយូរ' } },
  { id: 'earthy-harvest-basket', mood: 'earthy', name: { en: 'Harvest Basket', km: 'កន្ត្រកផលដំណាំ' },
    colors: { primary: '#7A5C1E', secondary: '#C8A951', accent: '#8E3B2E', background: '#FAF6EC', text: '#2A2212' },
    feel: { en: 'Thankful for good things grown', km: 'អរគុណចំពោះផលល្អៗ' } },

  /* ---- bold ---- */
  { id: 'bold-spark', mood: 'bold', name: { en: 'Spark', km: 'ផ្កាភ្លើង' },
    colors: { primary: '#D62828', secondary: '#003049', accent: '#FCBF49', background: '#FFFFFF', text: '#111111' },
    feel: { en: 'Loud, brave and ready to act', km: 'ខ្លាំង ក្លាហាន ត្រៀមធ្វើភ្លាម' } },
  { id: 'bold-midnight-neon', mood: 'bold', name: { en: 'Midnight Neon', km: 'ភ្លើងនីយ៉ុងពេលយប់' },
    colors: { primary: '#FF3D7F', secondary: '#7B61FF', accent: '#00E5C7', background: '#0F0F1A', text: '#F2F2F7' },
    feel: { en: 'Night city energy', km: 'ថាមពលទីក្រុងពេលយប់' } },
  { id: 'bold-electric-blue', mood: 'bold', name: { en: 'Electric Blue', km: 'ខៀវភ្លឺឆ្អៅ' },
    colors: { primary: '#1F4FFF', secondary: '#FF6B35', accent: '#FFD23F', background: '#F7F8FC', text: '#0B1026' },
    feel: { en: 'Sharp, fast and confident', km: 'មុត លឿន និងជឿជាក់' } },
  { id: 'bold-black-gold', mood: 'bold', name: { en: 'Black and Gold', km: 'ខ្មៅ និងមាស' },
    colors: { primary: '#E0B341', secondary: '#8C6D2C', accent: '#C1272D', background: '#111111', text: '#F5F0E6' },
    feel: { en: 'Strong, rich and serious', km: 'ខ្លាំង ប្រណីត និងម៉ឺងម៉ាត់' } },
  { id: 'bold-street-mural', mood: 'bold', name: { en: 'Street Mural', km: 'គំនូរលើជញ្ជាំង' },
    colors: { primary: '#EF233C', secondary: '#2B2D42', accent: '#2EC4B6', background: '#FFFDF7', text: '#14141F' },
    feel: { en: 'Young, loud and creative', km: 'ក្មេង ខ្លាំង និងច្នៃប្រឌិត' } },
  { id: 'bold-stage-lights', mood: 'bold', name: { en: 'Stage Lights', km: 'ភ្លើងលើឆាក' },
    colors: { primary: '#FFB703', secondary: '#FB5607', accent: '#3A86FF', background: '#1A1033', text: '#F7F3FF' },
    feel: { en: 'All eyes on the stage', km: 'ភ្នែកទាំងអស់មើលមកឆាក' } },

  /* ---- calm ---- */
  { id: 'calm-morning-mist', mood: 'calm', name: { en: 'Morning Mist', km: 'អ័ព្ទពេលព្រឹក' },
    colors: { primary: '#4F6D7A', secondary: '#C0D6DF', accent: '#DD6E42', background: '#F4F7F8', text: '#1C2A30' },
    feel: { en: 'Slow, clear and peaceful', km: 'យឺតៗ ច្បាស់ និងសុខសាន្ត' } },
  { id: 'calm-still-water', mood: 'calm', name: { en: 'Still Water', km: 'ទឹកស្ងប់' },
    colors: { primary: '#2E6F8E', secondary: '#8FB9C9', accent: '#E9C46A', background: '#F2F8FA', text: '#13262F' },
    feel: { en: 'Deep breath, quiet mind', km: 'ដកដង្ហើមវែង ចិត្តស្ងប់' } },
  { id: 'calm-sage-garden', mood: 'calm', name: { en: 'Sage Garden', km: 'សួនស្លឹកឈើ' },
    colors: { primary: '#5C7A64', secondary: '#B7C9B0', accent: '#C08552', background: '#F5F7F2', text: '#1E2620' },
    feel: { en: 'Green, gentle and growing', km: 'បៃតង ទន់ភ្លន់ និងកំពុងលូតលាស់' } },
  { id: 'calm-evening-sky', mood: 'calm', name: { en: 'Evening Sky', km: 'មេឃពេលល្ងាច' },
    colors: { primary: '#5A5A8F', secondary: '#A9A9D1', accent: '#E8A87C', background: '#F5F5FA', text: '#1D1D33' },
    feel: { en: 'Rest after a long day', km: 'សម្រាកក្រោយថ្ងៃវែង' } },
  { id: 'calm-sea-breeze', mood: 'calm', name: { en: 'Sea Breeze', km: 'ខ្យល់សមុទ្រ' },
    colors: { primary: '#2A7F7A', secondary: '#A8DADC', accent: '#F4A261', background: '#F1FAF9', text: '#10302E' },
    feel: { en: 'Fresh and easy, like the beach', km: 'ស្រស់ និងស្រួល ដូចនៅមាត់សមុទ្រ' } },
  { id: 'calm-quiet-room', mood: 'calm', name: { en: 'Quiet Room', km: 'បន្ទប់ស្ងាត់' },
    colors: { primary: '#6B705C', secondary: '#DDBEA9', accent: '#6E8FA3', background: '#FAF7F2', text: '#26261F' },
    feel: { en: 'Simple, still and safe', km: 'សាមញ្ញ ស្ងៀម និងសុវត្ថិភាព' } },

  /* ---- joyful ---- */
  { id: 'joyful-birthday-party', mood: 'joyful', name: { en: 'Birthday Party', km: 'ជប់លៀងខួបកំណើត' },
    colors: { primary: '#E5386D', secondary: '#FFB627', accent: '#2EC4B6', background: '#FFFBF5', text: '#2A1A22' },
    feel: { en: 'Balloons, cake and laughter', km: 'ប៉េងប៉ោង នំខេក និងសំណើច' } },
  { id: 'joyful-fresh-lemonade', mood: 'joyful', name: { en: 'Fresh Lemonade', km: 'ទឹកក្រូចឆ្មារស្រស់' },
    colors: { primary: '#2D8C45', secondary: '#F9DC5C', accent: '#FF6F59', background: '#FFFEF2', text: '#1F2A14' },
    feel: { en: 'Bright, fresh and zesty', km: 'ភ្លឺ ស្រស់ និងជូរល្មម' } },
  { id: 'joyful-candy-shop', mood: 'joyful', name: { en: 'Candy Shop', km: 'ហាងស្ករគ្រាប់' },
    colors: { primary: '#8338EC', secondary: '#FF70A6', accent: '#FFD670', background: '#FFF7FB', text: '#24123A' },
    feel: { en: 'Sweet, silly and colourful', km: 'ផ្អែម កំប្លែង និងចម្រុះពណ៌' } },
  { id: 'joyful-water-festival', mood: 'joyful', name: { en: 'Water Festival', km: 'បុណ្យអុំទូក' },
    colors: { primary: '#0077B6', secondary: '#00B4D8', accent: '#FF9F1C', background: '#F3FBFF', text: '#0A2433' },
    feel: { en: 'Splashing, cheering, all together', km: 'ទឹកខ្ទាត ស្រែកអបអរ ជាមួយគ្នា' } },
  { id: 'joyful-flower-market', mood: 'joyful', name: { en: 'Flower Market', km: 'ផ្សារផ្កា' },
    colors: { primary: '#D1495B', secondary: '#EDAE49', accent: '#00798C', background: '#FFF8F3', text: '#2B1518' },
    feel: { en: 'Colour everywhere you look', km: 'ពណ៌គ្រប់ទីកន្លែង' } },
  { id: 'joyful-sunny-day', mood: 'joyful', name: { en: 'Sunny Day', km: 'ថ្ងៃភ្លឺស្រឡះ' },
    colors: { primary: '#D35F00', secondary: '#FCBF49', accent: '#3A86FF', background: '#FFFDF5', text: '#2B1D0E' },
    feel: { en: 'Happy, hopeful and bright', km: 'សប្បាយ មានសង្ឃឹម និងភ្លឺថ្លា' } },

  /* ---- sacred ---- */
  { id: 'sacred-candlelight', mood: 'sacred', name: { en: 'Candlelight', km: 'ពន្លឺទៀន' },
    colors: { primary: '#E8B04A', secondary: '#7A4E7E', accent: '#D98E73', background: '#1B1520', text: '#F5EEDC' },
    feel: { en: 'Worship in a quiet night', km: 'ថ្វាយបង្គំក្នុងយប់ស្ងាត់' } },
  { id: 'sacred-holy-ground', mood: 'sacred', name: { en: 'Holy Ground', km: 'ដីបរិសុទ្ធ' },
    colors: { primary: '#6D4C3D', secondary: '#C2A878', accent: '#8C2F39', background: '#F8F4EC', text: '#231A15' },
    feel: { en: 'Humble, still and set apart', km: 'សុភាព ស្ងៀម និងញែកចេញ' } },
  { id: 'sacred-king-of-kings', mood: 'sacred', name: { en: 'King of Kings', km: 'ស្ដេចលើអស់ទាំងស្ដេច' },
    colors: { primary: '#5B2A86', secondary: '#C9A227', accent: '#B23A48', background: '#FAF7FC', text: '#1E1129' },
    feel: { en: 'Royal, worthy and full of honour', km: 'រាជ្យ សក្ដិសម និងពោរពេញកិត្តិយស' } },
  { id: 'sacred-dawn-prayer', mood: 'sacred', name: { en: 'Dawn Prayer', km: 'អធិស្ឋានពេលព្រលឹម' },
    colors: { primary: '#7A5C99', secondary: '#F0B67F', accent: '#4F8A8B', background: '#FBF6F2', text: '#251C2E' },
    feel: { en: 'New mercy every morning', km: 'សេចក្ដីមេត្តាថ្មីរាល់ព្រឹក' } },
  { id: 'sacred-night-watch', mood: 'sacred', name: { en: 'Night Watch', km: 'ចាំយាមពេលយប់' },
    colors: { primary: '#8FB8DE', secondary: '#3E5C76', accent: '#F4D06F', background: '#0E1A2B', text: '#EEF2F8' },
    feel: { en: 'Stars, stillness and trust', km: 'ផ្កាយ ភាពស្ងៀម និងការទុកចិត្ត' } },
  { id: 'sacred-oil-and-olive', mood: 'sacred', name: { en: 'Oil and Olive', km: 'ប្រេង និងដើមអូលីវ' },
    colors: { primary: '#5F6B2E', secondary: '#BFB48F', accent: '#A4453B', background: '#F8F7EF', text: '#22251A' },
    feel: { en: 'Ancient, anointed and alive', km: 'បុរាណ ចាក់ប្រេងតាំង និងរស់' } },

  /* ---- modern ---- */
  { id: 'modern-slate-and-coral', mood: 'modern', name: { en: 'Slate and Coral', km: 'ប្រផេះ និងផ្កាថ្ម' },
    colors: { primary: '#2F3E46', secondary: '#84A98C', accent: '#FF6B6B', background: '#F7F9F8', text: '#161D21' },
    feel: { en: 'Clean, smart and calm', km: 'ស្អាត ឆ្លាត និងស្ងប់' } },
  { id: 'modern-studio-dark', mood: 'modern', name: { en: 'Studio Dark', km: 'ស្ទូឌីយោងងឹត' },
    colors: { primary: '#4CC9F0', secondary: '#4361EE', accent: '#F72585', background: '#121417', text: '#ECEDEF' },
    feel: { en: 'Tech, night mode, creator vibes', km: 'បច្ចេកវិទ្យា ម៉ូដយប់ បែបអ្នកបង្កើតមាតិកា' } },
  { id: 'modern-clean-coral', mood: 'modern', name: { en: 'Clean Orange', km: 'ទឹកក្រូចស្អាត' },
    colors: { primary: '#E4572E', secondary: '#29335C', accent: '#F3A712', background: '#FFFFFF', text: '#1B1E2B' },
    feel: { en: 'Simple, fresh and direct', km: 'សាមញ្ញ ស្រស់ និងត្រង់' } },
  { id: 'modern-graphite', mood: 'modern', name: { en: 'Graphite', km: 'ខ្មៅដៃ' },
    colors: { primary: '#FFC857', secondary: '#E9724C', accent: '#6CC4A1', background: '#1E1E24', text: '#F2F2F2' },
    feel: { en: 'Sleek and focused', km: 'ស្អាតរលោង និងផ្ដោតអារម្មណ៍' } },
  { id: 'modern-paper-and-ink', mood: 'modern', name: { en: 'Paper and Ink', km: 'ក្រដាស និងទឹកខ្មៅ' },
    colors: { primary: '#1D3557', secondary: '#457B9D', accent: '#E63946', background: '#F1FAEE', text: '#0D1B2A' },
    feel: { en: 'Clear words, clear message', km: 'ពាក្យច្បាស់ សារច្បាស់' } },
  { id: 'modern-soft-tech', mood: 'modern', name: { en: 'Soft Tech', km: 'បច្ចេកវិទ្យាទន់ៗ' },
    colors: { primary: '#5E60CE', secondary: '#48BFE3', accent: '#FF9F1C', background: '#F8F8FF', text: '#14142B' },
    feel: { en: 'Friendly, smart and new', km: 'រួសរាយ ឆ្លាត និងថ្មី' } },

  /* ---- khmer ---- */
  { id: 'khmer-angkor-sandstone', mood: 'khmer', name: { en: 'Angkor Sandstone', km: 'ថ្មភក់អង្គរ' },
    colors: { primary: '#94603F', secondary: '#D8BE9C', accent: '#5F7F4F', background: '#F5EDE1', text: '#2A1F17' },
    feel: { en: 'Old stones, deep roots', km: 'ថ្មបុរាណ ឫសគល់ជ្រៅ' } },
  { id: 'khmer-saffron-robes', mood: 'khmer', name: { en: 'Saffron Robes', km: 'ពណ៌ស្បង់ចីវរ' },
    colors: { primary: '#C2571A', secondary: '#F2A541', accent: '#2F5D62', background: '#FFF7EC', text: '#2E1A0E' },
    feel: { en: 'Bright orange of the morning streets', km: 'ពណ៌ទឹកក្រូចភ្លឺលើផ្លូវពេលព្រឹក' } },
  { id: 'khmer-silk-krama', mood: 'khmer', name: { en: 'Silk Krama', km: 'ក្រមាសូត្រ' },
    colors: { primary: '#A4243B', secondary: '#2C5F8A', accent: '#E8B04A', background: '#FBF7F2', text: '#1F1A1C' },
    feel: { en: 'Woven checks, family and home', km: 'ក្រឡាត្បាញ គ្រួសារ និងផ្ទះ' } },
  { id: 'khmer-lotus-pond', mood: 'khmer', name: { en: 'Lotus Pond', km: 'ស្រះផ្កាឈូក' },
    colors: { primary: '#C9457A', secondary: '#F4B6C2', accent: '#3E7C59', background: '#FFF6F8', text: '#2D1620' },
    feel: { en: 'Pure beauty out of the mud', km: 'ស្រស់ស្អាតបរិសុទ្ធ ដុះចេញពីភក់' } },
  { id: 'khmer-palm-sugar', mood: 'khmer', name: { en: 'Palm Sugar', km: 'ស្ករត្នោត' },
    colors: { primary: '#7B4A1E', secondary: '#C68B59', accent: '#5C8A3A', background: '#FAF3E7', text: '#2A1A0C' },
    feel: { en: 'Sweet like the countryside', km: 'ផ្អែមដូចជនបទ' } },
  { id: 'khmer-mekong-river', mood: 'khmer', name: { en: 'Mekong River', km: 'ទន្លេមេគង្គ' },
    colors: { primary: '#3F6472', secondary: '#A88B63', accent: '#E0A43A', background: '#F4F3EE', text: '#1E2528' },
    feel: { en: 'Wide, strong and always moving', km: 'ធំទូលាយ ខ្លាំង និងហូរជានិច្ច' } },
  { id: 'khmer-rice-field', mood: 'khmer', name: { en: 'Rice Field', km: 'វាលស្រែ' },
    colors: { primary: '#457F27', secondary: '#B5D46B', accent: '#2F7EA8', background: '#F7FAEF', text: '#1C2614' },
    feel: { en: 'Green fields after the rain', km: 'វាលស្រែខៀវខ្ចី ក្រោយភ្លៀង' } },
  { id: 'khmer-gold-and-lacquer', mood: 'khmer', name: { en: 'Gold and Lacquer', km: 'មាស និងម្រ័ក្សណ៍' },
    colors: { primary: '#D4A537', secondary: '#A3262A', accent: '#3F8F7A', background: '#2A0F0E', text: '#F7EBD3' },
    feel: { en: 'Temple gold on deep red', km: 'មាសវត្ត លើពណ៌ក្រហមចាស់' } },

  /* ---- gentle ---- */
  { id: 'gentle-soft-blanket', mood: 'gentle', name: { en: 'Soft Blanket', km: 'ភួយទន់' },
    colors: { primary: '#6C7DA6', secondary: '#D6DCEB', accent: '#E8A0A0', background: '#FAFAFD', text: '#252A3A' },
    feel: { en: 'Safe, warm and cared for', km: 'សុវត្ថិភាព កក់ក្ដៅ និងមានគេយកចិត្តទុកដាក់' } },
  { id: 'gentle-peach-blossom', mood: 'gentle', name: { en: 'Peach Blossom', km: 'ផ្កាប៉ែស' },
    colors: { primary: '#B85F50', secondary: '#F6C9B8', accent: '#7FA88E', background: '#FFF8F5', text: '#2E1E1B' },
    feel: { en: 'Kind words and a soft smile', km: 'ពាក្យល្អ និងស្នាមញញឹមទន់ៗ' } },
  { id: 'gentle-morning-dew', mood: 'gentle', name: { en: 'Morning Dew', km: 'ទឹកសន្សើម' },
    colors: { primary: '#548271', secondary: '#CFE3D8', accent: '#E6B566', background: '#F7FBF9', text: '#1B2B25' },
    feel: { en: 'A fresh, quiet start', km: 'ការចាប់ផ្ដើមស្រស់ និងស្ងប់' } },
  { id: 'gentle-lavender', mood: 'gentle', name: { en: 'Lavender', km: 'ផ្កាឡាវេនឌ័រ' },
    colors: { primary: '#8B6FAE', secondary: '#D9CCE8', accent: '#E9B872', background: '#FBF9FD', text: '#261E30' },
    feel: { en: 'Dreamy and kind', km: 'ដូចសុបិន និងចិត្តល្អ' } },
  { id: 'gentle-cotton-cloud', mood: 'gentle', name: { en: 'Cotton Cloud', km: 'ពពកដូចសំឡី' },
    colors: { primary: '#5F83A8', secondary: '#E3EDF5', accent: '#F2A98A', background: '#FBFCFE', text: '#1E2833' },
    feel: { en: 'Light, airy and free', km: 'ស្រាល ស្រឡះ និងសេរី' } },
  { id: 'gentle-rose-tea', mood: 'gentle', name: { en: 'Rose Tea', km: 'តែផ្កាកុលាប' },
    colors: { primary: '#A86A7C', secondary: '#E8C5CE', accent: '#8AA37B', background: '#FDF7F8', text: '#2E1D22' },
    feel: { en: 'Tender, warm and thoughtful', km: 'ទន់ភ្លន់ កក់ក្ដៅ និងគិតគូរ' } }
];

/* Colour helpers (pure functions). Hex in and out is #RRGGBB, uppercase. */
window.BFH_COLOR = (function () {
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function parse(hex) {
    var h = String(hex || '').replace('#', '').trim();
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (h.length !== 6 || isNaN(n)) return { r: 0, g: 0, b: 0 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function toHex(r, g, b) {
    function p(v) { v = Math.round(Math.max(0, Math.min(255, v))); return (v < 16 ? '0' : '') + v.toString(16); }
    return ('#' + p(r) + p(g) + p(b)).toUpperCase();
  }
  /* -> { h: 0–360, s: 0–100, l: 0–100 } */
  function hexToHsl(hex) {
    var c = parse(hex), r = c.r / 255, g = c.g / 255, b = c.b / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    var h = 0, s = 0, l = (max + min) / 2;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return { h: Math.round(h * 10) / 10, s: Math.round(s * 1000) / 10, l: Math.round(l * 1000) / 10 };
  }
  /* h 0–360, s and l 0–100 */
  function hslToHex(h, s, l) {
    h = ((Number(h) % 360) + 360) % 360; s = clamp01(s / 100); l = clamp01(l / 100);
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    var r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return toHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }
  /* WCAG 2 relative luminance */
  function luminance(hex) {
    var c = parse(hex);
    function ch(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
  }
  /* WCAG contrast ratio, 1–21 */
  function contrast(a, b) {
    var la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  /* t = 0 gives a, t = 1 gives b (mixed in sRGB) */
  function mix(a, b, t) {
    t = clamp01(Number(t) || 0);
    var x = parse(a), y = parse(b);
    return toHex(x.r + (y.r - x.r) * t, x.g + (y.g - x.g) * t, x.b + (y.b - x.b) * t);
  }
  /* 4 lighter: 20/40/60/80% toward white */
  function tints(hex) { return [0.2, 0.4, 0.6, 0.8].map(function (t) { return mix(hex, '#FFFFFF', t); }); }
  /* 4 darker: 20/40/60/80% toward black */
  function shades(hex) { return [0.2, 0.4, 0.6, 0.8].map(function (t) { return mix(hex, '#000000', t); }); }
  return { hexToHsl: hexToHsl, hslToHex: hslToHex, luminance: luminance, contrast: contrast,
    tints: tints, shades: shades, mix: mix };
})();
