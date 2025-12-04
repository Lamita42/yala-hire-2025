// src/utils/aiMatching.js
import { supabase } from "../supabaseClient";
import { computeMatchPercentage } from "./matching";
import { GROQ_API_KEY } from "../aiClient";

/* ============================================================
   1) AI MATCH SCORE
   ============================================================ */
export async function aiMatchJob(profile, job) {
  if (!GROQ_API_KEY) {
    console.error("❌ No AI key found. Add GROQ key to .env");
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

Return ONLY JSON:
{
  "score": <0-100>,
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
  } catch {
    return { score: 0, reason: "Invalid AI response" };
  }
}

/* ============================================================
   2) AI IMPROVEMENT SUGGESTIONS
   ============================================================ */
export async function aiSuggestImprovements(profile, job) {
  if (!GROQ_API_KEY) {
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
- Missing education
- 3–6 real courses they should take

Candidate:
${profile.skills}, ${profile.education}, ${profile.experience}

Job:
${job.required_skills}, ${job.description}

Return ONLY JSON:
{
  "missing_skills": ["skill1", "skill2"],
  "missing_experience": "text",
  "missing_education": "text",
  "suggested_courses": ["Course 1", "Course 2"]
}
`,
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error("❌ AI Error:", await res.text());
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
  } catch {
    return {
      missing_skills: [],
      missing_experience: "",
      missing_education: "",
      suggested_courses: [],
    };
  }
}

/* ============================================================
   3) STABLE MATCH SCORE (DB-CACHED)
   ============================================================ */
export async function getOrCreateMatch(userId, profile, job) {
  const { data: existing } = await supabase
    .from("job_matches")
    .select("*")
    .eq("user_id", userId)
    .eq("job_id", job.id)
    .maybeSingle();

  if (existing && existing.final_score != null) {
    return {
      basicScore: existing.basic_score ?? 0,
      aiScore: existing.ai_score ?? 0,
      finalScore: existing.final_score ?? 0,
      reason: existing.ai_reason || "",
    };
  }

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
  } catch {}

  const finalScore = basicScore * 0.3 + aiScore * 0.7;

  await supabase.from("job_matches").upsert(
    {
      user_id: userId,
      job_id: job.id,
      basic_score: basicScore,
      ai_score: aiScore,
      final_score: finalScore,
      ai_reason: reason,
    },
    { onConflict: "user_id,job_id" }
  );

  return { basicScore, aiScore, finalScore, reason };
}

/* ============================================================
   4) STABLE IMPROVEMENTS (DB-CACHED)
   ============================================================ */
export async function getOrCreateImprovements(userId, profile, job) {
  const { data: existing } = await supabase
    .from("job_matches")
    .select("improvement")
    .eq("user_id", userId)
    .eq("job_id", job.id)
    .maybeSingle();

  if (existing && existing.improvement) {
    return existing.improvement;
  }

  const improvement = await aiSuggestImprovements(profile, job);

  await supabase.from("job_matches").upsert(
    {
      user_id: userId,
      job_id: job.id,
      improvement,
    },
    { onConflict: "user_id,job_id" }
  );

  return improvement;
}

/* ============================================================
   5) NEW — LOCAL CACHE FOR SUGGESTIONS
   ============================================================ */
export function saveSuggestionsToCache(userId, jobId, suggestions) {
  try {
    localStorage.setItem(
      `suggestions_${userId}_${jobId}`,
      JSON.stringify(suggestions)
    );
  } catch {}
}

export function loadSuggestionsFromCache(userId, jobId) {
  try {
    const raw = localStorage.getItem(`suggestions_${userId}_${jobId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
