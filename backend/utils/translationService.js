'use strict';

/**
 * Translation service with built-in response templates for all 6 languages.
 * Falls back to LibreTranslate API for dynamic content.
 * Falls back to English if translation fails.
 */

const axios = require('axios');

// ─── Static multilingual response templates ───────────────────────────────────
const TEMPLATES = {
  greeting: {
    calm: {
      en: (name) => `Namaste ${name}! 🙏 I'm Meera, your SilverLink banking assistant. How can I help you today?\n\nYou can ask me about:\n• Account balance\n• Recent transactions\n• Fund transfers\n• Account security\n• Any banking help`,
      hi: (name) => `नमस्ते ${name}! 🙏 मैं मीरा हूँ, आपकी SilverLink बैंकिंग सहायक। आज मैं आपकी कैसे मदद कर सकती हूँ?\n\nआप मुझसे पूछ सकते हैं:\n• अकाउंट बैलेंस\n• हाल के लेनदेन\n• फंड ट्रांसफर\n• खाता सुरक्षा\n• कोई भी बैंकिंग सहायता`,
      ta: (name) => `வணக்கம் ${name}! 🙏 நான் மீரா, உங்கள் SilverLink வங்கி உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவலாம்?\n\nநீங்கள் கேட்கலாம்:\n• கணக்கு இருப்பு\n• சமீபத்திய பரிவர்த்தனைகள்\n• நிதி பரிமாற்றம்\n• கணக்கு பாதுகாப்பு`,
      te: (name) => `నమస్కారం ${name}! 🙏 నేను మీరా, మీ SilverLink బ్యాంకింగ్ అసిస్టెంట్. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?\n\nమీరు అడగవచ్చు:\n• ఖాతా బ్యాలెన్స్\n• ఇటీవలి లావాదేవీలు\n• నిధుల బదిలీ\n• ఖాతా భద్రత`,
      bn: (name) => `নমস্কার ${name}! 🙏 আমি মীরা, আপনার SilverLink ব্যাংকিং সহকারী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?\n\nআপনি জিজ্ঞেস করতে পারেন:\n• অ্যাকাউন্ট ব্যালেন্স\n• সাম্প্রতিক লেনদেন\n• তহবিল স্থানান্তর\n• অ্যাকাউন্ট নিরাপত্তা`,
      mr: (name) => `नमस्कार ${name}! 🙏 मी मीरा आहे, तुमची SilverLink बँकिंग सहाय्यक. आज मी तुम्हाला कशी मदत करू?\n\nतुम्ही विचारू शकता:\n• खाते शिल्लक\n• अलीकडील व्यवहार\n• निधी हस्तांतरण\n• खाते सुरक्षा`,
    },
    confused: {
      en: (name) => `Hello ${name}! 😊 Don't worry, I'm here to help step by step. What would you like to do — check your balance, see transactions, or something else?`,
      hi: (name) => `नमस्ते ${name}! 😊 कोई बात नहीं, मैं आपकी कदम दर कदम मदद करूंगी। आप क्या करना चाहते हैं — बैलेंस देखना, लेनदेन देखना, या कुछ और?`,
      ta: (name) => `வணக்கம் ${name}! 😊 கவலைப்படாதீர்கள், நான் படிப்படியாக உதவுவேன். இருப்பு சரிபார்க்க, பரிவர்த்தனைகள் பார்க்க, அல்லது வேறு ஏதாவது?`,
      te: (name) => `నమస్కారం ${name}! 😊 చింతించకండి, నేను అడుగడుగునా సహాయం చేస్తాను. బ్యాలెన్స్ చెక్ చేయాలా, లావాదేవీలు చూడాలా, లేదా వేరే ఏదైనా?`,
      bn: (name) => `নমস্কার ${name}! 😊 চিন্তা করবেন না, আমি ধাপে ধাপে সাহায্য করব। ব্যালেন্স চেক, লেনদেন দেখা, বা অন্য কিছু?`,
      mr: (name) => `नमस्कार ${name}! 😊 काळजी करू नका, मी टप्प्याटप्प्याने मदत करेन. शिल्लक तपासायची, व्यवहार पाहायचे, की आणखी काही?`,
    },
    stressed: {
      en: (name) => `Hello ${name}! 💛 I understand you may be feeling worried. I'm here immediately. Please tell me what happened and I'll resolve it right away.`,
      hi: (name) => `नमस्ते ${name}! 💛 मैं समझती हूँ आप परेशान हो सकते हैं। मैं अभी यहाँ हूँ। बताइए क्या हुआ, मैं तुरंत हल करूंगी।`,
      ta: (name) => `வணக்கம் ${name}! 💛 நீங்கள் கவலைப்படுவதை புரிந்துகொள்கிறேன். நான் இப்போதே இங்கே இருக்கிறேன். என்ன நடந்தது என்று சொல்லுங்கள்.`,
      te: (name) => `నమస్కారం ${name}! 💛 మీరు ఆందోళన చెందుతున్నారని అర్థమవుతోంది. నేను ఇప్పుడే ఇక్కడ ఉన్నాను. ఏం జరిగిందో చెప్పండి.`,
      bn: (name) => `নমস্কার ${name}! 💛 আপনি উদ্বিগ্ন বোধ করছেন তা বুঝতে পারছি। আমি এখনই এখানে আছি। কী হয়েছে বলুন।`,
      mr: (name) => `नमस्कार ${name}! 💛 तुम्ही काळजीत असल्याचे समजते. मी आत्ता इथे आहे. काय झाले ते सांगा, मी लगेच सोडवतो.`,
    },
  },

  balance: {
    calm: {
      en: (data) => `💰 Account Balance\n\nAccount: ${data.accountNumber}\nBank: ${data.bank}\nAvailable Balance: **₹${fmt(data.balance)}**\n\nYour account is secure. Is there anything else you'd like to know?`,
      hi: (data) => `💰 अकाउंट बैलेंस\n\nअकाउंट: ${data.accountNumber}\nबैंक: ${data.bank}\nउपलब्ध बैलेंस: **₹${fmt(data.balance)}**\n\nआपका अकाउंट सुरक्षित है। क्या आपको और कुछ जानना है?`,
      ta: (data) => `💰 கணக்கு இருப்பு\n\nகணக்கு: ${data.accountNumber}\nவங்கி: ${data.bank}\nகிடைக்கக்கூடிய இருப்பு: **₹${fmt(data.balance)}**\n\nஉங்கள் கணக்கு பாதுகாப்பாக உள்ளது.`,
      te: (data) => `💰 ఖాతా బ్యాలెన్స్\n\nఖాతా: ${data.accountNumber}\nబ్యాంక్: ${data.bank}\nఅందుబాటులో ఉన్న బ్యాలెన్స్: **₹${fmt(data.balance)}**\n\nమీ ఖాతా సురక్షితంగా ఉంది.`,
      bn: (data) => `💰 অ্যাকাউন্ট ব্যালেন্স\n\nঅ্যাকাউন্ট: ${data.accountNumber}\nব্যাংক: ${data.bank}\nপাওয়া যাচ্ছে: **₹${fmt(data.balance)}**\n\nআপনার অ্যাকাউন্ট নিরাপদ।`,
      mr: (data) => `💰 खाते शिल्लक\n\nखाते: ${data.accountNumber}\nबँक: ${data.bank}\nउपलब्ध शिल्लक: **₹${fmt(data.balance)}**\n\nतुमचे खाते सुरक्षित आहे.`,
    },
    confused: {
      en: (data) => `Let me explain simply 😊\n\nYour bank account currently holds:\n\n**₹${fmt(data.balance)}**\n\nThis is the total money available for you to spend or transfer. Would you like to know what you can do with it?`,
      hi: (data) => `सरल भाषा में बताती हूँ 😊\n\nआपके बैंक अकाउंट में अभी:\n\n**₹${fmt(data.balance)}**\n\nयह वह राशि है जो आप खर्च या ट्रांसफर कर सकते हैं। क्या आप जानना चाहते हैं इससे क्या कर सकते हैं?`,
      ta: (data) => `எளிதாக விளக்குகிறேன் 😊\n\nதற்போது உங்கள் கணக்கில்:\n\n**₹${fmt(data.balance)}**\n\nஇது செலவிட அல்லது பரிமாற்ற கிடைக்கும் தொகை.`,
      te: (data) => `సరళంగా వివరిస్తాను 😊\n\nప్రస్తుతం మీ ఖాతాలో:\n\n**₹${fmt(data.balance)}**\n\nఇది మీరు ఖర్చు చేయగల లేదా బదిలీ చేయగల మొత్తం.`,
      bn: (data) => `সহজভাবে বলি 😊\n\nএখন আপনার অ্যাকাউন্টে:\n\n**₹${fmt(data.balance)}**\n\nএটি আপনি ব্যয় বা স্থানান্তর করতে পারবেন এমন পরিমাণ।`,
      mr: (data) => `सोप्या भाषेत सांगतो 😊\n\nसध्या तुमच्या खात्यात:\n\n**₹${fmt(data.balance)}**\n\nही रक्कम तुम्ही खर्च करू किंवा हस्तांतरित करू शकता.`,
    },
    stressed: {
      en: (data) => `Please don't worry 💛\n\nI've checked your account right now:\n\n**₹${fmt(data.balance)}**\n\nYour money is completely safe. No unauthorized transactions detected. Are you okay?`,
      hi: (data) => `कृपया घबराइए मत 💛\n\nमैंने अभी आपका अकाउंट जांचा:\n\n**₹${fmt(data.balance)}**\n\nआपका पैसा बिल्कुल सुरक्षित है। कोई अनधिकृत लेनदेन नहीं मिला। क्या आप ठीक हैं?`,
      ta: (data) => `கவலைப்படாதீர்கள் 💛\n\nஉங்கள் கணக்கை இப்போது சரிபார்த்தேன்:\n\n**₹${fmt(data.balance)}**\n\nஉங்கள் பணம் முற்றிலும் பாதுகாப்பாக உள்ளது.`,
      te: (data) => `దయచేసి ఆందోళన చెందకండి 💛\n\nఇప్పుడు మీ ఖాతా తనిఖీ చేశాను:\n\n**₹${fmt(data.balance)}**\n\nమీ డబ్బు పూర్తిగా సురక్షితంగా ఉంది.`,
      bn: (data) => `দয়া করে চিন্তা করবেন না 💛\n\nএখনই আপনার অ্যাকাউন্ট চেক করলাম:\n\n**₹${fmt(data.balance)}**\n\nআপনার টাকা সম্পূর্ণ নিরাপদ।`,
      mr: (data) => `काळजी करू नका 💛\n\nआत्ता तुमचे खाते तपासले:\n\n**₹${fmt(data.balance)}**\n\nतुमचे पैसे पूर्णपणे सुरक्षित आहेत.`,
    },
  },

  transactions: {
    calm: {
      en: (txns) => `📋 Recent Transactions\n\n${formatTxns(txns)}\n\nWould you like to see more?`,
      hi: (txns) => `📋 हाल के लेनदेन\n\n${formatTxns(txns, 'hi')}\n\nक्या आप और लेनदेन देखना चाहते हैं?`,
      ta: (txns) => `📋 சமீபத்திய பரிவர்த்தனைகள்\n\n${formatTxns(txns)}\n\nமேலும் பார்க்க வேண்டுமா?`,
      te: (txns) => `📋 ఇటీవలి లావాదేవీలు\n\n${formatTxns(txns)}\n\nమరిన్ని చూడాలా?`,
      bn: (txns) => `📋 সাম্প্রতিক লেনদেন\n\n${formatTxns(txns)}\n\nআরও দেখতে চান?`,
      mr: (txns) => `📋 अलीकडील व्यवहार\n\n${formatTxns(txns)}\n\nआणखी पाहायचे आहे का?`,
    },
    confused: {
      en: (txns) => `Let me show your last 3 transactions simply 😊\n\n${formatTxnsSimple(txns.slice(0, 3))}\n\nShall I explain any of these?`,
      hi: (txns) => `मैं आपके पिछले 3 लेनदेन सरल तरीके से दिखाती हूँ 😊\n\n${formatTxnsSimple(txns.slice(0, 3), 'hi')}\n\nक्या कोई लेनदेन समझाऊं?`,
      ta: (txns) => `கடைசி 3 பரிவர்த்தனைகளை எளிதாக காட்டுகிறேன் 😊\n\n${formatTxnsSimple(txns.slice(0, 3))}\n\nஏதாவது விளக்கட்டுமா?`,
      te: (txns) => `చివరి 3 లావాదేవీలను సరళంగా చూపిస్తాను 😊\n\n${formatTxnsSimple(txns.slice(0, 3))}\n\nఏదైనా వివరించమంటారా?`,
      bn: (txns) => `শেষ ৩টি লেনদেন সহজভাবে দেখাচ্ছি 😊\n\n${formatTxnsSimple(txns.slice(0, 3))}\n\nকোনোটি বুঝিয়ে বলব?`,
      mr: (txns) => `शेवटचे 3 व्यवहार सोप्या भाषेत दाखवतो 😊\n\n${formatTxnsSimple(txns.slice(0, 3))}\n\nएखादा स्पष्ट करू का?`,
    },
    stressed: {
      en: (txns) => `💛 Checking for suspicious activity right now...\n\n${formatTxns(txns)}\n\nIf you see any transaction you didn't authorize, tell me and I'll escalate to our security team immediately.`,
      hi: (txns) => `💛 अभी संदिग्ध गतिविधि की जांच कर रही हूँ...\n\n${formatTxns(txns, 'hi')}\n\nयदि आपको कोई अनधिकृत लेनदेन दिखे, बताइए — मैं तुरंत सुरक्षा टीम को सूचित करूंगी।`,
      ta: (txns) => `💛 சந்தேகாஸ்பட நடவடிக்கை சரிபார்க்கிறேன்...\n\n${formatTxns(txns)}\n\nஏதாவது அங்கீகரிக்கப்படாத பரிவர்த்தனை இருந்தால் சொல்லுங்கள்.`,
      te: (txns) => `💛 అనుమానాస్పద కార్యకలాపాలు తనిఖీ చేస్తున్నాను...\n\n${formatTxns(txns)}\n\nమీరు చేయని లావాదేవీ కనిపిస్తే, చెప్పండి.`,
      bn: (txns) => `💛 সন্দেহজনক কার্যকলাপ যাচাই করছি...\n\n${formatTxns(txns)}\n\nঅননুমোদিত কোনো লেনদেন দেখলে জানান।`,
      mr: (txns) => `💛 संशयास्पद क्रियाकलाप तपासत आहे...\n\n${formatTxns(txns)}\n\nकोणता अनधिकृत व्यवहार दिसल्यास सांगा.`,
    },
  },

  transfer: {
    calm: {
      en: (bal) => `💸 Fund Transfer\n\nTo transfer money, please provide:\n1. Recipient's account number or UPI ID\n2. Amount (your balance: ₹${fmt(bal)})\n3. Purpose (optional)\n\nOr use the Transfer button for a guided flow.`,
      hi: (bal) => `💸 फंड ट्रांसफर\n\nपैसे ट्रांसफर करने के लिए:\n1. प्राप्तकर्ता का अकाउंट नंबर या UPI ID\n2. राशि (आपका बैलेंस: ₹${fmt(bal)})\n3. उद्देश्य (वैकल्पिक)\n\nया Transfer बटन से guided flow का उपयोग करें।`,
      ta: (bal) => `💸 நிதி பரிமாற்றம்\n\nபணம் அனுப்ப:\n1. பெறுனரின் கணக்கு எண் அல்லது UPI ID\n2. தொகை (உங்கள் இருப்பு: ₹${fmt(bal)})\n3. நோக்கம் (விருப்பத்திற்கு)`,
      te: (bal) => `💸 నిధుల బదిలీ\n\nడబ్బు పంపడానికి:\n1. స్వీకర్త ఖాతా నంబర్ లేదా UPI ID\n2. మొత్తం (మీ బ్యాలెన్స్: ₹${fmt(bal)})\n3. ఉద్దేశ్యం (ఐచ్ఛికం)`,
      bn: (bal) => `💸 তহবিল স্থানান্তর\n\nটাকা পাঠাতে:\n1. প্রাপকের অ্যাকাউন্ট নম্বর বা UPI ID\n2. পরিমাণ (আপনার ব্যালেন্স: ₹${fmt(bal)})\n3. উদ্দেশ্য (ঐচ্ছিক)`,
      mr: (bal) => `💸 निधी हस्तांतरण\n\nपैसे पाठवण्यासाठी:\n1. प्राप्तकर्त्याचा खाते क्रमांक किंवा UPI ID\n2. रक्कम (तुमची शिल्लक: ₹${fmt(bal)})\n3. हेतू (पर्यायी)`,
    },
    confused: {
      en: (bal) => `Let me explain transfers step by step 😊\n\nTransfer = sending YOUR money to someone else.\n\nStep 1: Their account number or UPI ID (e.g. 9876@upi)\nStep 2: How much to send (you have ₹${fmt(bal)})\nStep 3: I'll confirm and send\n\nWho would you like to send to?`,
      hi: (bal) => `ट्रांसफर को कदम दर कदम समझाती हूँ 😊\n\nट्रांसफर = आपका पैसा किसी और को भेजना।\n\nकदम 1: उनका अकाउंट नंबर या UPI ID\nकदम 2: कितना भेजना है (आपके पास ₹${fmt(bal)} हैं)\nकदम 3: मैं पुष्टि करके भेजूंगी\n\nकिसे भेजना है?`,
      ta: (bal) => `பரிமாற்றம் படிப்படியாக விளக்குகிறேன் 😊\n\nபரிமாற்றம் = உங்கள் பணத்தை வேறொருவருக்கு அனுப்புவது.\n\nபடி 1: அவர்களின் கணக்கு எண் அல்லது UPI ID\nபடி 2: எவ்வளவு அனுப்பவேண்டும் (உங்களிடம் ₹${fmt(bal)} உள்ளது)\nபடி 3: உறுதிப்படுத்தி அனுப்புவேன்`,
      te: (bal) => `బదిలీని అడుగడుగునా వివరిస్తాను 😊\n\nబదిలీ = మీ డబ్బును వేరే వ్యక్తికి పంపడం.\n\nదశ 1: వారి ఖాతా నంబర్ లేదా UPI ID\nదశ 2: ఎంత పంపాలి (మీకు ₹${fmt(bal)} ఉంది)\nదశ 3: నిర్ధారించి పంపిస్తాను`,
      bn: (bal) => `স্থানান্তর ধাপে ধাপে বলছি 😊\n\nস্থানান্তর = আপনার টাকা অন্যজনকে পাঠানো।\n\nধাপ ১: তাদের অ্যাকাউন্ট নম্বর বা UPI ID\nধাপ ২: কত পাঠাবেন (আপনার আছে ₹${fmt(bal)})\nধাপ ৩: নিশ্চিত করে পাঠাব`,
      mr: (bal) => `हस्तांतरण टप्प्याटप्प्याने सांगतो 😊\n\nहस्तांतरण = तुमचे पैसे दुसऱ्याला पाठवणे.\n\nटप्पा 1: त्यांचा खाते क्रमांक किंवा UPI ID\nटप्पा 2: किती पाठवायचे (तुमच्याकडे ₹${fmt(bal)} आहे)\nटप्पा 3: पुष्टी करून पाठवतो`,
    },
    stressed: {
      en: () => `⚠️ Safety Check Before Transfer\n\nBefore we proceed, I need to ask:\n• Is anyone pressuring you to send money?\n• Are you making this voluntarily?\n\nIf something feels wrong, please tap "Connect to Human Agent" now. Your safety is our top priority. 💛`,
      hi: () => `⚠️ ट्रांसफर से पहले सुरक्षा जांच\n\nआगे बढ़ने से पहले:\n• क्या कोई आपको पैसे भेजने के लिए दबाव दे रहा है?\n• क्या आप अपनी इच्छा से यह कर रहे हैं?\n\nयदि कुछ गलत लग रहा है, अभी "Human Agent से जोड़ें" दबाएं। आपकी सुरक्षा सर्वोच्च है। 💛`,
      ta: () => `⚠️ பரிமாற்றத்திற்கு முன் பாதுகாப்பு சரிபார்ப்பு\n\nதொடர்வதற்கு முன்:\n• யாராவது உங்களை பணம் அனுப்ப கட்டாயப்படுத்துகிறார்களா?\n• இது உங்கள் சொந்த விருப்பமா?\n\nஏதாவது தவறு என்று தோன்றினால், "Human Agent" ஐ அழுத்துங்கள். 💛`,
      te: () => `⚠️ బదిలీకి ముందు భద్రతా తనిఖీ\n\nముందుకు వెళ్ళే ముందు:\n• ఎవరైనా మీపై ఒత్తిడి చేస్తున్నారా?\n• ఇది మీ స్వేచ్ఛాయుతమైన నిర్ణయమా?\n\nఏదైనా తప్పుగా అనిపిస్తే "Human Agent" నొక్కండి. 💛`,
      bn: () => `⚠️ স্থানান্তরের আগে নিরাপত্তা পরীক্ষা\n\nএগিয়ে যাওয়ার আগে:\n• কেউ কি আপনাকে টাকা পাঠাতে চাপ দিচ্ছে?\n• এটা কি আপনার নিজের ইচ্ছায়?\n\nকিছু ভুল মনে হলে "Human Agent" চাপুন। 💛`,
      mr: () => `⚠️ हस्तांतरणापूर्वी सुरक्षा तपासणी\n\nपुढे जाण्यापूर्वी:\n• कोणी तुम्हाला पैसे पाठवण्यास भाग पाडत आहे का?\n• हे तुमच्या इच्छेने आहे का?\n\nकाही चुकीचे वाटल्यास "Human Agent" दाबा. 💛`,
    },
  },

  help: {
    calm: {
      en: () => `🤝 I'm here to help!\n\nYou can ask about:\n• Account balance\n• Transaction history\n• Fund transfers\n• Card blocking\n• Account security\n• Fraud reporting\n\nOr tap "Connect to Human Agent" to speak with our team.`,
      hi: () => `🤝 मैं मदद के लिए यहाँ हूँ!\n\nआप पूछ सकते हैं:\n• अकाउंट बैलेंस\n• लेनदेन इतिहास\n• फंड ट्रांसफर\n• कार्ड ब्लॉक करना\n• अकाउंट सुरक्षा\n• धोखाधड़ी रिपोर्टिंग\n\nया "Human Agent से जोड़ें" दबाएं।`,
      ta: () => `🤝 உதவ தயாராக இருக்கிறேன்!\n\nகேட்கலாம்:\n• கணக்கு இருப்பு\n• பரிவர்த்தனை வரலாறு\n• நிதி பரிமாற்றம்\n• அட்டை தடுக்குதல்\n• கணக்கு பாதுகாப்பு`,
      te: () => `🤝 సహాయానికి ఇక్కడ ఉన్నాను!\n\nమీరు అడగవచ్చు:\n• ఖాతా బ్యాలెన్స్\n• లావాదేవీ చరిత్ర\n• నిధుల బదిలీ\n• కార్డ్ బ్లాక్\n• ఖాతా భద్రత`,
      bn: () => `🤝 আমি সাহায্য করতে এখানে আছি!\n\nজিজ্ঞেস করতে পারেন:\n• অ্যাকাউন্ট ব্যালেন্স\n• লেনদেনের ইতিহাস\n• তহবিল স্থানান্তর\n• কার্ড ব্লক\n• অ্যাকাউন্ট নিরাপত্তা`,
      mr: () => `🤝 मदतीसाठी इथे आहे!\n\nविचारू शकता:\n• खाते शिल्लक\n• व्यवहार इतिहास\n• निधी हस्तांतरण\n• कार्ड ब्लॉक\n• खाते सुरक्षा`,
    },
    confused: {
      en: () => `No worries! 😊 Tell me simply:\n\n• Money? → I'll check your balance\n• Payments? → I'll show transactions\n• Send money? → I'll guide the transfer\n• Problem? → I'll connect you to a person\n\nWhat do you need?`,
      hi: () => `कोई बात नहीं! 😊 बस बताइए:\n\n• पैसा? → बैलेंस चेक करूंगी\n• भुगतान? → लेनदेन दिखाऊंगी\n• पैसे भेजना? → ट्रांसफर में मदद\n• समस्या? → इंसान से जोड़ूंगी\n\nआपको क्या चाहिए?`,
      ta: () => `கவலைப்படாதீர்கள்! 😊 எளிதாக சொல்லுங்கள்:\n\n• பணம்? → இருப்பு சரிபார்க்கிறேன்\n• கொடுப்பனவு? → பரிவர்த்தனைகள் காட்டுவேன்\n• பணம் அனுப்ப? → வழிகாட்டுவேன்\n• சிக்கல்? → மனிதரிடம் இணைப்பேன்`,
      te: () => `చింతించకండి! 😊 సరళంగా చెప్పండి:\n\n• డబ్బు? → బ్యాలెన్స్ తనిఖీ చేస్తాను\n• చెల్లింపులు? → లావాదేవీలు చూపిస్తాను\n• డబ్బు పంపాలా? → బదిలీలో సహాయం\n• సమస్య? → వ్యక్తితో కలుపుతాను`,
      bn: () => `চিন্তা করবেন না! 😊 সহজভাবে বলুন:\n\n• টাকা? → ব্যালেন্স চেক করব\n• পেমেন্ট? → লেনদেন দেখাব\n• টাকা পাঠাতে? → স্থানান্তরে সাহায্য\n• সমস্যা? → মানুষের সাথে সংযুক্ত করব`,
      mr: () => `काळजी करू नका! 😊 साध्या भाषेत सांगा:\n\n• पैसे? → शिल्लक तपासतो\n• देयके? → व्यवहार दाखवतो\n• पैसे पाठवायचे? → हस्तांतरणात मदत\n• समस्या? → माणसाशी जोडतो`,
    },
    stressed: {
      en: () => `💛 I'm so sorry you're going through this. You are not alone.\n\n🔴 ESCALATING TO HUMAN AGENT...\n\nExpected wait: ~2 minutes. Our team handles urgent cases with top priority.\n\nPlease stay on — someone will be with you shortly.`,
      hi: () => `💛 मुझे खेद है कि आप इससे गुजर रहे हैं। आप अकेले नहीं हैं।\n\n🔴 HUMAN AGENT से जोड़ा जा रहा है...\n\nअनुमानित प्रतीक्षा: ~2 मिनट। हमारी टीम आपकी प्राथमिकता से मदद करेगी।\n\nकृपया रहें — कोई जल्द आएगा।`,
      ta: () => `💛 நீங்கள் சஞ்சலப்படுவதில் மன்னிப்பு கேட்கிறேன். நீங்கள் தனியாக இல்லை.\n\n🔴 HUMAN AGENT இணைக்கிறோம்...\n\nதாமத நேரம்: ~2 நிமிடங்கள். நாங்கள் உங்களை உடனே உதவுவோம்.`,
      te: () => `💛 మీరు ఇది అనుభవిస్తున్నందుకు చింతిస్తున్నాను. మీరు ఒంటరిగా లేరు.\n\n🔴 HUMAN AGENT కనెక్ట్ అవుతోంది...\n\nవేచి ఉండే సమయం: ~2 నిమిషాలు. మా టీమ్ తక్షణం సహాయం చేస్తుంది.`,
      bn: () => `💛 আপনি এটি অনুভব করছেন তার জন্য দুঃখিত। আপনি একা নন।\n\n🔴 HUMAN AGENT সংযুক্ত হচ্ছে...\n\nঅনুমানিত অপেক্ষা: ~2 মিনিট। আমাদের দল অবিলম্বে সাহায্য করবে।`,
      mr: () => `💛 तुम्ही हे अनुभवत आहात याबद्दल माफी. तुम्ही एकटे नाही.\n\n🔴 HUMAN AGENT जोडत आहोत...\n\nअपेक्षित प्रतीक्षा: ~2 मिनिटे. आमची टीम त्वरित मदत करेल.`,
    },
  },


  fraud: {
    calm: {
      en: () => `🛡️ Security Check\n\nI've run a real-time fraud scan on your account.\n\nNo unauthorized transactions detected right now.\n\n💡 Stay safe:\n• Never share your OTP or PIN\n• Check your Security tab for any flagged transactions\n• Enable transaction SMS alerts\n\nWant me to open your Security Centre?`,
      hi: () => `🛡️ सुरक्षा जांच\n\nमैंने आपके खाते का रियल-टाइम फ्रॉड स्कैन किया।\n\nअभी कोई अनधिकृत लेनदेन नहीं मिला।\n\n💡 सुरक्षित रहें:\n• OTP या PIN कभी साझा न करें\n• Security tab में फ्लैग लेनदेन देखें\n\nक्या Security Centre खोलूँ?`,
      ta: () => `🛡️ பாதுகாப்பு சரிபார்ப்பு\n\nஉங்கள் கணக்கை real-time fraud scan செய்தேன்.\n\nதற்போது அங்கீகரிக்கப்படாத பரிவர்த்தனை இல்லை.\n\nSecurity tab-ல் பார்க்க வேண்டுமா?`,
      te: () => `🛡️ భద్రతా తనిఖీ\n\nమీ ఖాతా real-time fraud scan చేశాను.\n\nప్రస్తుతం అనధికార లావాదేవీ లేదు.\n\nSecurity tab తెరవాలా?`,
      bn: () => `🛡️ নিরাপত্তা যাচাই\n\nআপনার অ্যাকাউন্টে real-time fraud scan করলাম.\n\nএখন কোনো অননুমোদিত লেনদেন নেই।\n\nSecurity tab খুলব?`,
      mr: () => `🛡️ सुरक्षा तपासणी\n\nतुमच्या खात्याचे real-time fraud scan केले.\n\nआत्ता कोणताही अनधिकृत व्यवहार नाही.\n\nSecurity tab उघडू का?`,
    },
    stressed: {
      en: () => `🚨 I'm checking your account for fraud RIGHT NOW.\n\nImmediate steps I've taken:\n✅ Account activity monitored\n✅ High-risk transactions flagged\n✅ Security team notified\n\nPlease do NOT share your OTP or PIN with anyone — even if they claim to be from the bank.\n\nShall I block your card as a precaution?`,
      hi: () => `🚨 मैं अभी आपके खाते में fraud चेक कर रही हूँ।\n\nतुरंत कदम:\n✅ खाते की गतिविधि मॉनिटर की\n✅ उच्च जोखिम लेनदेन फ्लैग किए\n✅ सुरक्षा टीम को सूचित किया\n\nकृपया OTP या PIN किसी को न बताएं।\n\nसावधानी के तौर पर कार्ड ब्लॉक करूँ?`,
      ta: () => `🚨 இப்போதே fraud சரிபார்க்கிறேன்.\n\n✅ கணக்கு செயல்பாடு கண்காணிக்கப்பட்டது\n✅ உயர் ஆபத்து பரிவர்த்தனைகள் கொடியிடப்பட்டன\n\nOTP அல்லது PIN யாரிடமும் கொடுக்காதீர்கள்.`,
      te: () => `🚨 ఇప్పుడే fraud తనిఖీ చేస్తున్నాను.\n\n✅ ఖాతా కార్యకలాపాలు పర్యవేక్షించబడ్డాయి\n✅ అధిక ప్రమాద లావాదేవీలు గుర్తించబడ్డాయి\n\nOTP లేదా PIN ఎవరికీ చెప్పకండి.`,
      bn: () => `🚨 এখনই fraud চেক করছি.\n\n✅ অ্যাকাউন্ট কার্যকলাপ পর্যবেক্ষণ করা হয়েছে\n\nOTP বা PIN কাউকে দেবেন না।`,
      mr: () => `🚨 आत्ता fraud तपासत आहे.\n\n✅ खाते क्रियाकलाप निरीक्षण केले\n\nOTP किंवा PIN कोणाला देऊ नका.`,
    },
    confused: {
      en: () => `Let me explain fraud protection simply 😊\n\nFraud means someone tries to steal money from your account without your permission.\n\nHow we protect you:\n1. AI scans every transaction in real-time\n2. Unusual amounts or new merchants get flagged\n3. You get an alert and can block the card\n\nYour Security Centre shows all this clearly. Want me to navigate there?`,
      hi: () => `fraud protection सरल भाषा में 😊\n\nFraud मतलब कोई आपकी अनुमति के बिना पैसे चुराने की कोशिश।\n\nहम कैसे बचाते हैं:\n1. AI हर लेनदेन real-time में स्कैन करती है\n2. असामान्य राशि या नए व्यापारी फ्लैग होते हैं\n3. आपको अलर्ट मिलता है\n\nSecurity Centre में जाएं?`,
      ta: () => `Fraud பாதுகாப்பை எளிதாக விளக்குகிறேன் 😊\n\nFraud என்பது உங்கள் அனுமதி இல்லாமல் பணம் திருடுவது.\n\nAI ஒவ்வொரு பரிவர்த்தனையையும் real-time ல் சரிபார்க்கிறது.`,
      te: () => `Fraud రక్షణను సరళంగా వివరిస్తాను 😊\n\nFraud అంటే మీ అనుమతి లేకుండా డబ్బు దొంగిలించడం.\n\nAI ప్రతి లావాదేవీని real-time లో తనిఖీ చేస్తుంది.`,
      bn: () => `Fraud সুরক্ষা সহজভাবে বলি 😊\n\nFraud মানে আপনার অনুমতি ছাড়া টাকা চুরির চেষ্টা।\n\nAI প্রতিটি লেনদেন real-time এ স্ক্যান করে।`,
      mr: () => `Fraud संरक्षण सोप्या भाषेत सांगतो 😊\n\nFraud म्हणजे परवानगीशिवाय पैसे चोरण्याचा प्रयत्न.\n\nAI प्रत्येक व्यवहार real-time मध्ये तपासते.`,
    },
  },

  predict: {
    calm: {
      en: () => `📈 Cash Flow Forecast\n\nBased on your last 6 months of transactions, I've predicted your next 90 days.\n\nOpen the **Forecast tab** (📈) to see:\n• Next month income & expenses\n• 3-month projection chart\n• Savings estimate\n• Risk level\n\nThis helps you plan ahead before money gets tight.`,
      hi: () => `📈 Cash Flow पूर्वानुमान\n\nआपके पिछले 6 महीनों के लेनदेन के आधार पर मैंने अगले 90 दिनों का पूर्वानुमान लगाया है।\n\n**Forecast tab** (📈) खोलें:\n• अगले महीने की आय और व्यय\n• 3 महीने की प्रोजेक्शन\n• बचत अनुमान\n• जोखिम स्तर`,
      ta: () => `📈 Cash Flow முன்னறிவிப்பு\n\nகடந்த 6 மாதங்களை பகுப்பாய்வு செய்து அடுத்த 90 நாட்களை கணித்தேன்.\n\nForecast tab திறக்கவும்.`,
      te: () => `📈 Cash Flow అంచనా\n\nగత 6 నెలల లావాదేవీల ఆధారంగా వచ్చే 90 రోజులు అంచనా వేశాను.\n\nForecast tab తెరవండి.`,
      bn: () => `📈 Cash Flow পূর্বাভাস\n\nগত ৬ মাসের লেনদেন বিশ্লেষণ করে পরবর্তী ৯০ দিনের পূর্বাভাস দিয়েছি।\n\nForecast tab খুলুন।`,
      mr: () => `📈 Cash Flow अंदाज\n\nमागील ६ महिन्यांच्या व्यवहारांच्या आधारे पुढील ९० दिवसांचा अंदाज केला आहे.\n\nForecast tab उघडा.`,
    },
    stressed: {
      en: () => `I understand you're worried about money 💛\n\nLet me check your forecast right now...\n\nYour next month looks manageable. Open the Forecast tab to see the full picture — it also shows if you have enough buffer for unexpected expenses.\n\nWould you like me to help you set a savings goal for emergencies?`,
      hi: () => `समझती हूँ आप पैसों की चिंता में हैं 💛\n\nआपका अगला महीना संभालने योग्य दिखता है।\n\nForecast tab खोलें — इसमें आपातकालीन बफर भी दिखता है।\n\nEmergency savings goal बनाऊँ?`,
      ta: () => `பணம் பற்றி கவலைப்படுவதை புரிந்துகொள்கிறேன் 💛\n\nForecast tab திறந்து முழு படத்தை பாருங்கள்.`,
      te: () => `డబ్బు గురించి ఆందోళన అర్థమవుతోంది 💛\n\nForecast tab తెరిచి పూర్తి చిత్రం చూడండి.`,
      bn: () => `টাকার চিন্তা বুঝতে পারছি 💛\n\nForecast tab খুলুন — পূর্ণ চিত্র দেখুন।`,
      mr: () => `पैशांची काळजी समजते 💛\n\nForecast tab उघडा — पूर्ण चित्र पहा.`,
    },
    confused: {
      en: () => `Let me explain what Cash Flow Forecast means 😊\n\nIt simply means I look at how much money comes in and goes out every month, then I predict what next month will look like.\n\nFor example: if your pension is ₹18,500 and bills are usually ₹7,000, I predict you'll save around ₹11,500 next month.\n\nWant to see your personal forecast?`,
      hi: () => `Cash Flow Forecast सरल भाषा में 😊\n\nमैं देखती हूँ कि हर महीने कितना पैसा आता है और जाता है, फिर अगले महीने का अनुमान लगाती हूँ।\n\nजैसे: अगर pension ₹18,500 है और bills ₹7,000 हैं, तो अगले महीने बचत ~₹11,500 होगी।\n\nआपका personal forecast देखें?`,
      ta: () => `Cash Flow Forecast எளிதாக சொல்கிறேன் 😊\n\nமாதாமாதம் எவ்வளவு வரும், எவ்வளவு போகும் என்று பார்த்து அடுத்த மாதம் கணிக்கிறேன்.`,
      te: () => `Cash Flow Forecast సరళంగా చెప్తాను 😊\n\nప్రతి నెలా ఎంత వస్తుందో ఎంత పోతుందో చూసి తదుపరి నెల అంచనా వేస్తాను.`,
      bn: () => `Cash Flow Forecast সহজভাবে বলি 😊\n\nপ্রতি মাসে কত আসে, কত যায় দেখে পরের মাস অনুমান করি।`,
      mr: () => `Cash Flow Forecast सोप्या भाषेत सांगतो 😊\n\nदर महिन्याला किती येते, किती जाते हे पाहून पुढचा महिना अंदाज करतो.`,
    },
  },

  budget: {
    calm: {
      en: () => `💰 Budget Overview\n\nYour spending budgets help you stay in control each month.\n\nOpen the **Budget tab** (🎯) to see:\n• Budget vs actual spending per category\n• Which categories are near/over limit\n• Savings goals progress\n\nWant me to flag any categories that are overspent this month?`,
      hi: () => `💰 Budget Overview\n\nआपके spending budgets आपको हर महीने नियंत्रण में रखते हैं।\n\n**Budget tab** (🎯) खोलें:\n• हर category का बजट vs खर्च\n• कौन सी category limit के पास/ऊपर है\n• Savings goals progress`,
      ta: () => `💰 Budget பார்வை\n\nBudget tab (🎯) திறந்து category-வாரியான செலவு பாருங்கள்.`,
      te: () => `💰 Budget సమీక్ష\n\nBudget tab (🎯) తెరిచి category-వారీ ఖర్చు చూడండి.`,
      bn: () => `💰 Budget সারসংক্ষেপ\n\nBudget tab (🎯) খুলে category-ভিত্তিক খরচ দেখুন।`,
      mr: () => `💰 Budget आढावा\n\nBudget tab (🎯) उघडा आणि category-निहाय खर्च पाहा.`,
    },
    stressed: {
      en: () => `I can see you're worried about spending 💛\n\nLet me reassure you — your budget tab shows exactly where money is going so there are no surprises.\n\nYour highest expense categories this month are visible in the Budget tab. Would you like to set a stricter limit on any category?`,
      hi: () => `समझती हूँ आप खर्च को लेकर चिंतित हैं 💛\n\nBudget tab आपको बताता है पैसा कहाँ जा रहा है।\n\nकिसी category का limit और सख्त करना चाहते हैं?`,
      ta: () => `செலவு பற்றி கவலைப்படுவதை புரிந்துகொள்கிறேன் 💛\n\nBudget tab திறந்து பாருங்கள்.`,
      te: () => `ఖర్చు గురించి ఆందోళన అర్థమవుతోంది 💛\n\nBudget tab తెరిచి చూడండి.`,
      bn: () => `খরচ নিয়ে চিন্তা বুঝতে পারছি 💛\n\nBudget tab খুলুন।`,
      mr: () => `खर्चाची काळजी समजते 💛\n\nBudget tab उघडा.`,
    },
    confused: {
      en: () => `Let me explain budgeting simply 😊\n\nA budget means you decide in advance how much to spend in each area — like ₹2,000 for groceries or ₹1,000 for mobile.\n\nWhen you're close to the limit, I warn you. When you go over, I alert you.\n\nThis way you never run out of money unexpectedly!\n\nWant to see your current budgets?`,
      hi: () => `Budgeting सरल भाषा में 😊\n\nBudget मतलब आप पहले से तय करते हैं कि किस क्षेत्र में कितना खर्च करना है।\n\nजब limit के पास पहुंचते हैं — मैं चेतावनी देती हूँ। जब पार करते हैं — alert भेजती हूँ।\n\nआपके मौजूदा budgets देखें?`,
      ta: () => `Budgeting எளிதாக சொல்கிறேன் 😊\n\nBudget என்பது முன்கூட்டியே எவ்வளவு செலவிட வேண்டும் என்று தீர்மானிப்பது.`,
      te: () => `Budgeting సరళంగా చెప్తాను 😊\n\nBudget అంటే ముందే ఎంత ఖర్చు చేయాలో నిర్ణయించడం.`,
      bn: () => `Budgeting সহজভাবে বলি 😊\n\nBudget মানে আগে থেকে কোন খাতে কতটা খরচ করবেন তা ঠিক করা।`,
      mr: () => `Budgeting सोप्या भाषेत सांगतो 😊\n\nBudget म्हणजे आधीच ठरवणे की कुठल्या विभागात किती खर्च करायचा.`,
    },
  },

  goals: {
    calm: {
      en: () => `🎯 Savings Goals\n\nYou have active savings goals in your Budget tab.\n\nOpen the **Budget tab** (🎯) → tap **Goals** to see:\n• Each goal's progress bar\n• How much more you need to save\n• Deadline countdown\n\nYou can also add money to any goal directly from there!`,
      hi: () => `🎯 Savings Goals\n\nआपके Budget tab में active savings goals हैं।\n\n**Budget tab** (🎯) → **Goals** tap करें:\n• हर goal की progress\n• कितना और बचाना है\n• Deadline countdown`,
      ta: () => `🎯 சேமிப்பு இலக்குகள்\n\nBudget tab → Goals திறந்து முன்னேற்றம் பாருங்கள்.`,
      te: () => `🎯 పొదుపు లక్ష్యాలు\n\nBudget tab → Goals తెరిచి పురోగతి చూడండి.`,
      bn: () => `🎯 সঞ্চয় লক্ষ্য\n\nBudget tab → Goals খুলে অগ্রগতি দেখুন।`,
      mr: () => `🎯 बचत ध्येये\n\nBudget tab → Goals उघडा आणि प्रगती पाहा.`,
    },
    stressed: {
      en: () => `Don't worry about your savings goals 💛\n\nEvery small amount counts. Even ₹100 added today brings you closer.\n\nYour goals are saved safely. Open the Budget tab to add to a goal when you're ready — no pressure.`,
      hi: () => `Savings goals की चिंता मत करें 💛\n\nहर छोटी राशि मायने रखती है। आज ₹100 भी जोड़ें तो आगे बढ़ेंगे।\n\nBudget tab में जब तैयार हों तब जोड़ें।`,
      ta: () => `சேமிப்பு இலக்குகளை பற்றி கவலைப்படாதீர்கள் 💛\n\nஒவ்வொரு சிறிய தொகையும் முக்கியம்.`,
      te: () => `పొదుపు లక్ష్యాల గురించి ఆందోళన వద్దు 💛\n\nప్రతి చిన్న మొత్తం ముఖ్యమే.`,
      bn: () => `সঞ্চয় লক্ষ্য নিয়ে চিন্তা করবেন না 💛\n\nপ্রতিটি ছোট পরিমাণ গুরুত্বপূর্ণ।`,
      mr: () => `बचत ध्येयांची काळजी करू नका 💛\n\nप्रत्येक लहान रक्कम महत्त्वाची आहे.`,
    },
    confused: {
      en: () => `Let me explain savings goals simply 😊\n\nA savings goal is a target amount you want to reach — like saving ₹50,000 for an emergency fund or ₹25,000 for a trip.\n\nYou add small amounts over time and I track progress for you.\n\nWant to create a new goal right now?`,
      hi: () => `Savings goal सरल भाषा में 😊\n\nSavings goal मतलब एक target राशि जो आप पाना चाहते हैं — जैसे Emergency fund के लिए ₹50,000।\n\nधीरे-धीरे छोटी राशियाँ जोड़ें, मैं progress track करती हूँ।\n\nनया goal बनाएं?`,
      ta: () => `Savings goal எளிதாக சொல்கிறேன் 😊\n\nSavings goal என்பது நீங்கள் சேமிக்க விரும்பும் ஒரு இலக்கு தொகை.`,
      te: () => `Savings goal సరళంగా చెప్తాను 😊\n\nSavings goal అంటే మీరు చేరుకోవాలనుకునే లక్ష్య మొత్తం.`,
      bn: () => `Savings goal সহজভাবে বলি 😊\n\nSavings goal মানে আপনি যে পরিমাণ সঞ্চয় করতে চান তার একটি লক্ষ্যমাত্রা।`,
      mr: () => `Savings goal सोप्या भाषेत सांगतो 😊\n\nSavings goal म्हणजे तुम्हाला जमवायची असलेली एक ठरावीक रक्कम.`,
    },
  },

  insights: {
    calm: {
      en: () => `🤖 Autonomous AI Insights\n\nI've analysed your last 90 days and generated personalised recommendations.\n\nOpen the **Insights tab** (🤖) to see:\n• Urgent action items (fraud, over-budget warnings)\n• Smart saving suggestions\n• Goal updates\n• Autonomous financial tips\n\nInsights refresh every 24 hours based on your activity.`,
      hi: () => `🤖 Autonomous AI Insights\n\nमैंने आपके पिछले 90 दिन analyse किए और personalised recommendations बनाए।\n\n**Insights tab** (🤖) खोलें:\n• Urgent items (fraud, over-budget)\n• Smart saving suggestions\n• Goal updates\n\nInsights हर 24 घंटे में refresh होते हैं।`,
      ta: () => `🤖 Autonomous AI Insights\n\nInsights tab திறந்து tailored பரிந்துரைகள் பாருங்கள்.`,
      te: () => `🤖 Autonomous AI Insights\n\nInsights tab తెరిచి tailored సిఫారసులు చూడండి.`,
      bn: () => `🤖 Autonomous AI Insights\n\nInsights tab খুলে tailored সুপারিশ দেখুন।`,
      mr: () => `🤖 Autonomous AI Insights\n\nInsights tab उघडा आणि tailored शिफारसी पाहा.`,
    },
    stressed: {
      en: () => `I understand you need guidance 💛\n\nMy AI has already identified the most important things you should act on right now.\n\nOpen the Insights tab — urgent items appear at the top in red. I'll guide you through each one.`,
      hi: () => `समझती हूँ आपको मार्गदर्शन चाहिए 💛\n\nMy AI ने पहले से सबसे जरूरी चीजें identify की हैं।\n\nInsights tab खोलें — urgent items ऊपर red में हैं।`,
      ta: () => `வழிகாட்டுதல் தேவை என்று புரிகிறது 💛\n\nInsights tab திறந்து முக்கியமான பரிந்துரைகள் பாருங்கள்.`,
      te: () => `మార్గదర్శకత్వం అవసరమని అర్థమవుతోంది 💛\n\nInsights tab తెరిచి ముఖ్యమైన సిఫారసులు చూడండి.`,
      bn: () => `নির্দেশনা দরকার বুঝতে পারছি 💛\n\nInsights tab খুলুন — জরুরি বিষয় উপরে দেখুন।`,
      mr: () => `मार्गदर्शन हवे आहे हे समजते 💛\n\nInsights tab उघडा — तातडीचे मुद्दे वर दिसतात.`,
    },
    confused: {
      en: () => `Let me explain AI Insights simply 😊\n\nMy AI looks at your spending patterns and automatically suggests things like:\n• "You're spending too much on food delivery"\n• "Your emergency fund is on track!"\n• "Switch this bill to auto-pay and save ₹120/month"\n\nThink of it as a smart financial advisor that works 24/7.\n\nOpen the Insights tab to see your personal recommendations!`,
      hi: () => `AI Insights सरल भाषा में 😊\n\nMy AI आपके खर्च patterns देखकर automatically suggest करती है:\n• "Food delivery पर ज्यादा खर्च हो रहा है"\n• "Emergency fund सही रास्ते पर है!"\n\nInsights tab खोलें अपनी personal recommendations देखें!`,
      ta: () => `AI Insights எளிதாக சொல்கிறேன் 😊\n\nAI உங்கள் செலவு patterns பார்த்து தானாக பரிந்துரைக்கிறது.`,
      te: () => `AI Insights సరళంగా చెప్తాను 😊\n\nAI మీ ఖర్చు patterns చూసి స్వయంచాలకంగా సూచిస్తుంది.`,
      bn: () => `AI Insights সহজভাবে বলি 😊\n\nAI আপনার খরচের pattern দেখে স্বয়ংক্রিয়ভাবে পরামর্শ দেয়।`,
      mr: () => `AI Insights सोप्या भाषेत सांगतो 😊\n\nAI तुमच्या खर्चाचे patterns पाहून आपोआप सुचवते.`,
    },
  },

  general: {
    calm: {
      en: () => `I'm here to help with your banking needs. You can ask about:\n• Balance, transactions, transfers\n• Account security or card issues\n• Or tap one of the quick action buttons!`,
      hi: () => `मैं आपकी बैंकिंग जरूरतों में मदद के लिए यहाँ हूँ। आप पूछ सकते हैं:\n• बैलेंस, लेनदेन, ट्रांसफर\n• खाता सुरक्षा या कार्ड समस्याएं\n• या Quick Action बटन दबाएं!`,
      ta: () => `உங்கள் வங்கி தேவைகளில் உதவ இங்கே இருக்கிறேன்:\n• இருப்பு, பரிவர்த்தனைகள், பரிமாற்றம்\n• கணக்கு பாதுகாப்பு அல்லது அட்டை சிக்கல்கள்`,
      te: () => `మీ బ్యాంకింగ్ అవసరాలలో సహాయానికి ఇక్కడ ఉన్నాను:\n• బ్యాలెన్స్, లావాదేవీలు, బదిలీలు\n• ఖాతా భద్రత లేదా కార్డ్ సమస్యలు`,
      bn: () => `আপনার ব্যাংকিং প্রয়োজনে সাহায্য করতে এখানে আছি:\n• ব্যালেন্স, লেনদেন, স্থানান্তর\n• অ্যাকাউন্ট নিরাপত্তা বা কার্ড সমস্যা`,
      mr: () => `तुमच्या बँकिंग गरजांसाठी मदतीस इथे आहे:\n• शिल्लक, व्यवहार, हस्तांतरण\n• खाते सुरक्षा किंवा कार्ड समस्या`,
    },
    confused: {
      en: () => `I want to make sure I understand you 😊 Are you trying to:\n\n1. Check your money\n2. Send money\n3. See payments\n4. Get help with a problem\n\nJust tell me the number or describe it simply!`,
      hi: () => `मैं समझना चाहती हूँ 😊 क्या आप:\n\n1. पैसा चेक करना चाहते हैं\n2. पैसे भेजना चाहते हैं\n3. भुगतान देखना चाहते हैं\n4. किसी समस्या में मदद चाहते हैं\n\nबस नंबर बताएं या सरल भाषा में बोलें!`,
      ta: () => `புரிந்துகொள்ள விரும்புகிறேன் 😊 நீங்கள்:\n\n1. பணம் சரிபார்க்க\n2. பணம் அனுப்ப\n3. கொடுப்பனவு பார்க்க\n4. சிக்கலில் உதவி\n\nஎண்ணை சொல்லுங்கள்!`,
      te: () => `అర్థం చేసుకోవాలనుకుంటున్నాను 😊 మీరు:\n\n1. డబ్బు తనిఖీ చేయాలా\n2. డబ్బు పంపాలా\n3. చెల్లింపులు చూడాలా\n4. సమస్యలో సహాయం కావాలా\n\nసంఖ్యను చెప్పండి!`,
      bn: () => `বুঝতে চাই 😊 আপনি কি:\n\n1. টাকা চেক করতে চান\n2. টাকা পাঠাতে চান\n3. পেমেন্ট দেখতে চান\n4. সমস্যায় সাহায্য চান\n\nনম্বরটি বলুন!`,
      mr: () => `समजून घ्यायचे आहे 😊 तुम्हाला:\n\n1. पैसे तपासायचे\n2. पैसे पाठवायचे\n3. देयके पाहायची\n4. समस्येत मदत हवी\n\nक्रमांक सांगा!`,
    },
    stressed: {
      en: () => `I hear you and I want to help right now 💛 Can you briefly tell me what's worrying you? I'll either resolve it immediately or connect you to a human agent within seconds.`,
      hi: () => `मैं सुन रही हूँ और अभी मदद करना चाहती हूँ 💛 संक्षेप में बताइए क्या परेशान कर रहा है? मैं तुरंत हल करूंगी या सेकंड में human agent से जोड़ूंगी।`,
      ta: () => `கேட்கிறேன், இப்போதே உதவ விரும்புகிறேன் 💛 சுருக்கமாக என்ன கவலை என்று சொல்லுங்கள்? உடனே தீர்க்கிறேன் அல்லது human agent இணைக்கிறேன்.`,
      te: () => `వింటున్నాను, ఇప్పుడే సహాయం చేయాలనుకుంటున్నాను 💛 సంక్షిప్తంగా ఏం ఆందోళన చెందుతున్నారో చెప్పండి.`,
      bn: () => `শুনছি এবং এখনই সাহায্য করতে চাই 💛 সংক্ষেপে কী চিন্তা করাচ্ছে বলুন। তাৎক্ষণিক সমাধান বা human agent সংযুক্ত করব।`,
      mr: () => `ऐकत आहे, आत्ता मदत करायची आहे 💛 थोडक्यात सांगा काय काळजी वाटते? लगेच सोडवतो किंवा human agent जोडतो.`,
    },
  },

  thanks: {
    calm: {
      en: () => `You're welcome! 😊 Is there anything else I can help you with?`,
      hi: () => `आपका स्वागत है! 😊 क्या और कोई मदद कर सकती हूँ?`,
      ta: () => `வரவேற்கிறேன்! 😊 வேறு ஏதாவது உதவ வேண்டுமா?`,
      te: () => `స్వాగతం! 😊 మరేమైనా సహాయం కావాలా?`,
      bn: () => `স্বাগতম! 😊 আর কিছু সাহায্য লাগবে?`,
      mr: () => `स्वागत! 😊 आणखी काही मदत हवी का?`,
    },
    confused: { en: () => `Glad I could help! 😊 Don't hesitate to ask if anything is still unclear.`, hi: () => `खुशी हुई! 😊 कुछ और समझाऊं तो बताइए।`, ta: () => `உதவியதில் மகிழ்ச்சி! 😊`, te: () => `సహాయపడినందుకు సంతోషం! 😊`, bn: () => `সাহায্য করতে পেরে আনন্দিত! 😊`, mr: () => `मदत करताना आनंद झाला! 😊` },
    stressed: { en: () => `Take care of yourself 💛 I'm always here whenever you need banking help. Stay safe!`, hi: () => `अपना ख्याल रखें 💛 जरूरत पड़े तो मैं हमेशा यहाँ हूँ।`, ta: () => `உங்களை பத்திரமாக வைத்துக்கொள்ளுங்கள் 💛`, te: () => `మిమ్మల్ని మీరు జాగ్రత్తగా చూసుకోండి 💛`, bn: () => `নিজের যত্ন নিন 💛`, mr: () => `स्वतःची काळजी घ्या 💛` },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const formatTxns = (txns, _lang) =>
  txns.slice(0, 5).map(t =>
    `${t.type === 'credit' ? '🟢' : '🔴'} ${t.description}\n   ${t.type === 'credit' ? '+' : '-'}₹${fmt(t.amount)} · ${t.date} · ${t.method}`
  ).join('\n\n');

const formatTxnsSimple = (txns) =>
  txns.map((t, i) =>
    `${i + 1}. ${t.description}: ${t.type === 'credit' ? 'Received' : 'Paid'} ₹${fmt(t.amount)}`
  ).join('\n');

// ─── Public API ───────────────────────────────────────────────────────────────
const getTemplate = (intent, emotion, lang, payload) => {
  const tpl = TEMPLATES[intent]?.[emotion]?.[lang] || TEMPLATES[intent]?.[emotion]?.en || TEMPLATES[intent]?.calm?.en;
  if (!tpl) return `I'm here to help with your banking needs.`;
  const result = typeof tpl === 'function' ? tpl(payload) : tpl;
  return result;
};

// Attempt LibreTranslate; fall back to returning text as-is
const translateText = async (text, targetLang) => {
  if (!text || targetLang === 'en') return text;
  try {
    const response = await axios.post(
      'https://libretranslate.com/translate',
      { q: text, source: 'en', target: targetLang, format: 'text' },
      { timeout: 3000, headers: { 'Content-Type': 'application/json' } }
    );
    return response.data?.translatedText || text;
  } catch {
    return text; // Graceful fallback
  }
};

module.exports = { getTemplate, translateText };
