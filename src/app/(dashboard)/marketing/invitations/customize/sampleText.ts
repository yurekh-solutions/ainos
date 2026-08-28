/**
 * Multi-language sample text for each occasion category.
 * Used as the default content when the user customises a template.
 */
import { getFestivalFields } from './customizeConstants';

export const SAMPLE_TEXT: Record<string, Record<string, Record<string, string>>> = {
  ganpati: {
    english: { blessingLine: '|| Shri Ganeshay Namah ||', hostName: 'Sharma Family', message: 'Cordially invite you to Ganpati Bappa\'s arrival at our home', eventName: 'Ganesh Chaturthi', dateLabel: 'Sthapana', date: 'Monday, 14 September 2026', aartiTimes: 'Aarti — 7:00 AM & 7:30 PM daily', venue: 'Residence, Dadar, Mumbai', closingLine: 'Ganpati Bappa Morya!' },
    hindi: { blessingLine: '|| श्री गणेशाय नमः ||', hostName: 'शर्मा परिवार', message: 'गणपति बप्पा के आगमन पर आपका हार्दिक स्वागत', eventName: 'गणेश चतुर्थी', dateLabel: 'स्थापना', date: 'सोमवार, 14 सितंबर 2026', aartiTimes: 'आरती — सुबह 7:00 और शाम 7:30', venue: 'निवास, दादर, मुंबई', closingLine: 'गणपति बप्पा मोरया!' },
    marathi: { blessingLine: '|| श्री गणेशाय नमः ||', hostName: 'शर्मा कुटुंब', message: 'गणपती बाप्पाच्या आगमनाचे हार्दिक स्वागत', eventName: 'गणेश चतुर्थी', dateLabel: 'स्थापना', date: 'सोमवार, 14 सप्टेंबर 2026', aartiTimes: 'आरती — सकाळी 7:00 व संध्याकाळी 7:30', venue: 'निवास, दादर, मुंबई', closingLine: 'गणपती बाप्पा मोरया!' },
  },
  wedding: {
    english: { blessingLine: '|| Shubh Vivah ||', hostName: 'Mr. & Mrs. Sharma', message: 'Request the pleasure of your company at the wedding of', groomName: 'Rahul', brideName: 'Priya', eventName: 'Wedding Ceremony', date: 'Sunday, 15 December 2026', aartiTimes: '7:00 PM onwards', venue: 'Grand Ballroom, Taj Hotel, Mumbai', closingLine: 'Your presence is our blessing' },
    hindi: { blessingLine: '॥ शुभ विवाह ॥', hostName: 'श्री और श्रीमती शर्मा', message: 'के विवाह में आपकी उपस्थिति की प्रार्थना करते हैं', groomName: 'राहुल', brideName: 'प्रिया', eventName: 'विवाह समारोह', date: 'रविवार, 15 दिसंबर 2026', aartiTimes: 'शाम 7:00 बजे से', venue: 'ग्रैंड बॉलरूम, ताज होटल, मुंबई', closingLine: 'आपकी उपस्थिति हमारा आशीर्वाद है' },
    marathi: { blessingLine: '॥ शुभ विवाह ॥', hostName: 'श्री आणि श्रीमती शर्मा', message: 'च्या विवाहास आपली उपस्थिती हवी', groomName: 'राहुल', brideName: 'प्रिया', eventName: 'विवाह समारंभ', date: 'रविवार, 15 डिसेंबर 2026', aartiTimes: 'सायंकाळी 7:00 वाजतापासून', venue: 'ग्रँड बॉलरूम, ताज हॉटेल, मुंबई', closingLine: 'तुमची उपस्थिती हेच आमचे आशीर्वाद' },
  },
  birthday: {
    english: { blessingLine: 'You are invited!', hostName: 'Aarav\'s Parents', message: 'Celebrate with us as our little one turns', eventName: 'Aarav\'s 5th Birthday!', date: 'Saturday, 20 March 2026', aartiTimes: '4:00 PM - 7:00 PM', venue: 'Fun Zone, Andheri West, Mumbai', closingLine: 'Come dressed in your favorite costume!' },
    hindi: { blessingLine: 'आप आमंत्रित हैं!', hostName: 'आरव के माता-पिता', message: 'हमारे नन्हे के जन्मदिन पर जश्न मनाएं', eventName: 'आरव का 5वां जन्मदिन!', date: 'शनिवार, 20 मार्च 2026', aartiTimes: 'शाम 4:00 - 7:00', venue: 'फन जोन, अंधेरी वेस्ट, मुंबई', closingLine: 'अपने पसंदीदा पोशाक में आएं!' },
    marathi: { blessingLine: 'तुम्हाला आमंत्रण!', hostName: 'आरवचे पालक', message: 'आमच्या लहानाचा वाढदिवस साजरा करा', eventName: 'आरवचा 5 वा वाढदिवस!', date: 'शनिवार, 20 मार्च 2026', aartiTimes: 'सायंकाळी 4:00 - 7:00', venue: 'फन झोन, अंधेरी वेस्ट, मुंबई', closingLine: 'आपल्या आवडत्या पोशाखात या!' },
  },
  navratri: {
    english: { blessingLine: '|| Jai Mata Di ||', hostName: 'Sharma Family', message: 'Cordially invite you to join us for', eventName: 'Navratri Garba Night', date: 'Friday, 3 October 2026', aartiTimes: '7:00 PM onwards', venue: 'Community Hall, Sector 15, Noida', closingLine: 'Dress in traditional attire' },
    hindi: { blessingLine: '|| जय माता दी ||', hostName: 'शर्मा परिवार', message: 'नवरात्रि गरबा नाइट में आपका स्वागत', eventName: 'नवरात्रि गरबा नाइट', date: 'शुक्रवार, 3 अक्टूबर 2026', aartiTimes: 'शाम 7:00 बजे से', venue: 'कम्युनिटी हॉल, सेक्टर 15, नोएडा', closingLine: 'पारंपरिक परिधान में आएं' },
    marathi: { blessingLine: '|| जय माता दी ||', hostName: 'शर्मा कुटुंब', message: 'नवरात्री गरबा नाइटसाठी सादर आमंत्रण', eventName: 'नवरात्री गरबा नाइट', date: 'शुक्रवार, 3 ऑक्टोबर 2026', aartiTimes: 'सायंकाळी 7:00 वाजतापासून', venue: 'कम्युनिटी हॉल, सेक्टर 15, नोएडा', closingLine: 'पारंपरिक वेशभूषेत या' },
  },
  diwali: {
    english: { blessingLine: '|| Shubh Deepavali ||', hostName: 'Sharma Family', message: 'Invite you to celebrate the festival of lights with', eventName: 'Diwali Celebration', date: 'Monday, 4 November 2026', aartiTimes: 'Puja Time — 6:30 PM', venue: 'Residence, Vasant Vihar, New Delhi', closingLine: 'May the lights illuminate your life' },
    hindi: { blessingLine: '|| शुभ दीपावली ||', hostName: 'शर्मा परिवार', message: 'प्रकाश के त्योहार में आपका स्वागत', eventName: 'दीवाली समारोह', date: 'सोमवार, 4 नवंबर 2026', aartiTimes: 'पूजा — शाम 6:30', venue: 'निवास, वसंत विहार, नई दिल्ली', closingLine: 'दीयों की रोशनी आपकी जिंदगी रोशन करे' },
    marathi: { blessingLine: '|| शुभ दिवाळी ||', hostName: 'शर्मा कुटुंब', message: 'प्रकाशाच्या सणात आपले स्वागत', eventName: 'दिवाळी समारंभ', date: 'सोमवार, 4 नोव्हेंबर 2026', aartiTimes: 'पूजा — सायंकाळी 6:30', venue: 'निवास, वसंत विहार, नवी दिल्ली', closingLine: 'दिम्यांची रोशनी तुमचे आयुष्य प्रकाशित करो' },
  },
  holi: {
    english: { blessingLine: '|| Holi Hai! ||', hostName: 'Verma Family', message: 'Join us for a colorful celebration of', eventName: 'Holi Festival', date: 'Saturday, 14 March 2026', aartiTimes: '10:00 AM - 4:00 PM', venue: 'Community Center, Sector 22, Chandigarh', closingLine: 'Wear white and bring your colors!' },
    hindi: { blessingLine: '|| होली है! ||', hostName: 'वर्मा परिवार', message: 'रंगों के त्योहार में आपका स्वागत', eventName: 'होली महोत्सव', date: 'शनिवार, 14 मार्च 2026', aartiTimes: 'सुबह 10:00 - शाम 4:00', venue: 'कम्युनिटी सेंटर, सेक्टर 22, चंडीगढ़', closingLine: 'सफेद पहनें और अपने रंग लाएं!' },
    marathi: { blessingLine: '|| होली आहे! ||', hostName: 'वर्मा कुटुंब', message: 'रंगांच्या सणात आपले स्वागत', eventName: 'होली महोत्सव', date: 'शनिवार, 14 मार्च 2026', aartiTimes: 'सकाळी 10:00 - दुपारी 4:00', venue: 'कम्युनिटी सेंटर, सेक्टर 22, चंडीगढ़', closingLine: 'पांढरे कपडे घाला आणि रंग आणा!' },
  },
  engagement: {
    english: { blessingLine: '|| Shubh Vivah ||', hostName: 'Mr. & Mrs. Gupta', message: 'Request the honor of your presence at the engagement of', groomName: 'Vikram', brideName: 'Ananya', eventName: 'Ring Ceremony', date: 'Saturday, 14 February 2026', aartiTimes: '6:00 PM onwards', venue: 'The Leela Palace, New Delhi', closingLine: 'Your blessings make it complete' },
    hindi: { blessingLine: '॥ शुभ विवाह ॥', hostName: 'श्री और श्रीमती गुप्ता', message: 'की सगाई में आपकी उपस्थिति की प्रार्थना', groomName: 'विक्रम', brideName: 'अनन्या', eventName: 'सगाई समारोह', date: 'शनिवार, 14 फरवरी 2026', aartiTimes: 'शाम 6:00 बजे से', venue: 'द लीला पैलेस, नई दिल्ली', closingLine: 'आपके आशीर्वाद से सब पूरा होता है' },
    marathi: { blessingLine: '॥ शुभ विवाह ॥', hostName: 'श्री आणि श्रीमती गुप्ता', message: 'च्या साखरपुड्यास आपली उपस्थिती हवी', groomName: 'विक्रम', brideName: 'अनन्या', eventName: 'साखरपुडा', date: 'शनिवार, 14 फेब्रुवारी 2026', aartiTimes: 'सायंकाळी 6:00 वाजतापासून', venue: 'द लीला पॅलेस, नवी दिल्ली', closingLine: 'तुमच्या आशीर्वादाने सर्व पूर्ण होते' },
  },
  haldi: {
    english: { blessingLine: '|| Shubh Vivah ||', hostName: 'Both Families', message: 'Join us for the colorful celebration of', groomName: 'Arjun', brideName: 'Sneha', eventName: 'Haldi Ceremony', date: 'Friday, 20 March 2026', aartiTimes: '10:00 AM onwards', venue: 'Farmhouse, Chhatarpur, New Delhi', closingLine: 'Wear yellow and join the fun!' },
    hindi: { blessingLine: '॥ शुभ विवाह ॥', hostName: 'दोनों परिवार', message: 'हल्दी की रस्म में आपका स्वागत', groomName: 'अर्जुन', brideName: 'स्नेहा', eventName: 'हल्दी समारोह', date: 'शुक्रवार, 20 मार्च 2026', aartiTimes: 'सुबह 10:00 बजे से', venue: 'फार्महाउस, छतरपुर, नई दिल्ली', closingLine: 'पीला पहनें और खुशी में शामिल हों!' },
    marathi: { blessingLine: '॥ शुभ विवाह ॥', hostName: 'दोन्ही कुटुंबे', message: 'हळदी सोहळ्यात आपले स्वागत', groomName: 'अर्जुन', brideName: 'स्नेहा', eventName: 'हळदी समारंभ', date: 'शुक्रवार, 20 मार्च 2026', aartiTimes: 'सकाळी 10:00 वाजतापासून', venue: 'फार्महाउस, छतरपूर, नवी दिल्ली', closingLine: 'पिवळे कपडे घाला आणि आनंदात सामील व्हा!' },
  },
  mehndi: {
    english: { blessingLine: '|| Mehndi Raachao ||', hostName: 'Verma Family', message: 'Invite you to the beautiful evening of', eventName: 'Mehndi Ceremony', date: 'Wednesday, 11 February 2026', aartiTimes: '6:00 PM onwards', venue: 'Rose Garden, Jaipur', closingLine: 'Come get henna and celebrate!' },
    hindi: { blessingLine: '|| मेहँदी रचाओ ||', hostName: 'वर्मा परिवार', message: 'के सुंदर कार्यक्रम में आपका स्वागत है', eventName: 'मेहँदी समारोह', date: 'बुधवार, 11 फरवरी 2026', aartiTimes: 'शाम 6:00 बजे से', venue: 'रोज गार्डन, जयपुर', closingLine: 'मेहँदी लगवाएं और जश्न मनाएं!' },
    marathi: { blessingLine: '|| मेहंदी रचवा ||', hostName: 'वर्मा कुटुंब', message: 'च्या सुंदर कार्यक्रमात आपले स्वागत आहे', eventName: 'मेहँदी समारंभ', date: 'बुधवार, 11 फेब्रुवारी 2026', aartiTimes: 'सायंकाळी 6:00 वाजतापासून', venue: 'रोज गार्डन, जयपूर', closingLine: 'मेहंदी काढा आणि जल्लोष साजरा करा!' },
  },
  sangeet: {
    english: { blessingLine: 'Sangeet Night', hostName: 'Sharma Family', message: 'Cordially invite you to dance the night away at', eventName: 'Sangeet Ceremony', date: 'Friday, 13 February 2026', aartiTimes: '7:00 PM onwards', venue: 'Grand Banquet, Mumbai', closingLine: 'Dress to dazzle!' },
    hindi: { blessingLine: 'संगीत की रात', hostName: 'शर्मा परिवार', message: 'में नाचते हुए रात बिताने के लिए सादर आमंत्रित', eventName: 'संगीत समारोह', date: 'शुक्रवार, 13 फरवरी 2026', aartiTimes: 'शाम 7:00 बजे से', venue: 'ग्रैंड बैंक्वेट, मुंबई', closingLine: 'चमकने के लिए तैयार हों!' },
    marathi: { blessingLine: 'संगीताची रात्र', hostName: 'शर्मा कुटुंब', message: 'मध्ये नाचत रात्र काढण्यासाठी सादर आमंत्रण', eventName: 'संगीत समारंभ', date: 'शुक्रवार, 13 फेब्रुवारी 2026', aartiTimes: 'सायंकाळी 7:00 वाजतापासून', venue: 'ग्रँड बँक्वेट, मुंबई', closingLine: 'तेजस्वी दिसण्यासाठी तयार व्हा!' },
  },
  reception: {
    english: { blessingLine: 'Reception', hostName: 'Mr. & Mrs. Sharma', message: 'Request the pleasure of your company at the wedding reception of', groomName: 'Rahul', brideName: 'Priya', eventName: 'Wedding Reception', date: 'Saturday, 20 February 2026', aartiTimes: '7:00 PM onwards', venue: 'Grand Ballroom, Taj Hotel, Mumbai', closingLine: 'Cocktails, dinner & dancing await!' },
    hindi: { blessingLine: 'रिसेप्शन', hostName: 'श्री और श्रीमती शर्मा', message: 'के विवाह रिसेप्शन में आपकी उपस्थिति की प्रार्थना करते हैं', groomName: 'राहुल', brideName: 'प्रिया', eventName: 'विवाह रिसेप्शन', date: 'शनिवार, 20 फरवरी 2026', aartiTimes: 'शाम 7:00 बजे से', venue: 'ग्रैंड बॉलरूम, ताज होटल, मुंबई', closingLine: 'कॉकटेल, डिनर और नाच की रात!' },
    marathi: { blessingLine: 'रिसेप्शन', hostName: 'श्री आणि श्रीमती शर्मा', message: 'च्या विवाह रिसेप्शनसाठी सादर आमंत्रण', groomName: 'राहुल', brideName: 'प्रिया', eventName: 'विवाह रिसेप्शन', date: 'शनिवार, 20 फेब्रुवारी 2026', aartiTimes: 'सायंकाळी 7:00 वाजतापासून', venue: 'ग्रँड बॉलरूम, ताज हॉटेल, मुंबई', closingLine: 'कॉकटेल, जेवण आणि नृत्याची रात्र!' },
  },
  'durga-puja': {
    english: { blessingLine: '|| Durga Mata Ki Jai ||', hostName: 'Bose Family', message: 'Cordially invite you to celebrate', eventName: 'Durga Puja', date: 'Friday, 9 October 2026', aartiTimes: 'Pushpanjali — 12:00 PM', venue: 'Community Pandal, Kolkata', closingLine: 'Shubho Bijoya!' },
    hindi: { blessingLine: '॥ दुर्गा माता की जय ॥', hostName: 'बोस परिवार', message: 'दुर्गा पूजा मनाने के लिए सादर आमंत्रित', eventName: 'दुर्गा पूजा', date: 'शुक्रवार, 9 अक्टूबर 2026', aartiTimes: 'पुष्पांजलि — दोपहर 12:00', venue: 'कम्युनिटी पंडाल, कोलकाता', closingLine: 'शुभो बिजोया!' },
    marathi: { blessingLine: '॥ दुर्गा माता की जय ॥', hostName: 'बोस कुटुंब', message: 'दुर्गा पूजा साजरी करण्यासाठी सादर आमंत्रण', eventName: 'दुर्गा पूजा', date: 'शुक्रवार, 9 ऑक्टोबर 2026', aartiTimes: 'पुष्पांजली — दुपारी 12:00', venue: 'कम्युनिटी पंडाल, कोलकाता', closingLine: 'शुभो बिजोया!' },
  },
  janmashtami: {
    english: { blessingLine: '|| Hare Krishna ||', hostName: 'Patel Family', message: 'Invite you to celebrate the divine birth of', eventName: 'Shri Krishna Janmashtami', date: 'Monday, 24 August 2026', aartiTimes: 'Midnight Aarti — 12:00 AM', venue: 'ISKCON Temple, Juhu, Mumbai', closingLine: 'Come dressed as Radha-Krishna' },
    hindi: { blessingLine: '॥ हरे कृष्ण ॥', hostName: 'पटेल परिवार', message: 'श्री कृष्ण जन्मोत्सव में आमंत्रित करते हैं', eventName: 'श्री कृष्ण जन्माष्टमी', date: 'सोमवार, 24 अगस्त 2026', aartiTimes: 'मध्यरात्रि आरती — 12:00 बजे', venue: 'इस्कॉन मंदिर, जुहू, मुंबई', closingLine: 'राधा-कृष्ण के वेश में आएं' },
    marathi: { blessingLine: '॥ हरे कृष्ण ॥', hostName: 'पटेल कुटुंब', message: 'श्री कृष्ण जन्माच्या पर्वाच्या जल्लोषासाठी आमंत्रण', eventName: 'श्री कृष्ण जन्माष्टमी', date: 'सोमवार, 24 ऑगस्ट 2026', aartiTimes: 'मध्यरात्री आरती — 12:00', venue: 'इस्कॉन मंदिर, जुहू, मुंबई', closingLine: 'राधा-कृष्ण वेशात या' },
  },
};

