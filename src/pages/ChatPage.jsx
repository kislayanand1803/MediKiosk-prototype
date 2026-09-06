import "regenerator-runtime/runtime";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Send,
  Bot,
  CheckCircle,
  Volume2,
  VolumeX,
  Loader2,
  Upload,
  FileImage,
  X,
  Globe,
  Mic,
  MicOff,
  AlertTriangle,
} from "lucide-react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import BodyMapSelector from "../components/BodyMapSelector";
import {
  generateMedicalCaseSummary,
  generateNextChatResponse,
} from "../services/aiService";
import { getT, LANGUAGES } from "../utils/translations";

/**
 * ==========================================
 * REGIONAL LANGUAGE & TTS CONFIGURATION
 * ==========================================
 * Maps all 22 Scheduled Indian Languages (plus English) to their specific
 * BCP-47 language codes. Includes a 'fallbackLang' system so that if a device
 * doesn't have a specific regional voice installed (e.g., Assamese), it safely
 * falls back to a related phonetic script family (e.g., Bengali) instead of breaking.
 */
const REGIONAL_LANG_MAP = {
  en: {
    code: "en-IN",
    keywords: ["english", "en-in", "en-us", "en-gb"],
    fallbackLang: null,
  },
  hi: {
    code: "hi-IN",
    keywords: ["hindi", "हिन्दी", "hi-in", "hi_in"],
    fallbackLang: null,
  },
  bn: {
    code: "bn-IN",
    keywords: ["bengali", "বাংলা", "bn-in", "bn-bd"],
    fallbackLang: null,
  },
  mr: {
    code: "mr-IN",
    keywords: ["marathi", "मराठी", "mr-in"],
    fallbackLang: "hi",
  },
  te: {
    code: "te-IN",
    keywords: ["telugu", "తెలుగు", "te-in"],
    fallbackLang: null,
  },
  ta: {
    code: "ta-IN",
    keywords: ["tamil", "தமிழ்", "ta-in"],
    fallbackLang: null,
  },
  gu: {
    code: "gu-IN",
    keywords: ["gujarati", "ગુજરાતી", "gu-in"],
    fallbackLang: null,
  },
  kn: {
    code: "kn-IN",
    keywords: ["kannada", "ಕನ್ನಡ", "kn-in"],
    fallbackLang: null,
  },
  ml: {
    code: "ml-IN",
    keywords: ["malayalam", "മലയാളം", "ml-in"],
    fallbackLang: null,
  },
  pa: {
    code: "pa-IN",
    keywords: ["punjabi", "ਪੰਜਾਬੀ", "pa-in"],
    fallbackLang: null,
  },
  ur: {
    code: "ur-IN",
    keywords: ["urdu", "اردو", "ur-in", "ur-pk"],
    fallbackLang: null,
  },
  or: {
    code: "or-IN",
    keywords: ["odia", "oriya", "ଓଡ଼ିଆ", "or-in"],
    fallbackLang: null,
  },
  ne: {
    code: "ne-NP",
    keywords: ["nepali", "नेपाली", "ne-np", "ne-in"],
    fallbackLang: "hi",
  },
  sa: {
    code: "sa-IN",
    keywords: ["sanskrit", "संस्कृतम्", "sa-in"],
    fallbackLang: "hi",
  },
  mai: {
    code: "mai-IN",
    keywords: ["maithili", "मैथिली", "mai-in"],
    fallbackLang: "hi",
  },
  kok: {
    code: "kok-IN",
    keywords: ["कोंकणी", "कोंकणी", "kok-in"],
    fallbackLang: "mr",
  },
  doi: {
    code: "doi-IN",
    keywords: ["dogri", "डोगरी", "doi-in"],
    fallbackLang: "hi",
  },
  brx: {
    code: "brx-IN",
    keywords: ["bodo", "बड़ो", "brx-in"],
    fallbackLang: "hi",
  },
  as: {
    code: "as-IN",
    keywords: ["assamese", "অসমীয়া", "as-in"],
    fallbackLang: "bn",
  },
  mni: {
    code: "mni-IN",
    keywords: ["manipuri", "মৈতৈলোন্", "মিতেইলোন", "mni-in"],
    fallbackLang: "bn",
  },
  sd: {
    code: "sd-IN",
    keywords: ["sindhi", "سنڌي", "sd-in"],
    fallbackLang: "ur",
  },
  ks: {
    code: "ks-IN",
    keywords: ["kashmiri", "कॉशुर", "کٲشُر", "ks-in"],
    fallbackLang: "ur",
  },
  sat: {
    code: "sat-IN",
    keywords: ["santali", "ᱥᱟᱱᱛᱟᱲᱤ", "sat-in"],
    fallbackLang: "en",
  },
};

/**
 * ==========================================
 * MULTILINGUAL EMERGENCY DICTIONARY
 * ==========================================
 * Hardcoded translations specifically for the Emergency Interrupt Pop-up.
 * Ensures that if the AI detects a life-threatening symptom, the safety warning
 * is instantly displayed and spoken in the patient's native language.
 */
