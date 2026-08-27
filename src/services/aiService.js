import { GoogleGenAI, Type } from "@google/genai";

export async function generateMedicalCaseSummary(
  patientInfo,
  chatHistory,
  documentImageBase64 = null,
) {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "🚨 VITE_GEMINI_API_KEY is missing! Check your .env file.",
      );
    }

    console.log("Calling Gemini API via official SDK...");
    const ai = new GoogleGenAI({ apiKey: apiKey });

    // Build the parts array for multimodal analysis
    const parts = [
      {
        text: `Patient Demographics:
- Name: ${patientInfo?.name || "Anonymous"}
- Age: ${patientInfo?.age || "Unknown"}
- Gender: ${patientInfo?.gender || "Unknown"}
- ABHA ID: ${patientInfo?.abhaId || "Not Linked"}

Analyze the following patient-AI consultation transcript and any attached medical document image (prescription, lab report, discharge summary).

Consultation Transcript:
${JSON.stringify(chatHistory)}

Extract the chief complaint, structured clinical history, preliminary diagnosis, emergency red-flag triage status, document analysis, and comprehensive Ayurvedic Pariksha assessment (Vata, Pitta, Kapha scores from 0 to 100, Agni state, and Ahara-Vihara advice).`,
      },
    ];

    // Append base64 image if uploaded by the patient
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

    // Call the model using the SDK (handles URLs automatically)
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: parts,
        },
      ],
      config: {
        temperature: 0.1, // Near-zero for factual accuracy
        systemInstruction:
          "You are an expert clinical triage assistant and Ayurvedic diagnostician for the Ministry of Ayush. Perform clinical history structuring, medical document OCR, and Dashavidha/Dosha triaging. Return strictly structured JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chiefComplaint: {
              type: Type.STRING,
              description: "Primary presenting complaint",
            },
            symptomsSummary: {
              type: Type.STRING,
              description: "Detailed subjective clinical history",
            },
            possibleDiagnosis: {
              type: Type.STRING,
              description: "Preliminary potential condition",
            },
            extractedDocNotes: {
              type: Type.STRING,
              description:
                "Key medications or lab findings extracted from attached document",
            },
            agniStatus: {
              type: Type.STRING,
              description:
                "Digestive fire state: Mandagni, Tikshnagni, Vishamagni, or Samagni",
            },
            aharaVihara: {
              type: Type.STRING,
              description: "Dietary and lifestyle causative factors observed",
            },
            vataScore: {
              type: Type.INTEGER,
              description: "Vata imbalance percentage from 0 to 100",
            },
            pittaScore: {
              type: Type.INTEGER,
              description: "Pitta imbalance percentage from 0 to 100",
            },
            kaphaScore: {
              type: Type.INTEGER,
              description: "Kapha imbalance percentage from 0 to 100",
            },
            urgencyLevel: {
              type: Type.STRING,
              enum: ["Routine", "Review Soon", "Urgent"],
              description: "Triage priority level",
            },
            isRedFlag: {
              type: Type.BOOLEAN,
              description: "True if acute emergency symptoms are present",
            },
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

    console.log("AI successfully generated a response!");
    const parsedData = JSON.parse(response.text);

    return {
      name: patientInfo?.name || "Anonymous Patient",
      age: patientInfo?.age || "N/A",
      gender: patientInfo?.gender || "N/A",
      abhaId: patientInfo?.abhaId || "Not Linked",
      primaryComplaint: parsedData.chiefComplaint,
      subjectiveHistory: parsedData.symptomsSummary,
      possibleDiagnosis: parsedData.possibleDiagnosis,
      extractedDocNotes: parsedData.extractedDocNotes,
      agniStatus: parsedData.agniStatus,
      aharaVihara: parsedData.aharaVihara,
      urgencyLevel: parsedData.urgencyLevel,
      isRedFlag: parsedData.isRedFlag,
      doshaData: [
        { subject: "Vata", value: parsedData.vataScore },
        { subject: "Pitta", value: parsedData.pittaScore },
        { subject: "Kapha", value: parsedData.kaphaScore },
      ],
    };
  } catch (error) {
    console.error("🔥 True AI Generation Error:", error.message || error);
    throw error;
  }
}
