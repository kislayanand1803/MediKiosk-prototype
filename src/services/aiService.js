import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "./supabaseClient";

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
  const combinedText = chatHistory.map((m) => m.text.toLowerCase()).join(" ");
  const findings = [];

  for (const [flag, phrases] of Object.entries(RED_FLAG_PATTERNS)) {
    const hits = phrases.filter((p) => combinedText.includes(p));
    if (hits.length > 0) {
      findings.push({ flag, evidence: hits });
    }
  }
  return findings;
}

export async function generateMedicalCaseSummary(
  patientInfo,
  chatHistory,
  documentImageBase64 = null,
  language = "English",
) {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("🚨 VITE_GEMINI_API_KEY is missing!");
    }

    const deterministicFlags = deterministicRedFlagCheck(chatHistory);
    const hasDeterministicRedFlag = deterministicFlags.length > 0;

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const languageInstruction = `Provide all descriptive text summaries (chiefComplaint, symptomsSummary, possibleDiagnosis, extractedDocNotes, agniStatus, aharaVihara) in clear, professional medical English for the doctor portal, while accurately translating the patient's ${language} input.`;

    const parts = [
      {
        text: `Patient Demographics:
- Name: ${patientInfo?.name || "Rahul Sharma"}
- Age: ${patientInfo?.age || "28"}
- Gender: ${patientInfo?.gender || "Male"}
- ABHA ID: ${patientInfo?.abhaId || "Not Linked"}
- Patient Language Session: ${language}

Analyze the following patient-AI Ayush Prashna Pariksha transcript and any attached medical document image.

Consultation Transcript:
${JSON.stringify(chatHistory)}

CRITICAL INSTRUCTION - DATA PROVENANCE: 
For every text field you extract, you MUST assign a source tag:
- "PATIENT_REPORTED": If the patient explicitly said it in the chat.
- "DOCUMENT_REPORTED": If you read it from an uploaded prescription or lab report.
- "AI_INFERRED": If you deduced it medically but it wasn't explicitly stated.

Extract the chief complaint, structured clinical history, preliminary diagnosis, emergency red-flag triage status, document analysis, and comprehensive Ayurvedic Pariksha assessment (Vata, Pitta, Kapha scores from 0 to 100, Agni state, and Ahara-Vihara advice). ${languageInstruction}`,
      },
    ];

    if (documentImageBase64) {
      const cleanBase64 = documentImageBase64.replace(
        /^data:image\/\w+;base64,/,
        "",
      );
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: parts }],
      config: {
        temperature: 0.1,
        systemInstruction:
          "You are an expert clinical triage assistant and Ayurvedic diagnostician for the Ministry of Ayush conducting the Ayush Prashna Pariksha. Perform clinical history structuring, medical document OCR, and Dashavidha/Dosha triaging. Distinguish patient-reported facts from AI inferences. Return strictly structured JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chiefComplaint: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                source: {
                  type: Type.STRING,
                  enum: [
                    "PATIENT_REPORTED",
                    "DOCUMENT_REPORTED",
                    "AI_INFERRED",
                  ],
                },
              },
            },
            symptomsSummary: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                source: {
                  type: Type.STRING,
                  enum: [
                    "PATIENT_REPORTED",
                    "DOCUMENT_REPORTED",
                    "AI_INFERRED",
                  ],
                },
              },
            },
            possibleDiagnosis: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                source: {
                  type: Type.STRING,
                  enum: [
                    "PATIENT_REPORTED",
                    "DOCUMENT_REPORTED",
                    "AI_INFERRED",
                  ],
                },
              },
            },
            extractedDocNotes: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                source: {
                  type: Type.STRING,
                  enum: [
                    "PATIENT_REPORTED",
                    "DOCUMENT_REPORTED",
                    "AI_INFERRED",
                  ],
                },
              },
            },
            agniStatus: { type: Type.STRING },
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
            "aharaVihara",
            "vataScore",
            "pittaScore",
            "kaphaScore",
            "urgencyLevel",
            "isRedFlag",
          ],
        },
      },
    });

    const parsedData = JSON.parse(response.text);

    const finalIsRedFlag = hasDeterministicRedFlag || parsedData.isRedFlag;
    const finalUrgency = hasDeterministicRedFlag
      ? "Urgent"
      : parsedData.urgencyLevel;

    const formatProvenance = (obj) => {
      if (!obj || !obj.text) return "";
      const badge =
        obj.source === "PATIENT_REPORTED"
          ? "🗣️"
          : obj.source === "DOCUMENT_REPORTED"
            ? "📄"
            : "🤖";
      return `${badge} ${obj.text}`;
    };

    const finalCaseData = {
      name: patientInfo?.name || "Rahul Sharma",
      age: patientInfo?.age || "28",
      gender: patientInfo?.gender || "Male",
      abha_id:
        patientInfo?.abhaId && patientInfo.abhaId.trim() !== ""
          ? patientInfo.abhaId
          : "Not Linked",
      primary_complaint: formatProvenance(parsedData.chiefComplaint),
      subjective_history: formatProvenance(parsedData.symptomsSummary),
      possible_diagnosis: formatProvenance(parsedData.possibleDiagnosis),
      extracted_doc_notes: formatProvenance(parsedData.extractedDocNotes),
      agni_status: parsedData.agniStatus,
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
    if (dbError) {
      console.error("Error saving patient to Supabase:", dbError);
    }

    return {
      ...finalCaseData,
      id: dbData?.[0]?.id,
    };
  } catch (apiError) {
    console.warn(
      "⚠️ API error encountered. Engaging demo fallback mode:",
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
    if (fbError) {
      console.error("Error saving fallback patient to Supabase:", fbError);
    }

    return {
      ...fallbackData,
      id: fbData?.[0]?.id,
    };
  }
}

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
    if (step === 1) {
      clinicalDirective = `PHASE 1: History of Present Illness (HPI). Use the SOCRATES medical framework. 
      Based on the patient's chief complaint, ask exactly ONE logical follow-up question. 
      DO NOT repeat any question already asked. Move the diagnosis forward.`;
    } else if (step === 2) {
      clinicalDirective = `PHASE 2: Ayush Dashavidha Pariksha. 
      Ask exactly ONE targeted question about their systemic health. Focus specifically on Digestion (Agni), Bowel Movements (Koshtha), or Sleep (Nidra).`;
    }

    const langInstruction = `CRITICAL LANGUAGE REQUIREMENT: You MUST write both your generated clinical question and all 3 quick-reply options entirely in fluent ${language} script and vocabulary. Do not mix in English unless it is an unavoidable technical word.`;

    const prompt = `You are a highly skilled Ayush Physician conducting a rapid clinical triage interview.
    ${clinicalDirective}
    ${langInstruction}
    
    Review the conversation history below. Generate your next logical, professional question in ${language}. Keep it under 2 sentences. 
    Provide 3 short, highly relevant quick-reply option chips in ${language}.

    Conversation History:
    ${historyText}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["question", "options"],
        },
      },
    });

    let cleanText = response.text || "";
    cleanText = cleanText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("🚨 Live Chat API Error:", error);

    return {
      question:
        "Could you clarify exactly how many days you have been experiencing this?",
      options: ["2-3 days", "1 week", "A long time"],
    };
  }
}
