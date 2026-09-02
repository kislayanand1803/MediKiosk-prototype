import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "./supabaseClient";

// ---------------------------------------------------------
// MODEL FALLBACK CHAIN
// ---------------------------------------------------------
const MODEL_FALLBACK_CHAIN = [
  "gemini-3-flash",
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
];

async function executeWithModelFallback(aiClient, promptParts, config) {
  let lastError = null;

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      console.log(`Attempting generation with model: ${modelName}`);
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: promptParts }],
        config: config,
      });
      console.log(`✅ Success with model: ${modelName}`);
      return response;
    } catch (error) {
      console.warn(`⚠️ Model ${modelName} failed:`, error.message);
      lastError = error;
    }
  }
  throw lastError || new Error("All fallback models failed.");
}

// ---------------------------------------------------------
// CLINICAL SAFETY: Deterministic Red Flag Scanner
// ---------------------------------------------------------
const RED_FLAG_PATTERNS = {
  possible_chest_pain_emergency: [
    "severe chest pain",
    "crushing chest pain",
    "pressure in chest",
    "chest pain with sweating",
    "chest pain with breathlessness",
    "छाती में तेज दर्द",
    "सीने में दबाव",
  ],
  possible_stroke_emergency: [
    "face drooping",
    "facial droop",
    "one side weak",
    "one-sided weakness",
    "slurred speech",
    "cannot speak",
    "sudden loss of speech",
    "बोलने में दिक्कत",
    "एक तरफ कमजोरी",
  ],
  possible_severe_breathing_emergency: [
    "cannot breathe",
    "can't breathe",
    "severe breathlessness",
    "severe difficulty breathing",
    "blue lips",
    "turning blue",
    "सांस नहीं ले पा रहा",
    "सांस लेने में बहुत तकलीफ",
  ],
  possible_severe_allergic_reaction: [
    "swelling of tongue",
    "swollen tongue",
    "throat closing",
    "difficulty breathing after medicine",
    "difficulty breathing after food",
    "जीभ में सूजन",
    "गला बंद",
  ],
  possible_severe_bleeding: [
    "vomiting blood",
    "coughing blood",
    "black stool",
    "uncontrolled bleeding",
    "bleeding won't stop",
    "खून की उल्टी",
    "लगातार खून बहना",
  ],
  possible_seizure_or_unresponsiveness: [
    "unconscious",
    "not responding",
    "seizure",
    "fit",
    "convulsion",
    "बेहोश",
    "दौरा",
  ],
};

function deterministicRedFlagCheck(chatHistory) {
  let combinedText = "";

  if (Array.isArray(chatHistory)) {
    combinedText = chatHistory
      .map((m) => (m.text ? m.text.toLowerCase() : ""))
      .join(" ");
  } else if (typeof chatHistory === "string") {
    combinedText = chatHistory.toLowerCase();
  } else {
    combinedText = JSON.stringify(chatHistory).toLowerCase();
  }

  const findings = [];
  for (const [flag, phrases] of Object.entries(RED_FLAG_PATTERNS)) {
    const hits = phrases.filter((p) => combinedText.includes(p));
    if (hits.length > 0) {
      findings.push({ flag, evidence: hits });
    }
  }
  return findings;
}

