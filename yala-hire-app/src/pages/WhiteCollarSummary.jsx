// src/pages/WhiteCollarSummary.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaPhone, FaUserTie, FaUserCog, FaTools, FaArrowLeft } from "react-icons/fa";

import { aiMatchJob } from "../utils/aiMatching";
import { computeMatchPercentage } from "../utils/matching";

const MATCH_THRESHOLD = 75; // % needed to be allowed to apply

// ---------- Local cache helpers (stable scores per profile version) ----------
function getCacheKey(profile) {
  return `matches_white_${profile.id}`;
}

function loadMatchesFromCache(profile) {
  try {
    const raw = localStorage.getItem(getCacheKey(profile));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.profileVersion !== profile.updated_at) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveMatchesToCache(profile, recommended, improvement) {
  try {
    localStorage.setItem(
      getCacheKey(profile),
      JSON.stringify({
        profileVersion: profile.updated_at || null,
        recommended,
        improvement,
      })
    );
  } catch (err) {
    console.warn("Could not save matches cache:", err);
  }
}

export default function WhiteCollarSummary() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [recommended, setRecommended] = useState([]); // jobs with score >= 75
  const [improvement, setImprovement] = useState([]); // jobs below 75 but with suggestions
  const [checking, setChecking] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [openSuggestionJobId, setOpenSuggestionJobId] = useState(null);

  const navigate = useNavigate();

  // ---------------------------------------------------------
  // LOAD PROFILE + AUTO INIT MATCHES
  // ---------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("job_seekers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);

      // After profile is loaded, try to load cached matches
      const cached = loadMatchesFromCache(data);
      if (cached) {
        setRecommended(cached.recommended || []);
        setImprovement(cached.improvement || []);
      } else {
        // First time or profile updated → auto compute
        refreshMatches(data);
      }
    };

    load();
  }, [navigate]);

  // ---------------------------------------------------------
  // CORE: COMPUTE MATCHES (AI + basic)
  // ---------------------------------------------------------
  const refreshMatches = async (currentProfile) => {
    if (!currentProfile) return;

    setChecking(true);
    setMatchError("");
    setRecommended([]);
    setImprovement([]);

    const { data: jobs, error } = await supabase.from("jobs").select("*");

    if (error || !jobs) {
      console.error("Failed to load jobs:", error);
      setMatchError("Failed to load jobs.");
      setChecking(false);
      return;
    }

    // Only white-collar jobs
    const whiteJobs = jobs.filter((job) => job.collar_type === "white");

    if (whiteJobs.length === 0) {
      setMatchError("No white-collar jobs found.");
      setChecking(false);
      return;
    }

    const recList = [];
    const improvList = [];

    for (const job of whiteJobs) {
      const jobSkills = job.required_skills || "";
      const userSkills = currentProfile.skills || "";

      // Basic skill overlap score
      const basicScore = computeMatchPercentage(userSkills, jobSkills);

      let aiScore = 0;
      let reason = "";
      let missingSkills = [];
      let courses = [];

      try {
        const ai = await aiMatchJob(currentProfile, job);
        aiScore = ai.score || 0;
        reason = ai.reason || "";
        missingSkills = ai.missing_skills || [];
        courses = ai.course_suggestions || [];
      } catch (err) {
        console.error("AI matching error:", err);
        reason = "AI failed to evaluate this job.";
      }

      const finalScore = basicScore * 0.3 + aiScore * 0.7;

      const record = {
        jobId: job.id,
        title: job.title,
        companyId: job.company_id,
        job,
        finalScore,
        basicScore,
        aiScore,
        reason,
        missingSkills,
        courses,
      };

      if (finalScore >= MATCH_THRESHOLD) {
        recList.push(record);
      } else {
        // Only keep "almost" matches if they have some relevance
        if (finalScore >= 30 || missingSkills.length > 0) {
          improvList.push(record);
        }
      }
    }

    if (recList.length === 0) {
      setMatchError("No strong matches found (75%+).");
    }

    setRecommended(recList);
    setImprovement(improvList);
    saveMatchesToCache(currentProfile, recList, improvList);
    setChecking(false);
  };

  // ---------------------------------------------------------
  // MANUAL BUTTON: USE CACHE IF PRESENT (SO SCORE DOESN'T CHANGE)
  // ---------------------------------------------------------
  const handleFindJobsClick = async () => {
    if (!profile) return;

    const cached = loadMatchesFromCache(profile);
    if (cached) {
      setRecommended(cached.recommended || []);
      setImprovement(cached.improvement || []);
      return;
    }
    await refreshMatches(profile);
  };

  // ---------------------------------------------------------
  // APPLY TO A JOB (only if score >= threshold)
  // ---------------------------------------------------------
  const handleApply = async (jobId) => {
    if (!profile) return;

    const { data: existing, error: checkError } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (checkError) {
      console.error(checkError);
    }

    if (existing) {
      alert("You already applied to this job.");
      return;
    }

    const { error } = await supabase.from("applications").insert({
      job_id: jobId,
      user_id: profile.id,
    });

    if (error) {
      console.error(error);
      alert("Error applying: " + error.message);
      return;
    }

    alert("Application sent! ✅");
  };

  // ---------------------------------------------------------
  // UI Rendering
  // ---------------------------------------------------------
  if (loading || !profile) {
    return <p style={{ padding: "2rem" }}>Loading...</p>;
  }

  return (
    <div
      style={{
        maxWidth: "850px",
        margin: "3rem auto",
        padding: "2rem",
        borderRadius: "18px",
        background: "white",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
      }}
    >
      {/* Top bar with Back */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <button
          onClick={() => navigate("/profile")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            padding: "0.4rem 0.8rem",
            borderRadius: "999px",
            border: "1px solid #cbd5e1",
            background: "white",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          <FaArrowLeft /> Back
        </button>

        <button
          onClick={() => navigate("/edit-white-profile")}
          style={{
            padding: "0.7rem 1.4rem",
            borderRadius: "10px",
            border: "none",
            background: "#1e3a8a",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Edit Profile
        </button>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.8rem", color: "#1e3a8a" }}>
            Your Profile
          </h2>
          <p
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              color: "#475569",
              fontWeight: "bold",
            }}
          >
            <FaUserTie style={{ marginRight: 6 }} /> White Collar Professional
          </p>
        </div>
      </div>

      <hr style={{ margin: "1.5rem 0", borderColor: "#e2e8f0" }} />

      {/* Personal Info */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#1e3a8a" }}>
          <FaUserCog style={{ marginRight: "8px" }} /> Personal Information
        </h3>

        <p style={{ margin: "0.5rem 0" }}>
          <strong>Name:</strong> {profile.full_name}
        </p>

        <p style={{ margin: "0.5rem 0" }}>
          <strong>Phone:</strong>{" "}
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            <FaPhone style={{ marginRight: "6px" }} /> {profile.phone}
          </span>
        </p>
      </div>

      {/* Education */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#1e3a8a" }}>Education</h3>
        <p>{profile.education || "No education added."}</p>
      </div>

      {/* Experience */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#1e3a8a" }}>Experience</h3>
        <p>{profile.experience || "No experience added."}</p>
      </div>

      {/* Skills */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#1e3a8a" }}>
          <FaTools style={{ marginRight: "8px" }} /> Skills
        </h3>

        {profile.skills ? (
          <div
            style={{
              marginTop: "0.5rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            {profile.skills.split(",").map((skill, idx) => (
              <span
                key={idx}
                style={{
                  background: "#eef2ff",
                  color: "#3730a3",
                  padding: "0.35rem 0.7rem",
                  borderRadius: "999px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                {skill.trim()}
              </span>
            ))}
          </div>
        ) : (
          <p>No skills yet.</p>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* MATCHING BUTTON */}
      {/* ---------------------------------------------------------------- */}
      <div style={{ marginTop: "1.5rem" }}>
        <button
          onClick={handleFindJobsClick}
          disabled={checking}
          style={{
            padding: "0.8rem 1.6rem",
            background: checking ? "#9ca3af" : "#1e3a8a",
            color: "white",
            fontWeight: "bold",
            borderRadius: "10px",
            border: "none",
            cursor: checking ? "default" : "pointer",
          }}
        >
          {checking ? "Finding jobs..." : "🔍 Refresh Matching Jobs"}
        </button>

        {matchError && (
          <p style={{ marginTop: "0.75rem", color: "darkred" }}>{matchError}</p>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* RECOMMENDED JOBS (CAN APPLY) */}
      {/* ---------------------------------------------------------------- */}
      {recommended.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ color: "#1e3a8a" }}>🎯 Recommended Jobs (75%+ Match)</h3>

          {recommended.map((job) => (
            <div
              key={job.jobId}
              style={{
                marginTop: "1rem",
                padding: "1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                background: "#f8fafc",
              }}
            >
              <h4 style={{ margin: 0 }}>{job.title}</h4>

              <p style={{ margin: "0.3rem 0" }}>
                <strong>Match:</strong> {job.finalScore.toFixed(1)}%
              </p>

              {job.reason && (
                <p style={{ margin: "0.3rem 0" }}>
                  <strong>Why this matches you:</strong> {job.reason}
                </p>
              )}

              <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() =>
                    navigate(`/jobs/${job.jobId}`, {
                      state: {
                        fromSummary: true,
                        backTo: "/profile/white-summary",
                        match: job,
                        collar: "white",
                      },
                    })
                  }
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  View Job Details
                </button>

                <button
                  onClick={() => handleApply(job.jobId)}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#16a34a",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* "ALMOST" JOBS WITH SUGGESTIONS (NO APPLY) */}
      {/* ---------------------------------------------------------------- */}
      {improvement.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ color: "#1e3a8a" }}>🚀 Jobs You Could Reach Soon</h3>
          <p style={{ marginTop: "0.3rem", color: "#475569", fontSize: "0.9rem" }}>
            These jobs are not an exact match yet, but you can see what skills or
            courses would help you qualify.
          </p>

          {improvement.map((job) => (
            <div
              key={job.jobId}
              style={{
                marginTop: "1rem",
                padding: "1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                background: "#f9fafb",
              }}
            >
              <h4 style={{ margin: 0 }}>{job.title}</h4>
              <p style={{ margin: "0.2rem 0" }}>
                <strong>Current match:</strong> {job.finalScore.toFixed(1)}%
              </p>

              <button
                onClick={() =>
                  setOpenSuggestionJobId((prev) =>
                    prev === job.jobId ? null : job.jobId
                  )
                }
                style={{
                  marginTop: "0.4rem",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "white",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                {openSuggestionJobId === job.jobId
                  ? "Hide suggestions"
                  : "Show how to qualify"}
              </button>

              {openSuggestionJobId === job.jobId && (
                <div style={{ marginTop: "0.6rem", fontSize: "0.9rem" }}>
                  {job.missingSkills && job.missingSkills.length > 0 && (
                    <>
                      <p style={{ margin: 0 }}>
                        <strong>Missing skills:</strong>
                      </p>
                      <ul style={{ marginTop: "0.2rem" }}>
                        {job.missingSkills.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  {job.courses && job.courses.length > 0 && (
                    <>
                      <p style={{ margin: "0.4rem 0 0" }}>
                        <strong>Suggested courses:</strong>
                      </p>
                      <ul style={{ marginTop: "0.2rem" }}>
                        {job.courses.map((c, idx) => (
                          <li key={idx}>
                            <strong>{c.title}</strong>
                            {c.provider && <> – {c.provider}</>}
                            {c.focus && <> ({c.focus})</>}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {!job.missingSkills?.length && !job.courses?.length && (
                    <p style={{ marginTop: "0.3rem" }}>
                      No specific suggestions available. Try improving your skills in
                      similar areas.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
