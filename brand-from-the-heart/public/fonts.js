/* Brand From the Heart — the font library. Hand-picked pairings, grouped by style.
 *
 * 7 styles, 36 pairings. Each pairing has a Latin heading + body and a Khmer heading + body
 * chosen for the same personality, all from Google Fonts. Khmer display faces (Moul, Koulen,
 * Bokor, Fasthand…) are only ever headings; Khmer body fonts are ones that read well small.
 * BFH_FONT_URL(pairing) gives one fonts.googleapis.com css2 URL for all four.
 *
 * The Khmer (km) in this file is a draft by Claude, unreviewed — have a native speaker check it.
 */
window.BFH_FONT_STYLES = [
  { id: 'elegant', en: 'Elegant', km: 'ប្រណីត' },
  { id: 'playful', en: 'Playful', km: 'លេងសើច' },
  { id: 'strong', en: 'Strong', km: 'រឹងមាំ' },
  { id: 'handwritten', en: 'Handwritten', km: 'សរសេរដោយដៃ' },
  { id: 'editorial', en: 'Editorial', km: 'បែបទស្សនាវដ្ដី' },
  { id: 'modern', en: 'Modern', km: 'ទំនើប' },
  { id: 'traditional', en: 'Traditional', km: 'បែបប្រពៃណី' }
];

