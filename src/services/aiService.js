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
3. ABDM / NAMASTE CODING:
   - Provide a highly probable SNOMED-CT or NAMASTE diagnostic code (as a string) mapping to the possibleDiagnosis.
4. ACUTE OCR & SURGICAL RED-FLAG OVERRIDE:
   - If acute findings exist, set isRedFlag to true and urgencyLevel to "Urgent".
5. MODULE B DOCUMENT DIGITIZATION:
   - Extract medications, lab values, and timeline events into arrays.
6. AYUSH DEPARTMENT ROUTING (MILESTONE 2):
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
        "You are an expert integrative clinical triage assistant and Ayurvedic diagnostician. Extract structured entities accurately, including SNOMED-CT or NAMASTE diagnostic codes.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chiefComplaint: { type: Type.STRING },
          symptomsSummary: { type: Type.STRING },
          possibleDiagnosis: { type: Type.STRING },
          diagnosisCode: { type: Type.STRING },
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
          "diagnosisCode",
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
      diagnosis_code: parsedData.diagnosisCode || "000000",
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

/**
 * Phase definitions for the Ayush Prashna Pariksha intake interview.
 * Each phase has:
 *   - directive: the one concrete clinical question topic to ask
 *   - completionCriteria: what the patient must have provided for
 *     `phase_complete` to be legitimately true. This is injected
 *     verbatim into the prompt so the model has an unambiguous,
 *     checkable condition — not a vague "enough information" judgment.
 *   - minimumExchanges: the fewest patient turns this phase should ever
 *     take. Used as a hard floor on `phase_complete` — prevents the
 *     model from marking a phase complete on the very first reply when
 *     it has no conversation history to evaluate.
 */
const INTAKE_PHASE_DEFINITIONS = [
  null, // index 0 unused — step is 1-indexed
  {
    // Step 1
    name: "Chief Complaint & Body Location",
    directive:
      "Ask ONE focused clinical follow-up about the patient's PRIMARY SYMPTOM. Clarify location, onset, severity, or character. Do NOT ask about digestion, sleep, diet, or any other topic.",
    completionCriteria:
      "The patient has described WHAT their symptom is AND at least one of: WHERE it is located, WHEN it started, or HOW SEVERE it is.",
    minimumExchanges: 1,
  },
  {
    // Step 2
    name: "Digestion & Agni",
    directive:
      "Ask ONE targeted question about DIGESTION OR APPETITE ONLY. Examples: bowel habits, appetite changes, acidity, bloating. Do NOT revisit the chief complaint. Do NOT ask about sleep or diet.",
    completionCriteria:
      "The patient has commented on their appetite, digestion, or bowel habits in any way.",
    minimumExchanges: 1,
  },
  {
    // Step 3
    name: "Sleep & Energy (Nidra)",
    directive:
      "Ask ONE targeted question about SLEEP QUALITY OR ENERGY LEVELS ONLY. Examples: difficulty sleeping, fatigue, tiredness. Do NOT ask about digestion or diet.",
    completionCriteria:
      "The patient has commented on their sleep pattern or energy level in any way.",
    minimumExchanges: 1,
  },
  {
    // Step 4
    name: "Lifestyle & Stress (Vihara)",
    directive:
      "Ask ONE targeted question about DAILY ROUTINE OR STRESS LEVELS ONLY. Examples: work hours, physical activity, stress, anxiety. Do NOT ask about diet or food.",
    completionCriteria:
      "The patient has commented on their daily routine, work, activity level, or stress in any way.",
    minimumExchanges: 1,
  },
  {
    // Step 5
    name: "Dietary Habits (Ahara)",
    directive:
      "Ask ONE targeted question about REGULAR DIETARY HABITS ONLY. Examples: spicy food, meal timing, vegetarian or non-vegetarian diet, water intake. Do NOT ask about symptoms or lifestyle.",
    completionCriteria:
      "The patient has commented on their eating habits or food preferences in any way.",
    minimumExchanges: 1,
  },
];

