// src/pages/WhiteCollarSummary.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaPhone,
  FaUserTie,
  FaUserCog,
  FaTools,
  FaFileDownload,
} from "react-icons/fa";
import ProfileSearchBox from "../components/ProfileSearchBox";
import { saveSuggestionsToCache } from "../utils/aiMatching";
import {
  getOrCreateMatch,
  getOrCreateImprovements,
} from "../utils/aiMatching";

const MATCH_THRESHOLD = 75;

export default function WhiteCollarSummary() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [matches, setMatches] = useState([]);
  const [checking, setChecking] = useState(false);
  const [matchError, setMatchError] = useState("");

  const [showImproveModal, setShowImproveModal] = useState(false);
  const [improveJob, setImproveJob] = useState(null);
  const [improveData, setImproveData] = useState(null);
  const [improveLoading, setImproveLoading] = useState(false);
  const [improveError, setImproveError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const cameFromNav = location.state?.fromNav === true;

  // -------------------- LOAD PROFILE --------------------
  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) return navigate("/login");

      const { data, error } = await supabase
        .from("job_seekers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) return console.error(error);

      setProfile(data);
      setLoading(false);
    };

    load();
  }, [navigate]);

  // -------------------- APPLY --------------------
  const handleApply = async (jobId, finalScore) => {
    if (finalScore < MATCH_THRESHOLD)
      return alert("This job is not a strong match yet.");

    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (existing) return alert("You already applied to this job.");

    const { error } = await supabase
      .from("applications")
      .insert({ job_id: jobId, user_id: profile.id });

    if (error) return alert("Error applying: " + error.message);

    alert("Application sent! ✅");
  };

  // -------------------- FIND MATCHES --------------------
  const checkMatchingJobs = async () => {
    setChecking(true);
    setMatchError("");
    setMatches([]);

    const { data: jobs, error } = await supabase.from("jobs").select("*");
    if (error || !jobs) {
      setMatchError("Failed to load jobs.");
      setChecking(false);
      return;
    }

    const whiteJobs = jobs.filter((j) => j.collar_type === "white");

    const results = [];
    for (const job of whiteJobs) {
      const match = await getOrCreateMatch(profile.id, profile, job);
      if (match.finalScore >= MATCH_THRESHOLD) {
        results.push({
          job,
          finalScore: match.finalScore,
          reason: match.reason,
        });
      }
    }

    if (!results.length) setMatchError("No strong matches found.");

    results.sort((a, b) => b.finalScore - a.finalScore);
    setMatches(results);
    setChecking(false);
  };

  // -------------------- IMPROVE MATCH --------------------
  const handleImprove = async (job) => {
    setShowImproveModal(true);
    setImproveJob(job);
    setImproveError("");
    setImproveLoading(true);

    try {
      const improvement = await getOrCreateImprovements(
        profile.id,
        profile,
        job
      );
      saveSuggestionsToCache(profile.id, job.id, improvement);
      setImproveData(improvement);
    } catch {
      setImproveError("Failed to load improvements.");
    } finally {
      setImproveLoading(false);
    }
  };

  if (loading || !profile)
    return <p style={{ padding: "2rem" }}>Loading...</p>;

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
      {/* BACK BUTTON */}
      {cameFromNav && (
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "0.4rem 0.8rem",
            borderRadius: "999px",
            border: "1px solid #cbd5e1",
            background: "white",
            cursor: "pointer",
            marginBottom: "1rem",
            fontSize: "0.85rem",
          }}
        >
          ← Back
        </button>
      )}

      {/* HEADER WITH PHOTO + CV (FIXED POSITION) */}
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        
        {/* PROFILE PICTURE + CV button centered */}
        <div style={{ textAlign: "center", minWidth: "180px" }}>
          <img
            src={
              profile.profile_image ||
              "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
            }
            alt="Profile"
            style={{
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "4px solid #1e3a8a",
            }}
          />

          <p
            style={{
              marginTop: "0.4rem",
              color: "#475569",
              fontSize: "0.9rem",
            }}
          >
            Your Profile Picture
          </p>

          {profile.cv_url && (
            <a
              href={profile.cv_url}
              target="_blank"
              rel="noreferrer"
              style={{
                marginTop: "0.7rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "0.6rem 1.2rem",
                background: "#1e3a8a",
                color: "white",
                borderRadius: "8px",
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              <FaFileDownload /> Download CV
            </a>
          )}
        </div>

        {/* TITLE AREA */}
        <div style={{ flex: 1 }}>
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

        {/* EDIT BUTTON */}
        <button
          onClick={() =>
            navigate("/edit-white-profile", { state: { fromNav: true } })
          }
          style={{
            padding: "0.7rem 1.4rem",
            borderRadius: "10px",
            border: "none",
            background: "#1e3a8a",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
            height: "45px",
          }}
        >
          Edit Profile
        </button>
      </div>

      <ProfileSearchBox />
      <hr style={{ margin: "1.5rem 0", borderColor: "#d0d8e0" }} />

      {/* PERSONAL INFO */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#1e3a8a" }}>
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

      {/* EDUCATION */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#1e3a8a" }}>Education</h3>
        <p>{profile.education || "No education added."}</p>
      </div>

      {/* EXPERIENCE */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#1e3a8a" }}>Experience</h3>
        <p>{profile.experience || "No experience added."}</p>
      </div>

      {/* SKILLS */}
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
          <p>No skills added.</p>
        )}
      </div>

      {/* MATCHING BUTTON */}
      <button
        onClick={checkMatchingJobs}
        disabled={checking}
        style={{
          marginTop: "1rem",
          padding: "0.8rem 1.6rem",
          background: "#1e3a8a",
          color: "white",
          borderRadius: "10px",
          border: "none",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {checking ? "Finding jobs..." : "🔍 Find Matching Jobs"}
      </button>

      {matchError && (
        <p style={{ marginTop: "0.75rem", color: "darkred" }}>{matchError}</p>
      )}

      {/* MATCH RESULTS */}
      {matches.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ color: "#1e3a8a" }}>Recommended Jobs</h3>

          {matches.map((item) => (
            <div
              key={item.job.id}
              style={{
                marginTop: "1rem",
                padding: "1rem",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                background: "#f8fbff",
              }}
            >
              <h4 style={{ margin: 0 }}>{item.job.title}</h4>

              <p>
                <strong>Match:</strong> {item.finalScore.toFixed(1)}%
              </p>

              {item.reason && (
                <p style={{ color: "#555" }}>
                  <strong>Reason:</strong> {item.reason}
                </p>
              )}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() =>
                    navigate(`/jobs/${item.job.id}`, {
                      state: {
                        fromSummary: true,
                        fromNav: true,
                        backTo: "/profile/white-summary",
                        match: {
                          ...item,
                          missingSkills: improveData?.missing_skills || [],
                          courses: improveData?.suggested_courses || [],
                        },
                      },
                    })
                  }
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#1e3a8a",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                  }}
                >
                  View Job
                </button>

                <button
                  onClick={() => handleApply(item.job.id, item.finalScore)}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#16a34a",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                  }}
                >
                  Apply
                </button>

                <button
                  onClick={() => handleImprove(item.job)}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#f97316",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                  }}
                >
                  Improve Match
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* IMPROVE MODAL */}
      {showImproveModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 50,
          }}
          onClick={() => setShowImproveModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "600px",
              background: "white",
              borderRadius: "18px",
              padding: "1.5rem",
              boxShadow: "0 20px 50px rgba(15,23,42,0.35)",
            }}
          >
            <h3 style={{ margin: 0, color: "#1e3a8a" }}>
              How to Improve Your Match
            </h3>

            {improveJob && (
              <p>
                Target job: <strong>{improveJob.title}</strong>
              </p>
            )}

            {improveLoading && <p>Analyzing...</p>}

            {improveError && (
              <p style={{ color: "darkred" }}>{improveError}</p>
            )}

            {improveData && (
              <div>
                {improveData.missing_skills?.length > 0 && (
                  <>
                    <h4>Missing Skills</h4>
                    <ul>
                      {improveData.missing_skills.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </>
                )}

                {improveData.missing_experience && (
                  <>
                    <h4>Experience Needed</h4>
                    <p>{improveData.missing_experience}</p>
                  </>
                )}

                {improveData.missing_education && (
                  <>
                    <h4>Education Needed</h4>
                    <p>{improveData.missing_education}</p>
                  </>
                )}

                {improveData.suggested_courses?.length > 0 && (
                  <>
                    <h4>Suggested Courses</h4>
                    <ul>
                      {improveData.suggested_courses.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            <div style={{ textAlign: "right", marginTop: "1rem" }}>
              <button
                onClick={() => setShowImproveModal(false)}
                style={{
                  padding: "0.6rem 1.2rem",
                  background: "#1e293b",
                  color: "white",
                  borderRadius: "10px",
                  cursor: "pointer",
                  border: "none",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
