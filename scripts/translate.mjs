import fs from 'fs/promises';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the API key is set
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY is not set in the environment variables.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const EN_JSON_PATH = path.join(__dirname, '../src/locales/en.json');
const MM_JSON_PATH = path.join(__dirname, '../src/locales/mm.json');

async function translate() {
  try {
    const enDataRaw = await fs.readFile(EN_JSON_PATH, 'utf-8');
    const enData = JSON.parse(enDataRaw);

    if (Object.keys(enData).length === 0) {
      console.log('en.json is empty. Nothing to translate.');
      await fs.writeFile(MM_JSON_PATH, JSON.stringify({}, null, 2), 'utf-8');
      return;
    }

    const prompt = `
You are an expert English to Myanmar (Burmese) translator.
Translate the following JSON object's values to Myanmar (Burmese). 
Keep the keys exactly the same. Do not translate the keys.
Return ONLY valid JSON, without markdown formatting or backticks.

${JSON.stringify(enData, null, 2)}
`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // Clean up potential markdown formatting block
    responseText = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    const translatedJson = JSON.parse(responseText);

    await fs.writeFile(MM_JSON_PATH, JSON.stringify(translatedJson, null, 2), 'utf-8');
    console.log('Successfully translated to Myanmar (Burmese) and saved to mm.json');
  } catch (error) {
    console.error('Translation failed:', error);
    process.exit(1);
  }
}

translate();
