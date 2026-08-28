// Invitations Templates — hand-picked photo cards plus a generated vector
// catalogue (scripts/genArt.cjs) covering many more occasions.
import { GENERATED_TEMPLATES, GENERATED_CATEGORIES } from './templatesGenerated';

// Retired: tpl-ganpati-1.jpg, card-durgapuja.jpg, tpl-janmashtami.jpg, tpl-diwali.jpg
// and card-holi.jpg have their greeting printed inside the artwork itself, so every
// overlaid line collided with it. Please don't re-add those five images as templates.
const BASE_TEMPLATES = [
  // ========== WEDDINGS (15 unique) ==========
  { _id: 'w1', name: 'Classic Wedding', slug: 'classic-wedding', category: 'wedding', previewImage: '/templates/wedding-01.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: '|| Shubh Vivah ||', event: 'Wedding Ceremony', date: 'Sunday, 15 December 2026' }},
  { _id: 'w2', name: 'Bengal Terracotta', slug: 'bengal-terracotta', category: 'wedding', previewImage: '/templates/wedding-02.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: '|| Shubh Vivah ||', event: 'Wedding Celebration', date: '15 December 2026' }},
  { _id: 'w3', name: 'Pastel Bliss', slug: 'pastel-bliss', category: 'wedding', previewImage: '/templates/wedding-03.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'You are invited', event: 'Wedding Celebration', date: 'December 15, 2026' }},
  { _id: 'w4', name: 'Floral Mandap', slug: 'floral-mandap', category: 'wedding', previewImage: '/templates/wedding-04.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: '॥ शुभ विवाह ॥', event: 'विवाह समारोह', date: '१५ दिसंबर २०२६' }},
  { _id: 'w5', name: 'Royal Maharaja', slug: 'royal-maharaja', category: 'wedding', previewImage: '/templates/wedding-05.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '॥ शाही विवाह ॥', event: 'शाही विवाह', date: '१२ दिसंबर २०२६' }},
  { _id: 'w6', name: 'Royal Blue Palace', slug: 'royal-blue-palace', category: 'wedding', previewImage: '/templates/wedding-06.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '|| Shubh Vivah ||', event: 'Royal Wedding', date: 'Sunday, 20 December 2026' }},
  { _id: 'w7', name: 'South Indian Kalyanam', slug: 'south-indian-kalyanam', category: 'wedding', previewImage: '/templates/wedding-07.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '|| Shubh Vivah ||', event: 'Wedding Ceremony', date: 'Sunday, 10 January 2026' }},
  { _id: 'w8', name: 'Punjabi Dholki', slug: 'punjabi-dholki', category: 'wedding', previewImage: '/templates/wedding-08.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: '॥ शुभ विवाह ॥', event: 'पंजाबी विवाह', date: '१३ अप्रैल २०२६' }},
  { _id: 'w9', name: 'Christian Vows', slug: 'christian-vows', category: 'wedding', previewImage: '/templates/wedding-09.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'Holy Matrimony', event: 'Wedding Ceremony', date: 'Saturday, 25 December 2026' }},
  { _id: 'w10', name: 'Beach Wedding', slug: 'beach-wedding', category: 'wedding', previewImage: '/templates/wedding-10.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'peacock-teal', sampleText: { blessing: 'Seaside Vows', event: 'Beach Wedding', date: 'Sunday, 10 January 2026' }},
  { _id: 'w11', name: 'Mughal Garden', slug: 'mughal-garden', category: 'wedding', previewImage: '/templates/wedding-11.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: '|| Shubh Vivah ||', event: 'Royal Wedding', date: 'Sunday, 22 February 2026' }},
  { _id: 'w12', name: 'Temple Kalyanam', slug: 'temple-kalyanam', category: 'wedding', previewImage: '/templates/wedding-12.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '|| Kalyanam ||', event: 'Wedding Ceremony', date: 'Sunday, 8 March 2026' }},
  { _id: 'w13', name: 'Golden Anniversary', slug: 'golden-anniversary', category: 'wedding', previewImage: '/templates/anniversary-01.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '25 Years of Love', event: 'Anniversary Celebration', date: 'Sunday, 15 November 2026' }},
  { _id: 'w14', name: 'Silver Anniversary', slug: 'silver-anniversary', category: 'wedding', previewImage: '/templates/anniversary-02.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'Celebrating Love', event: 'Wedding Anniversary', date: 'Sunday, 15 November 2026' }},
  { _id: 'w15', name: 'Valentine Vows', slug: 'valentine-vows', category: 'wedding', previewImage: '/templates/valentine-01.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'Be My Forever', event: 'Wedding Ceremony', date: 'Saturday, 14 February 2026' }},

  // ========== ENGAGEMENT (7 unique) ==========
  { _id: 'e1', name: 'Save the Date', slug: 'save-the-date', category: 'engagement', previewImage: '/templates/engagement-01.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: 'Save the Date', event: 'Engagement', date: '15 December 2026' }},
  { _id: 'e2', name: 'Rose & Ring', slug: 'rose-ring', category: 'engagement', previewImage: '/templates/engagement-02.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'Roses & Rings', event: 'Engagement', date: '5 February 2026' }},
  { _id: 'e3', name: 'Peacock Promise', slug: 'peacock-promise', category: 'engagement', previewImage: '/templates/engagement-03.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'peacock-teal', sampleText: { blessing: '॥ शुभ सगाई ॥', event: 'सगाई समारोह', date: '१४ फरवरी २०२६' }},
  { _id: 'e4', name: 'Blush Ring Ceremony', slug: 'blush-ring-ceremony', category: 'engagement', previewImage: '/templates/engagement-04.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'Ring Ceremony', event: 'Engagement', date: 'Saturday, 14 February 2026' }},
  { _id: 'e5', name: 'Romantic Ring Ceremony', slug: 'romantic-ring-ceremony', category: 'engagement', previewImage: '/templates/engagement-05.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'Engagement', event: 'Ring Ceremony', date: 'Saturday, 21 February 2026' }},
  { _id: 'e6', name: 'Elegant Engagement', slug: 'elegant-engagement', category: 'engagement', previewImage: '/templates/tpl-engagement.jpg', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: 'Save the Date', event: 'Engagement Ceremony', date: 'Sunday, 1 March 2026' }},
  { _id: 'e7', name: 'Grand Engagement', slug: 'grand-engagement', category: 'engagement', previewImage: '/templates/engagement-06.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: '॥ शुभ सगाई ॥', event: 'सगाई समारोह', date: '१५ मार्च २०२६' }},

  // ========== HALDI (8 unique) ==========
  { _id: 'h1', name: 'Haldi Sohala', slug: 'haldi-sohala', category: 'haldi', previewImage: '/templates/haldi-01.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '॥ हल्दी समारोह ॥', event: 'हल्दी', date: '१२ फरवरी २०२६' }},
  { _id: 'h2', name: 'Marigold Havan', slug: 'marigold-havan', category: 'haldi', previewImage: '/templates/haldi-02.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '|| Haldi Ceremony ||', event: 'Haldi', date: '12 February 2026' }},
  { _id: 'h3', name: 'Turmeric Uruli', slug: 'turmeric-uruli', category: 'haldi', previewImage: '/templates/haldi-03.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '॥ हल्दी रसम ॥', event: 'हल्दी समारोह', date: '१२ फरवरी २०२६' }},
  { _id: 'h4', name: 'Rustic Haldi', slug: 'rustic-haldi', category: 'haldi', previewImage: '/templates/haldi-04.png', language: 'marathi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '॥ हळदी समारंभ ॥', event: 'हळदी', date: '१२ फेब्रुवारी २०२६' }},
  { _id: 'h5', name: 'Golden Haldi', slug: 'golden-haldi', category: 'haldi', previewImage: '/templates/haldi-05.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '॥ हल्दी समारोह ॥', event: 'हल्दी', date: '१३ फरवरी २०२६' }},
  { _id: 'h6', name: 'South Indian Haldi', slug: 'south-indian-haldi', category: 'haldi', previewImage: '/templates/haldi-06.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '|| Haldi Ceremony ||', event: 'Haldi', date: '13 February 2026' }},
  { _id: 'h7', name: 'Playful Haldi', slug: 'playful-haldi', category: 'haldi', previewImage: '/templates/haldi-07.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '॥ हल्दी की रस्म ॥', event: 'हल्दी समारोह', date: '१४ फरवरी २०२६' }},
  { _id: 'h8', name: 'Traditional Haldi', slug: 'traditional-haldi', category: 'haldi', previewImage: '/templates/haldi-08.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '॥ शुभ हल्दी ॥', event: 'हल्दी समारोह', date: '१५ फरवरी २०२६' }},

  // ========== MEHNDI (8 unique) ==========
  { _id: 'm1', name: 'Mehndi Magic', slug: 'mehndi-magic', category: 'mehndi', previewImage: '/templates/mehndi-01.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: '॥ मेहँदी रचाओ ॥', event: 'मेहँदी समारोह', date: '११ फरवरी २०२६' }},
  { _id: 'm2', name: 'Henna Nights', slug: 'henna-nights', category: 'mehndi', previewImage: '/templates/mehndi-02.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: 'Mehndi Night', event: 'Mehndi Ceremony', date: 'Wednesday, 11 February 2026' }},
  { _id: 'm3', name: 'Royal Mehndi', slug: 'royal-mehndi', category: 'mehndi', previewImage: '/templates/mehndi-03.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '॥ मेहँदी की रात ॥', event: 'मेहँदी समारोह', date: '११ फरवरी २०२६' }},
  { _id: 'm4', name: 'Elegant Henna', slug: 'elegant-henna', category: 'mehndi', previewImage: '/templates/mehndi-04.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: '॥ मेहँदी समारोह ॥', event: 'मेहँदी की रात', date: '१० फरवरी २०२६' }},
  { _id: 'm5', name: 'Rich Henna', slug: 'rich-henna', category: 'mehndi', previewImage: '/templates/mehndi-05.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: '॥ मेहँदी रचाओ ॥', event: 'मेहँदी समारोह', date: '१० फरवरी २०२६' }},
  { _id: 'm6', name: 'Green Vines Mehndi', slug: 'green-vines-mehndi', category: 'mehndi', previewImage: '/templates/mehndi-06.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'peacock-teal', sampleText: { blessing: 'Mehndi Night', event: 'Henna Ceremony', date: 'Tuesday, 10 February 2026' }},
  { _id: 'm7', name: 'Royal Mandala Mehndi', slug: 'royal-mandala-mehndi', category: 'mehndi', previewImage: '/templates/mehndi-07.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '॥ शुभ मेहँदी ॥', event: 'मेहँदी समारोह', date: '११ फरवरी २०२६' }},
  { _id: 'm8', name: 'Whimsical Mehndi', slug: 'whimsical-mehndi', category: 'mehndi', previewImage: '/templates/mehndi-08.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'Mehndi Night', event: 'Mehndi Celebration', date: 'Wednesday, 11 February 2026' }},

  // ========== SANGEET (8 unique) ==========
  { _id: 's1', name: 'Sangeet Dhamaka', slug: 'sangeet-dhamaka', category: 'sangeet', previewImage: '/templates/sangeet-01.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: 'संगीत की शाम', event: 'संगीत समारोह', date: '१३ फरवरी २०२६' }},
  { _id: 's2', name: 'Musical Night', slug: 'musical-night', category: 'sangeet', previewImage: '/templates/sangeet-02.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: 'Musical Evening', event: 'Sangeet Night', date: '13 February 2026' }},
  { _id: 's3', name: 'Disco Sangeet', slug: 'disco-sangeet', category: 'sangeet', previewImage: '/templates/sangeet-03.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'peacock-teal', sampleText: { blessing: 'Dance Tonight', event: 'Sangeet Night', date: '13 February 2026' }},
  { _id: 's4', name: 'Vibrant Sangeet', slug: 'vibrant-sangeet', category: 'sangeet', previewImage: '/templates/sangeet-04.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: 'Sangeet Night', event: 'Musical Evening', date: 'Friday, 13 February 2026' }},
  { _id: 's5', name: 'Glamorous Sangeet', slug: 'glamorous-sangeet', category: 'sangeet', previewImage: '/templates/sangeet-05.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: 'संगीत की रात', event: 'संगीत समारोह', date: '१३ फरवरी २०२६' }},
  { _id: 's6', name: 'Colorful Dandiya', slug: 'colorful-dandiya', category: 'sangeet', previewImage: '/templates/sangeet-06.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'peacock-teal', sampleText: { blessing: '॥ जय माता दी ॥', event: 'डांडिया नाइट', date: '३ अक्टूबर २०२६' }},
  { _id: 's7', name: 'Elegant Sangeet', slug: 'elegant-sangeet', category: 'sangeet', previewImage: '/templates/sangeet-07.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: 'Musical Evening', event: 'Sangeet Ceremony', date: 'Friday, 13 February 2026' }},
  { _id: 's8', name: 'Disco Ball Sangeet', slug: 'disco-ball-sangeet', category: 'sangeet', previewImage: '/templates/sangeet-08.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'Dance Night', event: 'Sangeet Party', date: 'Friday, 13 February 2026' }},

  // ========== RECEPTION (8 unique) ==========
  { _id: 'r1', name: 'Grand Reception', slug: 'grand-reception', category: 'reception', previewImage: '/templates/reception-01.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: 'Reception', event: 'Wedding Reception', date: 'Saturday, 20 February 2026' }},
  { _id: 'r2', name: 'Cocktail Night', slug: 'cocktail-night', category: 'reception', previewImage: '/templates/reception-02.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: 'Cocktails & Cheers', event: 'Wedding Reception', date: '20 February 2026' }},
  { _id: 'r3', name: 'Dinner Reception', slug: 'dinner-reception', category: 'reception', previewImage: '/templates/reception-03.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: 'Evening Gala', event: 'Reception Night', date: '20 February 2026' }},
  { _id: 'r4', name: 'Ballroom Reception', slug: 'ballroom-reception', category: 'reception', previewImage: '/templates/reception-04.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: 'Grand Reception', event: 'Wedding Reception', date: 'Saturday, 21 February 2026' }},
  { _id: 'r5', name: 'Modern Banquet', slug: 'modern-banquet', category: 'reception', previewImage: '/templates/reception-05.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'Reception', event: 'Wedding Reception', date: 'Saturday, 21 February 2026' }},
  { _id: 'r6', name: 'Palace Reception', slug: 'palace-reception', category: 'reception', previewImage: '/templates/reception-06.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: 'Royal Reception', event: 'Wedding Reception', date: 'Sunday, 22 February 2026' }},
  { _id: 'r7', name: 'Black Tie Reception', slug: 'black-tie-reception', category: 'reception', previewImage: '/templates/reception-07.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: 'Evening Reception', event: 'Wedding Reception', date: 'Saturday, 22 February 2026' }},
  { _id: 'r8', name: 'Garden Reception', slug: 'garden-reception', category: 'reception', previewImage: '/templates/reception-08.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'Sunset Reception', event: 'Wedding Reception', date: 'Sunday, 22 February 2026' }},

  // ========== GANPATI (10 unique) ==========
  // _id prefix is 'gp' because the generated catalogue already owns 'g<n>'.
  { _id: 'gp1', name: 'Golden Makhar', slug: 'golden-makhar', category: 'ganpati', previewImage: '/templates/ganpati-01.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'soft-brown', sampleText: { blessing: '॥ श्री गणेशाय नमः ॥', event: 'गणेश चतुर्थी', date: '१४ सितंबर २०२६' }},
  { _id: 'gp2', name: 'Chandrakant Bappa', slug: 'chandrakant-bappa', category: 'ganpati', previewImage: '/templates/ganpati-02.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'soft-brown', sampleText: { blessing: '॥ गणपति बाप्पा मोरया ॥', event: 'गणेश चतुर्थी', date: '१४ सितंबर २०२६' }},
  { _id: 'gp3', name: 'Shubh Aagman', slug: 'shubh-aagman', category: 'ganpati', previewImage: '/templates/ganpati-03.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'antique-gold', sampleText: { blessing: '॥ शुभ आगमन ॥', event: 'गणेश चतुर्थी', date: '१४ सितंबर २०२६' }},
  { _id: 'gp4', name: 'Dhol Tasha', slug: 'dhol-tasha', category: 'ganpati', previewImage: '/templates/ganpati-04.png', language: 'marathi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'deep-burgundy', sampleText: { blessing: '॥ गणपति बाप्पा मोरया ॥', event: 'गणेश उत्सव', date: '१४ सप्टेंबर २०२६' }},
  { _id: 'gp5', name: 'Modak Bhog', slug: 'modak-bhog', category: 'ganpati', previewImage: '/templates/ganpati-05.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'antique-gold', sampleText: { blessing: '॥ मोदक प्रिय ॥', event: 'गणेश चतुर्थी', date: '१४ सितंबर २०२६' }},
  { _id: 'gp6', name: 'Marigold Bappa', slug: 'marigold-bappa', category: 'ganpati', previewImage: '/templates/ganpati-06.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'soft-brown', sampleText: { blessing: '॥ श्री गणेशाय नमः ॥', event: 'गणेश चतुर्थी', date: '१४ सितंबर २०२६' }},
  { _id: 'gp7', name: 'Ocean Bappa', slug: 'ocean-bappa', category: 'ganpati', previewImage: '/templates/ganpati-07.png', language: 'marathi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'soft-brown', sampleText: { blessing: '॥ गणपती बाप्पा मोरया ॥', event: 'गणेशोत्सव', date: '१४ सप्टेंबर २०२६' }},
  { _id: 'gp8', name: 'Puneri Bappa', slug: 'puneri-bappa', category: 'ganpati', previewImage: '/templates/ganpati-08.png', language: 'marathi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'deep-burgundy', sampleText: { blessing: '॥ श्री गणेशाय नमः ॥', event: 'गणेशोत्सव', date: '१४ सप्टेंबर २०२६' }},
  { _id: 'gp10', name: 'Rose Ganesha', slug: 'rose-ganesha', category: 'ganpati', previewImage: '/templates/tpl-ganpati-2.jpg', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'soft-brown', sampleText: { blessing: '॥ गणपति बाप्पा मोरया ॥', event: 'गणेश उत्सव', date: '१४ सितंबर २०२६' }},
  { _id: 'gp11', name: 'Joyful Bappa', slug: 'joyful-bappa', category: 'ganpati', previewImage: '/templates/ganpati-09.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'antique-gold', sampleText: { blessing: '॥ गणपति बाप्पा मोरया ॥', event: 'गणेश चतुर्थी', date: '१४ सितंबर २०२६' }},

  // ========== NAVRATRI (6 unique) ==========
  { _id: 'n1', name: 'Garba Raatri', slug: 'garba-raatri', category: 'navratri', previewImage: '/templates/navratri-01.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: '॥ जय माता दी ॥', event: 'नवरात्रि गरबा', date: '३ अक्टूबर २०२६' }},
  { _id: 'n2', name: 'Mirror Work Garba', slug: 'mirror-work-garba', category: 'navratri', previewImage: '/templates/navratri-02.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'peacock-teal', sampleText: { blessing: '॥ जय माता दी ॥', event: 'नवरात्रि गरबा', date: '३ अक्टूबर २०२६' }},
  { _id: 'n3', name: 'Maa Durga Garba', slug: 'maa-durga-garba', category: 'navratri', previewImage: '/templates/navratri-03.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '॥ जय माता दी ॥', event: 'नवरात्रि गरबा नाइट', date: '३ अक्टूबर २०२६' }},
  { _id: 'n4', name: 'Dandiya Night', slug: 'dandiya-night', category: 'navratri', previewImage: '/templates/navratri-04.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: 'Dandiya Dhamaka', event: 'Navratri Dandiya', date: 'Friday, 2 October 2026' }},
  { _id: 'n5', name: 'Chaniya Choli', slug: 'chaniya-choli', category: 'navratri', previewImage: '/templates/navratri-05.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: '॥ जय माता दी ॥', event: 'नवरात्रि महोत्सव', date: '३ अक्टूबर २०२६' }},
  { _id: 'n6', name: 'Vijayadashami', slug: 'vijayadashami', category: 'navratri', previewImage: '/templates/dussehra-01.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: '॥ जय श्री राम ॥', event: 'विजयादशमी', date: '२४ अक्टूबर २०२६' }},

  // ========== DURGA PUJA (4 unique) ==========
  { _id: 'd2', name: 'Mahalaya', slug: 'mahalaya', category: 'durga-puja', previewImage: '/templates/durgapuja-02.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '॥ शुभ महालय ॥', event: 'दुर्गा पूजा', date: '३० सितंबर २०२६' }},
  { _id: 'd3', name: 'Warrior Durga', slug: 'warrior-durga', category: 'durga-puja', previewImage: '/templates/durgapuja-03.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '॥ दुर्गा माता की जय ॥', event: 'दुर्गा पूजा', date: '९ अक्टूबर २०२६' }},
  { _id: 'd4', name: 'Moonlit Durga', slug: 'moonlit-durga', category: 'durga-puja', previewImage: '/templates/durgapuja-04.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '॥ जय माँ दुर्गे ॥', event: 'दुर्गा पूजा', date: '८ अक्टूबर २०२६' }},
  { _id: 'd5', name: 'Vibrant Durga Puja', slug: 'vibrant-durga-puja', category: 'durga-puja', previewImage: '/templates/durgapuja-05.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: '॥ दुर्गा माता की जय ॥', event: 'दुर्गा पूजा महोत्सव', date: '९ अक्टूबर २०२६' }},

  // ========== DIWALI (4 unique) ==========
  { _id: 'di2', name: 'Deep Utsav', slug: 'deep-utsav', category: 'diwali', previewImage: '/templates/diwali-01.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '॥ दीपोत्सव ॥', event: 'दीवाली पार्टी', date: '४ नवंबर २०२६' }},
  { _id: 'di3', name: 'Laxmi Puja', slug: 'laxmi-puja', category: 'diwali', previewImage: '/templates/diwali-02.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '॥ महालक्ष्मी ॥', event: 'लक्ष्मी पूजा', date: '४ नवंबर २०२६' }},
  { _id: 'di4', name: 'Fireworks Diwali', slug: 'fireworks-diwali', category: 'diwali', previewImage: '/templates/diwali-03.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: '॥ शुभ दीपावली ॥', event: 'दीवाली महोत्सव', date: '४ नवंबर २०२६' }},
  { _id: 'di5', name: 'Floral Rangoli', slug: 'floral-rangoli', category: 'diwali', previewImage: '/templates/diwali-04.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: '॥ लक्ष्मी पूजन ॥', event: 'दीवाली', date: '४ नवंबर २०२६' }},

  // ========== HOLI (4 unique) ==========
  { _id: 'ho1', name: 'Holi Festival', slug: 'holi-festival', category: 'holi', previewImage: '/templates/holi-01.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: '॥ होली है! ॥', event: 'होली', date: '१४ मार्च २०२६' }},
  { _id: 'ho2', name: 'Rang Barse', slug: 'rang-barse', category: 'holi', previewImage: '/templates/holi-02.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'राधा कृष्ण रंग में', event: 'होली मिलन', date: '१४ मार्च २०२६' }},
  { _id: 'ho3', name: 'Color Blast Holi', slug: 'color-blast-holi', category: 'holi', previewImage: '/templates/holi-03.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'peacock-teal', sampleText: { blessing: 'Holi Hai!', event: 'Holi Party', date: 'Saturday, 14 March 2026' }},
  { _id: 'ho4', name: 'Pastel Holi', slug: 'pastel-holi', category: 'holi', previewImage: '/templates/holi-04.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: '॥ राधे कृष्ण ॥', event: 'होली उत्सव', date: '१४ मार्च २०२६' }},

  // ========== JANMASHTAMI (4 unique) ==========
  { _id: 'j2', name: 'Bal Gopal', slug: 'bal-gopal', category: 'janmashtami', previewImage: '/templates/janmashtami-01.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'peacock-teal', sampleText: { blessing: 'राधे राधे', event: 'जन्माष्टमी', date: '२४ अगस्त २०२६' }},
  { _id: 'j3', name: 'Krishna Jhula', slug: 'krishna-jhula', category: 'janmashtami', previewImage: '/templates/janmashtami-02.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'peacock-teal', sampleText: { blessing: '॥ राधे कृष्ण ॥', event: 'कृष्ण झूला', date: '२४ अगस्त २०२६' }},
  { _id: 'j4', name: 'Midnight Krishna', slug: 'midnight-krishna', category: 'janmashtami', previewImage: '/templates/janmashtami-03.png', language: 'hindi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'ivory-cream', sampleText: { blessing: '॥ हरे कृष्ण हरे राम ॥', event: 'श्री कृष्ण जन्माष्टमी', date: '२४ अगस्त २०२६' }},
  { _id: 'j5', name: 'Dahi Handi', slug: 'dahi-handi', category: 'janmashtami', previewImage: '/templates/janmashtami-04.png', language: 'marathi', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'peacock-teal', sampleText: { blessing: 'आला रे आला!', event: 'दहीहंडी', date: '२४ ऑगस्ट २०२६' }},

  // ========== BIRTHDAYS (14 unique) ==========
  { _id: 'b1', name: 'Our Little One', slug: 'our-little-one', category: 'birthday', previewImage: '/templates/tpl-birthday-1.jpg', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'You are invited!', event: 'Birthday Celebration', date: 'Saturday, 20 March 2026' }},
  { _id: 'b2', name: 'First Birthday', slug: 'first-birthday', category: 'birthday', previewImage: '/templates/birthday-01.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'Turning One', event: 'First Birthday', date: '20 March 2026' }},
  { _id: 'b3', name: 'Starlit Blue', slug: 'starlit-blue', category: 'birthday', previewImage: '/templates/birthday-02.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'peacock-teal', sampleText: { blessing: 'Under the stars', event: 'Birthday Party', date: '20 March 2026' }},
  { _id: 'b4', name: 'Blush Balloons', slug: 'blush-balloons', category: 'birthday', previewImage: '/templates/birthday-03.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'Balloons & Fun', event: 'Birthday Bash', date: 'March 20, 2026' }},
  { _id: 'b5', name: 'Superhero Party', slug: 'superhero-party', category: 'birthday', previewImage: '/templates/birthday-04.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'royal-maroon', sampleText: { blessing: 'Calling All Heroes', event: 'Superhero Birthday', date: '21 March 2026' }},
  { _id: 'b6', name: 'Princess Theme', slug: 'princess-theme', category: 'birthday', previewImage: '/templates/birthday-05.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'A Royal Celebration', event: 'Princess Birthday', date: 'Sunday, 21 March 2026' }},
  { _id: 'b7', name: 'Jungle Safari', slug: 'jungle-safari', category: 'birthday', previewImage: '/templates/birthday-06.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: 'Wild One!', event: 'First Birthday', date: '20 March 2026' }},
  { _id: 'b8', name: 'Teen Vibes', slug: 'teen-vibes', category: 'birthday', previewImage: '/templates/birthday-07.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'peacock-teal', sampleText: { blessing: 'Party Time!', event: 'Birthday Bash', date: '21 March 2026' }},
  { _id: 'b9', name: 'Black & Gold', slug: 'black-gold', category: 'birthday', previewImage: '/templates/birthday-08.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'gold-leaf', sampleText: { blessing: 'Cheers to You!', event: 'Birthday Party', date: 'Saturday, 21 March 2026' }},
  { _id: 'b10', name: 'Baby Shower Bliss', slug: 'baby-shower-bliss', category: 'birthday', previewImage: '/templates/baby-shower-01.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'A Little One is on the Way', event: 'Baby Shower', date: 'Saturday, 10 April 2026' }},
  { _id: 'b11', name: 'Baby Elephant', slug: 'baby-elephant', category: 'birthday', previewImage: '/templates/baby-shower-02.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'Welcome Little One', event: 'Baby Shower', date: '10 April 2026' }},
  { _id: 'b12', name: 'Mint Baby Shower', slug: 'mint-baby-shower', category: 'birthday', previewImage: '/templates/baby-shower-03.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'peacock-teal', sampleText: { blessing: 'Baby on Board', event: 'Baby Shower', date: '10 April 2026' }},
  { _id: 'b13', name: 'Pink Baby Girl', slug: 'pink-baby-girl', category: 'birthday', previewImage: '/templates/baby-shower-04.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: "It's a Girl!", event: 'Baby Shower', date: '10 April 2026' }},
  { _id: 'b14', name: 'Baby Announcement', slug: 'baby-announcement', category: 'birthday', previewImage: '/templates/baby-announcement-01.png', language: 'english', hasVideo: true, price: 49, videoPrice: 99, recommendedColor: 'rose-blush', sampleText: { blessing: 'Welcome Baby', event: 'Birth Announcement', date: 'April 2026' }},
];

export const TEMPLATES = [...BASE_TEMPLATES, ...GENERATED_TEMPLATES];

const BASE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'wedding', label: 'Weddings' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'haldi', label: 'Haldi' },
  { id: 'mehndi', label: 'Mehndi' },
  { id: 'sangeet', label: 'Sangeet' },
  { id: 'reception', label: 'Reception' },
  { id: 'ganpati', label: 'Ganpati' },
  { id: 'navratri', label: 'Navratri' },
  { id: 'durga-puja', label: 'Durga Puja' },
  { id: 'diwali', label: 'Diwali' },
  { id: 'holi', label: 'Holi' },
  { id: 'janmashtami', label: 'Janmashtami' },
  { id: 'birthday', label: 'Birthdays' },
];

// Occasions that only exist in the generated catalogue are appended, so the
// filter bar stays in sync with whatever genArt.cjs produced.
const BASE_IDS = new Set(BASE_CATEGORIES.map((c) => c.id));
export const CATEGORIES = [
  ...BASE_CATEGORIES,
  ...GENERATED_CATEGORIES.filter((c) => !BASE_IDS.has(c.id)),
];

// Occasion families — the level above individual occasions in the filter bar.
// With 650+ designs a shopper picks a family first, then the exact occasion.
export const CATEGORY_GROUPS = [
  { id: 'popular', label: 'All designs', allLabel: 'All Templates', ids: [] },
  {
    id: 'wedding', label: 'Wedding functions', allLabel: 'All wedding functions',
    ids: ['wedding', 'engagement', 'haldi', 'mehndi', 'sangeet', 'reception', 'anniversary'],
  },
  {
    id: 'festivals', label: 'Festivals', allLabel: 'All festivals',
    ids: ['ganpati', 'navratri', 'durga-puja', 'diwali', 'holi', 'janmashtami', 'dussehra', 'maha-shivratri',
      'ram-navami', 'makar-sankranti', 'pongal', 'onam', 'vaisakhi', 'gudi-padwa', 'saraswati-puja',
      'bhai-dooj', 'chhath', 'karva-chauth', 'teej', 'dhanteras', 'raksha-bandhan', 'buddha-purnima',
      'mahavir-jayanti', 'paryushan', 'eid-ul-fitr', 'eid-ul-adha', 'muharram', 'milad-un-nabi',
      'christmas', 'easter', 'good-friday', 'gurpurab', 'new-year'],
  },
  {
    id: 'family', label: 'Family functions', allLabel: 'All family functions',
    ids: ['birthday', 'baby-shower', 'baby-announcement', 'naamkaran', 'annaprashan', 'mundan',
      'thread-ceremony', 'satyanarayan', 'griha-pravesh'],
  },
  { id: 'work', label: 'Work & college', allLabel: 'Work & college events', ids: ['retirement', 'farewell'] },
];

// A family tab means *every* occasion in it, so the selection carries a
// "group:<id>" value instead of silently narrowing to one occasion.
export const getGroup = (value: string) => (
  typeof value === 'string' && value.startsWith('group:')
    ? CATEGORY_GROUPS.find((g) => g.id === value.slice('group:'.length)) || null
    : null
);

export const getGroupIds = (value: string) => {
  const group = getGroup(value);
  return group ? group.ids : null;
};

export const LANGUAGES = [
  { id: 'all', label: 'All Languages' },
  { id: 'english', label: 'English' },
  { id: 'hindi', label: 'हिंदी' },
  { id: 'marathi', label: 'मराठी' },
];

export const PRICING = {
  image: 49,
  videoBundle: 99,
};
