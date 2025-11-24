// src/pages/WhiteCollarProfile.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const WHITE_SKILL_OPTIONS = [
  "Administrative Assistant",
  "Accountant",
  "Finance / Banking",
  "Customer Service",
  "Office Manager",
  "Receptionist",
  "Data Entry",
  "Human Resources",
  "Project Coordinator",
  "Marketing",
  "Sales Representative",
  "Telemarketing / Call Center",
  "IT Support",
  "Software Developer",
  "Graphic Designer",
  "Content Writer",
  "Teacher / Instructor",
  "Nurse / Medical Assistant",
  "Pharmacist Assistant",
  "Social Media Manager",
  "Business Development",
  "Quality Control / QA",
  "Purchasing / Procurement",
  "Logistics Coordinator",
  "Other",
];

export default function WhiteCollarProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [otherSkill, setOtherSkill] = useState("");

  // -------- LOAD USER PROFILE --------
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return navigate("/login");

      setUserId(user.id);

      let { data: seeker } = await supabase
        .from("job_seekers")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!seeker) {
        const base = {
          id: user.id,
          full_name: user.user_metadata.full_name || "",
          phone: user.user_metadata.phone || "",
          collar: "white",
          experience: "",
          education: "",
          skills: "",
        };

        const { data: inserted } = await supabase
          .from("job_seekers")
          .insert(base)
          .select()
          .single();

        seeker = inserted;
      }

      setFullName(seeker.full_name);
      setPhone(seeker.phone);
      setExperience(seeker.experience || "");
      setEducation(seeker.education || "");

      const raw = (seeker.skills || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

      const known = [];
      const extras = [];

      raw.forEach((s) => {
        if (WHITE_SKILL_OPTIONS.includes(s)) known.push(s);
        else extras.push(s);
      });

      if (extras.length > 0) {
        known.push("Other");
        setOtherSkill(extras.join(", "));
      }

      setSelectedSkills(known);
      setLoading(false);
    };

    load();
  }, [navigate]);

  // -------- SKILL TOGGLE --------
  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((x) => x !== skill)
        : [...prev, skill]
    );
  };

  const isOther = selectedSkills.includes("Other");

  // -------- SAVE --------
  const saveProfile = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    let skillsToSave = selectedSkills.filter((s) => s !== "Other");

    if (isOther && otherSkill.trim()) {
      skillsToSave.push(
        ...otherSkill.split(",").map((x) => x.trim()).filter(Boolean)
      );
    }

    const { error: updateError } = await supabase
      .from("job_seekers")
      .update({
        full_name: fullName,
        phone,
        experience,
        education,
        skills: skillsToSave.join(", "),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      setError("Failed to save.");
    } else {
      setSuccess("Profile updated ✔");

      // ⭐ FIXED REDIRECT ⭐
      setTimeout(() => navigate("/profile/white-summary"), 900);
    }

    setSaving(false);
  };

  if (loading) return <p style={{ padding: "2rem" }}>Loading...</p>;

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "2.5rem auto",
        padding: "2rem",
        borderRadius: "20px",
        background:
          "linear-gradient(135deg, rgba(238,242,255,0.95), rgba(249,250,255,0.98))",
        boxShadow: "0 18px 45px rgba(15,23,42,0.15)",
      }}
    >
      <h2 style={{ color: "#1e3a8a", marginBottom: "1rem" }}>
        Edit White Collar Profile
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.8rem",
        }}
      >
        {/* LEFT SIDE */}
        <div style={card}>
          <h3 style={sectionTitle}>Basic Info</h3>

          <label style={label}>
            Full Name
            <input
              style={input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>

          <label style={label}>
            Phone
            <input
              style={input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <label style={label}>
            Experience
            <textarea
              style={textarea}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
          </label>

          <label style={label}>
            Education (optional)
            <input
              style={input}
              value={education}
              onChange={(e) => setEducation(e.target.value)}
            />
          </label>
        </div>

        {/* RIGHT SIDE */}
        <div style={card}>
          <h3 style={sectionTitle}>Skills (multi-select)</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "0.5rem",
            }}
          >
            {WHITE_SKILL_OPTIONS.map((s) => (
              <label key={s} style={skillItem(selectedSkills.includes(s))}>
                <input
                  type="checkbox"
                  checked={selectedSkills.includes(s)}
                  onChange={() => toggleSkill(s)}
                  style={{ cursor: "pointer" }}
                />
                {s}
              </label>
            ))}
          </div>

          {isOther && (
            <label style={{ marginTop: "1rem", ...label }}>
              Other Skills
              <input
                style={input}
                value={otherSkill}
                onChange={(e) => setOtherSkill(e.target.value)}
                placeholder="Write custom skills..."
              />
            </label>
          )}
        </div>
      </div>

      {/* SAVE BUTTON */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "1.5rem",
        }}
      >
        <p style={{ color: success ? "#15803d" : "darkred" }}>
          {success || error}
        </p>

        <button
          onClick={saveProfile}
          disabled={saving}
          style={{
            padding: "0.9rem 2rem",
            background: "#1e3a8a",
            color: "white",
            borderRadius: "30px",
            cursor: "pointer",
            fontWeight: "bold",
            border: "none",
          }}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

const card = {
  background: "white",
  padding: "1.4rem",
  borderRadius: "16px",
  boxShadow: "0 8px 22px rgba(148,163,184,0.25)",
};

const label = {
  display: "flex",
  flexDirection: "column",
  fontSize: "0.9rem",
  marginBottom: "0.9rem",
};

const input = {
  padding: "0.7rem",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
};

const textarea = {
  padding: "0.7rem",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  minHeight: "80px",
};

const sectionTitle = {
  margin: 0,
  marginBottom: "1rem",
  color: "#1e3a8a",
};

const skillItem = (active) => ({
  padding: "0.35rem 0.7rem",
  borderRadius: "30px",
  border: active ? "1px solid #1e3a8a" : "1px solid transparent",
  background: active ? "rgba(30,58,138,0.05)" : "transparent",
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  cursor: "pointer",
});
