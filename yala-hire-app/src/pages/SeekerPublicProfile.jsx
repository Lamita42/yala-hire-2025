// src/pages/SeekerPublicProfile.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaTools, FaGraduationCap } from "react-icons/fa";

export default function SeekerPublicProfile() {
  const { seekerId } = useParams(); // comes from /seeker/:seekerId
  const navigate = useNavigate();

  const [seeker, setSeeker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSeeker = async () => {
      const { data, error } = await supabase
        .from("job_seekers")
        .select("*")
        .eq("id", seekerId)
        .single();

      if (error || !data) {
        console.error(error);
        setSeeker(null);
        setLoading(false);
        return;
      }

      setSeeker(data);
      setLoading(false);
    };

    loadSeeker();
  }, [seekerId]);

  if (loading) {
    return <p style={{ padding: "2rem" }}>Loading profile...</p>;
  }

  if (!seeker) {
    return (
      <p style={{ padding: "2rem", color: "red" }}>
        Profile not found or no longer available.
      </p>
    );
  }

  const skills = (seeker.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "2rem auto",
        padding: "2rem",
        borderRadius: "18px",
        background: "white",
        boxShadow: "0 8px 28px rgba(0,0,0,0.1)",
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "1rem",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
          background: "white",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <h2 style={{ margin: 0, color: "#0b3b75" }}>
        {seeker.full_name || "Applicant"}
      </h2>

      <p style={{ color: "#334155", marginTop: "0.5rem" }}>
        Phone: {seeker.phone || "Not provided"}
      </p>

      <hr style={{ margin: "1.5rem 0", borderColor: "#e2e8f0" }} />

      {/* LOCATION */}
      {seeker.location && (
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#475569",
          }}
        >
          <FaMapMarkerAlt /> {seeker.location}
        </p>
      )}

      {/* EDUCATION */}
      {seeker.education && (
        <div style={{ marginTop: "1rem" }}>
          <h3 style={{ margin: 0, color: "#0b3b75" }}>
            <FaGraduationCap style={{ marginRight: 6 }} />
            Education
          </h3>
          <p>{seeker.education}</p>
        </div>
      )}

      {/* EXPERIENCE */}
      {seeker.experience && (
        <div style={{ marginTop: "1rem" }}>
          <h3 style={{ margin: 0, color: "#0b3b75" }}>Experience</h3>
          <p>{seeker.experience}</p>
        </div>
      )}

      {/* SKILLS */}
      <div style={{ marginTop: "1rem" }}>
        <h3 style={{ margin: 0, color: "#0b3b75" }}>
          <FaTools style={{ marginRight: 6 }} />
          Skills
        </h3>

        {skills.length ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.6rem",
              marginTop: "0.5rem",
            }}
          >
            {skills.map((skill, idx) => (
              <span
                key={idx}
                style={{
                  background: "#e0f2fe",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "999px",
                  fontSize: "0.85rem",
                  color: "#0b3b75",
                  fontWeight: 600,
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p>No skills listed.</p>
        )}
      </div>
    </div>
  );
}
