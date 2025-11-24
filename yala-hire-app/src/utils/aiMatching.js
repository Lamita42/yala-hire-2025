import { GROQ_API_KEY } from "../aiClient";

export async function aiMatchJob(profile, job) {
  if (!GROQ_API_KEY) {
    console.error("❌ No AI key found. Set REACT_APP_GROQ_KEY in .env");
    return { score: 0, reason: "Missing API key" };
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: `
Evaluate how well this candidate matches this job.

Candidate:
- Skills: ${profile.skills}
- Education: ${profile.education}
- Experience: ${profile.experience}

Job:
- Skills Required: ${job.required_skills}
- Description: ${job.description}

Return JSON ONLY:
{
  "score": <0-100>,
  "reason": "<short explanation>"
}
`
        }
      ]
    })
  });

  if (!res.ok) {
    console.error("❌ AI Error:", await res.text());
    return { score: 0, reason: "AI request failed" };
  }

  const data = await res.json();

  try {
    return JSON.parse(data.choices[0].message.content);
  } catch (err) {
    console.error("❌ JSON Parse Error:", data);
    return { score: 0, reason: "Invalid AI response format" };
  }
}
