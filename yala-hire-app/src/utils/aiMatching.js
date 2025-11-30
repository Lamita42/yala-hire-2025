// src/utils/aiMatching.js
import { supabase } from "../supabaseClient";
import { computeMatchPercentage } from "./matching";
import { GROQ_API_KEY } from "../aiClient";

// -----------------------------
// Raw AI: score + reason
// -----------------------------
export async function aiMatchJob(profile, job) {
  if (!GROQ_API_KEY) {
    console.error("❌ No AI key found. Set REACT_APP_GROQ_KEY in .env");
    return { score: 0, reason: "Missing API key" };
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
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

Return JSON ONLY with this shape:
{
  "score": <number 0-100>,
  "reason": "<short explanation>"
}
`,
        },
      ],
    }),
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

// -----------------------------
// Raw AI: improvement suggestions
// -----------------------------
export async function aiSuggestImprovements(profile, job) {
  if (!GROQ_API_KEY) {
    console.error("❌ No AI key found. Set REACT_APP_GROQ_KEY in .env");
    return {
      missing_skills: [],
      missing_experience: "",
      missing_education: "",
      suggested_courses: [],
    };
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: `
You are a friendly career coach.

Given this candidate and job, list:
- Missing skills
- Missing experience
- Missing education (if relevant)
- 3–6 concrete course suggestions (with platform + course title)

Candidate:
- Skills: ${profile.skills}
- Education: ${profile.education}
- Experience: ${profile.experience}

Job:
- Skills Required: ${job.required_skills}
- Description: ${job.description}

Return JSON ONLY in this shape:
{
  "missing_skills": ["skill 1", "skill 2", ...],
  "missing_experience": "short text",
  "missing_education": "short text or empty string",
  "suggested_courses": [
    "Coursera – Course name",
    "Udemy – Course name",
    "YouTube – Channel / Playlist name"
  ]
}
`,
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error("❌ AI Error (improvements):", await res.text());
    return {
      missing_skills: [],
      missing_experience: "",
      missing_education: "",
      suggested_courses: [],
    };
  }

  const data = await res.json();

  try {
    return JSON.parse(data.choices[0].message.content);
  } catch (err) {
    console.error("❌ JSON Parse Error (improvements):", data);
    return {
      missing_skills: [],
      missing_experience: "",
      missing_education: "",
      suggested_courses: [],
    };
  }
}

// -----------------------------
// Cached match (stable score)
// -----------------------------
export async function getOrCreateMatch(userId, profile, job) {
  // 1) Check cache in job_matches
  const { data: existing, error } = await supabase
    .from("job_matches")
    .select("*")
    .eq("user_id", userId)
    .eq("job_id", job.id)
    .maybeSingle();

  if (!error && existing && existing.final_score != null) {
    return {
      basicScore: existing.basic_score ?? 0,
      aiScore: existing.ai_score ?? 0,
      finalScore: existing.final_score ?? 0,
      reason: existing.ai_reason || "",
    };
  }

  // 2) Compute fresh
  const basicScore = computeMatchPercentage(
    profile.skills || "",
    job.required_skills || ""
  );

  let aiScore = 0;
  let reason = "";
  try {
    const ai = await aiMatchJob(profile, job);
    aiScore = ai.score || 0;
    reason = ai.reason || "";
  } catch (e) {
    console.error("AI matching error:", e);
  }

  const finalScore = basicScore * 0.3 + aiScore * 0.7;

  // 3) Save to DB so it stays stable next time
  const payload = {
    user_id: userId,
    job_id: job.id,
    basic_score: basicScore,
    ai_score: aiScore,
    final_score: finalScore,
    ai_reason: reason,
  };

  await supabase
    .from("job_matches")
    .upsert(payload, { onConflict: "user_id,job_id" });

  return { basicScore, aiScore, finalScore, reason };
}

// -----------------------------
// Cached improvement suggestions
// -----------------------------
export async function getOrCreateImprovements(userId, profile, job) {
  const { data: existing, error } = await supabase
    .from("job_matches")
    .select("improvement")
    .eq("user_id", userId)
    .eq("job_id", job.id)
    .maybeSingle();

  if (!error && existing && existing.improvement) {
    return existing.improvement;
  }

  const improvement = await aiSuggestImprovements(profile, job);

  await supabase
    .from("job_matches")
    .upsert(
      {
        user_id: userId,
        job_id: job.id,
        improvement,
      },
      { onConflict: "user_id,job_id" }
    );

  return improvement;
}
