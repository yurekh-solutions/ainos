/**
 * genTemplates2.cjs — Generate 2000+ invitation template entries.
 * Scans /public/templates/art/*.svg and /public/templates/*.{png,jpg}
 * then distributes them across all occasion categories with unique names.
 *
 * Usage:  node scripts/genTemplates2.cjs
 * Output: src/data/invitations/templatesExpanded.ts
 */
const fs = require("fs");
const path = require("path");

const ART_DIR = path.join(__dirname, "..", "public", "templates", "art");
const IMG_DIR = path.join(__dirname, "..", "public", "templates");
const OUT_FILE = path.join(__dirname, "..", "src", "data", "invitations", "templatesExpanded.ts");

// ── Collect image files ──
const artFiles = fs.readdirSync(ART_DIR).filter((f) => f.endsWith(".svg")).sort();
const imgFiles = fs.readdirSync(IMG_DIR)
  .filter((f) => /\.(png|jpg)$/i.test(f) && !f.startsWith("tpl-"))
  .sort();

console.log(`Found ${artFiles.length} art SVGs, ${imgFiles.length} base images`);

// ── Category definitions with target counts ──
const CATEGORIES = [
  // Wedding functions
  { id: "wedding", count: 200, lang: "english", color: "royal-maroon" },
  { id: "engagement", count: 80, lang: "english", color: "rani-pink" },
  { id: "haldi", count: 80, lang: "hindi", color: "gold-leaf" },
  { id: "mehndi", count: 80, lang: "hindi", color: "emerald" },
  { id: "sangeet", count: 80, lang: "english", color: "magenta" },
  { id: "reception", count: 80, lang: "english", color: "peacock-teal" },
  { id: "anniversary", count: 40, lang: "english", color: "gold-leaf" },
  // Hindu festivals
  { id: "ganpati", count: 80, lang: "hindi", color: "saffron" },
  { id: "navratri", count: 60, lang: "hindi", color: "royal-maroon" },
  { id: "diwali", count: 80, lang: "hindi", color: "gold-leaf" },
  { id: "holi", count: 50, lang: "hindi", color: "royal-maroon" },
  { id: "janmashtami", count: 40, lang: "hindi", color: "peacock-teal" },
  { id: "durga-puja", count: 50, lang: "hindi", color: "gold-leaf" },
  { id: "dussehra", count: 30, lang: "hindi", color: "royal-maroon" },
  { id: "chhath", count: 30, lang: "hindi", color: "saffron" },
  { id: "raksha-bandhan", count: 30, lang: "hindi", color: "rani-pink" },
  { id: "karva-chauth", count: 30, lang: "hindi", color: "royal-maroon" },
  { id: "dhanteras", count: 25, lang: "hindi", color: "gold-leaf" },
  { id: "teej", count: 20, lang: "hindi", color: "emerald" },
  { id: "bhai-dooj", count: 20, lang: "hindi", color: "gold-leaf" },
  { id: "makar-sankranti", count: 25, lang: "hindi", color: "saffron" },
  // Islamic
  { id: "eid-ul-fitr", count: 80, lang: "english", color: "emerald" },
  { id: "eid-ul-adha", count: 60, lang: "english", color: "emerald" },
  { id: "muharram", count: 40, lang: "english", color: "deep-maroon" },
  { id: "milad-un-nabi", count: 30, lang: "english", color: "emerald" },
  // Jain
  { id: "paryushan", count: 50, lang: "english", color: "forest" },
  { id: "mahavir-jayanti", count: 50, lang: "english", color: "peacock-teal" },
  // Maharashtrian
  { id: "gudi-padwa", count: 40, lang: "marathi", color: "saffron" },
  // Family functions
  { id: "birthday", count: 120, lang: "english", color: "rose-blush" },
  { id: "baby-shower", count: 30, lang: "english", color: "rose-blush" },
  { id: "baby-announcement", count: 20, lang: "english", color: "rose-blush" },
  { id: "naamkaran", count: 20, lang: "hindi", color: "gold-leaf" },
  { id: "annaprashan", count: 20, lang: "hindi", color: "gold-leaf" },
  { id: "mundan", count: 20, lang: "hindi", color: "saffron" },
  { id: "thread-ceremony", count: 15, lang: "hindi", color: "saffron" },
  { id: "satyanarayan", count: 20, lang: "hindi", color: "saffron" },
  { id: "griha-pravesh", count: 20, lang: "hindi", color: "gold-leaf" },
  // Christian / Other
  { id: "christmas", count: 40, lang: "english", color: "royal-maroon" },
  { id: "easter", count: 20, lang: "english", color: "rose-blush" },
  { id: "new-year", count: 30, lang: "english", color: "gold-leaf" },
  { id: "good-friday", count: 10, lang: "english", color: "deep-maroon" },
  // Work / College
  { id: "retirement", count: 15, lang: "english", color: "sky-trust" },
  { id: "farewell", count: 15, lang: "english", color: "peacock-teal" },
  { id: "corporate", count: 30, lang: "english", color: "sky-trust" },
  // Other Hindu
  { id: "ram-navami", count: 25, lang: "hindi", color: "saffron" },
  { id: "saraswati-puja", count: 25, lang: "hindi", color: "rose-blush" },
  { id: "buddha-purnima", count: 15, lang: "english", color: "saffron" },
  { id: "gurpurab", count: 20, lang: "hindi", color: "saffron" },
  { id: "vaisakhi", count: 15, lang: "hindi", color: "saffron" },
  { id: "onam", count: 15, lang: "english", color: "gold-leaf" },
  { id: "pongal", count: 15, lang: "english", color: "gold-leaf" },
  { id: "maha-shivratri", count: 25, lang: "hindi", color: "deep-maroon" },
];

