// src/pages/BlueCollarSummary.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaPhone, FaUserCog, FaTools, FaHardHat, FaArrowLeft } from "react-icons/fa";

import { computeMatchPercentage } from "../utils/matching";
import { aiMatchJob } from "../utils/aiMatching";

const MATCH_THRESHOLD = 75;

// ---------- Local cache helpers ----------
function getCacheKey(profile) {
  return `matches_blue_${profile.id}`;
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

export default function BlueCollarSummary() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [recommended, setRecommended] = useState([]);
  const [improvement, setImprovement] = useState([]);
  const [checking, setChecking] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [openSuggestionJobId, setOpenSuggestionJobId] = useState(null);

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

      const cached = loadMatchesFromCache(data);
      if (cached) {
        setRecommended(cached.recommended || []);
        setImprovement(cached.improvement || []);
      } else {
        refreshMatches(data);
      }
    };

    load();
  }, [navigate]);

  const refreshMatches = async (currentProfile) => {
    if (!currentProfile) return;

    setChecking(true);
    setRecommended([]);
    setImprovement([]);
    setMatchError("");

    const { data: jobs, error } = await supabase.from("jobs").select("*");

    if (error || !jobs) {
      console.error("Failed to load jobs:", error);
      setMatchError("Failed to load jobs.");
      setChecking(false);
      return;
    }

    const blueJobs = jobs.filter((job) => job.collar_type === "blue");

    if (blueJobs.length === 0) {
      setMatchError("No blue-collar jobs found.");
      setChecking(false);
      return;
    }

    const recList = [];
    const improvList = [];

    for (const job of blueJobs) {
      const jobSkills = job.required_skills || "";
      const userSkills = currentProfile.skills || "";

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
      } else if (finalScore >= 25 || missingSkills.length > 0) {
        improvList.push(record);
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

  if (loading || !profile)
    return <p style={{ padding: "2rem" }}>Loading profile...</p>;

  return (
    <div
      style={{
        maxWidth: "850px",
        margin: "3rem auto",
        padding: "2rem",
        borderRadius: "18px",
        background: "white",
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
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
          onClick={() => navigate("/edit-blue-profile")}
          style={{
            padding: "0.7rem 1.4rem",
            borderRadius: "10px",
            border: "none",
            background: "#0b7ad1",
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
          <h2 style={{ margin: 0, fontSize: "1.8rem", color: "#0b3b75" }}>
            Your Profile
          </h2>
          <p
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              color: "#0b7ad1",
              fontWeight: "bold",
            }}
          >
            <FaHardHat style={{ marginRight: 6 }} /> Blue Collar Worker
          </p>
        </div>
      </div>

      <hr style={{ margin: "1.5rem 0", borderColor: "#d0d8e0" }} />

      {/* PERSONAL INFO */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#004080" }}>
          <FaUserCog style={{ marginRight: "8px" }} /> Personal Information
        </h3>
        <p>
          <strong>Name:</strong> {profile.full_name}
        </p>
        <p>
          <strong>Phone:</strong>{" "}
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            <FaPhone style={{ marginRight: "6px" }} /> {profile.phone}
          </span>
        </p>
      </div>

      {/* EXPERIENCE */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#004080" }}>Experience</h3>
        <p>{profile.experience || "No experience added."}</p>
      </div>

      {/* EDUCATION */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#004080" }}>Education</h3>
        <p>{profile.education || "No education added."}</p>
      </div>

      {/* SKILLS */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#004080" }}>
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
                  background: "#e9f3ff",
                  color: "#004080",
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
          <p>No skills added yet.</p>
        )}
      </div>

      {/* ----------------------------------------------------
          🔍 FIND AI MATCHING JOBS
      ------------------------------------------------------ */}
      <button
        onClick={handleFindJobsClick}
        disabled={checking}
        style={{
          marginTop: "1.5rem",
          padding: "0.8rem 1.6rem",
          borderRadius: "10px",
          background: checking ? "#9ca3af" : "#0b7ad1",
          color: "white",
          border: "none",
          cursor: checking ? "default" : "pointer",
          fontWeight: "bold",
        }}
      >
        {checking ? "Analyzing jobs..." : "🔍 Refresh Matching Jobs"}
      </button>

      {matchError && (
        <p style={{ marginTop: "0.75rem", color: "darkred" }}>{matchError}</p>
      )}

      {/* ---------------------- RECOMMENDED ---------------------- */}
      {recommended.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ color: "#0b3b75" }}>Recommended Jobs (75%+ Match)</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {recommended.map((item) => (
              <div
                key={item.jobId}
                style={{
                  border: "1px solid #d1d5db",
                  padding: "1rem",
                  borderRadius: "10px",
                  background: "#f8fbff",
                }}
              >
                <h4 style={{ margin: 0 }}>{item.title}</h4>

                <p style={{ margin: "0.2rem 0" }}>
                  <strong>Match:</strong> {item.finalScore.toFixed(1)}%
                </p>

                <p style={{ margin: "0.2rem 0", color: "#555" }}>
                  <strong>Why:</strong> {item.reason}
                </p>

                <button
                  onClick={() =>
                    navigate(`/jobs/${item.jobId}`, {
                      state: {
                        fromSummary: true,
                        backTo: "/profile/blue-summary",
                        match: item,
                        collar: "blue",
                      },
                    })
                  }
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem 1rem",
                    background: "#0b7ad1",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  View Job
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- IMPROVEMENT LIST -------------------- */}
      {improvement.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ color: "#0b3b75" }}>Jobs You Can Reach Soon</h3>
          <p style={{ marginTop: "0.3rem", color: "#475569", fontSize: "0.9rem" }}>
            These jobs are not yet a strong match, but you can see what to learn
            to get closer.
          </p>

          {improvement.map((job) => (
            <div
              key={job.jobId}
              style={{
                marginTop: "1rem",
                padding: "1rem",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
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
                      No specific suggestions available. Try improving similar
                      practical skills.
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
