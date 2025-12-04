// src/pages/BlueCollarSummary.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaPhone,
  FaUserCog,
  FaTools,
  FaHardHat,
  FaFileDownload,
  FaChevronLeft,
} from "react-icons/fa";
import { saveSuggestionsToCache } from "../utils/aiMatching";
import ProfileSearchBox from "../components/ProfileSearchBox";
import {
  getOrCreateMatch,
  getOrCreateImprovements,
} from "../utils/aiMatching";

const MATCH_THRESHOLD = 75;

export default function BlueCollarSummary() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const cameFromNav = location.state?.fromNav === true;

  const [recommended, setRecommended] = useState([]);
  const [checking, setChecking] = useState(false);
  const [matchError, setMatchError] = useState("");

  // Improve modal
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [improveJob, setImproveJob] = useState(null);
  const [improveData, setImproveData] = useState(null);
  const [improveLoading, setImproveLoading] = useState(false);
  const [improveError, setImproveError] = useState("");

  // ------------------------ LOAD PROFILE ------------------------
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

  // ------------------------ APPLY TO JOB ------------------------
  const handleApply = async (jobId, finalScore) => {
    if (!profile) return;

    if (finalScore < MATCH_THRESHOLD) {
      alert("This job is not a strong match yet. Try 'Improve your match'.");
      return;
    }

    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (existing) {
      alert("You already applied to this job.");
      return;
    }

    const { error } = await supabase.from("applications").insert({
      job_id: jobId,
      user_id: profile.id,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Application sent! ✅");
  };

  // ------------------------ FIND JOBS ------------------------
  const findJobs = async () => {
    if (!profile) return;

    setChecking(true);
    setMatchError("");
    setRecommended([]);

    const { data: jobs } = await supabase.from("jobs").select("*");
    const blueJobs = jobs?.filter((j) => j.collar_type === "blue") || [];

    const results = [];

    for (const job of blueJobs) {
      const match = await getOrCreateMatch(profile.id, profile, job);

      if (match.finalScore >= MATCH_THRESHOLD) {
        results.push({
          job,
          finalScore: match.finalScore,
          reason: match.reason,
        });
      }
    }

    results.sort((a, b) => b.finalScore - a.finalScore);
    setRecommended(results);
    if (results.length === 0) setMatchError("No strong matches found (75%+).");

    setChecking(false);
  };

  // ------------------------ IMPROVE MATCH ------------------------
  const handleImprove = async (job) => {
    setShowImproveModal(true);
    setImproveJob(job);
    setImproveData(null);
    setImproveError("");
    setImproveLoading(true);

    try {
      const imp = await getOrCreateImprovements(profile.id, profile, job);
      saveSuggestionsToCache(profile.id, job.id, imp);
      setImproveData(imp);
    } catch (err) {
      setImproveError("Failed to load improvements.");
    } finally {
      setImproveLoading(false);
    }
  };

  if (loading || !profile)
    return <p style={{ padding: "2rem" }}>Loading profile...</p>;

  // =================================================================
  // =======================     UI START     =========================
  // =================================================================

  return (
    <div
      style={{
        maxWidth: "860px",
        margin: "3rem auto",
        padding: "2rem",
        borderRadius: "22px",
        background: "white",
        boxShadow: "0 12px 35px rgba(0,0,0,0.12)",
        transition: "0.3s ease",
      }}
    >
      {/* BACK BUTTON (only when coming from routes inside the app) */}
      {cameFromNav && (
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            borderRadius: "999px",
            border: "1px solid #d0d7e2",
            background: "white",
            cursor: "pointer",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
          }}
        >
          <FaChevronLeft /> Back
        </button>
      )}

      {/* ========================================================== */}
      {/* =============== HEADER PROFILE CARD ======================= */}
      {/* ========================================================== */}

      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          padding: "1.5rem",
          borderRadius: "18px",
          background: "#f0f6ff",
          boxShadow: "inset 0 0 10px rgba(0,0,0,0.05)",
        }}
      >
        <img
          src={
            profile.profile_image ||
            "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
          }
          alt="Profile"
          style={{
            width: "130px",
            height: "130px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "4px solid #0b7ad1",
          }}
        />

        <div style={{ flex: 1 }}>
          <h2 style={{ margin: "0", fontSize: "1.8rem", color: "#0b3b75" }}>
            {profile.full_name}
          </h2>

          <p
            style={{
              marginTop: "0.3rem",
              color: "#0b7ad1",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FaHardHat style={{ marginRight: "6px" }} /> Blue Collar Worker
          </p>

          <p
            style={{
              margin: "0.4rem 0",
              color: "#475569",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FaPhone style={{ marginRight: "8px" }} />
            {profile.phone}
          </p>

          <button
            onClick={() =>
              navigate("/edit-blue-profile", { state: { fromNav: true } })
            }
            style={{
              marginTop: "0.5rem",
              padding: "0.6rem 1.4rem",
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
      </div>

      {/* SEARCH BOX */}
      <div style={{ marginTop: "1.5rem" }}>
        <ProfileSearchBox />
      </div>

      <hr style={{ margin: "1.8rem 0", borderColor: "#dce3ec" }} />

      {/* ========================================================== */}
      {/* =================== PROFILE SECTIONS ====================== */}
      {/* ========================================================== */}

      {/* EXPERIENCE */}
      <Section title="Experience" value={profile.experience || "No experience added."} />

      {/* EDUCATION */}
      <Section title="Education" value={profile.education || "No education added."} />

      {/* SKILLS */}
      <div style={{ marginBottom: "1.4rem" }}>
        <h3 style={{ margin: 0, color: "#004080" }}>
          <FaTools style={{ marginRight: "6px" }} /> Skills
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
                  background: "#e3f2ff",
                  color: "#0b3b75",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "999px",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
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

      {/* ========================================================== */}
      {/* ==================== CV DOWNLOAD ========================== */}
      {/* ========================================================== */}

      {profile.cv_url && (
        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <a
            href={profile.cv_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.8rem 1.6rem",
              background: "#0b7ad1",
              color: "white",
              borderRadius: "12px",
              textDecoration: "none",
              fontWeight: "bold",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <FaFileDownload /> Download CV
          </a>
        </div>
      )}

      <hr style={{ margin: "2rem 0" }} />

      {/* ========================================================== */}
      {/* ================= MATCHING JOBS SECTION ================== */}
      {/* ========================================================== */}

      <button
        onClick={findJobs}
        disabled={checking}
        style={{
          padding: "0.9rem 1.6rem",
          width: "100%",
          borderRadius: "12px",
          background: "#0b7ad1",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        {checking ? "Analyzing jobs..." : "🔍 Find Matching Jobs"}
      </button>

      {matchError && (
        <p style={{ marginTop: "0.8rem", color: "darkred", textAlign: "center" }}>
          {matchError}
        </p>
      )}

      {/* MATCH RESULTS */}
      {recommended.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ color: "#0b3b75", marginBottom: "1rem" }}>
            Recommended Jobs (75%+ Match)
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {recommended.map((item) => (
              <div
                key={item.job.id}
                style={{
                  border: "1px solid #d7e3f3",
                  padding: "1rem",
                  borderRadius: "12px",
                  background: "#f8fbff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                }}
              >
                <h4 style={{ margin: 0 }}>{item.job.title}</h4>

                <p style={{ margin: "0.2rem 0" }}>
                  <strong>Match:</strong> {item.finalScore.toFixed(1)}%
                </p>

                <p style={{ margin: "0.2rem 0", color: "#555" }}>
                  <strong>Why:</strong> {item.reason}
                </p>

                <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() =>
                      navigate(`/jobs/${item.job.id}`, {
                        state: {
                          fromSummary: true,
                          fromNav: true,
                          backTo: "/profile/blue-summary",
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

                  <button
                    onClick={() => handleApply(item.job.id, item.finalScore)}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#16a34a",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "bold",
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
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Improve your match
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IMPROVE MODAL (same behavior) */}
      {showImproveModal && (
        <ImproveModal
          improveJob={improveJob}
          improveLoading={improveLoading}
          improveError={improveError}
          improveData={improveData}
          onClose={() => setShowImproveModal(false)}
        />
      )}
    </div>
  );
}

// Small reusable section component
function Section({ title, value }) {
  return (
    <div style={{ marginBottom: "1.4rem" }}>
      <h3 style={{ margin: 0, color: "#004080" }}>{title}</h3>
      <p style={{ marginTop: "0.4rem" }}>{value}</p>
    </div>
  );
}

// Improve modal
function ImproveModal({ improveJob, improveLoading, improveError, improveData, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "550px",
          background: "white",
          borderRadius: "18px",
          padding: "1.5rem",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#0b3b75" }}>How to improve your match</h3>

        <p style={{ marginTop: 0, color: "#4b5563" }}>
          Target job: <strong>{improveJob.title}</strong>
        </p>

        {improveLoading && <p>Loading...</p>}
        {improveError && <p style={{ color: "red" }}>{improveError}</p>}

        {improveData && (
          <div style={{ marginTop: "0.5rem" }}>
            {improveData.missing_skills && improveData.missing_skills.length > 0 && (
              <>
                <h4>Missing skills</h4>
                <ul>{improveData.missing_skills.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </>
            )}

            {improveData.missing_experience && (
              <>
                <h4>Experience gap</h4>
                <p>{improveData.missing_experience}</p>
              </>
            )}

            {improveData.missing_education && (
              <>
                <h4>Education gap</h4>
                <p>{improveData.missing_education}</p>
              </>
            )}

            {improveData.suggested_courses && improveData.suggested_courses.length > 0 && (
              <>
                <h4>Suggested courses</h4>
                <ul>{improveData.suggested_courses.map((c, i) => <li key={i}>{c}</li>)}</ul>
              </>
            )}
          </div>
        )}

        <div style={{ textAlign: "right", marginTop: "1rem" }}>
          <button
            onClick={onClose}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: "999px",
              background: "#1e293b",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
