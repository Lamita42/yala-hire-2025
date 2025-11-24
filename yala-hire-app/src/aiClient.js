// src/aiClient.js

export const GROQ_API_KEY = process.env.REACT_APP_GROQ_KEY;

if (!GROQ_API_KEY) {
  console.warn("⚠️ Warning: No Groq API key found in REACT_APP_GROQ_KEY");
}