// ── Name generators per category ──
const ADJECTIVES = ["Royal","Elegant","Grand","Vibrant","Classic","Luxe","Divine","Golden","Silver","Radiant","Majestic","Opulent","Serene","Blissful","Regal","Noble","Sacred","Glorious","Supreme","Imperial","Exquisite","Delicate","Enchanted","Ethereal","Celestial","Traditional","Modern","Charming","Graceful","Stunning","Beautiful","Premium","Artistic","Heritage","Timeless","Sparkling","Glowing","Shining","Brilliant","Dazzling"];
const NOUNS = {
  wedding: ["Mandap","Mahal","Palace","Vows","Union","Kalyanam","Vivah","Bandhan","Shaadi","Nikah","Ceremony","Darbar","Mahfil","Shahi","Rishta"],
  engagement: ["Ring","Promise","Sagai","Mangni","Commitment","Bond","Pledge","Roka","Kurmai","Muhurat"],
  haldi: ["Haldi","Turmeric","Pithi","Ubtan","Golden Glow","Marigold","Sunlit","Yellow Bloom","Haldi Glow","Pele Rang"],
  mehndi: ["Mehndi","Henna","Intricate","Pattern","Rangoli","Mandala","Design","Mehndi Raat","Henna Night","Nakhshi"],
  sangeet: ["Sangeet","Musical","Dance","Melody","Rhythm","Beat","Tarana","Raag","Dhun","Garba","Dandiya"],
  reception: ["Reception","Gala","Soiree","Banquet","Celebration","Evening","Dinner","Ballroom","Fete","Gathering"],
  anniversary: ["Anniversary","Years","Milestone","Jubilee","Celebration","Together","Love Story","Safar"],
  ganpati: ["Ganpati","Bappa","Ganesha","Modak","Morya","Vinayaka","Sthapana","Ganesh","Mangalmurti"],
  navratri: ["Navratri","Garba","Dandiya","Navdurga","Aarti","Shakti","Garba Night","Raas","Navratri Utsav"],
  diwali: ["Diwali","Deepak","Rangoli","Laxmi","Diya","Roshni","Deepotsav","Festival of Lights","Patakha"],
  holi: ["Holi","Rang","Colors","Gulal","Brij","Phagun","Holi Milan","Color Splash","Rang Barse"],
  "durga-puja": ["Durga","Mahishasura","Shakti","Pandal","Bhog","Aarti","Devi","Mahalaya","Bodhon"],
  janmashtami: ["Krishna","Gopal","Kanhaiya","Makhan","Govinda","Radhe","Kanha","Janmashtami","Dahi Handi"],
  dussehra: ["Dussehra","Ravan","Ram","Vijayadashami","Sirsa","Shastra","Dharma","Ramlila"],
  chhath: ["Chhath","Surya","Arghya","Prayer","Sun God","Chhath Puja","Thekua"],
  "eid-ul-fitr": ["Eid","Fitr","Meethi Eid","Chand Raat","Eidi","Khushi","Celebration","Mubarak"],
  "eid-ul-adha": ["Eid","Adha","Bakrid","Qurbani","Sacrifice","Eid Mubarak","Hajj","Zil Hajj"],
  muharram: ["Muharram","Tazia","Azadari","Peace","Salaam","Husain","Matam"],
  "milad-un-nabi": ["Milad","Nabi","Prophet","Rabi","Mubarak","Jashn","Siraat"],
  paryushan: ["Paryushan","Kshama","Micchami","Ayambil","Tapasya","Forgiveness","Dharma","Sutra"],
  "mahavir-jayanti": ["Mahavir","Tirthankar","Ahimsa","Keval Gyan","Jain","Bhagwan","24th"],
  "gudi-padwa": ["Gudi Padwa","Ugadi","Chaitra","NavVarsh","Marathi New Year","Samvatsar"],
  birthday: ["Birthday","Party","Celebration","Bash","Fiesta","Blast","Balloons","Confetti","Cake","Bash"],
  "baby-shower": ["Baby Shower","Godh Bharai","Shaadi Se Pehle","Welcome Little One","Nanhi Si"],
  "baby-announcement": ["Baby Announcement","New Arrival","Welcome","Little Star","Bundle of Joy"],
  naamkaran: ["Naamkaran","Naming","First Name","Namkaran Sanskar"],
  annaprashan: ["Annaprashan","First Rice","Annaprashan Sanskar","Rice Ceremony"],
  mundan: ["Mundan","Chudakar","First Haircut","Mundan Sanskar"],
  "thread-ceremony": ["Thread","Janeu","Upanayana","Munj","Sacred Thread"],
  satyanarayan: ["Satyanarayan","Katha","Puja","Vrat","Prasad"],
  "griha-pravesh": ["Griha Pravesh","Housewarming","New Home","Griha Shanti","Naya Ghar"],
  christmas: ["Christmas","Natal","Noel","Xmas","Santa","Nativity","Star of Bethlehem"],
  easter: ["Easter","Resurrection","Lily","Spring","Egg Hunt","Bunny"],
  "new-year": ["New Year","Celebration","Countdown","Resolution","Fresh Start","Naya Saal"],
  "good-friday": ["Good Friday","Cross","Passion","Lent","Sacrifice"],
  retirement: ["Retirement","Farewell","Golden Years","New Chapter","Thank You","Legacy"],
  farewell: ["Farewell","Goodbye","Best Wishes","New Journey","Adieu","Send-Off"],
  corporate: ["Corporate","Business","Conference","Summit","Seminar","Launch","Annual Day","Meet"],
  "raksha-bandhan": ["Rakhi","Raksha Bandhan","Brother-Sister","Thread of Love","Rakhi Bandhan"],
  "karva-chauth": ["Karva Chauth","Moon","Fast","Love","Saubhagyavati","Mehendi"],
  dhanteras: ["Dhanteras","Dhanvantari","Gold","Wealth","Prosperity","Laxmi Puja"],
  teej: ["Teej","Haryali","Hartalika","Swing","Green","Monsoon"],
  "bhai-dooj": ["Bhai Dooj","Bhaiya Dooj","Brother-Sister","Tilak","Aarti"],
  "makar-sankranti": ["Sankranti","Makar","Kite","Tilgul","Uttarayan","Pongal"],
  "ram-navami": ["Ram Navami","Shri Ram","Ayodhya","Raghunandan","Ram Rajya"],
  "saraswati-puja": ["Saraswati","Vidya","Knowledge","Books","Vasant Panchami","Basant"],
  "buddha-purnima": ["Buddha","Enlightenment","Bodh Gaya","Dhamma","Peace","Ahimsa"],
  gurpurab: ["Gurpurab","Sikh","Granth","Khalsa","Waheguru","Guru"],
  vaisakhi: ["Vaisakhi","Baisakhi","Harvest","Khalsa","Punjab","Bhangra"],
  onam: ["Onam","Sadya","Kerala","Pookalam","Vallam","Maveli"],
  pongal: ["Pongal","Tamil","Harvest","Kolam","Surya","Thai"],
  "maha-shivratri": ["Shivratri","Shiva","Trishul","Damru","Mahadev","Bholenath","Om Namah Shivay"],
};

