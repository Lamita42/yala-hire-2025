// src/pages/JobDetails.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaBriefcase,
  FaTools,
  FaExternalLinkAlt,
  FaArrowLeft,
  FaBuilding,
} from "react-icons/fa";

const MATCH_THRESHOLD = 75;

export default function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const matchFromSummary = location.state?.match || null;
  const backTo = location.state?.backTo || null;

  const [job, setJob] = useState(null);
  const [company, setCompany] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [userId, setUserId] = useState(null);

  const [error, setError] = useState("");

  // ------------------------- LOAD JOB + COMPANY + APPLICATION STATUS -------------------------
  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) setUserId(user.id);

      // Load job
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

      // Load company
      const { data: companyData } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("id", jobData.company_id)
        .single();

      setCompany(companyData || null);

      // Owner check
      if (user && companyData && user.id === companyData.id) {
        setIsOwner(true);
      }

      // Already applied?
      if (user) {
        const { data: existingApp } = await supabase
          .from("applications")
          .select("id")
          .eq("job_id", jobId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingApp) setHasApplied(true);
      }
    };

    load();
  }, [jobId]);

  // ------------------------- HANDLE APPLY -------------------------
  const handleApply = async () => {
    if (!userId) {
      navigate("/login");
      return;
    }

    // Ensure user is a job seeker
    const { data: seeker } = await supabase
      .from("job_seekers")
      .select("id")
      .eq("id", userId)
      .single();

    if (!seeker) {
      alert("Only job seekers can apply.");
      return;
    }

    // Insert application
    const { error } = await supabase.from("applications").insert({
      job_id: jobId,
      user_id: userId,
    });

    if (error) {
      alert("Error applying: " + error.message);
      return;
    }

    setHasApplied(true);
    alert("Application sent! ✅");
  };

  // ------------------------- UI -------------------------
  if (error)
    return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;

  if (!job)
    return <p style={{ padding: "2rem" }}>Loading job...</p>;

  const skills = (job.required_skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const matchScore =
    matchFromSummary?.finalScore != null
      ? matchFromSummary.finalScore
      : null;

  const canApply =
    !isOwner &&
    !hasApplied &&
    matchScore !== null &&
    matchScore >= MATCH_THRESHOLD;

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
      <div
        style={{
          marginBottom: "0.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
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

        {!isOwner && company && (
          <button
            type="button"
            onClick={() =>
              navigate("/profile/company-summary", {
                state: { companyId: company.id },
              })
            }
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
            <FaBuilding />
            View Company
            <FaExternalLinkAlt size={10} />
          </button>
        )}
      </div>

      {/* TITLE */}
      <h2 style={{ marginTop: 0, marginBottom: "0.2rem", color: "#0b3b75" }}>
        {job.title}
      </h2>

      {/* COLLAR TYPE */}
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

      {/* LOCATION */}
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

      {/* DESCRIPTION */}
      <h3 style={{ color: "#0b3b75", marginBottom: "0.5rem" }}>
        Description
      </h3>
      <p style={{ whiteSpace: "pre-line", lineHeight: 1.5 }}>
        {job.description}
      </p>

      {/* REQUIREMENTS */}
      <h3 style={{ marginTop: "1.5rem", color: "#0b3b75" }}>
        Requirements
      </h3>
      <ul style={{ paddingLeft: "1.2rem" }}>
        {job.required_experience_years != null && (
          <li>
            Experience: {job.required_experience_years} year
            {job.required_experience_years > 1 ? "s" : ""}
          </li>
        )}

        {job.education_level && job.education_level !== "none" && (
          <li>
            Education:{" "}
            {job.education_level === "high_school" &&
              "High school / Baccalaureate"}
            {job.education_level === "technical" &&
              "Technical diploma"}
            {job.education_level === "university" &&
              "University degree"}
            {job.education_degree && ` – ${job.education_degree}`}
            {job.education_major && ` in ${job.education_major}`}
          </li>
        )}
      </ul>

      {/* SKILLS */}
      <h3
        style={{
          marginTop: "1.5rem",
          marginBottom: "0.5rem",
          color: "#0b3b75",
        }}
      >
        <FaTools style={{ marginRight: 6 }} /> Required Skills
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

      {/* MATCH INFO */}
      {matchScore !== null && (
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
            {matchScore.toFixed(1)}%
          </p>

          {matchFromSummary?.reason && (
            <p style={{ marginTop: "0.3rem" }}>
              <strong>Why:</strong> {matchFromSummary.reason}
            </p>
          )}
        </div>
      )}

      {/* APPLY BUTTON CONDITIONS */}
      <div style={{ marginTop: "1.5rem" }}>
        {hasApplied ? (
          <div
            style={{
              width: "100%",
              padding: "0.9rem",
              background: "#d1fae5",
              color: "#065f46",
              textAlign: "center",
              borderRadius: "10px",
              fontWeight: "bold",
            }}
          >
            ✔ You already applied
          </div>
        ) : canApply ? (
          <button
            onClick={handleApply}
            style={{
              width: "100%",
              padding: "0.9rem 1.4rem",
              background: "#16a34a",
              color: "white",
              borderRadius: "10px",
              fontWeight: "bold",
              border: "none",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Apply Now
          </button>
        ) : (
          matchScore !== null &&
          matchScore < MATCH_THRESHOLD && (
            <div
              style={{
                width: "100%",
                padding: "0.9rem",
                background: "#fee2e2",
                color: "#991b1b",
                textAlign: "center",
                borderRadius: "10px",
                fontWeight: "bold",
              }}
            >
              ❌ Match below 75% — Improve your skills before applying
            </div>
          )
        )}
      </div>
    </div>
  );
}