export const getDefaultSample = (category: string, language = 'english') => {
  const config = getFestivalFields(category);
  const title = (language === 'hindi' && config.titleHi)
    || (language === 'marathi' && config.titleMr)
    || config.title
    || 'Celebration';
  const samples: Record<string, Record<string, string>> = {
    english: { blessingLine: `|| ${title} ||`, hostName: 'Host Family', message: 'Invite you to celebrate', eventName: title as string, dateLabel: 'Join us!', date: 'Sunday, 1 January 2026', aartiTimes: '10:00 AM onwards', visarjanLabel: 'Closing', visarjanDate: 'Sunday, 8 January 2026', venue: 'Venue Address', closingLine: 'With love and joy' },
    hindi: { blessingLine: `॥ ${title} ॥`, hostName: 'मेजबान परिवार', message: 'आपको इस खास मौके पर आमंत्रित करते हैं', eventName: title as string, dateLabel: 'हमारे साथ जुड़ें!', date: 'रविवार, 1 जनवरी 2026', aartiTimes: 'सुबह 10:00 बजे से', visarjanLabel: 'समापन', visarjanDate: 'रविवार, 8 जनवरी 2026', venue: 'स्थान का पता', closingLine: 'प्रेम और खुशी के साथ' },
    marathi: { blessingLine: `॥ ${title} ॥`, hostName: 'यजमान परिवार', message: 'या खास प्रसंगी आमंत्रित', eventName: title as string, dateLabel: 'आमच्यासोबत सामील व्हा!', date: 'रविवार, 1 जानेवारी 2026', aartiTimes: 'सकाळी 10:00 वाजतापासून', visarjanLabel: 'समापन', visarjanDate: 'रविवार, 8 जानेवारी 2026', venue: 'स्थान पत्ता', closingLine: 'प्रेम आणि आनंदाने' },
  };
  const ritual: Record<string, string> = {};
  config.fields.forEach((f) => { ritual[f.key] = f.placeholder; });
  const base = samples[language] || samples.english;
  return {
    ...base,
    blessingLine: ritual.blessingLine || base.blessingLine,
    eventName: title,
    dateLabel: language === 'english' ? (ritual.dateLabel || base.dateLabel) : base.dateLabel,
    aartiTimes: language === 'english' ? (ritual.aartiTimes || base.aartiTimes) : base.aartiTimes,
    closingLine: language === 'english' ? (ritual.closingLine || base.closingLine) : base.closingLine,
  };
};