const EMERGENCY_TRANSLATIONS = {
  en: {
    title: "⚠️ Critical Symptom Detected",
    desc: "You mentioned a symptom that may require immediate medical attention. Do you need emergency assistance?",
    btnEnd: "🚨 End Assessment & Request Emergency Review",
    btnContinue: "➡️ This is my normal baseline – Continue",
    voice:
      "Critical symptom detected. Do you need immediate emergency help, or is this your normal baseline?",
  },
  hi: {
    title: "⚠️ गंभीर लक्षण का पता चला",
    desc: "आपने एक ऐसे लक्षण का उल्लेख किया है जिसके लिए तत्काल चिकित्सा ध्यान देने की आवश्यकता हो सकती है। क्या आपको आपातकालीन सहायता की आवश्यकता है?",
    btnEnd: "🚨 मूल्यांकन समाप्त करें और आपातकालीन जांच का अनुरोध करें",
    btnContinue: "➡️ यह मेरे लिए सामान्य है – जारी रखें",
    voice:
      "गंभीर लक्षण का पता चला है। क्या आपको तुरंत आपातकालीन सहायता की आवश्यकता है, या यह आपके लिए सामान्य है?",
  },
  bn: {
    title: "⚠️ গুরুতর উপসর্গ সনাক্ত হয়েছে",
    desc: "আপনার বলা উপসর্গটির জন্য অবিলম্বে চিকিৎসার প্রয়োজন হতে পারে। আপনার কি জরুরি সহায়তার প্রয়োজন?",
    btnEnd: "🚨 মূল্যায়ন শেষ করুন এবং জরুরি পর্যালোচনার অনুরোধ করুন",
    btnContinue: "➡️ এটি আমার জন্য স্বাভাবিক – চালিয়ে যান",
    voice:
      "গুরুতর উপসর্গ সনাক্ত হয়েছে। আপনার কি অবিলম্বে জরুরি সহায়তা প্রয়োজন, নাকি এটি আপনার জন্য স্বাভাবিক?",
  },
  mr: {
    title: "⚠️ गंभीर लक्षण आढळले",
    desc: "तुम्ही सांगितलेल्या लक्षणासाठी त्वरित वैद्यकीय मदतीची आवश्यकता असू शकते. तुम्हाला आपत्कालीन मदतीची गरज आहे का?",
    btnEnd: "🚨 मूल्यांकन थांबवा आणि आपत्कालीन तपासणीची विनंती करा",
    btnContinue: "➡️ हे माझ्यासाठी सामान्य आहे – चालू ठेवा",
    voice:
      "गंभीर लक्षण आढळले आहे. तुम्हाला त्वरित आपत्कालीन मदतीची आवश्यकता आहे की हे तुमच्यासाठी सामान्य आहे?",
  },
  ta: {
    title: "⚠️ தீவிர அறிகுறி கண்டறியப்பட்டது",
    desc: "நீங்கள் குறிப்பிட்ட அறிகுறிக்கு உடனடி மருத்துவ கவனிப்பு தேவைப்படலாம். உங்களுக்கு அவசர உதவி தேவையா?",
    btnEnd: "🚨 மதிப்பீட்டை முடித்து அவசர பரிசோதனையை கோரவும்",
    btnContinue: "➡️ இது எனக்கு சாதாரணமானது – தொடரவும்",
    voice:
      "தீவிர அறிகுறி கண்டறியப்பட்டுள்ளது. உங்களுக்கு உடனடி அவசர உதவி தேவையா, அல்லது இது உங்களுக்கு சாதாரணமானதா?",
  },
  te: {
    title: "⚠️ తీవ్రమైన లక్షణం కనుగొనబడింది",
    desc: "మీరు చెప్పిన లక్షణానికి తక్షణ వైద్య సహాయం అవసరం కావచ్చు. మీకు అత్యవసర సహాయం కావాలా?",
    btnEnd: "🚨 అంచనా ముగించి అత్యవసర సమీక్షను అభ్యర్థించండి",
    btnContinue: "➡️ ఇది నాకు సాధారణమే – కొనసాగించండి",
    voice:
      "తీవ్రమైన లక్షణం కనుగొనబడింది. మీకు తక్షణ అత్యవసర సహాయం కావాలా, లేదా ఇది మీకు సాధారణమేనా?",
  },
  gu: {
    title: "⚠️ ગંભીર લક્ષણ જોવા મળ્યું",
    desc: "તમે એક લક્ષણનો ઉલ્લેખ કર્યો છે જેને તાત્કાલિક તબીબી ધ્યાનની જરૂર પડી શકે છે. શું તમને ઇમરજન્સી સહાયની જરૂર છે?",
    btnEnd: "🚨 મૂલ્યાંકન સમાપ્ત કરો અને ઇમરજન્સી તપાસની વિનંતી કરો",
    btnContinue: "➡️ આ મારા માટે સામાન્ય છે - ચાલુ રાખો",
    voice:
      "ગંભીર લક્ષણ જોવા મળ્યું છે. શું તમને તાત્કાલિક ઇમરજન્સી સહાયની જરૂર છે, કે આ તમારા માટે સામાન્ય છે?",
  },
  kn: {
    title: "⚠️ ಗಂಭೀರ ಲಕ್ಷಣ ಪತ್ತೆಯಾಗಿದೆ",
    desc: "ನೀವು ಹೇಳಿದ ಲಕ್ಷಣಕ್ಕೆ ತಕ್ಷಣದ ವೈದ್ಯಕೀಯ ನೆರವು ಬೇಕಾಗಬಹುದು. ನಿಮಗೆ ತುರ್ತು ಸಹಾಯ ಬೇಕೇ?",
    btnEnd: "🚨 ಮೌಲ್ಯಮಾಪನವನ್ನು ಕೊನೆಗೊಳಿಸಿ ಮತ್ತು ತುರ್ತು ಪರಿಶೀಲನೆಗೆ ವಿನಂತಿಸಿ",
    btnContinue: "➡️ ಇದು ನನಗೆ ಸಾಮಾನ್ಯವಾಗಿದೆ - ಮುಂದುವರಿಸಿ",
    voice:
      "ಗಂಭೀರ ಲಕ್ಷಣ ಪತ್ತೆಯಾಗಿದೆ. ನಿಮಗೆ ತಕ್ಷಣದ ತುರ್ತು ಸಹಾಯ ಬೇಕೇ, ಅಥವಾ ಇದು ನಿಮಗೆ ಸಾಮಾನ್ಯವೇ?",
  },
  ml: {
    title: "⚠️ ഗുരുതരമായ ലക്ഷണം കണ്ടെത്തി",
    desc: "നിങ്ങൾ പറഞ്ഞ ലക്ഷണത്തിന് അടിയന്തര വൈദ്യസഹായം ആവശ്യമായി വന്നേക്കാം. നിങ്ങൾക്ക് അടിയന്തര സഹായം ആവശ്യമുണ്ടോ?",
    btnEnd: "🚨 വിലയിരുത്തൽ അവസാനിപ്പിച്ച് അടിയന്തര പരിശോധന ആവശ്യപ്പെടുക",
    btnContinue: "➡️ ഇത് എനിക്ക് സാധാരണമാണ് - തുടരുക",
    voice:
      "ഗുരുതരമായ ലക്ഷണം കണ്ടെത്തിയിരിക്കുന്നു. നിങ്ങൾക്ക് അടിയന്തര സഹായം ആവശ്യമുണ്ടോ, അതോ ഇത് നിങ്ങൾക്ക് സാധാരണമാണോ?",
  },
  pa: {
    title: "⚠️ ਗੰਭੀਰ ਲੱਛਣ ਦਾ ਪਤਾ ਲੱਗਿਆ",
    desc: "ਤੁਸੀਂ ਇੱਕ ਅਜਿਹੇ ਲੱਛਣ ਦਾ ਜ਼ਿਕਰ ਕੀਤਾ ਹੈ ਜਿਸ ਲਈ ਤੁਰੰਤ ਡਾਕਟਰੀ ਸਹਾਇਤਾ ਦੀ ਲੋੜ ਹੋ ਸਕਦੀ ਹੈ। ਕੀ ਤੁਹਾਨੂੰ ਐਮਰਜੈਂਸੀ ਸਹਾਇਤਾ ਦੀ ਲੋੜ ਹੈ?",
    btnEnd: "🚨 ਮੁਲਾਂਕਣ ਸਮਾਪਤ ਕਰੋ ਅਤੇ ਐਮਰਜੈਂਸੀ ਜਾਂਚ ਦੀ ਬੇਨਤੀ ਕਰੋ",
    btnContinue: "➡️ ਇਹ ਮੇਰੇ ਲਈ ਆਮ ਹੈ - ਜਾਰੀ ਰੱਖੋ",
    voice:
      "ਗੰਭੀਰ ਲੱਛਣ ਦਾ ਪਤਾ ਲੱਗਿਆ ਹੈ। ਕੀ ਤੁਹਾਨੂੰ ਤੁਰੰਤ ਐਮਰਜੈਂਸੀ ਸਹਾਇਤਾ ਦੀ ਲੋੜ ਹੈ, ਜਾਂ ਕੀ ਇਹ ਤੁਹਾਡੇ ਲਈ ਆਮ ਹੈ?",
  },
  ur: {
    title: "⚠️ شدید علامت کی نشاندہی",
    desc: "آپ نے ایک ایسی علامت کا ذکر کیا ہے جس کے لیے فوری طبی امداد کی ضرورت ہو سکتی ہے۔ کیا آپ کو ہنگامی امداد کی ضرورت ہے؟",
    btnEnd: "🚨 تشخیص ختم کریں اور ہنگامی معائنے کی درخواست کریں",
    btnContinue: "➡️ یہ میرے لئے معمول ہے - جاری رکھیں",
    voice:
      "شدید علامت کی نشاندہی ہوئی ہے۔ کیا آپ کو فوری ہنگامی امداد کی ضرورت ہے، یا یہ آپ کے لئے معمول ہے?",
  },
  or: {
    title: "⚠️ ଗୁରୁତର ଲକ୍ଷଣ ଚିହ୍ନଟ ହୋଇଛି",
    desc: "ଆପଣ ଏପରି ଏକ ଲକ୍ଷଣ ବିଷୟରେ କହିଛନ୍ତି ଯାହା ପାଇଁ ତୁରନ୍ତ ଡାକ୍ତରୀ ସହାୟତା ଆବଶ୍ୟକ ହୋଇପାରେ। ଆପଣଙ୍କୁ ଜରୁରୀକାଳୀନ ସହାୟତା ଦରକାର କି?",
    btnEnd: "🚨 ମୂଲ୍ୟାଙ୍କନ ଶେଷ କରନ୍ତୁ ଏବଂ ଜରୁରୀକାଳୀନ ଯାଞ୍ଚ ପାଇଁ ଅନୁରୋଧ କରନ୍ତୁ",
    btnContinue: "➡️ ଏହା ମୋ ପାଇଁ ସାଧାରଣ - ଜାରି ରଖନ୍ତୁ",
    voice:
      "ଗୁରୁତର ଲକ୍ଷଣ ଚିହ୍ନଟ ହୋଇଛି। ଆପଣଙ୍କୁ ତୁରନ୍ତ ଜରୁରୀକାଳୀନ ସହାୟତା ଦରକାର କି, ନା ଏହା ଆପଣଙ୍କ ପାଇଁ ସାଧାରଣ?",
  },
  ne: {
    title: "⚠️ गम्भीर लक्षण पत्ता लाग्यो",
    desc: "तपाईंले एउटा यस्तो लक्षण उल्लेख गर्नुभयो जसलाई तत्काल चिकित्सा ध्यान आवश्यक पर्न सक्छ। के तपाईंलाई आपतकालीन सहायता चाहिन्छ?",
    btnEnd: "🚨 मूल्याङ्कन समाप्त गर्नुहोस् र आपतकालीन जाँचको अनुरोध गर्नुहोस्",
    btnContinue: "➡️ यो मेरो लागि सामान्य हो - जारी राख्नुहोस्",
    voice:
      "गम्भीर लक्षण पत्ता लागेको छ। के तपाईंलाई तत्काल आपतकालीन सहायता चाहिन्छ, वा यो तपाईंको लागि सामान्य हो?",
  },
  sa: {
    title: "⚠️ गम्भीरं लक्षणं दृष्टम्",
    desc: "भवता उक्तस्य लक्षणस्य कृते सत्वरं वैद्यकीयचिकित्सायाः आवश्यकता भवितुम् अर्हति। किं भवते आपत्कालीनसहायतायाः आवश्यकता अस्ति?",
    btnEnd: "🚨 परीक्षणं समाप्य आपत्कालीनसमीक्षाम् प्रार्थयताम्",
    btnContinue: "➡️ एतत् मह्यं सामान्यम् - अनुवर्तताम्",
    voice:
      "गम्भीरं लक्षणं दृष्टम्। किं भवते सत्वरम् आपत्कालीनसहायतायाः आवश्यकता अस्ति, उत एतत् भवतः कृते सामान्यम्?",
  },
  mai: {
    title: "⚠️ गंभीर लक्षण भेटल",
    desc: "अहाँ जे लक्षण बतौलहुँ ओकरा लेल तुरंत मेडिकल सहायताक आवश्यकता भ सकैत अछि। की अहाँकें आपातकालीन सहायता चाही?",
    btnEnd: "🚨 मूल्यांकन समाप्त करू आ आपातकालीन जाँचक अनुरोध करू",
    btnContinue: "➡️ ई हमरा लेल सामान्य अछि - जारी राखू",
    voice:
      "गंभीर लक्षण भेटल अछि। की अहाँकें तुरंत आपातकालीन सहायता चाही, वा ई अहाँक लेल सामान्य अछि?",
  },
  kok: {
    title: "⚠️ गंभीर लक्षण मेळ्ळां",
    desc: "तुमी सांगिल्ल्या लक्षणाक रोखडीच वैजकी मजत लागूं शकता. तुमकां आणीबाणीची मजत जाय?",
    btnEnd: "🚨 मुल्यांकन सोंपोवया आनी आणीबाणीचे तपासणेची विनंती करया",
    btnContinue: "➡️ हें म्हजे खातीर सामान्य आसा - चालू दवरा",
    voice:
      "गंभीर लक्षण मेळ्ळां. तुमकां रोखडीच आणीबाणीची मजत जाय, वा हें तुमचे खातीर सामान्य आसा?",
  },
  doi: {
    title: "⚠️ गंभीर लक्षण लब्भा",
    desc: "तुसें जेह्ड़े लक्षण दा जिक्र कीता ऐ उस ताईं फौरी डाक्टरी मदद दी लोड़ होई सकदी ऐ। के तुसेंगी इमरजेंसी मदद दी लोड़ ऐ?",
    btnEnd: "🚨 जांच खतम करो ते इमरजेंसी चैक-अप दी मंग करो",
    btnContinue: "➡️ एह मेरे ताईं आम ऐ - जारी रक्खो",
    voice:
      "गंभीर लक्षण लब्भा ऐ। के तुसेंगी फौरी इमरजेंसी मदद दी लोड़ ऐ, जां एह तुंदे ताईं आम ऐ?",
  },
  brx: {
    title: "⚠️ गोब्राब सिमटम नुनाय जादों",
    desc: "नोंथाङा बुंनाय सिमटमनि थाखाय गोख्रै डाक्टारी हेफाजाबनि गोनांथि जानो हागौ। नोंथांनो इमार्जेन्सि हेफाजाब गोनां नामा?",
    btnEnd: "🚨 नायबिजिरनाय फोजोब आरो इमार्जेन्सि नायफिननायनि खावलाय",
    btnContinue: "➡️ बेयो आंनि थाखाय सरासनस्रा - दालांबाय था",
    voice:
      "गोब्राब सिमटम नुनाय जादों। नोंथांनो गोख्रै इमार्जेन्सि हेफाजाब गोनां नामा, एबा बेयो नोंथांनि थाखाय सरासनस्रा?",
  },
  as: {
    title: "⚠️ গুৰুতৰ লক্ষণ ধৰা পৰিছে",
    desc: "আপুনি উল্লেখ কৰা লক্ষণটোৰ বাবে লগে লগে চিকিৎসাৰ প্ৰয়োজন হ'ব পাৰে। আপোনাক জৰুৰীকালীন সহায়ৰ প্ৰয়োজন নেকি?",
    btnEnd: "🚨 মূল্যায়ন সমাপ্ত কৰক আৰু জৰুৰীকালীন পৰীক্ষাৰ অনুৰোধ কৰক",
    btnContinue: "➡️ এয়া মোৰ বাবে স্বাভাৱিক – চলাই যাওক",
    voice:
      "গুৰুতৰ লক্ষণ ধৰা পৰিছে। আপোনাক লগে লগে জৰুৰীকালীন সহায়ৰ প্ৰয়োজন নেকি, নে এয়া আপোনাৰ বাবে স্বাভাৱিক?",
  },
  mni: {
    title: "⚠️ অরুবা লাইওং উবা ফংলে",
    desc: "নহাক্না পল্লীবা লাইওং অসিদা থুনা লায়েংবগী মথৌ তাবয়াউই। নহাক্কী ইমর্জেন্সী ওইবা মতেং মথৌ তাব্রা?",
    btnEnd: "🚨 য়েংশিনবা লোইশিনবিয়ু অমসুং ইমর্জেন্সী য়েংশিনবগী হায়জরকউ",
    btnContinue: "➡️ মসি ঐগীদমক মহৌশানি – মখা চত্থবিয়ু",
    voice:
      "অরুবা লাইওং উবা ফংলে। নহাক্কী থুনা ইমর্জেন্সী ওইবা মতেং মথৌ তাব্রা, নত্রগা মসি নহাক্কী মহৌশানিব্রা?",
  },
  sd: {
    title: "⚠️ شديد علامت ظاهر ٿي",
    desc: "توهان جنهن علامت جو ذڪر ڪيو آهي ان لاءِ فوري طبي ڌيان جي ضرورت پئجي سگهي ٿي. ڇا توهان کي ايمرجنسي مدد جي ضرورت آهي؟",
    btnEnd: "🚨 جائزو ختم ڪريو ۽ ايمرجنسي چڪاس جي درخواست ڪريو",
    btnContinue: "➡️ هي مون لاءِ عام آهي - جاري رکو",
    voice:
      "شديد علامت ظاهر ٿي آهي. ڇا توهان کي فوري ايمرجنسي مدد جي ضرورت آهي، يا هي توهان لاءِ عام آهي؟",
  },
  ks: {
    title: "⚠️ شدیٖد علامت وُچھنہٕ آیہِ",
    desc: "تُہؠ یۄس علامت بٲیان کٔر، تَمیہِ خٲطرٕ ہیکہِ فوراََ دَوٲیی توجُہٕچ ضروٗرت پؠتھ۔ کیا تُہینٛدِ خٲطرٕ چھا ایمرجنسی مددٕچ ضروٗرت؟",
    btnEnd: "🚨 تشخیص کرٕنؠ مُکمل تہٕ ایمرجنسی چیک اَپچ دَرخواست",
    btnContinue: "➡️ یہِ چھُ مؠانہِ خٲطرٕ عام – جٲری تھٲوِو",
    voice:
      "شدیٖد علامت وُچھنہٕ آیہِ۔ کیا تُہینٛدِ فوراََ ایمرجنسی مددٕچ ضروٗرت، یا یہِ چھُ تُہینٛدِ خٲطرٕ عام؟",
  },
  sat: {
    title: "⚠️ ᱟᱹᱰᱤ ᱵᱟᱹᱲᱤᱡ ᱞᱚᱠᱷᱚᱱ ᱧᱟᱢ ᱟᱠᱟᱱᱟ",
    desc: "ᱟᱢ ᱡᱟᱦᱟᱸ ᱞᱚᱠᱷᱚᱱ ᱮᱢ ᱞᱟᱹᱭ ᱠᱮᱫᱟ ᱚᱱᱟ ᱞᱟᱹᱜᱤᱫ ᱛᱮ ᱞᱚᱜᱚᱱ ᱨᱟᱱ ᱨᱮᱭᱟᱜ ᱜᱚᱲᱚ ᱫᱚᱨᱠᱟᱨ ᱦᱩᱭ ᱫᱟᱲᱮᱭᱟᱜ-ᱟ᱾ ᱪᱮᱫ ᱟᱢ ᱮᱢᱟᱨᱡᱮᱱᱥᱤ ᱜᱚᱲᱚᱢ ᱠᱷᱚᱡᱚᱜ ᱠᱟᱱᱟ?",
    btnEnd: "🚨 ᱵᱤᱰᱟᱹᱣ ᱢᱩᱪᱟᱹᱫᱽ ᱢᱮ ᱟᱨ ᱮᱢᱟᱨᱡᱮᱱᱥᱤ ᱧᱮᱞ ᱨᱮᱭᱟᱜ ᱱᱮᱦᱚᱨ ᱢᱮ",
    btnContinue: "➡️ ᱱᱚᱶᱟ ᱫᱚ ᱤᱧ ᱞᱟᱹᱜᱤᱫ ᱥᱟᱫᱷᱟᱨᱚᱱ ᱜᱮᱭᱟ – ᱞᱟᱦᱟᱜ ᱢᱮ",
    voice:
      "ᱟᱹᱰᱤ ᱵᱟᱹᱲᱤᱡ ᱞᱚᱠᱷᱚᱱ ᱧᱟᱢ ᱟᱠᱟᱱᱟ᱾ ᱪᱮᱫ ᱟᱢ ᱞᱚᱜᱚᱱ ᱮᱢᱟᱨᱡᱮᱱᱥᱤ ᱜᱚᱲᱚᱢ ᱠᱷᱚᱡᱚᱜ ᱠᱟᱱᱟ, ᱥᱮ ᱱᱚᱶᱟ ᱫᱚ ᱟᱢ ᱞᱟᱹᱜᱤᱫ ᱥᱟᱫᱷᱟᱨᱚᱱ ᱜᱮᱭᱟ?",
  },
};

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATE INITIALIZATION ---
  // Retrieves patient info passed from the Intake Page, or defaults for testing
  const patientInfo = location.state?.patientInfo || {
    name: "Rahul Sharma",
    age: "28",
    gender: "Male",
    abhaId: "91-4582-1923-8821",
  };

  // Language Setup & Fallbacks
  const language = location.state?.appLanguage || "en";
  const t = getT(language);
  const emText = EMERGENCY_TRANSLATIONS[language] || EMERGENCY_TRANSLATIONS.en;

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || {
    label: "English",
  };
  const languageName = currentLangObj.label.split(" ")[0];

  // Core Chat States
  const [messages, setMessages] = useState([]);
  const [dynamicChips, setDynamicChips] = useState([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(1);
  const [isVoiceOn, setIsVoiceOn] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [uploadedDocBase64, setUploadedDocBase64] = useState(null);
  const [docFileName, setDocFileName] = useState("");
  const [availableVoices, setAvailableVoices] = useState([]);

  // Emergency Interrupt States
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyTimer, setEmergencyTimer] = useState(15);
  const [pendingAiResponse, setPendingAiResponse] = useState(null);

  const messagesEndRef = useRef(null);

  // Accommodates 5 active AI questions + 1 Final upload/submit step
  const TOTAL_STEPS = 7;

  /**
   * ==========================================
   * SYSTEM EFFECTS & LISTENERS
   * ==========================================
   */

  // System Voices Loader
  // Loads available voices from the browser API into state.
  useEffect(() => {
    const loadVoices = () => {
      if ("speechSynthesis" in window) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) setAvailableVoices(voices);
      }
    };
    loadVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // Emergency Timer Countdown Controller
  // Decrements the timer when the modal is active, automatically confirms emergency when 0.
  useEffect(() => {
    let timer;
    if (showEmergencyModal && emergencyTimer > 0) {
      timer = setInterval(() => setEmergencyTimer((prev) => prev - 1), 1000);
    } else if (showEmergencyModal && emergencyTimer === 0) {
      handleEmergencyConfirm();
    }
    return () => clearInterval(timer);
  }, [showEmergencyModal, emergencyTimer]);

  // Speech Recognition Hook Initialization
  const {
    transcript,
    listening: isListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Speech Recognition Sync
  // Syncs the spoken transcript to the text input field in real-time.
  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  // Speech Recognition Reset
  // Stops listening if the user switches languages mid-interaction.
  useEffect(() => {
    if (isListening) SpeechRecognition.stopListening();
  }, [language]);

  // Initial AI Greeting Triggers
  // Fires the introductory message when the component mounts.
  useEffect(() => {
    let timeoutId;
    const greetingText = t.greeting(patientInfo.name);

    setMessages([{ text: greetingText, sender: "ai" }]);
    setDynamicChips(t.defaultChips);

    if (isVoiceOn) {
      window.speechSynthesis.cancel();
      timeoutId = setTimeout(() => speakText(greetingText), 600);
    }
    return () => clearTimeout(timeoutId);
  }, [language, availableVoices]);

  // Auto-scroll Controller
  // Automatically scrolls to the newest message whenever the chat updates.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, step, isAiThinking]);

  /**
   * ==========================================
   * TEXT-TO-SPEECH (TTS) HANDLERS
   * ==========================================
   */

  // Voice Selection Strategy
  // Finds the most appropriate regional voice based on BCP-47 codes, keywords, or phonetic fallbacks.
  const findRegionalVoice = (langKey, voicesList) => {
    const langConfig = REGIONAL_LANG_MAP[langKey] || REGIONAL_LANG_MAP.en;
    const targetCode = langConfig.code.toLowerCase();
    const keywords = langConfig.keywords;

    // Strategy A: Direct Match (BCP-47 Code)
    let match = voicesList.find((v) => {
      const vLang = v.lang ? v.lang.toLowerCase().replace("_", "-") : "";
      return vLang === targetCode || vLang.startsWith(targetCode.split("-")[0]);
    });

    // Strategy B: Keyword Match (Checking Voice Names)
    if (!match) {
      match = voicesList.find((v) => {
        const vName = v.name.toLowerCase();
        return keywords.some((kw) => vName.includes(kw));
      });
    }

    // Strategy C: Script-Family Phonetical Fallback
    if (!match && langConfig.fallbackLang) {
      const fallbackConfig = REGIONAL_LANG_MAP[langConfig.fallbackLang];
      if (fallbackConfig) {
        match = voicesList.find((v) => {
          const vLang = v.lang ? v.lang.toLowerCase().replace("_", "-") : "";
          return vLang.startsWith(fallbackConfig.code.split("-")[0]);
        });
      }
    }
    return match;
  };

  // TTS Execution Engine
  // Triggers the browser TTS, sanitizing text to ensure no markdown or emojis are read aloud.
  const speakText = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel(); // Stop current speech immediately

    // Content Sanitization
    const cleanText = text
      .replace(/[\[\]\(\)\*\_#]/g, "")
      .replace(/^[🗣️📄🤖]\s*/, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    const voices =
      availableVoices.length > 0
        ? availableVoices
        : window.speechSynthesis.getVoices();
    const langConfig = REGIONAL_LANG_MAP[language] || REGIONAL_LANG_MAP.en;

    const selectedVoice = findRegionalVoice(language, voices);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
      window.speechSynthesis.speak(utterance);
    } else {
      // Cloud TTS Fallback: Passes the precise BCP-47 locale code (e.g., 'pa-IN')
      // to trigger the browser's native cloud voice engine if no local voice matches.
      utterance.lang = langConfig.code;
      window.speechSynthesis.speak(utterance);
    }
  };

  /**
   * ==========================================
   * CORE CHAT & AI LOGIC
   * ==========================================
   */

  // AI Response Processor
  // Appends the AI response to the chat log and handles the spoken audio.
  const proceedWithAiResponse = (aiResponse) => {
    setMessages((prev) => [
      ...prev,
      { text: aiResponse.question, sender: "ai" },
    ]);
    setDynamicChips(aiResponse.options || []);
    setStep((prev) => prev + 1);
    if (isVoiceOn) speakText(aiResponse.question);
  };

  // Chat Orchestration Function
  // Main sequence for handling user inputs, sending history to Gemini, and evaluating responses.
  const processMessage = async (userText) => {
    if (!userText.trim()) return;

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    resetTranscript();

    // Append immediate user message to UI
    const updatedHistory = [...messages, { text: userText, sender: "user" }];
    setMessages(updatedHistory);
    setDynamicChips([]);

    if (step < TOTAL_STEPS - 1) {
      setIsAiThinking(true);

      // Invoke external AI Service for subsequent response
      const aiResponse = await generateNextChatResponse(
        updatedHistory,
        step,
        languageName,
      );
      setIsAiThinking(false);

      // Emergency Gateway Filter
      if (aiResponse.critical_symptom_detected) {
        setPendingAiResponse(aiResponse);
        setShowEmergencyModal(true);
        setEmergencyTimer(15);
        if (isVoiceOn) speakText(emText.voice);
      } else {
        proceedWithAiResponse(aiResponse);
      }
    } else if (step === TOTAL_STEPS - 1) {
      // Concluding Step Logic
      setMessages((prev) => [...prev, { text: t.finalMsg, sender: "ai" }]);
      setStep((prev) => prev + 1);
      if (isVoiceOn) speakText(t.finalMsg);
    }
  };

  // Form Submission Handler
  // Submits the typed or dictated input from the text field.
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (isListening) SpeechRecognition.stopListening();
    processMessage(input);
    setInput("");
  };

  // Speech Recognition Toggle
  // Checks browser support and begins the continuous listening session.
  const toggleMicrophone = () => {
    if (!browserSupportsSpeechRecognition) {
      alert(t.noMicSupport);
      return;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    if (isListening) {
      SpeechRecognition.stopListening();
    } else {
      const langConfig = REGIONAL_LANG_MAP[language] || REGIONAL_LANG_MAP.en;
      SpeechRecognition.startListening({
        continuous: true,
        language: langConfig.code,
      });
    }
  };

  // File Read Handler (Legacy Document OCR Module)
  // Extracts the uploaded file data into base64 to send to the multimodal AI endpoint.
  const handleDocUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDocFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setUploadedDocBase64(reader.result);
    reader.readAsDataURL(file);
  };

  /**
   * ==========================================
   * SUBMISSION & TRIAGE HANDLERS
   * ==========================================
   */

  // Final Evaluation Trigger
  // Bundles patient context, entire history, and documents to generate the doctor-facing summary.
  const handleFinishAndAnalyze = async (isForcedEmergency = false) => {
    setIsAnalyzing(true);
    try {
      let transcriptStr = messages
        .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
        .join("\n");

      // Appends an un-ignorable system tag to trigger the hard-coded deterministic red flag backend logic.
      if (isForcedEmergency) {
        transcriptStr += "\nSYSTEM: PATIENT CONFIRMED CRITICAL EMERGENCY.";
      }

      const aiResult = await generateMedicalCaseSummary(
        patientInfo,
        transcriptStr,
        uploadedDocBase64,
        languageName,
      );

      navigate("/success", {
        state: { currentCase: aiResult, appLanguage: language },
      });
    } catch (error) {
      console.error("AI Intake failed:", error);
      alert("Failed to analyze case. Please verify your Gemini API key.");
      setIsAnalyzing(false);
    }
  };

  // Emergency Pop-Up Controls: Confirm Emergency Path
  const handleEmergencyConfirm = () => {
    setShowEmergencyModal(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    handleFinishAndAnalyze(true);
  };

  // Emergency Pop-Up Controls: Dismiss Path (Normal Baseline Override)
  const handleEmergencyDismiss = () => {
    setShowEmergencyModal(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (pendingAiResponse) {
      proceedWithAiResponse(pendingAiResponse);
      setPendingAiResponse(null);
    }
  };

  /**
   * ==========================================
   * RENDER UI
   * ==========================================
   */
  return (
    <div className="flex flex-col h-[100dvh] max-w-2xl mx-auto bg-white shadow-lg border-x relative">
      {/* EMERGENCY MODAL */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-4 border-red-500 rounded-3xl w-full max-w-md shadow-2xl p-6 text-center space-y-6">
            <div className="mx-auto bg-red-100 text-red-600 w-20 h-20 rounded-full flex items-center justify-center animate-pulse shadow-inner">
              <AlertTriangle size={40} />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                {emText.title}
              </h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                {emText.desc}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleEmergencyConfirm}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
              >
                {emText.btnEnd} ({emergencyTimer}s)
              </button>
              <button
                onClick={handleEmergencyDismiss}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                {emText.btnContinue}
              </button>
            </div>
          </div>
        </div>
      )}

      {isListening && !showEmergencyModal && (
        <div className="absolute top-16 left-0 right-0 z-20 flex justify-center animate-pulse">
          <div className="bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <Mic size={14} /> {t.listening}
          </div>
        </div>
      )}

      <div className="p-3 sm:p-4 bg-blue-600 text-white flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-2 overflow-hidden">
          <Bot size={24} className="flex-shrink-0" />
          <div className="truncate">
            <h2 className="font-bold text-sm sm:text-base leading-tight truncate">
              MediKiosk Clinical Intake
            </h2>
            <p className="text-[10px] sm:text-[11px] text-blue-100 truncate">
              Patient: {patientInfo.name} ({patientInfo.age}y/
              {patientInfo.gender})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-blue-800 text-blue-100 text-xs font-bold px-2 py-1.5 rounded-lg shadow-inner">
            <Globe size={14} /> {currentLangObj.label}
          </div>
          <button
            onClick={() => {
              if (isVoiceOn) window.speechSynthesis.cancel();
              setIsVoiceOn(!isVoiceOn);
            }}
            className="p-2 bg-blue-700 hover:bg-blue-800 rounded-full transition"
            title={isVoiceOn ? "Mute Voice" : "Enable Voice"}
          >
            {isVoiceOn ? (
              <Volume2 size={16} />
            ) : (
              <VolumeX size={16} className="opacity-60" />
            )}
          </button>
          <span className="hidden sm:inline text-xs bg-blue-950/80 px-2.5 py-1 rounded-full font-bold">
            {t.phase} {step}/{TOTAL_STEPS}
          </span>
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-4 bg-gray-50 pb-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${msg.sender === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"}`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isAiThinking && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-3.5 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          </div>
        )}

        {step === 1 && !isAiThinking && (
          <div className="animate-fade-in-up">
            <BodyMapSelector onSelect={processMessage} />
          </div>
        )}

        {step >= 5 && !isAiThinking && (
          <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 flex-wrap">
                <FileImage size={16} className="text-blue-600" /> {t.moduleB}
              </span>
              {uploadedDocBase64 && (
                <button
                  onClick={() => {
                    setUploadedDocBase64(null);
                    setDocFileName("");
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {uploadedDocBase64 ? (
              <div className="flex items-center gap-2 bg-blue-50 p-2 rounded border border-blue-100 text-xs text-blue-900 truncate">
                <span className="font-semibold flex-shrink-0">
                  {t.attached}
                </span>{" "}
                <span className="truncate">{docFileName}</span>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-blue-500 py-3 rounded-lg cursor-pointer bg-gray-50 transition text-xs text-gray-600 font-medium text-center px-2">
                <Upload size={16} className="text-gray-400 flex-shrink-0" />{" "}
                {t.upload}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleDocUpload}
                />
              </label>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />

        {step === TOTAL_STEPS && !isAiThinking && (
          <div className="flex justify-center mt-4 mb-2">
            <button
              onClick={() => handleFinishAndAnalyze(false)}
              disabled={isAnalyzing}
              className={`flex items-center gap-2 text-white px-6 py-2.5 rounded-full font-bold text-sm transition shadow-lg ${isAnalyzing ? "bg-gray-400" : "bg-green-600 hover:bg-green-700 animate-pulse"}`}
            >
              {isAnalyzing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle size={18} />
              )}
              {isAnalyzing ? t.processing : t.submitDoc}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border-t">
        {dynamicChips.length > 0 && !isAiThinking && !showEmergencyModal && (
          <div className="flex gap-2 p-2.5 overflow-x-auto bg-gray-50 border-b scrollbar-none">
            {dynamicChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput("");
                  processMessage(chip);
                }}
                className="whitespace-nowrap px-3.5 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs rounded-full hover:bg-blue-50 hover:border-blue-600 transition shadow-sm font-medium flex-shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="p-3 flex gap-2 items-center">
          <button
            type="button"
            onClick={toggleMicrophone}
            disabled={
              isAiThinking ||
              showEmergencyModal ||
              !browserSupportsSpeechRecognition
            }
            className={`p-3 rounded-full transition flex-shrink-0 ${isListening ? "bg-red-600 text-white shadow-md animate-pulse" : "bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm"} disabled:opacity-50`}
            title={t.dictation}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <input
            type="text"
            disabled={
              step === TOTAL_STEPS ||
              isAnalyzing ||
              isAiThinking ||
              showEmergencyModal
            }
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100 text-sm"
            placeholder={t.chatPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={
              step === TOTAL_STEPS ||
              isAnalyzing ||
              isAiThinking ||
              showEmergencyModal ||
              !input.trim()
            }
            className="p-3 bg-blue-600 text-white rounded-full disabled:bg-gray-300 hover:bg-blue-700 transition flex-shrink-0 shadow-sm"
          >
            <Send size={18} />
          </button>
        </form>
        <div className="text-center pb-2 pt-1 px-4 text-[10px] text-gray-500 italic bg-white">
          ⚠️ This AI is for triage data collection only and is not providing a
          medical diagnosis. Please consult your examining physician.
        </div>
      </div>
    </div>
  );
}
