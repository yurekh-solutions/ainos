// Festival-specific field configurations, colour palettes, typography presets,
// backdrop boards, sample text and utility helpers for the invitation customiser.

/* ------------------------------------------------------------------ */
/*  FESTIVAL FIELDS                                                    */
/* ------------------------------------------------------------------ */
export interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  maxLength: number;
}
export interface FestivalConfig {
  title: string;
  titleHi?: string;
  titleMr?: string;
  fields: FieldDef[];
}

export const FESTIVAL_FIELDS: Record<string, FestivalConfig> = {
  ganpati: {
    title: 'Ganesh Chaturthi',
    fields: [
      { key: 'blessingLine', label: 'Blessing line', placeholder: '|| Shri Ganeshay Namah ||', maxLength: 60 },
      { key: 'hostName', label: "Who's inviting", placeholder: 'Shri & Sau. Deshmukh Family', maxLength: 60 },
      { key: 'message', label: 'Invitation message', placeholder: "warmly invites you to Ganpati Bappa's arrival at our home", maxLength: 160 },
      { key: 'eventName', label: 'Occasion', placeholder: 'Ganesh Chaturthi', maxLength: 60 },
      { key: 'dateLabel', label: 'The word above the date', placeholder: 'Sthapana', maxLength: 60 },
      { key: 'date', label: 'Sthapana date', placeholder: 'Monday, 14 September 2026', maxLength: 60 },
      { key: 'aartiTimes', label: 'Aarti times', placeholder: 'Aarti — 7:00 AM & 7:30 PM daily', maxLength: 160 },
      { key: 'visarjanLabel', label: 'The word above visarjan', placeholder: 'Visarjan', maxLength: 60 },
      { key: 'visarjanDate', label: 'Visarjan date', placeholder: 'Friday, 25 September 2026', maxLength: 160 },
      { key: 'venue', label: 'Address', placeholder: '101, Shivsagar Society,\nThane (W)', maxLength: 160 },
      { key: 'closingLine', label: 'Closing line', placeholder: 'Ganpati Bappa Morya', maxLength: 60 },
    ],
  },
  wedding: {
    title: 'Wedding',
    fields: [
      { key: 'blessingLine', label: 'Blessing line', placeholder: '|| Shubh Vivah ||', maxLength: 60 },
      { key: 'hostName', label: "Who's inviting", placeholder: 'Mr. & Mrs. Sharma', maxLength: 60 },
      { key: 'message', label: 'Invitation message', placeholder: 'Request the pleasure of your company at the wedding of', maxLength: 160 },
      { key: 'groomName', label: "Groom's name", placeholder: 'Rahul', maxLength: 40 },
      { key: 'brideName', label: "Bride's name", placeholder: 'Priya', maxLength: 40 },
      { key: 'eventName', label: 'Occasion', placeholder: 'Wedding Ceremony', maxLength: 60 },
      { key: 'date', label: 'Date', placeholder: 'Sunday, 15 December 2026', maxLength: 60 },
      { key: 'aartiTimes', label: 'Time', placeholder: '7:00 PM onwards', maxLength: 60 },
      { key: 'venue', label: 'Venue', placeholder: 'Grand Ballroom, Taj Hotel, Mumbai', maxLength: 120 },
      { key: 'closingLine', label: 'Closing Line', placeholder: 'Your presence is our blessing', maxLength: 80 },
    ],
  },
  birthday: {
    title: 'Birthday',
    fields: [
      { key: 'blessingLine', label: 'Top line', placeholder: 'You are invited!', maxLength: 60 },
      { key: 'hostName', label: "Who's inviting", placeholder: "Aarav's Parents", maxLength: 60 },
      { key: 'message', label: 'Message', placeholder: 'Celebrate with us as our little one turns', maxLength: 80 },
      { key: 'eventName', label: 'Occasion', placeholder: "Aarav's 5th Birthday Bash!", maxLength: 60 },
      { key: 'date', label: 'Date', placeholder: 'Saturday, 20 March 2026', maxLength: 60 },
      { key: 'aartiTimes', label: 'Time', placeholder: '4:00 PM - 7:00 PM', maxLength: 60 },
      { key: 'venue', label: 'Venue', placeholder: 'Fun Zone, Andheri West, Mumbai', maxLength: 120 },
      { key: 'closingLine', label: 'Closing line', placeholder: 'Come dressed in your favorite superhero costume!', maxLength: 100 },
    ],
  },
  navratri: {
    title: 'Navratri',
    fields: [
      { key: 'blessingLine', label: 'Blessing line', placeholder: '|| Jai Mata Di ||', maxLength: 60 },
      { key: 'hostName', label: "Who's inviting", placeholder: 'Sharma Family', maxLength: 60 },
      { key: 'message', label: 'Invitation message', placeholder: 'Cordially invite you to join us for', maxLength: 80 },
      { key: 'eventName', label: 'Occasion', placeholder: 'Navratri Garba Night', maxLength: 60 },
      { key: 'date', label: 'Date', placeholder: 'Friday, 3 October 2026', maxLength: 60 },
      { key: 'aartiTimes', label: 'Aarti time', placeholder: '7:00 PM onwards', maxLength: 60 },
      { key: 'venue', label: 'Venue', placeholder: 'Community Hall, Sector 15, Noida', maxLength: 120 },
      { key: 'closingLine', label: 'Closing line', placeholder: 'Dress in traditional attire', maxLength: 80 },
    ],
  },
  janmashtami: {
    title: 'Janmashtami',
    fields: [
      { key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Hare Krishna Hare Rama ||', maxLength: 60 },
      { key: 'hostName', label: "Who's Inviting", placeholder: 'Patel Family', maxLength: 60 },
      { key: 'message', label: 'Invitation Message', placeholder: 'Invite you to celebrate the divine birth of', maxLength: 80 },
      { key: 'eventName', label: 'Occasion', placeholder: 'Shri Krishna Janmashtami', maxLength: 60 },
      { key: 'date', label: 'Date', placeholder: 'Monday, 24 August 2026', maxLength: 60 },
      { key: 'aartiTimes', label: 'Aarti / Dahi Handi Time', placeholder: '12:00 AM (Midnight)', maxLength: 60 },
      { key: 'venue', label: 'Venue', placeholder: 'ISKCON Temple, Juhu, Mumbai', maxLength: 120 },
      { key: 'closingLine', label: 'Closing Line', placeholder: 'Come dressed as Radha-Krishna', maxLength: 80 },
    ],
  },
  'griha-pravesh': {
    title: 'Griha Pravesh',
    fields: [
      { key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Shubh Griha Pravesh ||', maxLength: 60 },
      { key: 'hostName', label: "Who's Inviting", placeholder: 'Mehta Family', maxLength: 60 },
      { key: 'message', label: 'Invitation Message', placeholder: 'We are delighted to invite you to our', maxLength: 80 },
      { key: 'eventName', label: 'Occasion', placeholder: 'Griha Pravesh Ceremony', maxLength: 60 },
      { key: 'date', label: 'Date', placeholder: 'Sunday, 10 January 2026', maxLength: 60 },
      { key: 'aartiTimes', label: 'Muhurat Time', placeholder: '10:30 AM', maxLength: 60 },
      { key: 'venue', label: 'New Home Address', placeholder: 'Flat 402, Sunrise Apartments, Pune', maxLength: 120 },
      { key: 'closingLine', label: 'Closing Line', placeholder: 'Bless our new home with your presence', maxLength: 80 },
    ],
  },
  engagement: {
    title: 'Engagement',
    fields: [
      { key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Shubh Vivah ||', maxLength: 60 },
      { key: 'hostName', label: "Who's Inviting", placeholder: 'Mr. & Mrs. Gupta', maxLength: 60 },
      { key: 'message', label: 'Invitation Message', placeholder: 'Request the honor of your presence at the engagement of', maxLength: 120 },
      { key: 'groomName', label: "Groom's Name", placeholder: 'Vikram', maxLength: 40 },
      { key: 'brideName', label: "Bride's Name", placeholder: 'Ananya', maxLength: 40 },
      { key: 'eventName', label: 'Occasion', placeholder: 'Ring Ceremony', maxLength: 60 },
      { key: 'date', label: 'Date', placeholder: 'Saturday, 14 February 2026', maxLength: 60 },
      { key: 'aartiTimes', label: 'Time', placeholder: '6:00 PM onwards', maxLength: 60 },
      { key: 'venue', label: 'Venue', placeholder: 'The Leela Palace, New Delhi', maxLength: 120 },
      { key: 'closingLine', label: 'Closing Line', placeholder: 'Your blessings make it complete', maxLength: 80 },
    ],
  },
  haldi: {
    title: 'Haldi',
    fields: [
      { key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Shubh Vivah ||', maxLength: 60 },
      { key: 'hostName', label: "Who's Inviting", placeholder: 'Both Families', maxLength: 60 },
      { key: 'message', label: 'Invitation Message', placeholder: 'Join us for the colorful celebration of', maxLength: 80 },
      { key: 'groomName', label: "Groom's Name", placeholder: 'Arjun', maxLength: 40 },
      { key: 'brideName', label: "Bride's Name", placeholder: 'Sneha', maxLength: 40 },
      { key: 'eventName', label: 'Occasion', placeholder: 'Haldi Ceremony', maxLength: 60 },
      { key: 'date', label: 'Date', placeholder: 'Friday, 20 March 2026', maxLength: 60 },
      { key: 'aartiTimes', label: 'Time', placeholder: '10:00 AM onwards', maxLength: 60 },
      { key: 'venue', label: 'Venue', placeholder: 'Farmhouse, Chhatarpur, New Delhi', maxLength: 120 },
      { key: 'closingLine', label: 'Closing Line', placeholder: 'Wear yellow and join the fun!', maxLength: 80 },
    ],
  },
  diwali: {
    title: 'Diwali',
    fields: [
      { key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Shubh Deepavali ||', maxLength: 60 },
      { key: 'hostName', label: "Who's Inviting", placeholder: 'Sharma Family', maxLength: 60 },
      { key: 'message', label: 'Invitation Message', placeholder: 'Invite you to celebrate the festival of lights with', maxLength: 80 },
      { key: 'eventName', label: 'Occasion', placeholder: 'Diwali Celebration', maxLength: 60 },
      { key: 'date', label: 'Date', placeholder: 'Monday, 4 November 2026', maxLength: 60 },
      { key: 'aartiTimes', label: 'Puja Time', placeholder: '6:30 PM onwards', maxLength: 60 },
      { key: 'venue', label: 'Venue', placeholder: 'Residence, Vasant Vihar, New Delhi', maxLength: 120 },
      { key: 'closingLine', label: 'Closing Line', placeholder: 'May the light illuminate your life', maxLength: 80 },
    ],
  },
  holi: {
    title: 'Holi',
    fields: [
      { key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Holi Hai! ||', maxLength: 60 },
      { key: 'hostName', label: "Who's Inviting", placeholder: 'Verma Family', maxLength: 60 },
      { key: 'message', label: 'Invitation Message', placeholder: 'Join us for a colorful celebration of', maxLength: 80 },
      { key: 'eventName', label: 'Occasion', placeholder: 'Holi Festival', maxLength: 60 },
      { key: 'date', label: 'Date', placeholder: 'Saturday, 14 March 2026', maxLength: 60 },
      { key: 'aartiTimes', label: 'Time', placeholder: '10:00 AM - 4:00 PM', maxLength: 60 },
      { key: 'venue', label: 'Venue', placeholder: 'Community Center, Sector 22, Chandigarh', maxLength: 120 },
      { key: 'closingLine', label: 'Closing Line', placeholder: 'Wear white and bring your colors!', maxLength: 80 },
    ],
  },
  dussehra: {
    title: 'Dussehra',
    fields: [
      { key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Jai Shri Ram ||', maxLength: 60 },
      { key: 'hostName', label: "Who's Inviting", placeholder: 'Agarwal Family', maxLength: 60 },
      { key: 'message', label: 'Invitation Message', placeholder: 'Invite you to celebrate the victory of good over evil', maxLength: 80 },
      { key: 'eventName', label: 'Occasion', placeholder: 'Dussehra Celebration', maxLength: 60 },
      { key: 'date', label: 'Date', placeholder: 'Thursday, 15 October 2026', maxLength: 60 },
      { key: 'aartiTimes', label: 'Ravan Dahan Time', placeholder: '8:00 PM onwards', maxLength: 60 },
      { key: 'venue', label: 'Venue', placeholder: 'Ramlila Ground, Connaught Place, Delhi', maxLength: 120 },
      { key: 'closingLine', label: 'Closing Line', placeholder: 'Celebrate the triumph of righteousness', maxLength: 80 },
    ],
  },
  'maha-shivratri': {
    title: 'Maha Shivratri',
    fields: [
      { key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Om Namah Shivaya ||', maxLength: 60 },
      { key: 'hostName', label: "Who's Inviting", placeholder: 'Iyer Family', maxLength: 60 },
      { key: 'message', label: 'Invitation Message', placeholder: 'Join us in worship on the great night of', maxLength: 80 },
      { key: 'eventName', label: 'Occasion', placeholder: 'Maha Shivratri', maxLength: 60 },
      { key: 'date', label: 'Date', placeholder: 'Monday, 17 February 2026', maxLength: 60 },
      { key: 'aartiTimes', label: 'Puja Time', placeholder: '6:00 PM - 6:00 AM (Night-long)', maxLength: 60 },
      { key: 'venue', label: 'Venue', placeholder: 'Kashi Vishwanath Temple, Varanasi', maxLength: 120 },
      { key: 'closingLine', label: 'Closing Line', placeholder: 'Har Har Mahadev!', maxLength: 80 },
    ],
  },
  'ram-navami': { title: 'Ram Navami', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Jai Shri Ram ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Tiwari Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Celebrate the divine birth of Lord', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Shri Ram Navami', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Tuesday, 7 April 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Aarti Time', placeholder: '12:00 PM (Madhyanha)', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Ram Temple, Ayodhya', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Siya Ram, Siya Ram', maxLength: 80 }] },
  'makar-sankranti': { title: 'Makar Sankranti', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Tilgul Ghya ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Deshmukh Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Invite you to celebrate the harvest festival of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Makar Sankranti', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Wednesday, 14 January 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Time', placeholder: 'Morning Puja at 8:00 AM', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Residence, Koregaon Park, Pune', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Fly kites and share tilgul!', maxLength: 80 }] },
  pongal: { title: 'Pongal', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Pongalo Pongal ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Rajagopalan Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Join us to celebrate the harvest festival of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Pongal Festival', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Thursday, 14 January 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Pongal Time', placeholder: '6:30 AM (Sunrise)', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Home, T. Nagar, Chennai', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Thai pirandhal vazhi pirakkum!', maxLength: 80 }] },
  onam: { title: 'Onam', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Happy Onam ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Nair Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Celebrate the harvest festival and homecoming of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Onam Festival', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Saturday, 29 August 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Onasadya Time', placeholder: '12:00 PM (Afternoon Feast)', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Home, Kochi, Kerala', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Pookalam and Vallam Kali await!', maxLength: 80 }] },
  'eid-ul-fitr': { title: 'Eid-ul-Fitr', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'Eid Mubarak!', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Khan Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Join us in celebrating the end of Ramadan with', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Eid-ul-Fitr Celebration', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Friday, 20 March 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Eid Prayer Time', placeholder: '8:00 AM', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Jama Masjid, Old Delhi', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'May Allah accept our fasts and prayers', maxLength: 80 }] },
  'eid-ul-adha': { title: 'Eid-ul-Adha', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'Eid Mubarak!', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Ansari Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Celebrate the festival of sacrifice with', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Eid-ul-Adha (Bakrid)', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Tuesday, 27 May 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Eid Prayer Time', placeholder: '7:30 AM', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Idgah Ground, Mumbai', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'May your sacrifice be accepted', maxLength: 80 }] },
  muharram: { title: 'Muharram', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'Ya Hussain', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Community', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Join us in observing the sacred month of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Muharram', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: '1st Muharram 1448 AH', maxLength: 60 }, { key: 'aartiTimes', label: 'Majlis Time', placeholder: 'Evening after Maghrib', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Imambada, Lucknow', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Labbaik Ya Hussain', maxLength: 80 }] },
  'milad-un-nabi': { title: 'Milad-un-Nabi', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'Sal-Allahu Alaihi Wasallam', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Muslim Community', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Celebrate the birth of Prophet', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Eid Milad-un-Nabi', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: '12th Rabi-ul-Awwal 1448 AH', maxLength: 60 }, { key: 'aartiTimes', label: 'Jashn Time', placeholder: 'After Isha Prayer', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Local Mosque/Community Center', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Peace be upon the Prophet', maxLength: 80 }] },
  christmas: { title: 'Christmas', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'Merry Christmas!', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: "D'Souza Family", maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Join us in celebrating the birth of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Christmas Celebration', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Friday, 25 December 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Midnight Mass', placeholder: '12:00 AM', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Holy Cross Church, Bandra, Mumbai', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Joy to the World!', maxLength: 80 }] },
  easter: { title: 'Easter', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'He is Risen!', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Fernandes Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Celebrate the resurrection of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Easter Sunday', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Sunday, 5 April 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Service Time', placeholder: '10:00 AM', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: "St. Mary's Cathedral, New Delhi", maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Alleluia! Christ is Risen!', maxLength: 80 }] },
  'good-friday': { title: 'Good Friday', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'In Loving Memory', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Christian Community', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Join us in commemorating the crucifixion of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Good Friday', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Friday, 3 April 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Service Time', placeholder: '3:00 PM', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Local Church', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'For God so loved the world', maxLength: 80 }] },
  vaisakhi: { title: 'Vaisakhi', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'Waheguru Ji Ka Khalsa', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Singh Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Celebrate the harvest and the birth of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Vaisakhi', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Monday, 13 April 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Nagar Kirtan Time', placeholder: '8:00 AM onwards', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Gurudwara Bangla Sahib, New Delhi', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Jo Bole So Nihal, Sat Sri Akal!', maxLength: 80 }] },
  gurpurab: { title: 'Gurpurab', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'Ik Onkar', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Khalsa Sangat', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Join us in celebrating the birth of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Guru Nanak Jayanti', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Thursday, 12 November 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Akhand Path Time', placeholder: '48-hour continuous reading', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Golden Temple, Amritsar', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Sat Sri Akal!', maxLength: 80 }] },
  'buddha-purnima': { title: 'Buddha Purnima', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'Namo Buddhaya', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Buddhist Sangha', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Celebrate the birth, enlightenment, and parinirvana of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Buddha Purnima', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Monday, 1 June 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Puja Time', placeholder: 'Morning 6:00 AM', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Mahabodhi Temple, Bodh Gaya', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Peace and compassion to all beings', maxLength: 80 }] },
  'mahavir-jayanti': { title: 'Mahavir Jayanti', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Namokar Mantra ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Jain Sangh', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Celebrate the birth of the 24th Tirthankara', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Mahavir Jayanti', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Thursday, 9 April 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Puja Time', placeholder: '6:00 AM onwards', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Jain Temple, Palitana, Gujarat', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Ahimsa Paramo Dharma', maxLength: 80 }] },
  paryushan: { title: 'Paryushan', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Micchami Dukkadam ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Jain Community', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Join us for the sacred period of fasting and repentance during', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Paryushan Parva', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: '8 Days (August-September 2026)', maxLength: 60 }, { key: 'aartiTimes', label: 'Pratikraman Time', placeholder: 'Evening 6:00 PM', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Jain Derasar, Mumbai', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Forgive us our trespasses', maxLength: 80 }] },
  'durga-puja': { title: 'Durga Puja', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Durga Maa Ki Jai ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Bose Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Invite you to celebrate the homecoming of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Durga Puja', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Friday, 9 October 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Aarti Time', placeholder: '7:00 PM onwards', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Durga Puja Pandal, Kolkata', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Durga Maa Ki Jai!', maxLength: 80 }] },
  mehndi: { title: 'Mehndi', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Mehndi Rachao ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: "Bride's Family", maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Join us for an evening of henna, music and joy', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Mehndi Ceremony', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Wednesday, 11 February 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Time', placeholder: '5:00 PM onwards', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Rose Garden, Jaipur', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Let your hands tell the story', maxLength: 80 }] },
  sangeet: { title: 'Sangeet', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'Sangeet Ki Raat', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Both Families', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Dance the night away at the musical celebration of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Sangeet Night', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Thursday, 12 February 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Time', placeholder: '7:00 PM onwards', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Grand Banquet Hall, Mumbai', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Bring your dancing shoes!', maxLength: 80 }] },
  reception: { title: 'Reception', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'With Joy We Invite', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Mr. & Mrs. Kapoor', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Request the pleasure of your company at the reception of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Wedding Reception', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Saturday, 20 February 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Time', placeholder: '8:00 PM onwards', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'The Leela Palace, New Delhi', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Dinner, drinks and celebrations await', maxLength: 80 }] },
  anniversary: { title: 'Anniversary', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'Celebrating Love', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Amit & Priya', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Invite you to celebrate our journey of togetherness', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: '25th Anniversary', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Sunday, 15 November 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Time', placeholder: '7:00 PM onwards', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Taj Lands End, Mumbai', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Love, laughter and happily ever after', maxLength: 80 }] },
  'baby-shower': { title: 'Baby Shower', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'A Little One is on the Way', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Mom-to-be Priya & Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Join us to shower blessings on the arrival of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Baby Shower', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Saturday, 10 April 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Time', placeholder: '4:00 PM - 7:00 PM', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Garden Terrace, Pune', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Tiny hands, big blessings', maxLength: 80 }] },
  'baby-announcement': { title: 'Baby Announcement', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'Welcome Baby', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Proud Parents', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'We are thrilled to announce the arrival of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Birth Announcement', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Born on 5 April 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Time', placeholder: 'Visit us anytime', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Our Home, Mumbai', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Bless our little miracle', maxLength: 80 }] },
  naamkaran: { title: 'Naamkaran', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Naamkaran Sanskar ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Sharma Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Invite you to bless our little one on their naming ceremony', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Naamkaran Ceremony', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Saturday, 25 April 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Time', placeholder: '11:00 AM', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Residence, Delhi', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Your blessings mean the world', maxLength: 80 }] },
  satyanarayan: { title: 'Satyanarayan Puja', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Shri Satyanarayan ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Gupta Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Invite you to seek blessings at', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Satyanarayan Katha', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Sunday, 18 January 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Puja Time', placeholder: '6:00 PM onwards', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Home, Vashi, Navi Mumbai', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Prasad and blessings await', maxLength: 80 }] },
  mundan: { title: 'Mundan Ceremony', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Mundan Sanskar ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Agarwal Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Invite you to bless our child on their first haircut ceremony', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Mundan Ceremony', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Friday, 20 February 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Muhurat Time', placeholder: '10:30 AM', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Temple, Ujjain', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Bless our little one', maxLength: 80 }] },
  'thread-ceremony': { title: 'Thread Ceremony', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Janeu Sanskar ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Iyer Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Invite you to bless our son on his sacred thread ceremony', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Upanayana', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Sunday, 15 March 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Muhurat Time', placeholder: '8:00 AM', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Gurukul, Chennai', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Gayatri Mantra and blessings', maxLength: 80 }] },
  'karva-chauth': { title: 'Karva Chauth', titleHi: 'करवा चौथ', titleMr: 'करवा चौथ', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Suhaag Sukh ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Priya & Amit', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Join us for the vrat katha and moon-lit blessings of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Karva Chauth Vrat', maxLength: 60 }, { key: 'dateLabel', label: 'The word above the date', placeholder: 'Vrat Katha', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Monday, 26 October 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Parana (Moonrise)', placeholder: 'Moonrise at 8:42 PM', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Residence, C-Scheme, Jaipur', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'For the love that keeps the fast', maxLength: 80 }] },
  teej: { title: 'Hariyali Teej', titleHi: 'हरियाली तीज', titleMr: 'हरियाली तीज', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Gauri Aayee ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Saxena Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Join the swing, the singar and the holi of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Hariyali Teej', maxLength: 60 }, { key: 'dateLabel', label: 'The word above the date', placeholder: 'Teej Puja', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Friday, 31 July 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Gauri Aarti', placeholder: 'Evening 6:30 PM', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Family Haveli, Lucknow', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Green bangles, green dupattas, green joy', maxLength: 80 }] },
  'bhai-dooj': { title: 'Bhai Dooj', titleHi: 'भाई दूज', titleMr: 'भाऊबीज', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| दीर्घायु प्रभोः ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Sister Anjali & Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Tika, thali and a long life of togetherness at', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Bhai Dooj / Bhaubeej', maxLength: 60 }, { key: 'dateLabel', label: 'The word above the date', placeholder: 'Tika Muhurat', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Tuesday, 17 November 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Tika Time', placeholder: '12:45 PM onwards', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: "Sister's Residence, Kothrud, Pune", maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Aayee bhaiya ki dhoop', maxLength: 80 }] },
  chhath: { title: 'Chhath Puja', titleHi: 'छठ पूजा', titleMr: 'छठ पूजा', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| सूर्य नमः ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Rai Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Arghya to the rising and setting sun with the family of', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Chhath Puja', maxLength: 60 }, { key: 'dateLabel', label: 'The word above the date', placeholder: 'Nahay Khay', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Wednesday, 28 October 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Sandhya Arghya', placeholder: 'Sunset 5:28 PM at the ghat', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Nahar Pond Ghat, Darbhanga', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Usha geets at sunrise, arghya at sunset', maxLength: 80 }] },
  'gudi-padwa': { title: 'Gudi Padwa / Ugadi', titleHi: 'गुडी पडवा / युगादी', titleMr: 'गुढी पडवो / उगादी', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| श्री सिद्धि ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Kulkarni Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Gudi praveshan, panchang sevan and mango-neem blessings at', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Gudi Padwa', maxLength: 60 }, { key: 'dateLabel', label: 'The word above the date', placeholder: 'Gudi Stapana', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Thursday, 19 March 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Muhurat', placeholder: 'Gudi raised at 7:14 AM', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Residence, Shivaji Nagar, Pune', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Nava varshachi hardik shubhekachna', maxLength: 80 }] },
  'saraswati-puja': { title: 'Saraswati Puja', titleHi: 'सरस्वती पूजा', titleMr: 'सारस्वत पूजन', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| सरस्वत्यै नमः ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Mukherjee Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Haldi-kumkum, veena and bhandara blessings on', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Saraswati Puja · Vasant Panchami', maxLength: 60 }, { key: 'dateLabel', label: 'The word above the date', placeholder: 'Puja & Bhandara', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Sunday, 25 January 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Aarti Time', placeholder: '10:00 AM onwards', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Residence, Park Street, Kolkata', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'May Maa Saraswati bless your learning', maxLength: 80 }] },
  annaprashan: { title: 'Annaprashan', titleHi: 'अन्नप्राशन', titleMr: 'भातभट्टी', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| अन्नप्राशन संस्कार ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Iyer Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'First spoon of rice, first taste of blessings at', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Annaprashan of little Veda', maxLength: 60 }, { key: 'dateLabel', label: 'The word above the date', placeholder: 'Muhurat', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Thursday, 12 November 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Annaprashan Time', placeholder: '11:30 AM (after Ganesh puja)', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: "Grandparents' home, T. Nagar, Chennai", maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Sweet bites, big blessings', maxLength: 80 }] },
  dhanteras: { title: 'Dhanteras', titleHi: 'धनतेरस', titleMr: 'धनत्रयोदशी', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| शुभ लाभ ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Gupta Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Diyas, lakshmi puja and a little gold on', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Dhanteras Puja', maxLength: 60 }, { key: 'dateLabel', label: 'The word above the date', placeholder: 'Puja Muhurat', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Friday, 30 October 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Lakshmi Aarti', placeholder: 'Prado Kaal — 6:12 PM', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Residence, Sadashiv Peth, Pune', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Yamadeep lighted at sunset', maxLength: 80 }] },
  'raksha-bandhan': { title: 'Raksha Bandhan', titleHi: 'रक्षाबंधन', titleMr: 'नारलीपूर्णिमा', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: '|| बहना का प्यार ||', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Verma Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'The sacred thread of protection is being tied at', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Raksha Bandhan', maxLength: 60 }, { key: 'dateLabel', label: 'The word above the date', placeholder: 'Rakhi Muhurat', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Sunday, 28 August 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Tika & Aarti', placeholder: '10:30 AM onwards', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Family Residence, Hazratganj, Lucknow', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Bhaiya ka dil, behna ka pyaar', maxLength: 80 }] },
  retirement: { title: 'Retirement Gala', titleHi: 'सेवानिवृत्ति समारोह', titleMr: 'निवृत्ती सोहळा', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'With Gratitude', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Colleagues & the Kapoor Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'A vote of thanks and a send-off for', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Retirement Gala — Mr. R. Kapoor', maxLength: 60 }, { key: 'dateLabel', label: 'The word above the date', placeholder: 'Felicitation', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Friday, 20 November 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Programme', placeholder: '6:30 PM memento, 8:00 PM dinner', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Hotel Sai Palace Banquet, Nashik', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'New chapter, same smile', maxLength: 80 }] },
  farewell: { title: 'Farewell Evening', titleHi: 'विदाई समारोह', titleMr: 'निरोप सोहळा', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'Bon Voyage', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'Batch of 2026', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Music, memories and a wish-thanks send-off for', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'Farewell — Ananya', maxLength: 60 }, { key: 'dateLabel', label: 'The word above the date', placeholder: 'Alvida', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Saturday, 30 May 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Time', placeholder: '5:00 PM onwards', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Campus Lawns, Fergusson College, Pune', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Memories forever, distances never', maxLength: 80 }] },
  'new-year': { title: 'New Year Eve', titleHi: 'नया साल', titleMr: 'नववर्ष स्वागत', fields: [{ key: 'blessingLine', label: 'Blessing Line', placeholder: 'Hello 2027', maxLength: 60 }, { key: 'hostName', label: "Who's Inviting", placeholder: 'The Sharma Family', maxLength: 60 }, { key: 'message', label: 'Invitation Message', placeholder: 'Dinner, music and the countdown party for', maxLength: 80 }, { key: 'eventName', label: 'Occasion', placeholder: 'New Year Celebration', maxLength: 60 }, { key: 'dateLabel', label: 'The word above the date', placeholder: 'Countdown', maxLength: 60 }, { key: 'date', label: 'Date', placeholder: 'Thursday, 31 December 2026', maxLength: 60 }, { key: 'aartiTimes', label: 'Time', placeholder: '9:00 PM · fireworks at midnight', maxLength: 60 }, { key: 'venue', label: 'Venue', placeholder: 'Rooftop Resort, Candolim, Goa', maxLength: 120 }, { key: 'closingLine', label: 'Closing Line', placeholder: 'Naya saal, nayi shubhkamnayein', maxLength: 80 }] },
};

