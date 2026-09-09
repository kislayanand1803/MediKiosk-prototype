// Use this code to generate translations for the 22 languages in the 8th Schedule of the Indian Constitution using Gemini AI.
// node scripts/translate.js
import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const EN_FILE_PATH = path.join(
  process.cwd(),
  "public",
  "locales",
  "en",
  "translation.json",
);
const LOCALES_DIR = path.join(process.cwd(), "public", "locales");

// The Complete 8th Schedule of the Indian Constitution (22 Languages)
const targetLanguages = [
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "mr", name: "Marathi" },
  { code: "te", name: "Telugu" },
  { code: "ta", name: "Tamil" },
  { code: "gu", name: "Gujarati" },
  { code: "ur", name: "Urdu" },
  { code: "kn", name: "Kannada" },
  { code: "or", name: "Odia" },
  { code: "ml", name: "Malayalam" },
  { code: "pa", name: "Punjabi" },
  { code: "as", name: "Assamese" },
  { code: "mai", name: "Maithili" },
  { code: "sat", name: "Santali" },
  { code: "ks", name: "Kashmiri" },
  { code: "ne", name: "Nepali" },
  { code: "kok", name: "Konkani" },
  { code: "sd", name: "Sindhi" },
  { code: "doi", name: "Dogri" },
  { code: "mni", name: "Manipuri (Meitei)" },
  { code: "brx", name: "Bodo" },
  { code: "sa", name: "Sanskrit" },
];

async function translateWithGemini(englishJson, targetLangName) {
  // UPDATED: Using the active, supported model version
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

  const prompt = `
    You are an expert medical translator for the Indian Ministry of Ayush.
    Translate the values of the following JSON object into ${targetLangName}.
    
    CRITICAL RULES:
    1. Keep the exact same JSON keys. ONLY translate the values.
    2. Maintain any interpolation variables like {{name}} or {{current}} exactly as they are.
    3. Ensure the translation is contextually accurate for a hospital/clinic environment.
    4. Return ONLY raw, valid JSON. Do not include markdown formatting like \`\`\`json.
    
    JSON to translate:
    ${JSON.stringify(englishJson, null, 2)}
  `;

  try {
    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();

    // Clean up any markdown blocks if Gemini accidentally includes them
    if (responseText.startsWith("```json")) {
      responseText = responseText
        .replace(/^```json\n/, "")
        .replace(/\n```$/, "");
    } else if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error(
      `Gemini translation failed for ${targetLangName}:`,
      error.message,
    );
    return null;
  }
}

async function run() {
  console.log(
    "🤖 Booting up Gemini AI Translation Pipeline for 22 Languages...",
  );

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in your .env file!");
    return;
  }

  const enData = JSON.parse(fs.readFileSync(EN_FILE_PATH, "utf-8"));

  for (const lang of targetLanguages) {
    const langDirPath = path.join(LOCALES_DIR, lang.code);
    const langFilePath = path.join(langDirPath, "translation.json");

    if (!fs.existsSync(langDirPath)) {
      fs.mkdirSync(langDirPath, { recursive: true });
    }

    console.log(`\n⚙️ Generating ${lang.name} (${lang.code})...`);

    const translatedData = await translateWithGemini(enData, lang.name);

    if (translatedData) {
      fs.writeFileSync(
        langFilePath,
        JSON.stringify(translatedData, null, 2),
        "utf-8",
      );
      console.log(`✅ Successfully saved ${lang.code}/translation.json`);
    } else {
      console.log(
        `⚠️ Skipping ${lang.name} due to translation error. It will fallback to English.`,
      );
    }

    // 3.5-second delay to ensure we easily stay within the free tier rate limits for a large batch
    await new Promise((resolve) => setTimeout(resolve, 3500));
  }

  console.log("\n🎉 AI Pipeline Complete! All 22 languages generated.");
}

run();
