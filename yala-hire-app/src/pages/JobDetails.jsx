// src/pages/JobDetails.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import { FaMapMarkerAlt, FaBriefcase, FaTools, FaExternalLinkAlt } from "react-icons/fa";

export default function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();

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

    // find the seeker row
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

    // insert or ignore if already applied
    const { error: appError } = await supabase.from("applications").insert({
      job_id: job.id,
      seeker_id: seeker.id,
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
            marginBottom: "1rem",
          }}
        >
          View company profile <FaExternalLinkAlt size={10} />
        </button>
      )}

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

      {/* APPLY BUTTON (hidden for owner) */}
      {!isOwner && (
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
