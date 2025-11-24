// src/pages/BlueCollarSummary.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaPhone, FaUserCog, FaTools, FaHardHat } from "react-icons/fa";

export default function BlueCollarSummary() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  if (loading || !profile) {
    return <p style={{ padding: "2rem" }}>Loading profile...</p>;
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
          <h2 style={{ margin: 0, fontSize: "1.8rem", color: "#0b3b75" }}>
            Your Profile
          </h2>
          <p style={{ margin: 0, display: "flex", alignItems: "center", color: "#0b7ad1", fontWeight: "bold" }}>
            <FaHardHat style={{ marginRight: 6 }} /> Blue Collar Worker
          </p>
        </div>

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

      <hr style={{ margin: "1.5rem 0", borderColor: "#d0d8e0" }} />

      {/* Full Name */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#004080" }}>
          <FaUserCog style={{ marginRight: "8px" }} />
          Personal Information
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

      {/* Experience */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#004080" }}>Experience</h3>
        <p style={{ margin: "0.5rem 0" }}>
          {profile.experience || "No experience added."}
        </p>
      </div>

      {/* Education */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#004080" }}>Education</h3>
        <p style={{ margin: "0.5rem 0" }}>
          {profile.education || "No education added."}
        </p>
      </div>

      {/* Skills */}
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
            {profile.skills.split(",").map((skill, index) => (
              <span
                key={index}
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
    </div>
  );
}
