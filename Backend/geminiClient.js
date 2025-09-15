// backend/geminiClient.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in .env");
}

// Initialize Gemini client (older SDK)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateTestCases(userStory) {
  try {
    const prompt = `
    You are an expert Senior Software Tester and QA Test Case Generator.
    Generate well-structured positive, negative, boundary and edge test cases in strict JSON format only.
    Do not include any explanations or extra text.
    Write the Steps in a numbered list format. Each step should be a single line.
    For steps, always start with "Navigate to https://a-qa-my.siliconexpert.com/"
    
    The format must be:
    [
      {
        "id": "number",
        "title": "string",
        "steps": "string",
        "expectedResult": "string",
        "priority": "Low | Medium | High",
      }
    ]
    
    User Story:
    ${userStory}
    `;
    
      const result = await model.generateContent(prompt);
      const text = result.response.text();
    
      // ensure JSON only (remove backticks, etc.)
      const cleaned = text.replace(/```json|```/g, "").trim();
      return cleaned;
  } catch (err) {
    console.error("Gemini API error:", err);
    throw new Error("Failed to generate test cases with Gemini.");
  }
}