export async function generateNextChatResponse(
  chatHistory,
  step,
  language = "English",
  hasDismissedEmergency = false,
) {
  try {
    const latestPatientMsg =
      [...chatHistory].reverse().find((m) => m.sender === "user")?.text || "";
    const deterministicFindings = deterministicRedFlagCheck(latestPatientMsg);

    /**
     * FIX 1: Broken template literal (was `\({m.sender}\){m.text}`).
     * The backslash-paren escaping was corrupting every message in the
     * history string. The model received literal `\(Doctor:\)text` instead
     * of "Doctor: text" — making the entire conversation unreadable and
     * causing the amnesia / script-restart behavior observed in production.
     */
    const historyText = chatHistory
      .map((m) => `${m.sender === "ai" ? "Doctor" : "Patient"}: ${m.text}`)
      .join("\n");

    /**
     * FIX 2: Phase-locked prompt with unambiguous completion criteria.
     * Previously the directive was a one-line soft suggestion that the model
     * could ignore. Now:
     *   (a) The phase name and what NOT to ask is stated explicitly.
     *   (b) `completionCriteria` is a concrete, checkable condition — not
     *       "enough information," which the model interprets as "one exchange."
     *   (c) `minimumExchanges` prevents `phase_complete: true` on the first
     *       reply of a fresh phase when the patient hasn't answered yet.
     */
    const phase = INTAKE_PHASE_DEFINITIONS[step];

    // Count how many patient turns have occurred at this step by looking
    // backward from the end of the history until we hit an AI message that
    // introduced the phase topic. Approximate: count patient turns since the
    // last AI question (within the last 6 messages, to stay cheap).
    const recentMessages = chatHistory.slice(-6);
    const patientTurnsInPhase = recentMessages.filter(
      (m) => m.sender === "user",
    ).length;

    const phaseTooNewForCompletion =
      phase && patientTurnsInPhase < phase.minimumExchanges;

    const clinicalDirective = phase
      ? `
=== CURRENT INTAKE PHASE: ${phase.name} (Step ${step} of 5) ===
YOUR TASK: ${phase.directive}

PHASE COMPLETION RULE:
Set "phase_complete": true ONLY IF this condition is met:
  "${phase.completionCriteria}"
Set "phase_complete": false if the patient has NOT yet satisfied this condition,
or if you need one more clarification specifically about ${phase.name}.
${phaseTooNewForCompletion ? `OVERRIDE: The patient has not yet responded to this phase's question. Set "phase_complete": false.` : ""}

ABSOLUTE PROHIBITION: Do NOT ask about topics belonging to other phases.
Do NOT ask what the patient's primary symptom is — that was captured in Step 1.
Do NOT restart the intake from the beginning.
`
      : `Ask ONE brief summary confirmation question.`;

    const kioskContextDirective = `YOU ARE AN AI CLINICAL INTAKE KIOSK LOCATED PHYSICALLY AT A HOSPITAL OPD WAITING COUNTER.
CRITICAL SAFETY & ROLE RULES:
1. NEVER act as a remote 911 or 112 ambulance dispatcher.
2. The patient is standing right in front of this kiosk in the clinic.

CRITICAL CONVERSATIONAL RULE:
You have FULL conversation history below. Read it carefully before responding.
The patient's chief complaint and all prior answers are already recorded.
DO NOT re-ask anything the patient has already answered.
DO NOT greet the patient again — the greeting already happened at the start.
DO NOT ask "what is your main symptom" or any opening intake question.`;

    const emergencyDirective = hasDismissedEmergency
      ? `SYSTEM OVERRIDE: The patient confirmed their severe symptoms are a chronic baseline. IGNORE the emergency red-flag protocol. Proceed with the current phase.`
      : `CLINICAL PROTOCOL:
If the patient reports ACUTE red-flag symptoms (e.g., severe sudden headache, chest pressure, syncope, uncontrolled bleeding):
- IMMEDIATELY set "critical_symptom_detected" to true.
- Do not ask conversational triage questions about the emergency.`;

    const formatInstruction = `Generate the next response in ${language}.
OUTPUT RULES:
1. Ask ONLY ONE single, short question under 15 words. No compound questions.
2. Tolerate code-switching (Hinglish, mixed dialects) from the patient, but output your response purely in fluent ${language}.
3. Provide exactly 3 short, clinically relevant quick-reply options in ${language}.`;

    /**
     * FIX 3: Prompt assembly also had the broken template literal.
     * The entire prompt was being built with `\({...}\){...}` syntax
     * which produced literal backslash-paren characters in the string.
     */
    const prompt = [
      kioskContextDirective,
      clinicalDirective,
      emergencyDirective,
      formatInstruction,
      "",
      "Conversation History (read this carefully):",
      historyText,
    ].join("\n");

    const config = {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          critical_symptom_detected: { type: Type.BOOLEAN },
          phase_complete: { type: Type.BOOLEAN },
        },
        required: [
          "question",
          "options",
          "critical_symptom_detected",
          "phase_complete",
        ],
      },
    };

    const response = await executeWithModelFallback([{ text: prompt }], config);
    const parsed = safeJsonParse(response.text);

    // Deterministic override: if our own red-flag scanner fired on the
    // patient's latest message, force critical_symptom_detected true
    // regardless of what the model returned.
    if (deterministicFindings.length > 0 && !hasDismissedEmergency) {
      parsed.critical_symptom_detected = true;
    }

    // Safety floor: never let the model mark a phase complete if the patient
    // hasn't had at least one turn to actually answer the phase question.
    if (phaseTooNewForCompletion) {
      parsed.phase_complete = false;
    }

    return parsed;
  } catch (error) {
    console.error("🚨 Live Chat API Error across fallback models:", error);
    return {
      question:
        "Could you clarify how long you have been experiencing this discomfort?",
      options: ["Few hours", "2-3 days", "Over a week"],
      critical_symptom_detected: false,
      phase_complete: false,
    };
  }
}