const BLESSINGS = {
  wedding: ["|| Shubh Vivah ||","|| Kalyanam ||","Blessed Union","Sacred Vows","Eternal Bond","Divine Alliance"],
  engagement: ["Save the Date","Ring Ceremony","Promise Night","Forever Begins","Matched Hearts","Sagai Mubarak"],
  haldi: ["|| Haldi ||","Turmeric Blessing","Golden Glow","Haldi Mubarak","Pele Rang","Shubh Haldi"],
  mehndi: ["|| Mehndi ||","Henna Night","Intricate Love","Mehndi Raat","Rangoli Hands","Shubh Mehndi"],
  sangeet: ["Sangeet Night","Musical Evening","Dance & Celebrate","Dhun & Dhol","Raas Raat","Sangeet Mubarak"],
  reception: ["Reception","Grand Evening","Celebration Night","Evening Gala","Royal Reception","Shubh Reception"],
  anniversary: ["Celebrating Love","Years Together","Milestone","Silver Jubilee","Golden Anniversary","Safar-e-Mohabbat"],
  ganpati: ["|| Shri Ganeshay Namah ||","Ganpati Bappa Morya","Mangalmurti","Vinayaka","Ganesh Utsav","Bappa Moraya"],
  navratri: ["|| Jai Mata Di ||","Navratri Mubarak","Garba Night","Dandiya Raas","Shakti Utsav","Aai Navdurge"],
  diwali: ["|| Shubh Deepavali ||","Diwali Mubarak","Festival of Lights","Deepotsav","Laxmi Puja","Roshni ka Tyohaar"],
  holi: ["|| Holi Hai! ||","Rang Barse","Holi Mubarak","Color Festival","Brij Ki Holi","Shubh Holi"],
  "durga-puja": ["|| Jai Ma Durga ||","Durga Puja Mubarak","Shubh Navratri","Ma Ki Kripa","Bodhon","Ashtami Mubarak"],
  janmashtami: ["Radhe Radhe","|| Jai Shri Krishna ||","Janmashtami Mubarak","Gokulashtami","Krishna Janmotsav","Nandotsav"],
  dussehra: ["|| Jai Sri Ram ||","Vijayadashami","Dussehra Mubarak","Ram Navami","Victory of Good","Ravan Vadha"],
  chhath: ["|| Chhath Puja ||","Surya Dev","Arghya","Chhath Mubarak","Prayer to Sun","Dala Chhath"],
  "eid-ul-fitr": ["Eid Mubarak","|| Eid ul-Fitr ||","Khushi ka Din","Meethi Eid","Jashn-e-Eid","Ramadan Ki Khushi"],
  "eid-ul-adha": ["Eid Mubarak","|| Eid ul-Adha ||","Bakrid Mubarak","Qurbani ka Din","Jashn-e-Bakrid","Eid ki Khushiyan"],
  muharram: ["|| Muharram ||","Peace & Harmony","Salaam","Azadari","Muharram Mubarak","Salam-e-Husain"],
  "milad-un-nabi": ["|| Milad-un-Nabi ||","Prophet's Birthday","Jashn-e-Milad","Rabi ul-Awwal","Milad Mubarak","Siraat"],
  paryushan: ["|| Micchami Dukkadam ||","Paryushan Parva","Kshama Prarthna","Ayambil Ols","Forgiveness","Paryushan Mubarak"],
  "mahavir-jayanti": ["|| Jai Jinendra ||","Mahavir Jayanti","24th Tirthankar","Ahimsa Utsav","Keval Gyan","Jai Jinendra"],
  "gudi-padwa": ["|| Gudi Padwa ||","NavVarsh Mubarak","Chaitra Shukla Pratipada","Samvatsar","Hindu New Year","Shubh NavVarsh"],
  birthday: ["You are invited!","Happy Birthday!","Celebration Time","Party Time","Birthday Bash","Cheers to You"],
  "baby-shower": ["Welcome Little One","Baby Shower","Godh Bharai","A Little Star","Nanhi Si Khushi","Shaadi Se Pehle"],
  "baby-announcement": ["Welcome Baby","New Arrival","Bundle of Joy","Our Little Star","Baby is Here","Khushkhabri"],
  naamkaran: ["|| Naamkaran ||","Naming Ceremony","First Name","Blessed Name","Naamkaran Sanskar","Shubh Naamkaran"],
  annaprashan: ["|| Annaprashan ||","First Rice Ceremony","Annaprashan Sanskar","Rice Feeding","Shubh Annaprashan","Anna Prashan"],
  mundan: ["|| Mundan Sanskar ||","First Haircut","Chudakar","Mundan Ceremony","Shubh Mundan","Mundan Sanskar"],
  "thread-ceremony": ["|| Upanayana ||","Sacred Thread","Janeu Ceremony","Munj Sanskar","Thread Ceremony","Yajnopavit"],
  satyanarayan: ["|| Satyanarayan Katha ||","Puja Invitation","Katha Prasadi","Shubh Katha","Satyanarayan Puja","Vrat Katha"],
  "griha-pravesh": ["|| Griha Pravesh ||","New Home Blessing","Housewarming","Griha Shanti","Naya Ghar","Shubh Aarambh"],
  christmas: ["Merry Christmas","|| Noel ||","Joy to the World","Season's Greetings","Christmas Blessings","Glory to God"],
  easter: ["Happy Easter","Resurrection Sunday","He is Risen","Easter Blessings","New Life","Easter Joy"],
  "new-year": ["Happy New Year","Naya Saal Mubarak","New Beginnings","Fresh Start","Countdown","Cheers to New Year"],
  "good-friday": ["Good Friday","Blessed Friday","Sacrifice & Love","Passion of Christ","Holy Friday","Grace"],
  retirement: ["Thank You & Farewell","Golden Years","New Chapter","Well Deserved Rest","Legacy Lives On","Happy Retirement"],
  farewell: ["Farewell & Best Wishes","Good Luck","New Journey","Adieu","Bon Voyage","Miss You"],
  corporate: ["Corporate Event","Business Summit","Annual Day","Conference","Product Launch","Team Meet"],
  "raksha-bandhan": ["|| Raksha Bandhan ||","Rakhi Mubarak","Brother-Sister Bond","Thread of Love","Bhaiya Behen ka Pyaar","Rakhi"],
  "karva-chauth": ["|| Karva Chauth ||","Fast of Love","Moon & Love","Saubhagyavati","Karva Mubarak","Chauth Chand"],
  dhanteras: ["|| Dhanteras ||","Wealth & Prosperity","Gold & Silver","Laxmi Blessings","Dhan Mubarak","Shubh Dhanteras"],
  teej: ["|| Teej ||","Haryali Teej","Monsoon Festival","Swing & Celebrate","Green Teej","Teej Mubarak"],
  "bhai-dooj": ["|| Bhai Dooj ||","Brother-Sister Love","Tilak Ceremony","Bhaiya Mubarak","Dooj ki Khushi","Bhai Dooj"],
  "makar-sankranti": ["|| Makar Sankranti ||","Kite Festival","Tilgul Ghya","Uttarayan","Harvest Festival","Sankranti Mubarak"],
  "ram-navami": ["|| Jai Shri Ram ||","Ram Navami Mubarak","Ayodhya Naresh","Raghunandan","Shri Ram Jai Ram"],
  "saraswati-puja": ["|| Saraswati Vandana ||","Vasant Panchami","Goddess of Knowledge","Vidya Devi","Saraswati Mubarak","Basant"],
  "buddha-purnima": ["|| Buddha Purnima ||","Enlightenment Day","Peace & Compassion","Bodhi Day","Dhamma","Buddha Shanti"],
  gurpurab: ["|| Waheguru Ji Ka Khalsa ||","Gurpurab Mubarak","Guru Blessings","Khalsa Panth","Sikh Utsav","Guru Nanak"],
  vaisakhi: ["|| Vaisakhi Mubarak ||","Harvest Festival","Khalsa Sajna Divas","Bhangra Night","Punjab Da Tyohaar","Vaisakhi"],
  onam: ["|| Onam Mubarak ||","Harvest Festival","Pookalam","Sadya Feast","Maveli Comes","Onam"],
  pongal: ["|| Pongal ||","Tamil Harvest","Kolam","Surya Pongal","Thai Festival","Pongal Mubarak"],
  "maha-shivratri": ["|| Om Namah Shivay ||","Maha Shivratri","Mahadev Ki Kripa","Trishul Dhari","Bholenath","Har Har Mahadev"],
};