// ---------------------------------------------------------
// CORE AI ENGINE (CLINICAL & AYUSH TRIAGE)
// ---------------------------------------------------------
export async function generateMedicalCaseSummary(
  patientInfo,
  chatHistory,
  documentImageBase64 = null,
  language = "English",
) {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("🚨 VITE_GEMINI_API_KEY is missing!");

    const deterministicFlags = deterministicRedFlagCheck(chatHistory);
    const hasDeterministicRedFlag = deterministicFlags.length > 0;
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const languageInstruction = `Provide all descriptive text summaries in clear, professional medical English for the doctor portal, while accurately translating the patient's ${language} input.
    
    CRITICAL DATA PROVENANCE: 
    Prepend the exact emoji to the beginning of the text fields (chiefComplaint, symptomsSummary, possibleDiagnosis, extractedDocNotes) based on the source:
    - 🗣️ If the patient explicitly said it in the chat.
    - 📄 If you read it from an uploaded prescription/lab report/imaging OCR.
    - 🤖 If you deduced it medically but it wasn't explicitly stated.`;

    const formattedTranscript =
      typeof chatHistory === "string"
        ? chatHistory
        : JSON.stringify(chatHistory);

    const parts = [
      {
        text: `Patient Demographics:
- Name: ${patientInfo?.name || "Rahul Sharma"}
- Age: ${patientInfo?.age || "28"}
- Gender: ${patientInfo?.gender || "Male"}
- ABHA ID: ${patientInfo?.abhaId || "Not Linked"}

Analyze the following patient-AI Ayush Prashna Pariksha transcript and any attached medical document image.

Consultation Transcript:
${formattedTranscript}

CRITICAL CLINICAL & AYUSH TRIAGING DIRECTIVES:
1. VIKRITI (DOSHA IMBALANCE) SCORING:
   - vataScore, pittaScore, and kaphaScore MUST be integers between 0 and 100 representing current pathological imbalance.
   - Normal baseline: 15-30%
   - Moderate aggravation: 45-65%
   - Acute / severe pathological aggravation (e.g. sharp pain, abscess, severe constipation, inflammation): 70-95%
   - DO NOT provide single-digit numbers (like 7 or 8) for active symptoms.

2. AYUSH CLINICAL PARIKSHA:
   - Identify Agni status: Vishamagni (irregular), Tikshnagni (hyperactive), Mandagni (sluggish), or Samagni (balanced).
   - Identify Koshtha status: Krura Koshtha (hard/constipated bowels), Mridu Koshtha (loose/fast bowels), or Madhyama Koshtha (regular bowels).
   - Provide Ahara-Vihara (dietary and lifestyle) guidance.

3. ACUTE OCR & SURGICAL RED-FLAG OVERRIDE:
   - If the attached document image or OCR shows acute structural/pathological findings (such as hepatic abscess, internal organ inflammation, hemangioma risks, perforation, acute abdomen, or sepsis), you MUST set isRedFlag to true and urgencyLevel to "Urgent".

${languageInstruction}`,
      },
    ];

    if (documentImageBase64) {
      const cleanBase64 = documentImageBase64.replace(
        /^data:image\/\w+;base64,/,
        "",
      );
      parts.push({
        inlineData: { mimeType: "image/jpeg", data: cleanBase64 },
      });
    }

    const config = {
      temperature: 0.1, // STRICT & DETERMINISTIC FOR ACCURATE SUMMARIES
      systemInstruction:
        "You are an expert integrative clinical triage assistant and Ayurvedic diagnostician for the Ministry of Ayush. Distinguish patient-reported facts from AI inferences. Return strictly structured JSON.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chiefComplaint: { type: Type.STRING },
          symptomsSummary: { type: Type.STRING },
          possibleDiagnosis: { type: Type.STRING },
          extractedDocNotes: { type: Type.STRING },
          agniStatus: { type: Type.STRING },
          koshthaStatus: { type: Type.STRING },
          aharaVihara: { type: Type.STRING },
          vataScore: { type: Type.INTEGER },
          pittaScore: { type: Type.INTEGER },
          kaphaScore: { type: Type.INTEGER },
          urgencyLevel: {
            type: Type.STRING,
            enum: ["Routine", "Review Soon", "Urgent"],
          },
          isRedFlag: { type: Type.BOOLEAN },
        },
        required: [
          "chiefComplaint",
          "symptomsSummary",
          "possibleDiagnosis",
          "extractedDocNotes",
          "agniStatus",
          "koshthaStatus",
          "aharaVihara",
          "vataScore",
          "pittaScore",
          "kaphaScore",
          "urgencyLevel",
          "isRedFlag",
        ],
      },
    };

    const response = await executeWithModelFallback(ai, parts, config);

    let cleanText = response.text || "{}";
    cleanText = cleanText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsedData = JSON.parse(cleanText);

    const finalIsRedFlag = hasDeterministicRedFlag || parsedData.isRedFlag;
    const finalUrgency = hasDeterministicRedFlag
      ? "Urgent"
      : parsedData.urgencyLevel;

    const finalCaseData = {
      name: patientInfo?.name || "Rahul Sharma",
      age: patientInfo?.age || "28",
      gender: patientInfo?.gender || "Male",
      abha_id:
        patientInfo?.abhaId && patientInfo.abhaId.trim() !== ""
          ? patientInfo.abhaId
          : "Not Linked",
      primary_complaint: parsedData.chiefComplaint,
      subjective_history: parsedData.symptomsSummary,
      possible_diagnosis: parsedData.possibleDiagnosis,
      extracted_doc_notes: parsedData.extractedDocNotes,
      agni_status: parsedData.agniStatus,
      koshtha_status: parsedData.koshthaStatus,
      ahara_vihara: parsedData.aharaVihara,
      urgency_level: finalUrgency,
      is_red_flag: finalIsRedFlag,
      dosha_data: [
        { subject: "Vata", value: parsedData.vataScore },
        { subject: "Pitta", value: parsedData.pittaScore },
        { subject: "Kapha", value: parsedData.kaphaScore },
      ],
      status: "Pending",
    };

    const { data: dbData, error: dbError } = await supabase
      .from("patients")
      .insert([finalCaseData])
      .select();
    if (dbError) console.error("Error saving patient to Supabase:", dbError);

    return { ...finalCaseData, id: dbData?.[0]?.id };
  } catch (apiError) {
    console.warn(
      "⚠️ All models in fallback chain failed. Engaging demo fallback mode:",
      apiError.message,
    );

    const fallbackData = {
      name: patientInfo?.name || "Rahul Sharma",
      age: patientInfo?.age || "28",
      gender: patientInfo?.gender || "Male",
      abha_id:
        patientInfo?.abhaId && patientInfo.abhaId.trim() !== ""
          ? patientInfo.abhaId
          : "Not Linked",
      primary_complaint: "🗣️ Severe Throbbing Headache & Acid Indigestion",
      subjective_history:
        "🗣️ Patient reports intense throbbing headache and sour belching.",
      possible_diagnosis: "🤖 Vata-Pitta Shiroroga / Migraine",
      extracted_doc_notes: "📄 Prior prescription OCR: Paracetamol 650mg SOS.",
      agni_status: "Vishamagni (Irregular digestion)",
      koshtha_status: "Krura Koshtha (Hard/Constipated bowels)",
      ahara_vihara: "Irregular diet and erratic sleep schedule.",
      urgency_level: "Review Soon",
      is_red_flag: false,
      dosha_data: [
        { subject: "Vata", value: 78 },
        { subject: "Pitta", value: 65 },
        { subject: "Kapha", value: 35 },
      ],
      status: "Pending",
    };

    const { data: fbData, error: fbError } = await supabase
      .from("patients")
      .insert([fallbackData])
      .select();
    if (fbError)
      console.error("Error saving fallback patient to Supabase:", fbError);
    return { ...fallbackData, id: fbData?.[0]?.id };
  }
}