export const getFestivalFields = (category: string): FestivalConfig => {
  if (FESTIVAL_FIELDS[category]) return FESTIVAL_FIELDS[category];
  const title = category.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    title,
    fields: [
      { key: 'blessingLine', label: 'Blessing Line', placeholder: '|| Blessings ||', maxLength: 60 },
      { key: 'hostName', label: "Who's Inviting", placeholder: 'Host Family', maxLength: 60 },
      { key: 'message', label: 'Invitation Message', placeholder: 'Invite you to celebrate with us', maxLength: 80 },
      { key: 'eventName', label: 'Occasion', placeholder: title, maxLength: 60 },
      { key: 'dateLabel', label: 'The word above the date', placeholder: 'Join us', maxLength: 60 },
      { key: 'date', label: 'Date', placeholder: 'Sunday, 1 January 2026', maxLength: 60 },
      { key: 'aartiTimes', label: 'Time', placeholder: '10:00 AM onwards', maxLength: 60 },
      { key: 'venue', label: 'Venue', placeholder: 'Venue Address', maxLength: 120 },
      { key: 'closingLine', label: 'Closing Line', placeholder: 'With love and joy', maxLength: 80 },
    ],
  };
};

/* ------------------------------------------------------------------ */
/*  TEXT COLOURS                                                       */
/* ------------------------------------------------------------------ */
export interface ColorDef { name: string; color: string; dotColor: string; }
export const TEXT_COLORS: Record<string, ColorDef> = {
  'royal-maroon': { name: 'royal maroon', color: '#800020', dotColor: '#800020' },
  'deep-burgundy': { name: 'deep burgundy', color: '#6B0F2E', dotColor: '#6B0F2E' },
  'maroon-rose': { name: 'maroon rose', color: '#7B1E3A', dotColor: '#7B1E3A' },
  'wine': { name: 'wine', color: '#5C1A2E', dotColor: '#5C1A2E' },
  'crimson': { name: 'crimson', color: '#C21E3A', dotColor: '#C21E3A' },
  'scarlet': { name: 'scarlet', color: '#D93A2B', dotColor: '#D93A2B' },
  'rani-pink': { name: 'rani pink', color: '#D6236A', dotColor: '#D6236A' },
  'plum': { name: 'plum', color: '#6B2D5C', dotColor: '#6B2D5C' },
  'gold-leaf': { name: 'gold leaf', color: '#B8860B', dotColor: '#B8860B' },
  'antique-gold': { name: 'antique gold', color: '#C19A6B', dotColor: '#C19A6B' },
  'brass': { name: 'brass', color: '#9C7A21', dotColor: '#9C7A21' },
  'mustard': { name: 'mustard', color: '#B8912F', dotColor: '#B8912F' },
  'saffron': { name: 'saffron', color: '#D2761A', dotColor: '#D2761A' },
  'marigold': { name: 'marigold', color: '#DD8A17', dotColor: '#DD8A17' },
  'amber': { name: 'amber', color: '#A96A15', dotColor: '#A96A15' },
  'warm-terracotta': { name: 'terracotta', color: '#A0522D', dotColor: '#A0522D' },
  'rust': { name: 'rust', color: '#8A3D20', dotColor: '#8A3D20' },
  'copper': { name: 'copper', color: '#8B5A2B', dotColor: '#8B5A2B' },
  'soft-brown': { name: 'soft brown', color: '#7D5A44', dotColor: '#7D5A44' },
  'cinnamon': { name: 'cinnamon', color: '#5E3A1F', dotColor: '#5E3A1F' },
  'peacock-teal': { name: 'peacock teal', color: '#2A7A7A', dotColor: '#2A7A7A' },
  'emerald': { name: 'emerald', color: '#0F6B4F', dotColor: '#0F6B4F' },
  'forest': { name: 'forest', color: '#23542F', dotColor: '#23542F' },
  'sage': { name: 'sage', color: '#5F7A5B', dotColor: '#5F7A5B' },
  'olive': { name: 'olive', color: '#5A6320', dotColor: '#5A6320' },
  'turquoise': { name: 'turquoise', color: '#128088', dotColor: '#128088' },
  'royal-blue': { name: 'royal blue', color: '#1F4E9C', dotColor: '#1F4E9C' },
  'indigo': { name: 'indigo', color: '#2B3A8C', dotColor: '#2B3A8C' },
  'peacock-blue': { name: 'peacock blue', color: '#0F6C94', dotColor: '#0F6C94' },
  'navy': { name: 'navy', color: '#17263F', dotColor: '#17263F' },
  'steel': { name: 'steel blue', color: '#43617A', dotColor: '#43617A' },
  'lavender': { name: 'lavender', color: '#6F5B94', dotColor: '#6F5B94' },
  'lilac': { name: 'lilac', color: '#8B6FA8', dotColor: '#8B6FA8' },
  'magenta': { name: 'magenta', color: '#A81E6B', dotColor: '#A81E6B' },
  'rose-blush': { name: 'rose blush', color: '#C4787A', dotColor: '#C4787A' },
  'dusty-rose': { name: 'dusty rose', color: '#A85C66', dotColor: '#A85C66' },
  'peach': { name: 'peach', color: '#C86F42', dotColor: '#C86F42' },
  'coral': { name: 'coral', color: '#D95B43', dotColor: '#D95B43' },
  'powder-blue': { name: 'powder blue', color: '#41698A', dotColor: '#41698A' },
  'mint': { name: 'mint', color: '#2E7D63', dotColor: '#2E7D63' },
  'ivory-cream': { name: 'ivory cream', color: '#F5E6D3', dotColor: '#F5E6D3' },
  'pearl': { name: 'pearl', color: '#EDE4D3', dotColor: '#EDE4D3' },
  'champagne': { name: 'champagne', color: '#EAD9A6', dotColor: '#EAD9A6' },
  'rose-gold-light': { name: 'blush light', color: '#F3C9CE', dotColor: '#F3C9CE' },
  'sky-light': { name: 'sky light', color: '#CFE3F0', dotColor: '#CFE3F0' },
  'sage-light': { name: 'sage light', color: '#D6E3D0', dotColor: '#D6E3D0' },
  'white': { name: 'pure white', color: '#FFFFFF', dotColor: '#FFFFFF' },
  'sand': { name: 'sand', color: '#A8916F', dotColor: '#A8916F' },
  'graphite': { name: 'graphite', color: '#4A4A4A', dotColor: '#4A4A4A' },
  'charcoal': { name: 'charcoal', color: '#2E2C2A', dotColor: '#2E2C2A' },
  'near-black': { name: 'near black', color: '#141414', dotColor: '#141414' },
};

