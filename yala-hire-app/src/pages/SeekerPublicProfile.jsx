// src/pages/SeekerPublicProfile.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaTools,
  FaGraduationCap,
  FaFileDownload,
  FaPhoneAlt,
} from "react-icons/fa";

export default function SeekerPublicProfile() {
  const { seekerId } = useParams();
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

  if (loading) return <p style={{ padding: "2rem" }}>Loading profile...</p>;

  if (!seeker) {
    return (
      <p style={{ padding: "2rem", color: "red" }}>
        Profile not found or unavailable.
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
        maxWidth: "850px",
        margin: "2rem auto",
        background: "white",
        padding: "2rem",
        borderRadius: "18px",
        boxShadow: "0 8px 26px rgba(0,0,0,0.1)",
      }}
    >
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "1.5rem",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
          background: "white",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      {/* TOP SECTION: PHOTO ON LEFT — DETAILS ON RIGHT */}
      <div style={{ display: "flex", gap: "1.5rem" }}>
        {/* Profile Image */}
        <img
          src={
            seeker.profile_image ||
            "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
          }
          alt="Profile"
          style={{
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "4px solid #0b7ad1",
          }}
        />

        {/* Name + Contact Info */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ margin: 0, color: "#0b3b75" }}>
            {seeker.full_name || "Applicant"}
          </h2>

          <p style={{ margin: "0.3rem 0", color: "#334155" }}>
            <FaPhoneAlt style={{ marginRight: 6 }} />
            {seeker.phone || "Not provided"}
          </p>

          <p style={{ margin: "0.3rem 0", color: "#334155" }}>
            ✉️ {seeker.email || "No email available"}
          </p>
        </div>
      </div>

      <hr style={{ margin: "1.5rem 0", borderColor: "#e2e8f0" }} />

      {/* LOCATION */}
      {seeker.location && (
        <div style={{ marginBottom: "1rem" }}>
          <h3 style={titleStyle}>Location</h3>
          <p style={textStyle}>
            <FaMapMarkerAlt style={{ marginRight: 6 }} /> {seeker.location}
          </p>
        </div>
      )}

      {/* EDUCATION */}
      {seeker.education && (
        <div style={{ marginBottom: "1rem" }}>
          <h3 style={titleStyle}>Education</h3>
          <p style={textStyle}>{seeker.education}</p>
        </div>
      )}

      {/* EXPERIENCE */}
      {seeker.experience && (
        <div style={{ marginBottom: "1rem" }}>
          <h3 style={titleStyle}>Experience</h3>
          <p style={textStyle}>{seeker.experience}</p>
        </div>
      )}

      {/* SKILLS */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={titleStyle}>
          <FaTools style={{ marginRight: 6 }} />
          Skills
        </h3>

        {skills.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {skills.map((skill, i) => (
              <span
                key={i}
                style={{
                  background: "#e0f2fe",
                  color: "#0b3b75",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "999px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p style={textStyle}>No skills listed.</p>
        )}
      </div>

      {/* CV BUTTON AT BOTTOM */}
      {seeker.cv_url && (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <a
            href={seeker.cv_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "0.8rem 1.6rem",
              background: "#0b7ad1",
              color: "white",
              borderRadius: "10px",
              fontWeight: "bold",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "1rem",
            }}
          >
            <FaFileDownload /> View CV
          </a>
        </div>
      )}
    </div>
  );
}

const titleStyle = {
  margin: 0,
  marginBottom: "0.4rem",
  color: "#0b3b75",
  fontSize: "1.2rem",
  fontWeight: "600",
};

const textStyle = {
  margin: 0,
  color: "#334155",
  fontSize: "1rem",
};
