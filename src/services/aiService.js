import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "./supabaseClient";
import { generateFHIRBundle } from "../utils/fhirMapper";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// =========================================================
// 1. GLOBAL MEMORY OPTIMIZATION
// =========================================================
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) console.warn("🚨 VITE_GEMINI_API_KEY is missing!");
const globalAiClient = apiKey ? new GoogleGenAI({ apiKey }) : null;

// =========================================================
// MODEL FALLBACK CHAIN & TIMEOUT
// =========================================================
const MODEL_FALLBACK_CHAIN = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.1-pro-preview",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3-flash",
];

const timeoutPromise = (ms) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`API Timeout after ${ms}ms`)), ms),
  );

async function executeWithModelFallback(promptParts, config) {
  if (!globalAiClient) throw new Error("🚨 VITE_GEMINI_API_KEY is missing!");

  let lastError = null;

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      console.log(`Attempting generation with model: ${modelName}`);

      const request = globalAiClient.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: promptParts }],
        config: config,
      });

      const response = await Promise.race([request, timeoutPromise(30000)]);
      console.log(`✅ Success with model: ${modelName}`);
      return response;
    } catch (error) {
      console.warn(`⚠️ Model ${modelName} failed:`, error.message);
      lastError = error;
    }
  }
  throw lastError || new Error("All fallback models failed.");
}

// =========================================================
// BRITTLE JSON PARSING FIX
// =========================================================
function safeJsonParse(rawText) {
  try {
    let cleanText = rawText || "{}";
    cleanText = cleanText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    cleanText = cleanText.replace(/,\s*([\]}])/g, "$1");
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("JSON Parsing failed. Raw Text:", rawText);
    throw new Error("Malformed JSON received from LLM.");
  }
}

// =========================================================
// CLINICAL SAFETY: Deterministic Red Flag Scanner
// =========================================================
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

async function getNextToken() {
  try {
    const { data, error } = await supabase.rpc("get_next_daily_token");
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Token generation RPC error:", err);
    return `TKN-F${Math.floor(Math.random() * 900) + 100}`;
  }
}