export const COLOR_GROUPS = [
  { label: 'Royal', keys: ['royal-maroon','deep-burgundy','maroon-rose','wine','crimson','scarlet','rani-pink','plum'] },
  { label: 'Gold & Earth', keys: ['gold-leaf','antique-gold','brass','mustard','saffron','marigold','amber','warm-terracotta','rust','copper','soft-brown','cinnamon'] },
  { label: 'Greens', keys: ['peacock-teal','emerald','forest','sage','olive','turquoise'] },
  { label: 'Blue & Violet', keys: ['royal-blue','indigo','peacock-blue','navy','steel','lavender','lilac','magenta'] },
  { label: 'Soft & Pastel', keys: ['rose-blush','dusty-rose','peach','coral','powder-blue','mint'] },
  { label: 'For dark art', keys: ['ivory-cream','pearl','champagne','rose-gold-light','sky-light','sage-light','white'] },
  { label: 'Neutral', keys: ['sand','graphite','charcoal','near-black'] },
];

export interface TextStyle { id: string; name: string; fonts: Record<string, string>; }
export const TEXT_STYLES: TextStyle[] = [
  { id: 'classic', name: 'Classic Temple', fonts: { blessingLine: 'Cormorant SC', hostName: 'Playfair Display', message: 'Lora', groomName: 'Playfair Display', brideName: 'Playfair Display', eventName: 'Marcellus', dateLabel: 'Marcellus', date: 'Cormorant Garamond', aartiTimes: 'Lora', visarjanLabel: 'Marcellus', visarjanDate: 'Cormorant Garamond', venue: 'Lora', closingLine: 'Great Vibes' } },
  { id: 'royal', name: 'Royal Serif', fonts: { blessingLine: 'Cinzel', hostName: 'Cinzel', message: 'EB Garamond', groomName: 'Cinzel', brideName: 'Cinzel', eventName: 'Cinzel', dateLabel: 'Cinzel', date: 'EB Garamond', aartiTimes: 'EB Garamond', visarjanLabel: 'Cinzel', visarjanDate: 'EB Garamond', venue: 'EB Garamond', closingLine: 'Pinyon Script' } },
  { id: 'minimal', name: 'Modern Minimal', fonts: { blessingLine: 'Poppins', hostName: 'Poppins', message: 'Mukta', groomName: 'Poppins', brideName: 'Poppins', eventName: 'Italiana', dateLabel: 'Poppins', date: 'Mukta', aartiTimes: 'Mukta', visarjanLabel: 'Poppins', visarjanDate: 'Mukta', venue: 'Mukta', closingLine: 'Poppins' } },
  { id: 'devanagari', name: 'Devanagari', fonts: { blessingLine: 'Tiro Devanagari Hindi', hostName: 'Tiro Devanagari Hindi', message: 'Mukta', groomName: 'Rozha One', brideName: 'Rozha One', eventName: 'Rozha One', dateLabel: 'Tiro Devanagari Hindi', date: 'Mukta', aartiTimes: 'Mukta', visarjanLabel: 'Tiro Devanagari Hindi', visarjanDate: 'Mukta', venue: 'Hind', closingLine: 'Kalam' } },
  { id: 'romantic', name: 'Romantic Script', fonts: { blessingLine: 'Cormorant Garamond', hostName: 'Cormorant Garamond', message: 'EB Garamond', groomName: 'Great Vibes', brideName: 'Great Vibes', eventName: 'Italiana', dateLabel: 'Cormorant SC', date: 'Cormorant Garamond', aartiTimes: 'Cormorant Garamond', visarjanLabel: 'Cormorant SC', visarjanDate: 'Cormorant Garamond', venue: 'Cormorant Garamond', closingLine: 'Tangerine' } },
  { id: 'festive', name: 'Festive Bold', fonts: { blessingLine: 'Yatra One', hostName: 'Baloo 2', message: 'Hind', groomName: 'Yatra One', brideName: 'Yatra One', eventName: 'Yatra One', dateLabel: 'Baloo 2', date: 'Hind', aartiTimes: 'Hind', visarjanLabel: 'Baloo 2', visarjanDate: 'Hind', venue: 'Hind', closingLine: 'Kalam' } },
];