const EVENTS = {
  wedding: ["Wedding Ceremony","Grand Wedding","Royal Wedding","Wedding Celebration","Shubh Vivah","Kalyanam"],
  engagement: ["Engagement","Ring Ceremony","Sagai Ceremony","Engagement Night","Promise Ceremony","Roka"],
  haldi: ["Haldi Ceremony","Haldi Function","Pithi Ritual","Turmeric Ceremony","Haldi Ki Rasam","Haldi Utsav"],
  mehndi: ["Mehndi Ceremony","Mehndi Night","Henna Evening","Mehndi Function","Mehndi Ki Raat","Henna Party"],
  sangeet: ["Sangeet Night","Musical Evening","Sangeet Ceremony","Dance Night","Sangeet Sandhya","Sangeet Party"],
  reception: ["Wedding Reception","Reception Night","Grand Reception","Evening Gala","Reception Party","Shubh Reception"],
  anniversary: ["Anniversary Celebration","Wedding Anniversary","Milestone Celebration","Years of Love","Jubilee","Safar-e-Mohabbat"],
  ganpati: ["Ganesh Chaturthi","Ganpati Utsav","Bappa Arrival","Sthapana","Ganeshotsav","Mangalmurti Bappa"],
  navratri: ["Navratri Garba","Navratri Celebration","Garba Night","Dandiya Night","Navratri Utsav","Nine Nights"],
  diwali: ["Diwali Celebration","Diwali Party","Deepotsav","Laxmi Puja","Diwali Milan","Festival of Lights"],
  holi: ["Holi Celebration","Holi Party","Rang Panchami","Holi Milan","Holi Utsav","Color Festival"],
  "durga-puja": ["Durga Puja","Durga Utsav","Puja Pandal","Mahalaya","Ashtami Celebration","Durga Visarjan"],
  janmashtami: ["Janmashtami","Krishna Janmotsav","Gokulashtami","Dahi Handi","Krishna Leela","Janmashtami Utsav"],
  dussehra: ["Dussehra","Vijayadashami","Ramlila","Ravan Dahan","Dussehra Utsav","Victory Celebration"],
  chhath: ["Chhath Puja","Surya Shashti","Chhath Utsav","Dala Chhath","Surya Arghya","Chhath Parva"],
  "eid-ul-fitr": ["Eid ul-Fitr","Meethi Eid","Eid Celebration","Eid Milan","Eid ki Namaz","Eid Party"],
  "eid-ul-adha": ["Eid ul-Adha","Bakrid","Qurbani Eid","Eid Mubarak","Hajj Celebration","Bakrid Milan"],
  muharram: ["Muharram","Muharram Observance","Peace Gathering","Azadari","Muharram Majlis"],
  "milad-un-nabi": ["Milad-un-Nabi","Prophet's Birthday","Milad Celebration","Rabi ul-Awwal","Jashn-e-Milad"],
  paryushan: ["Paryushan Parva","Paryushan","Micchami Dukkadam","Forgiveness Festival","Paryushan Utsav"],
  "mahavir-jayanti": ["Mahavir Jayanti","Tirthankar Jayanti","Ahimsa Utsav","Jain Festival","Keval Gyan Day"],
  "gudi-padwa": ["Gudi Padwa","Ugadi","Marathi New Year","Hindu New Year","Chaitra Pratipada","NavVarsh"],
  birthday: ["Birthday Party","Birthday Bash","Birthday Celebration","Birthday Bash","Birthday Fiesta","Cake Party"],
  "baby-shower": ["Baby Shower","Godh Bharai","Shaadi Se Pehle","Welcome Baby","Nanhi Si Khushi"],
  "baby-announcement": ["Birth Announcement","New Arrival","Welcome Little One","Baby Reveal","Khushkhabri"],
  naamkaran: ["Naamkaran Ceremony","Naming Ceremony","Naamkaran Sanskar","First Name Ceremony"],
  annaprashan: ["Annaprashan","First Rice Ceremony","Annaprashan Sanskar","Rice Feeding Ceremony"],
  mundan: ["Mundan Ceremony","First Haircut","Mundan Sanskar","Chudakar Ceremony"],
  "thread-ceremony": ["Thread Ceremony","Upanayana","Janeu Ceremony","Munj Sanskar","Sacred Thread"],
  satyanarayan: ["Satyanarayan Katha","Satyanarayan Puja","Katha Ceremony","Puja Celebration"],
  "griha-pravesh": ["Griha Pravesh","Housewarming","New Home Entry","Griha Shanti","Griha Pravesh Puja"],
  christmas: ["Christmas Celebration","Christmas Party","Christmas Eve","Nativity","Christmas Gala"],
  easter: ["Easter Sunday","Easter Celebration","Resurrection Day","Easter Party","Easter Joy"],
  "new-year": ["New Year Party","New Year Celebration","New Year Bash","Countdown Party","Naya Saal"],
  "good-friday": ["Good Friday","Good Friday Service","Holy Friday","Passion Observance"],
  retirement: ["Retirement Ceremony","Farewell Function","Golden Send-Off","Retirement Celebration"],
  farewell: ["Farewell Party","Farewell Ceremony","Goodbye Bash","Send-Off","Adieu Party"],
  corporate: ["Corporate Event","Business Conference","Annual Meet","Product Launch","Team Summit","AGM"],
  "raksha-bandhan": ["Raksha Bandhan","Rakhi Ceremony","Brother-Sister Day","Rakhi Bandhan"],
  "karva-chauth": ["Karva Chauth","Karva Chauth Puja","Moonrise Wait","Fast of Love","Karva Purnima"],
  dhanteras: ["Dhanteras","Dhanteras Puja","Wealth Festival","Dhan Puja","Gold Purchase Day"],
  teej: ["Teej","Haryali Teej","Hartalika Teej","Monsoon Festival","Teej Utsav"],
  "bhai-dooj": ["Bhai Dooj","Bhaiya Dooj","Brother-Sister Festival","Tilak Ceremony"],
  "makar-sankranti": ["Makar Sankranti","Kite Festival","Sankranti Celebration","Uttarayan","Tilgul Festival"],
  "ram-navami": ["Ram Navami","Shri Ram Navami","Ram Utsav","Ayodhya Utsav","Raghunandan Utsav"],
  "saraswati-puja": ["Saraswati Puja","Vasant Panchami","Knowledge Festival","Vidya Devi Puja","Basant Utsav"],
  "buddha-purnima": ["Buddha Purnima","Enlightenment Day","Buddha Jayanti","Bodhi Day","Buddha Peace Day"],
  gurpurab: ["Gurpurab","Guru Nanak Gurpurab","Khalsa Day","Guru Blessings Day","Sikh Festival"],
  vaisakhi: ["Vaisakhi","Baisakhi","Khalsa Day","Harvest Festival","Punjab Festival"],
  onam: ["Onam","Onam Celebration","Thiruvonam","Harvest Festival","Kerala Festival"],
  pongal: ["Pongal","Thai Pongal","Tamil Harvest","Pongal Celebration","Harvest Festival"],
  "maha-shivratri": ["Maha Shivratri","Shivratri","Night of Shiva","Mahadev Utsav","Shiva Utsav"],
};