(function () {
  function f(family, weight) { return { family: family, weight: weight }; }
  function P(id, style, h, b, kh, kb, en, km) {
    return { id: id, style: style, heading: h, body: b, khHeading: kh, khBody: kb, feel: { en: en, km: km } };
  }
  window.BFH_FONTS = [
    /* ---- elegant ---- */
    P('elegant-playfair-lato', 'elegant', f('Playfair Display', 700), f('Lato', 400), f('Moul', 400), f('Kantumruy Pro', 400),
      'Classic and graceful', 'បុរាណ និងស្រស់ស្អាត'),
    P('elegant-cormorant-montserrat', 'elegant', f('Cormorant Garamond', 600), f('Montserrat', 400), f('Moulpali', 400), f('Hanuman', 400),
      'Fine, light and beautiful', 'ល្អិតល្អន់ ស្រាល និងស្អាត'),
    P('elegant-cinzel-raleway', 'elegant', f('Cinzel', 600), f('Raleway', 400), f('Preahvihear', 400), f('Noto Serif Khmer', 400),
      'Carved in stone, made to last', 'ឆ្លាក់លើថ្ម នៅបានយូរ'),
    P('elegant-bodoni-jost', 'elegant', f('Bodoni Moda', 700), f('Jost', 400), f('Moul', 400), f('Kantumruy Pro', 300),
      'Fashion-magazine style', 'បែបទស្សនាវដ្ដីម៉ូដ'),
    P('elegant-marcellus-mulish', 'elegant', f('Marcellus', 400), f('Mulish', 400), f('Moulpali', 400), f('Siemreap', 400),
      'Calm beauty with good manners', 'ស្អាតស្ងប់ និងគួរសម'),

    /* ---- playful ---- */
    P('playful-fredoka-nunito', 'playful', f('Fredoka', 600), f('Nunito', 400), f('Dangrek', 400), f('Kantumruy Pro', 400),
      'Round, soft and friendly', 'មូល ទន់ និងរួសរាយ'),
    P('playful-baloo-quicksand', 'playful', f('Baloo 2', 700), f('Quicksand', 500), f('Bokor', 400), f('Nokora', 400),
      'Bouncy and full of fun', 'លោតៗ និងសប្បាយ'),
    P('playful-chewy-poppins', 'playful', f('Chewy', 400), f('Poppins', 400), f('Freehand', 400), f('Kdam Thmor Pro', 400),
      'Cartoon energy', 'ថាមពលដូចតុក្កតា'),
    P('playful-lilita-open-sans', 'playful', f('Lilita One', 400), f('Open Sans', 400), f('Koulen', 400), f('Noto Sans Khmer', 400),
      'Big, happy headlines', 'ចំណងជើងធំៗ សប្បាយ'),
    P('playful-sniglet-varela', 'playful', f('Sniglet', 800), f('Varela Round', 400), f('Dangrek', 400), f('Battambang', 400),
      'Sweet and cheerful', 'ផ្អែម និងរីករាយ'),

    /* ---- strong ---- */
    P('strong-anton-inter', 'strong', f('Anton', 400), f('Inter', 400), f('Koulen', 400), f('Kantumruy Pro', 500),
      'Loud and clear', 'ខ្លាំង និងច្បាស់'),
    P('strong-bebas-roboto', 'strong', f('Bebas Neue', 400), f('Roboto', 400), f('Bayon', 400), f('Noto Sans Khmer', 400),
      'Tall, bold, poster style', 'ខ្ពស់ ដិត បែបប័ណ្ណប្រកាស'),
    P('strong-oswald-work-sans', 'strong', f('Oswald', 700), f('Work Sans', 400), f('Metal', 400), f('Kantumruy Pro', 400),
      'Firm and ready to move', 'រឹងមាំ និងត្រៀមចេញដំណើរ'),
    P('strong-archivo-black-archivo', 'strong', f('Archivo Black', 400), f('Archivo', 400), f('Koulen', 400), f('Noto Sans Khmer', 500),
      'Heavy and confident', 'ធ្ងន់ និងជឿជាក់'),
    P('strong-barlow-condensed-barlow', 'strong', f('Barlow Condensed', 800), f('Barlow', 400), f('Kdam Thmor Pro', 400), f('Battambang', 400),
      'Sporty and full of drive', 'បែបកីឡា ពោរពេញកម្លាំង'),

    /* ---- handwritten ---- */
    P('handwritten-caveat-nunito-sans', 'handwritten', f('Caveat', 700), f('Nunito Sans', 400), f('Fasthand', 400), f('Kantumruy Pro', 400),
      'A note from a friend', 'កំណត់ត្រាពីមិត្តភក្ដិ'),
    P('handwritten-pacifico-quicksand', 'handwritten', f('Pacifico', 400), f('Quicksand', 400), f('Freehand', 400), f('Battambang', 400),
      'Sunny, beachy script', 'អក្សរផ្ចង់ បែបមាត់សមុទ្រ'),
    P('handwritten-kalam-lato', 'handwritten', f('Kalam', 700), f('Lato', 400), f('Fasthand', 400), f('Nokora', 400),
      'Like a page from my notebook', 'ដូចទំព័រពីសៀវភៅកត់ត្រា'),
    P('handwritten-shadows-open-sans', 'handwritten', f('Shadows Into Light', 400), f('Open Sans', 400), f('Freehand', 400), f('Noto Sans Khmer', 400),
      'Light, honest and personal', 'ស្រាល ស្មោះ និងផ្ទាល់ខ្លួន'),
    P('handwritten-marker-roboto', 'handwritten', f('Permanent Marker', 400), f('Roboto', 400), f('Bokor', 400), f('Kantumruy Pro', 400),
      'Written with a big marker', 'សរសេរដោយប៊ិចហ្វឺតធំ'),

    /* ---- editorial ---- */
    P('editorial-fraunces-inter', 'editorial', f('Fraunces', 700), f('Inter', 400), f('Moulpali', 400), f('Noto Serif Khmer', 400),
      'Thoughtful stories', 'រឿងរ៉ាវដែលគិតជ្រៅ'),
    P('editorial-dm-serif-dm-sans', 'editorial', f('DM Serif Display', 400), f('DM Sans', 400), f('Preahvihear', 400), f('Hanuman', 400),
      'Smart and stylish', 'ឆ្លាត និងទាន់សម័យ'),
    P('editorial-baskerville-source-sans', 'editorial', f('Libre Baskerville', 700), f('Source Sans 3', 400), f('Taprom', 400), f('Suwannaphum', 400),
      'Like a good book', 'ដូចសៀវភៅល្អមួយ'),
    P('editorial-cormorant-proza', 'editorial', f('Cormorant', 700), f('Proza Libre', 400), f('Moul', 400), f('Noto Serif Khmer', 400),
      'Long reads, deep ideas', 'អានវែង គំនិតជ្រៅ'),
    P('editorial-merriweather-sans', 'editorial', f('Merriweather', 700), f('Merriweather Sans', 400), f('Angkor', 400), f('Content', 400),
      'Trusted news voice', 'សំឡេងព័ត៌មានដែលគេទុកចិត្ត'),

    /* ---- modern ---- */
    P('modern-poppins-inter', 'modern', f('Poppins', 600), f('Inter', 400), f('Kantumruy Pro', 700), f('Kantumruy Pro', 400),
      'Clean and simple', 'ស្អាត និងសាមញ្ញ'),
    P('modern-montserrat-open-sans', 'modern', f('Montserrat', 700), f('Open Sans', 400), f('Noto Sans Khmer', 700), f('Noto Sans Khmer', 400),
      'Easy to read everywhere', 'ងាយអានគ្រប់កន្លែង'),
    P('modern-space-grotesk-dm-sans', 'modern', f('Space Grotesk', 700), f('DM Sans', 400), f('Kdam Thmor Pro', 400), f('Kantumruy Pro', 400),
      'Techy and creative', 'បែបបច្ចេកវិទ្យា និងច្នៃប្រឌិត'),
    P('modern-manrope-inter', 'modern', f('Manrope', 800), f('Inter', 400), f('Nokora', 700), f('Nokora', 400),
      'Sharp, like a new app', 'មុតស្រួច ដូចកម្មវិធីថ្មី'),
    P('modern-outfit-work-sans', 'modern', f('Outfit', 600), f('Work Sans', 400), f('Kantumruy Pro', 600), f('Noto Sans Khmer', 400),
      'Fresh and friendly', 'ស្រស់ និងរួសរាយ'),
    P('modern-sora-nunito-sans', 'modern', f('Sora', 700), f('Nunito Sans', 400), f('Battambang', 700), f('Battambang', 400),
      'Wide, open and calm', 'ធំទូលាយ បើកចំហ និងស្ងប់'),

    /* ---- traditional ---- */
    P('traditional-garamond-crimson', 'traditional', f('EB Garamond', 700), f('Crimson Text', 400), f('Moul', 400), f('Battambang', 400),
      'Old and wise', 'ចាស់ និងមានប្រាជ្ញា'),
    P('traditional-caslon-source-serif', 'traditional', f('Libre Caslon Text', 700), f('Source Serif 4', 400), f('Angkor', 400), f('Hanuman', 400),
      'Like an old printed Bible', 'ដូចព្រះគម្ពីរបោះពុម្ពចាស់'),
    P('traditional-lora-source-sans', 'traditional', f('Lora', 700), f('Source Sans 3', 400), f('Taprom', 400), f('Suwannaphum', 400),
      'Warm and trusted', 'កក់ក្ដៅ និងគួរទុកចិត្ត'),
    P('traditional-cinzel-garamond', 'traditional', f('Cinzel', 700), f('EB Garamond', 400), f('Moul', 400), f('Noto Serif Khmer', 400),
      'Royal and timeless', 'បែបរាជ្យ និងមិនចេះចាស់'),
    P('traditional-old-standard-pt-serif', 'traditional', f('Old Standard TT', 700), f('PT Serif', 400), f('Odor Mean Chey', 400), f('Siemreap', 400),
      'Like a letter from long ago', 'ដូចសំបុត្រពីយូរយារមកហើយ')
  ];
})();

/* One css2 URL for the pairing's four families, each at the weights it uses. */
window.BFH_FONT_URL = function (pairing) {
  var fams = {}, order = [];
  ['heading', 'body', 'khHeading', 'khBody'].forEach(function (k) {
    var x = pairing && pairing[k];
    if (!x || !x.family) return;
    if (!fams[x.family]) { fams[x.family] = []; order.push(x.family); }
    var w = Number(x.weight) || 400;
    if (fams[x.family].indexOf(w) < 0) fams[x.family].push(w);
  });
  var q = order.map(function (name) {
    var ws = fams[name].sort(function (a, b) { return a - b; });
    return 'family=' + encodeURIComponent(name).replace(/%20/g, '+') + ':wght@' + ws.join(';');
  });
  return 'https://fonts.googleapis.com/css2?' + q.join('&') + '&display=swap';
};
