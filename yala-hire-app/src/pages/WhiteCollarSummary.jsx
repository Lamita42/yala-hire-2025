// src/pages/WhiteCollarSummary.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaPhone, FaUserTie, FaUserCog, FaTools } from "react-icons/fa";

// Matching helpers
import { aiMatchJob } from "../utils/aiMatching";
import { computeMatchPercentage } from "../utils/matching";

export default function WhiteCollarSummary() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 NEW: matching state
  const [matches, setMatches] = useState([]);
  const [checking, setChecking] = useState(false);
  const [matchError, setMatchError] = useState("");

  const navigate = useNavigate();

  // ---------------------------------------------------------
  // LOAD PROFILE
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
        return;
      }

      setProfile(data);
      setLoading(false);
    };

    load();
  }, [navigate]);

  // ---------------------------------------------------------
  // APPLY TO A JOB
  // ---------------------------------------------------------
  const handleApply = async (jobId) => {
    if (!profile) return;

    // Optional: prevent duplicate applications
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
  // AI + BASIC MATCHING (SHOW IN UI, NOT CONSOLE)
  // ---------------------------------------------------------
  const checkMatchingJobs = async () => {
    if (!profile) return;

    setChecking(true);
    setMatchError("");
    setMatches([]);

    console.log("🔍 Checking matching jobs for:", profile.full_name);

    const { data: jobs, error } = await supabase.from("jobs").select("*");

    if (error || !jobs) {
      console.error("Failed to load jobs:", error);
      setMatchError("Failed to load jobs.");
      setChecking(false);
      return;
    }

    // Filter to white-collar jobs only (optional but recommended)
    const whiteJobs = jobs.filter((job) => job.collar_type === "white");

    if (whiteJobs.length === 0) {
      setMatchError("No white-collar jobs found.");
      setChecking(false);
      return;
    }

    const results = [];

    for (const job of whiteJobs) {
      const jobSkills = job.required_skills || "";
      const userSkills = profile.skills || "";

      // Basic skill score
      const baseScore = computeMatchPercentage(userSkills, jobSkills);

      // AI score
      let aiScore = 0;
      let aiReason = "";

      try {
        const ai = await aiMatchJob(profile, job); // uses Groq
        aiScore = ai.score || 0;
        aiReason = ai.reason || "";
      } catch (err) {
        console.error("AI matching error:", err);
        aiScore = 0;
        aiReason = "AI failed to evaluate this job.";
      }

      // Final combined score
      const finalScore = baseScore * 0.3 + aiScore * 0.7;

      // Only keep jobs with score >= 75
      if (finalScore >= 75) {
        results.push({
          job_id: job.id,
          title: job.title,
          company_id: job.company_id,
          score: finalScore.toFixed(1),
          reason: aiReason,
          jobData: job,
        });
      }
    }

    if (results.length === 0) {
      setMatchError("No strong matches found (75%+).");
    }

    setMatches(results);
    setChecking(false);
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
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
      }}
    >
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
          onClick={checkMatchingJobs}
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
          {checking ? "Finding jobs..." : "🔍 Find Matching Jobs"}
        </button>

        {matchError && (
          <p style={{ marginTop: "0.75rem", color: "darkred" }}>{matchError}</p>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* MATCHED JOBS SECTION */}
      {/* ---------------------------------------------------------------- */}
      {matches.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ color: "#1e3a8a" }}>🎯 Recommended Jobs for You</h3>

          {matches.map((job) => (
            <div
              key={job.job_id}
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
                <strong>AI Score:</strong> {job.score}%
              </p>

              {job.reason && (
                <p style={{ margin: "0.3rem 0" }}>
                  <strong>Why this matches you:</strong> {job.reason}
                </p>
              )}

              {/* In later steps we will navigate to job details / company profile */}
              {/* View Job Details button will be wired in Step 2 */}
              <button
                onClick={() => alert("Job details page will come in next step")}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  marginRight: "0.5rem",
                  cursor: "pointer",
                }}
              >
                View Job Details
              </button>

              <button
                onClick={() => handleApply(job.job_id)}
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
          ))}
        </div>
      )}
    </div>
  );
}