const VENUES = [
  "Grand Ballroom, Taj Mumbai","Shree Mandir Premises, Pune","Community Hall, Sector 15, Noida",
  "Residence, Vasant Vihar, New Delhi","Banquet Lawn, Jaipur","The Leela Palace, New Delhi",
  "Convention Center, Hyderabad","Palace Grounds, Udaipur","Marina Bay, Goa","Temple Hall, Varanasi",
  "Club House, Bangalore","Auditorium, Chennai","Lawn Garden, Lucknow","Heritage Hotel, Jodhpur",
  "Resort, Lonavala","Community Center, Chandigarh","Banquet Hall, Kolkata","Open Ground, Indore",
  "Marriage Hall, Ahmedabad","Convention Hall, Surat","Hotel Grand, Bhopal","Residence, Dadar Mumbai",
  "Palace Banquet, Mysore","Heritage Villa, Pondicherry","Garden Lawn, Coimbatore","Temple Premises, Tirupati",
];

const DATES = [
  "Sunday, 15 November 2026","Saturday, 5 December 2026","Monday, 11 January 2027",
  "Friday, 20 February 2027","Sunday, 8 March 2026","Thursday, 24 September 2026",
  "Saturday, 14 February 2026","Sunday, 15 March 2026","Friday, 3 October 2026",
  "Monday, 4 November 2026","Saturday, 14 March 2026","Wednesday, 24 August 2026",
  "Sunday, 14 September 2026","Friday, 20 January 2027","Saturday, 25 December 2026",
  "Monday, 26 January 2027","Friday, 14 April 2027","Sunday, 5 October 2026",
  "Thursday, 29 October 2026","Saturday, 7 November 2026","Monday, 9 November 2026",
  "Wednesday, 11 March 2026","Friday, 13 March 2026","Sunday, 22 March 2026",
];