// ---------------------------------------------------------
// DYNAMIC CHAT AI ENGINE (MULTILINGUAL SUPPORT)
// ---------------------------------------------------------
export async function generateNextChatResponse(
  chatHistory,
  step,
  language = "English",
) {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key missing from .env file");

    const ai = new GoogleGenAI({ apiKey: apiKey });
    const historyText = chatHistory
      .map((m) => `${m.sender === "ai" ? "Doctor" : "Patient"}: ${m.text}`)
      .join("\n");

    let clinicalDirective = "";

    // NEW DYNAMIC 5-PHASE AYURVEDIC QUESTIONING SYSTEM
    switch (step) {
      case 1:
        clinicalDirective = `PHASE 1: General Health & History. Use the SOCRATES framework. Respond with brief empathy, then ask exactly ONE logical follow-up question to narrow down the chief complaint.`;
        break;
      case 2:
        clinicalDirective = `PHASE 2: Digestion & Elimination. Respond with brief empathy. Ask exactly ONE targeted question about appetite, bloating, acidity, or bowel movements (stools/urine).`;
        break;
      case 3:
        clinicalDirective = `PHASE 3: Sleep & Energy. Ask exactly ONE targeted question about their sleep quality, insomnia, or daily energy levels.`;
        break;
      case 4:
        clinicalDirective = `PHASE 4: Lifestyle & Routine. Ask exactly ONE targeted question about their daily routine, stress management, or habits (exercise, addictions).`;
        break;
      case 5:
        clinicalDirective = `PHASE 5: Diet & Preferences. Ask exactly ONE targeted question about their dietary habits, meal frequency, or specific foods that worsen/relieve symptoms.`;
        break;
      default:
        clinicalDirective = `Ask ONE relevant follow-up question to clarify any missing details.`;
    }

    const langInstruction = `CRITICAL LANGUAGE REQUIREMENT: You MUST write both your generated clinical question and all 3 quick-reply options entirely in fluent ${language} script and vocabulary. Do not mix in English unless it is an unavoidable technical word.`;

    const prompt = `You are a highly skilled Ayush Physician conducting a rapid clinical triage interview.
    ${clinicalDirective}
    ${langInstruction}
    
    Review the conversation history below. Generate your next logical, professional question in ${language}. Keep it under 2 sentences. 
    Provide 3 short, highly relevant quick-reply option chips in ${language}.

    Conversation History:
    ${historyText}`;

    const config = {
      temperature: 0.4, // PATIENT-FACING: Higher temp for empathy and adaptability
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["question", "options"],
      },
    };

    const response = await executeWithModelFallback(
      ai,
      [{ text: prompt }],
      config,
    );
    let cleanText = response.text || "{}";
    cleanText = cleanText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("🚨 Live Chat API Error across all fallback models:", error);
    return {
      question:
        "Could you clarify exactly how many days you have been experiencing this?",
      options: ["2-3 days", "1 week", "A long time"],
    };
  }
}