// =========================================================
// CORE AI ENGINE (CLINICAL & AYUSH TRIAGE SUMMARY)
// =========================================================
export async function generateMedicalCaseSummary(
  patientInfo,
  chatHistory,
  uploadedDocs = [],
  language = "English",
) {
  try {
    const deterministicFlags = deterministicRedFlagCheck(chatHistory);
    const hasDeterministicRedFlag = deterministicFlags.length > 0;

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
- Name: ${patientInfo?.name || "Unknown Patient"}
- Age: ${patientInfo?.age || "N/A"}
- Gender: ${patientInfo?.gender || "Unknown"}
- ABHA ID: ${patientInfo?.abhaId || "Not Linked"}

Analyze the following patient-AI Ayush Prashna Pariksha transcript and any attached medical document image.

Consultation Transcript:
${formattedTranscript}

CRITICAL CLINICAL & AYUSH TRIAGING DIRECTIVES:
1. VIKRITI (DOSHA IMBALANCE) SCORING:
   - vataScore, pittaScore, and kaphaScore MUST be integers between 0 and 100.
2. AYUSH CLINICAL PARIKSHA:
   - Identify Agni status and Koshtha status. Provide Ahara-Vihara guidance.
3. ACUTE OCR & SURGICAL RED-FLAG OVERRIDE:
   - If acute findings exist, set isRedFlag to true and urgencyLevel to "Urgent".
4. MODULE B DOCUMENT DIGITIZATION:
   - Extract medications, lab values, and timeline events into arrays.
5. AYUSH DEPARTMENT ROUTING (MILESTONE 2):
   - Assign the patient to EXACTLY ONE of the following departments based on their condition:
     "Kayachikitsa", "Shalya Tantra", "Shalakya Tantra", "Kaumarbhritya", "Prasuti Tantra evam Stri Roga", "General"

${languageInstruction}`,
      },
    ];

    if (uploadedDocs && uploadedDocs.length > 0) {
      uploadedDocs.forEach((doc) => {
        const cleanBase64 = doc.base64.replace(/^data:(.*);base64,/, "");
        parts.push({
          inlineData: { mimeType: doc.type || "image/jpeg", data: cleanBase64 },
        });
      });
    }

    const config = {
      temperature: 0.1,
      systemInstruction:
        "You are an expert integrative clinical triage assistant and Ayurvedic diagnostician. Extract structured entities accurately.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chiefComplaint: { type: Type.STRING },
          symptomsSummary: { type: Type.STRING },
          possibleDiagnosis: { type: Type.STRING },
          extractedDocNotes: { type: Type.STRING },
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
          department: {
            type: SchemaType.STRING,
            enum: [
              "Kayachikitsa",
              "Shalya Tantra",
              "Shalakya Tantra",
              "Kaumarbhritya",
              "Prasuti Tantra evam Stri Roga",
              "General",
            ],
          },
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
          "department",
        ],
      },
    };

    const response = await executeWithModelFallback(parts, config);
    const parsedData = safeJsonParse(response.text);

    const finalIsRedFlag = hasDeterministicRedFlag || parsedData.isRedFlag;
    const finalUrgency = hasDeterministicRedFlag
      ? "Urgent"
      : parsedData.urgencyLevel;

    // SHIFT-AWARE ROUTING INTERCEPT
    let targetDepartment = parsedData.department || "General";

    if (targetDepartment !== "General") {
      const { data: activeDocs, error: shiftError } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "physician")
        .eq("department", targetDepartment)
        .eq("on_shift", true)
        .limit(1);

      if (shiftError || !activeDocs || activeDocs.length === 0) {
        console.warn(
          `No active physician in ${targetDepartment}, rerouting to General.`,
        );
        targetDepartment = "General";
      }
    }

    const generatedToken = await getNextToken();

    const baseCaseData = {
      name: patientInfo?.name || "Unknown Patient",
      age: patientInfo?.age || "N/A",
      gender: patientInfo?.gender || "Unknown",
      abha_id:
        patientInfo?.abhaId && patientInfo.abhaId.trim() !== ""
          ? patientInfo.abhaId
          : "Not Linked",
      primary_complaint: parsedData.chiefComplaint,
      subjective_history: parsedData.symptomsSummary,
      possible_diagnosis: parsedData.possibleDiagnosis,
      extracted_doc_notes: parsedData.extractedDocNotes,
      medications: parsedData.medications || [],
      lab_values: parsedData.labValues || [],
      timeline: parsedData.timeline || [],
      document_images: uploadedDocs || [],
      agni_status: parsedData.agniStatus,
      koshtha_status: parsedData.koshthaStatus,
      ahara_vihara: parsedData.aharaVihara,
      urgency_level: finalUrgency,
      is_red_flag: finalIsRedFlag,
      is_ai_fallback: false,
      dosha_data: [
        { subject: "Vata", value: parsedData.vataScore },
        { subject: "Pitta", value: parsedData.pittaScore },
        { subject: "Kapha", value: parsedData.kaphaScore },
      ],
      department: targetDepartment,
      token_number: generatedToken,
      status: "Waiting",
    };

    const fhirPayload = generateFHIRBundle(baseCaseData);
    const finalCaseData = { ...baseCaseData, fhir_bundle: fhirPayload };

    const { data: dbData, error: dbError } = await supabase
      .from("patients")
      .insert([finalCaseData])
      .select();
    if (dbError)
      console.error(
        "Error saving patient to Supabase:",
        dbError.message,
        dbError.details,
      );

    return { ...finalCaseData, ...(dbData?.[0] || {}) };
  } catch (apiError) {
    console.warn(
      "⚠️ All models in fallback chain failed. Engaging manual triage fallback mode.",
    );

    const fallbackToken = await getNextToken();
    const formattedHistory =
      typeof chatHistory === "string"
        ? chatHistory
        : JSON.stringify(chatHistory);

    const fallbackData = {
      name: patientInfo?.name || "Unknown Patient",
      age: patientInfo?.age || "N/A",
      gender: patientInfo?.gender || "Unknown",
      abha_id:
        patientInfo?.abhaId && patientInfo.abhaId.trim() !== ""
          ? patientInfo.abhaId
          : "Not Linked",
      primary_complaint:
        "⚠️ AI Unavailable: Manual routing and triage required.",
      subjective_history: `Raw Patient Input:\n${formattedHistory}`,
      possible_diagnosis: "Pending Manual Triage",
      extracted_doc_notes: "OCR unavailable. Review physical documents.",
      medications: [],
      lab_values: [],
      timeline: [],
      document_images: uploadedDocs || [],
      agni_status: "Pending",
      koshtha_status: "Pending",
      ahara_vihara: "Pending",
      urgency_level: "Review Soon",
      is_red_flag: false,
      is_ai_fallback: true,
      dosha_data: [
        { subject: "Vata", value: 50 },
        { subject: "Pitta", value: 50 },
        { subject: "Kapha", value: 50 },
      ],
      department: "General",
      token_number: fallbackToken,
      status: "Waiting",
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
      console.error(
        "Error saving fallback patient to Supabase:",
        fbError.message,
        fbError.details,
      );

    return { ...finalFallbackData, ...(fbData?.[0] || {}) };
  }
}

// =========================================================
// DYNAMIC CHAT AI ENGINE
// =========================================================
export async function generateNextChatResponse(
  chatHistory,
  step,
  language = "English",
) {
  try {
    const latestPatientMsg =
      [...chatHistory].reverse().find((m) => m.sender === "user")?.text || "";
    const deterministicFindings = deterministicRedFlagCheck(latestPatientMsg);

    const historyText = chatHistory
      .map((m) => `${m.sender === "ai" ? "Doctor" : "Patient"}: ${m.text}`)
      .join("\n");

    let clinicalDirective = "";
    switch (step) {
      case 1:
        clinicalDirective = `PHASE 1: Chief Complaint. Ask ONE focused clinical follow-up question.`;
        break;
      case 2:
        clinicalDirective = `PHASE 2: Digestion & Agni. Ask ONE targeted question about appetite, digestion.`;
        break;
      case 3:
        clinicalDirective = `PHASE 3: Sleep & Energy. Ask ONE targeted question about sleep quality, fatigue.`;
        break;
      case 4:
        clinicalDirective = `PHASE 4: Lifestyle & Vihara. Ask ONE targeted question about daily routine.`;
        break;
      case 5:
        clinicalDirective = `PHASE 5: Diet & Ahara. Ask ONE targeted question about regular dietary habits.`;
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
If the patient reports symptoms indicating an acute medical emergency:
- You MUST set "critical_symptom_detected" to true IMMEDIATELY.
- In "question", output a concise, urgent warning directing the patient to alert the hospital staff immediately.
- DO NOT continue asking conversational routine intake questions.`;

    const langInstruction = `CRITICAL LANGUAGE REQUIREMENT: Output the response JSON entirely in fluent ${language} script and vocabulary.`;

    const prompt = `${kioskContextDirective}\n${clinicalDirective}\n${emergencyDirective}\n${langInstruction}\n\nConversation History:\n${historyText}\n\nGenerate the next response in ${language}. Keep the question under 2 sentences.\nProvide 3 short, clinically relevant quick-reply options in ${language}.`;

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

    const response = await executeWithModelFallback([{ text: prompt }], config);
    const parsed = safeJsonParse(response.text);

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