const LANGUAGES = ["english","hindi","marathi"];

// ── Helpers ──
let idCounter = 0;
const pick = (arr, i) => arr[i % arr.length];
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function generateEntry(cat, imgPath, idx) {
  idCounter++;
  const adj = pick(ADJECTIVES, idx * 7 + idCounter);
  const nouns = NOUNS[cat.id] || ["Celebration"];
  const noun = pick(nouns, idx * 3 + idCounter);
  const name = `${adj} ${noun}`;
  const blessings = BLESSINGS[cat.id] || ["You are invited"];
  const events = EVENTS[cat.id] || ["Celebration"];
  const lang = pick(LANGUAGES, idx + (cat.lang === "hindi" ? 1 : cat.lang === "marathi" ? 2 : 0));
  const slug = `x-${slugify(cat.id)}-${slugify(name)}-${idCounter}`;

  return {
    _id: `x${idCounter}`,
    name,
    slug,
    category: cat.id,
    previewImage: imgPath,
    language: lang,
    hasVideo: true,
    price: 49,
    videoPrice: 99,
    recommendedColor: cat.color,
    sampleText: {
      blessing: pick(blessings, idx),
      event: pick(events, idx),
      date: pick(DATES, idx * 2 + idCounter),
      venue: pick(VENUES, idx + idCounter),
    },
  };
}

