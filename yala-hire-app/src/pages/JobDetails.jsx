// src/pages/JobDetails.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FaMapMarkerAlt, FaBriefcase, FaTools, FaExternalLinkAlt, FaArrowLeft } from "react-icons/fa";

const MATCH_THRESHOLD = 75;

export default function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // if navigated from summary:
  const matchFromSummary = location.state?.match || null;
  const fromSummary = Boolean(location.state?.fromSummary);
  const backTo = location.state?.backTo || null;

  const [job, setJob] = useState(null);
  const [company, setCompany] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError || !jobData) {
        setError("Job not found.");
        return;
      }
      setJob(jobData);

      const { data: companyData } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("id", jobData.company_id)
        .single();

      setCompany(companyData || null);

      if (user && companyData && user.id === companyData.id) {
        setIsOwner(true);
      }
    };

    load();
  }, [jobId]);

  const handleApply = async () => {
    setMessage("");
    setError("");
    setApplying(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data: seeker, error: seekerError } = await supabase
      .from("job_seekers")
      .select("id")
      .eq("id", user.id)
      .single();

    if (seekerError || !seeker) {
      setError("You must have a seeker profile to apply.");
      setApplying(false);
      return;
    }

    const { error: appError } = await supabase.from("applications").insert({
      job_id: job.id,
      user_id: seeker.id,
    });

    if (appError) {
      setError(appError.message);
    } else {
      setMessage("Application sent ✔ Only the company can view your profile.");
    }

    setApplying(false);
  };

  if (error) {
    return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;
  }
  if (!job) {
    return <p style={{ padding: "2rem" }}>Loading job...</p>;
  }

  const skills = (job.required_skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // If we came from summary & have a score < threshold → do not show Apply
  const canApplyBasedOnMatch =
    !matchFromSummary || (matchFromSummary.finalScore || 0) >= MATCH_THRESHOLD;

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "2.5rem auto",
        padding: "2rem",
        borderRadius: "18px",
        background: "white",
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
      }}
    >
      {/* BACK BUTTON */}
      <div style={{ marginBottom: "0.75rem", display: "flex", justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={() => {
            if (backTo) navigate(backTo);
            else navigate(-1);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.45rem 0.9rem",
            borderRadius: "999px",
            border: "1px solid #cbd5e1",
            background: "white",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          <FaArrowLeft /> Back
        </button>

        {company && (
          <button
            type="button"
            onClick={() => navigate(`/company-profile/${company.id}`)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 0.9rem",
              borderRadius: "999px",
              border: "1px solid #cbd5e1",
              background: "white",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            View company profile <FaExternalLinkAlt size={10} />
          </button>
        )}
      </div>

      <h2 style={{ marginTop: 0, marginBottom: "0.2rem", color: "#0b3b75" }}>
        {job.title}
      </h2>

      <p
        style={{
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          color: "#4b5563",
          fontSize: "0.9rem",
        }}
      >
        <FaBriefcase />
        {job.collar_type === "blue" ? "Blue Collar" : "White Collar"}
      </p>

      <p
        style={{
          marginTop: "0.3rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          color: "#4b5563",
          fontSize: "0.9rem",
        }}
      >
        <FaMapMarkerAlt />
        {job.location || "Location not specified"}
        {job.is_remote && " • Remote / Hybrid"}
      </p>

      <hr style={{ margin: "1rem 0", borderColor: "#e5e7eb" }} />

      <h3 style={{ marginBottom: "0.5rem", color: "#0b3b75" }}>Description</h3>
      <p style={{ whiteSpace: "pre-line", lineHeight: 1.5 }}>{job.description}</p>

      <h3 style={{ marginTop: "1.5rem", marginBottom: "0.5rem", color: "#0b3b75" }}>
        Requirements
      </h3>
      <ul style={{ marginTop: 0, paddingLeft: "1.2rem", color: "#374151" }}>
        {job.required_experience_years != null && (
          <li>
            Experience: {job.required_experience_years} year
            {job.required_experience_years > 1 ? "s" : ""} or more
          </li>
        )}
        {job.education_level && job.education_level !== "none" && (
          <li>
            Education:{" "}
            {job.education_level === "high_school" && "High school / Baccalaureate"}
            {job.education_level === "technical" && "Technical diploma"}
            {job.education_level === "university" && "University degree"}
            {job.education_degree && ` – ${job.education_degree}`}
            {job.education_major && ` in ${job.education_major}`}
          </li>
        )}
      </ul>

      <h3 style={{ marginTop: "1.5rem", marginBottom: "0.5rem", color: "#0b3b75" }}>
        <FaTools style={{ marginRight: 6 }} />
        Required Skills
      </h3>

      {skills.length ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          {skills.map((s, i) => (
            <span
              key={i}
              style={{
                background: "#e0f2fe",
                color: "#0b3b75",
                padding: "0.35rem 0.7rem",
                borderRadius: "999px",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      ) : (
        <p>No specific skills listed.</p>
      )}

      {/* EXTRA: show match info if we came from summary */}
      {matchFromSummary && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.9rem 1rem",
            borderRadius: "10px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
          }}
        >
          <p style={{ margin: 0 }}>
            <strong>Your match score:</strong>{" "}
            {matchFromSummary.finalScore.toFixed(1)}%
          </p>
          {matchFromSummary.reason && (
            <p style={{ margin: "0.3rem 0 0" }}>
              <strong>Why:</strong> {matchFromSummary.reason}
            </p>
          )}

          {!canApplyBasedOnMatch && (
            <>
              <p style={{ margin: "0.6rem 0 0", color: "#b91c1c" }}>
                You currently don't meet the requirements to apply for this job.
              </p>

              {matchFromSummary.missingSkills &&
                matchFromSummary.missingSkills.length > 0 && (
                  <>
                    <p style={{ margin: "0.4rem 0 0" }}>
                      <strong>Missing skills:</strong>
                    </p>
                    <ul style={{ marginTop: "0.2rem" }}>
                      {matchFromSummary.missingSkills.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </>
                )}

              {matchFromSummary.courses &&
                matchFromSummary.courses.length > 0 && (
                  <>
                    <p style={{ margin: "0.4rem 0 0" }}>
                      <strong>Suggested courses:</strong>
                    </p>
                    <ul style={{ marginTop: "0.2rem" }}>
                      {matchFromSummary.courses.map((c, idx) => (
                        <li key={idx}>
                          <strong>{c.title}</strong>
                          {c.provider && <> – {c.provider}</>}
                          {c.focus && <> ({c.focus})</>}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
            </>
          )}
        </div>
      )}

      {/* APPLY BUTTON (hidden for owner or if score too low) */}
      {!isOwner && canApplyBasedOnMatch && (
        <div style={{ marginTop: "1rem" }}>
          {message && <p style={{ color: "#15803d" }}>{message}</p>}
          {error && <p style={{ color: "darkred" }}>{error}</p>}

          <button
            type="button"
            onClick={handleApply}
            disabled={applying}
            style={{
              padding: "0.9rem 2rem",
              borderRadius: "999px",
              border: "none",
              background: "#0b7ad1",
              color: "white",
              fontWeight: "bold",
              cursor: applying ? "default" : "pointer",
            }}
          >
            {applying ? "Sending..." : "Apply"}
          </button>
        </div>
      )}
    </div>
  );
}