export interface TextBoard { id: string; name: string; css: Record<string, string>; dark: boolean; }
export const TEXT_BOARDS: TextBoard[] = [
  { id: 'none', name: 'None', css: {}, dark: false },
  { id: 'cream', name: 'Cream', css: { background: 'rgba(255,248,235,0.94)', border: '1px solid rgba(184,134,11,0.35)', boxShadow: '0 6px 26px rgba(80,40,10,0.18)' }, dark: false },
  { id: 'frost', name: 'Frost', css: { background: 'rgba(255,255,255,0.62)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 6px 26px rgba(60,30,30,0.16)' }, dark: false },
  { id: 'gold', name: 'Gold wash', css: { background: 'rgba(245,224,170,0.72)', border: '1.5px solid rgba(176,124,20,0.6)', boxShadow: '0 6px 26px rgba(90,55,10,0.2)' }, dark: false },
  { id: 'dark', name: 'Royal dark', css: { background: 'rgba(48,10,22,0.72)', border: '1.5px solid rgba(212,175,55,0.65)', boxShadow: '0 8px 30px rgba(0,0,0,0.35)' }, dark: true },
  { id: 'ink', name: 'Ink', css: { background: 'rgba(18,18,20,0.7)', border: '1px solid rgba(255,255,255,0.28)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }, dark: true },
];
export const BOARD_CHOICES = [{ id: 'auto', name: 'Auto (best fit)', swatch: 'linear-gradient(135deg, rgba(255,248,235,0.95) 0 50%, #ece2ce 50% 100%)' }, ...TEXT_BOARDS.map((b) => ({ id: b.id, name: b.name, swatch: b.id === 'none' ? 'repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 8px 8px' : b.css.background }))];
export const VIDEO_BOARD_STYLES: Record<string, { fill: string; stroke: string; dark: boolean } | null> = { none: null, cream: { fill: 'rgba(255,248,235,0.94)', stroke: 'rgba(184,134,11,0.35)', dark: false }, frost: { fill: 'rgba(255,255,255,0.62)', stroke: 'rgba(255,255,255,0.9)', dark: false }, gold: { fill: 'rgba(245,224,170,0.72)', stroke: 'rgba(176,124,20,0.6)', dark: false }, dark: { fill: 'rgba(48,10,22,0.72)', stroke: 'rgba(212,175,55,0.65)', dark: true }, ink: { fill: 'rgba(18,18,20,0.7)', stroke: 'rgba(255,255,255,0.28)', dark: true } };
export const MUSIC_STYLES = [{ id: 'auto', name: 'Auto' }, { id: 'flute', name: 'Bansuri' }, { id: 'sitar', name: 'Sitar' }, { id: 'bells', name: 'Temple bells' }, { id: 'tabla', name: 'Tabla' }];

export interface TextStackItem { key: string; font: string; size: number; weight: number; opacity: number; letterSpacing?: string; gap: number; }
export const TEXT_STACK: TextStackItem[] = [
  { key: 'blessingLine', font: 'Cormorant SC', size: 15, weight: 600, opacity: 0.95, letterSpacing: '0.06em', gap: 0 },
  { key: 'hostName', font: 'Playfair Display', size: 15, weight: 600, opacity: 0.96, gap: 9 },
  { key: 'message', font: 'Lora', size: 13, weight: 400, opacity: 0.9, gap: 7 },
  { key: '__couple', font: 'Playfair Display', size: 21, weight: 600, opacity: 1, gap: 9 },
  { key: 'eventName', font: 'Marcellus', size: 30, weight: 700, opacity: 1, letterSpacing: '0.02em', gap: 11 },
  { key: 'dateLabel', font: 'Marcellus', size: 14.5, weight: 600, opacity: 0.92, letterSpacing: '0.05em', gap: 12 },
  { key: 'date', font: 'Cormorant Garamond', size: 15.5, weight: 600, opacity: 0.96, gap: 3 },
  { key: 'aartiTimes', font: 'Lora', size: 13.5, weight: 500, opacity: 0.92, gap: 3 },
  { key: 'visarjanLabel', font: 'Marcellus', size: 14.5, weight: 600, opacity: 0.92, letterSpacing: '0.05em', gap: 12 },
  { key: 'visarjanDate', font: 'Cormorant Garamond', size: 15.5, weight: 600, opacity: 0.96, gap: 3 },
  { key: 'venue', font: 'Lora', size: 13.5, weight: 500, opacity: 0.92, gap: 12 },
  { key: 'closingLine', font: 'Great Vibes', size: 22, weight: 500, opacity: 0.98, gap: 4 },
];
export const PREVIEW_CARD_WIDTH = 420;
export const VIDEO_WIDTH = 720;
export const VIDEO_HEIGHT = 1280;
export const VIDEO_SCALE = VIDEO_WIDTH / PREVIEW_CARD_WIDTH;
export const clampBand = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
export const hexLuminance = (hex: string) => { const n = parseInt(hex.slice(1), 16); return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); };
export const contrastAgainst = (cL: number, gL: number) => { const hi = Math.max(cL, gL), lo = Math.min(cL, gL); return (hi + 5) / (lo + 5); };

export interface BandResult { start: number; end: number; luminance: number; busy: boolean; }
export const analyzeTextBand = (src: string): Promise<BandResult> => new Promise((resolve) => {
  const fallback = { start: 6, end: 52, luminance: 235, busy: false };
  const img = new Image(); img.crossOrigin = 'anonymous';
  img.onload = () => { try { const W=96,H=170,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d',{willReadFrequently:true});g!.drawImage(img,0,0,W,H);const{data}=g!.getImageData(0,0,W,H);const lum=new Float32Array(W*H);const rgb=[new Float32Array(W*H),new Float32Array(W*H),new Float32Array(W*H)];for(let i=0,p=0;i<data.length;i+=4,p++){rgb[0][p]=data[i];rgb[1][p]=data[i+1];rgb[2][p]=data[i+2];lum[p]=0.299*data[i]+0.587*data[i+1]+0.114*data[i+2];}const rC=new Float32Array(H),rL=new Float32Array(H),rI=new Float32Array(H),rE=new Float32Array(H),rD=new Float32Array(H);for(let y=0;y<H;y++){let e=0,m=0,s=0;for(let x=0;x<W;x++){const p=y*W+x,v=lum[p];m+=v;const hi=Math.max(rgb[0][p],rgb[1][p],rgb[2][p]),lo=Math.min(rgb[0][p],rgb[1][p],rgb[2][p]);s+=hi>0?(hi-lo)/hi:0;if(x>0)e+=Math.abs(v-lum[p-1]);if(y>0)e+=Math.abs(v-lum[p-W]);}m/=W;let va=0,st=0;for(let x=0;x<W;x++){const d=lum[y*W+x]-m;va+=d*d;if(Math.abs(d)>55)st++;}const sa=s/W,cl=Math.max(0,sa-0.35)*90,da=m<150?(150-m)*0.25:0,ik=st/W;rI[y]=ik;rE[y]=e/W;rD[y]=Math.sqrt(va/W);rC[y]=e/W+Math.sqrt(va/W)*0.9+cl+da+Math.min(ik,0.3)*70;rL[y]=m;}const sm=new Float32Array(H);for(let y=0;y<H;y++){let s=0,n=0;for(let k=-2;k<=2;k++){const yy=y+k;if(yy>=0&&yy<H){s+=rC[yy];n++;}}sm[y]=s/n;}const cands=[0.5,0.42,0.34,0.28,0.22].map((f)=>{const w=Math.max(10,Math.round(H*f));let s=Math.round(H*0.05),c=Infinity;for(let i=0;i+w<=H;i++){if(i<H*0.05||i+w>H*0.95)continue;let t=0;for(let y=i;y<i+w;y++)t+=sm[y];t/=w;if(t<c){c=t;s=i;}}return{w,s,c};});const fl=Math.min(...cands.map(c=>c.c));const ch=cands.find(c=>c.c<=fl*1.12)||cands[cands.length-1];const pd=Math.round(H*0.09),r0=Math.max(0,ch.s-pd),r1=Math.min(H,ch.s+ch.w+pd);const rows=Math.max(1,r1-r0);let lT=0,iT=0,eT=0,dT=0;for(let y=r0;y<r1;y++){lT+=rL[y];iT+=rI[y];eT+=rE[y];dT+=rD[y];}const mL=lT/rows;resolve({start:Math.round((ch.s/H)*100),end:Math.round(((ch.s+ch.w)/H)*100),luminance:mL,busy:dT/rows>15||eT/rows>14||iT/rows>0.06||(mL>92&&mL<196)});}catch{resolve(fallback);}};
  img.onerror = () => resolve(fallback); img.src = src;
});

export const TEMPLATE_IMAGES: Record<string, string> = {
  wedding: '/templates/wedding-01.png', engagement: '/templates/engagement-01.png', haldi: '/templates/haldi-01.png',
  mehndi: '/templates/mehndi-01.png', sangeet: '/templates/sangeet-01.png', reception: '/templates/reception-01.png',
  ganpati: '/templates/ganpati-01.png', navratri: '/templates/navratri-01.png', 'durga-puja': '/templates/durgapuja-02.png',
  diwali: '/templates/diwali-01.png', holi: '/templates/holi-01.png', janmashtami: '/templates/janmashtami-01.png',
  birthday: '/templates/birthday-01.png',
};