// ── Build all images pool ──
const allImages = [
  ...artFiles.map((f) => `/templates/art/${f}`),
  ...imgFiles.map((f) => `/templates/${f}`),
];
console.log(`Total image pool: ${allImages.length}`);

// ── Generate entries ──
const entries = [];
for (const cat of CATEGORIES) {
  for (let i = 0; i < cat.count; i++) {
    const imgPath = allImages[(entries.length) % allImages.length];
    entries.push(generateEntry(cat, imgPath, i));
  }
}

console.log(`Generated ${entries.length} template entries`);

// ── Build category labels ──
const CATEGORY_LABELS = {
  wedding: "Weddings", engagement: "Engagement", haldi: "Haldi", mehndi: "Mehndi",
  sangeet: "Sangeet", reception: "Reception", anniversary: "Anniversary",
  ganpati: "Ganpati", navratri: "Navratri", diwali: "Diwali", holi: "Holi",
  "janmashtami": "Janmashtami", "durga-puja": "Durga Puja", dussehra: "Dussehra",
  chhath: "Chhath Puja", "raksha-bandhan": "Raksha Bandhan", "karva-chauth": "Karva Chauth",
  dhanteras: "Dhanteras", teej: "Teej", "bhai-dooj": "Bhai Dooj",
  "makar-sankranti": "Sankranti", "maha-shivratri": "Maha Shivratri",
  "eid-ul-fitr": "Eid ul-Fitr", "eid-ul-adha": "Bakrid", muharram: "Muharram",
  "milad-un-nabi": "Milad-un-Nabi", paryushan: "Paryushan", "mahavir-jayanti": "Mahavir Jayanti",
  "gudi-padwa": "Gudi Padwa", birthday: "Birthdays", "baby-shower": "Baby Shower",
  "baby-announcement": "Baby Announcement", naamkaran: "Naamkaran", annaprashan: "Annaprashan",
  mundan: "Mundan", "thread-ceremony": "Thread Ceremony", satyanarayan: "Satyanarayan Puja",
  "griha-pravesh": "Griha Pravesh", christmas: "Christmas", easter: "Easter",
  "new-year": "New Year", "good-friday": "Good Friday",
  retirement: "Retirement", farewell: "Farewell", corporate: "Corporate",
  "ram-navami": "Ram Navami", "saraswati-puja": "Saraswati Puja",
  "buddha-purnima": "Buddha Purnima", gurpurab: "Gurpurab", vaisakhi: "Vaisakhi",
  onam: "Onam", pongal: "Pongal",
};

// ── Write output ──
const lines = [];
lines.push("// Auto-generated by scripts/genTemplates2.cjs — DO NOT EDIT MANUALLY.");
lines.push(`// ${entries.length} invitation templates across ${CATEGORIES.length} categories.`);
lines.push("");
lines.push("export const EXPANDED_TEMPLATES = [");
for (const e of entries) {
  const st = `blessing:${JSON.stringify(e.sampleText.blessing)},event:${JSON.stringify(e.sampleText.event)},date:${JSON.stringify(e.sampleText.date)},venue:${JSON.stringify(e.sampleText.venue)}`;
  lines.push(`  {_id:'${e._id}',name:${JSON.stringify(e.name)},slug:'${e.slug}',category:'${e.category}',previewImage:'${e.previewImage}',language:'${e.language}',hasVideo:true,price:49,videoPrice:99,recommendedColor:'${e.recommendedColor}',sampleText:{${st}}},`);
}
lines.push("];");
lines.push("");
lines.push("export const EXPANDED_CATEGORIES = [");
for (const cat of CATEGORIES) {
  const label = CATEGORY_LABELS[cat.id] || cat.id;
  lines.push(`  {id:"${cat.id}",label:"${label}"},`);
}
lines.push("];");

fs.writeFileSync(OUT_FILE, lines.join("\n"), "utf8");
console.log(`Wrote ${OUT_FILE} (${lines.length} lines)`);
