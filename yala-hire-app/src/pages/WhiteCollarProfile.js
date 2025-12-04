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

  // FORM FIELDS
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [otherSkill, setOtherSkill] = useState("");
  const isOtherSelected = selectedSkills.includes("Other");

  // FILES
  const [profileImage, setProfileImage] = useState(null);
  const [cvUrl, setCvUrl] = useState(null);

  // -------------------------------------------------------
  // LOAD USER PROFILE
  // -------------------------------------------------------
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
          full_name: "",
          phone: "",
          collar: "white",
          experience: "",
          education: "",
          skills: "",
        };

        const { data: created } = await supabase
          .from("job_seekers")
          .insert(base)
          .select()
          .single();

        seeker = created;
      }

      // Fill fields
      setFullName(seeker.full_name);
      setPhone(seeker.phone);
      setExperience(seeker.experience || "");
      setEducation(seeker.education || "");
      setProfileImage(seeker.profile_image || null);
      setCvUrl(seeker.cv_url || null);

      // Skills handling
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

  // -------------------------------------------------------
  // UPLOAD PROFILE IMAGE
  // -------------------------------------------------------
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !userId) return;

    const ext = file.name.split(".").pop();
    const path = `profile_images/${userId}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("job-files")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadErr) return alert("Image upload failed");

    const { data } = supabase.storage.from("job-files").getPublicUrl(path);
    const publicUrl = data.publicUrl;

    setProfileImage(publicUrl);

    await supabase.from("job_seekers").update({ profile_image: publicUrl }).eq("id", userId);
  };

  // -------------------------------------------------------
  // DELETE PROFILE PHOTO
  // -------------------------------------------------------
  const handleDeletePhoto = async () => {
    if (!userId) return;

    const possible = [
      `profile_images/${userId}.png`,
      `profile_images/${userId}.jpg`,
      `profile_images/${userId}.jpeg`,
    ];

    await supabase.storage.from("job-files").remove(possible);
    await supabase.from("job_seekers").update({ profile_image: null }).eq("id", userId);

    setProfileImage(null);
  };

  // -------------------------------------------------------
  // UPLOAD CV
  // -------------------------------------------------------
  const handleCvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !userId) return;

    const ext = file.name.split(".").pop();
    const path = `cvs/${userId}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("job-files")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadErr) return alert("CV upload failed");

    const { data } = supabase.storage.from("job-files").getPublicUrl(path);
    setCvUrl(data.publicUrl);

    await supabase.from("job_seekers").update({ cv_url: data.publicUrl }).eq("id", userId);
  };

  // -------------------------------------------------------
  // DELETE CV
  // -------------------------------------------------------
  const handleDeleteCv = async () => {
    if (!userId) return;

    const possible = [
      `cvs/${userId}.pdf`,
      `cvs/${userId}.doc`,
      `cvs/${userId}.docx`,
    ];

    await supabase.storage.from("job-files").remove(possible);
    await supabase.from("job_seekers").update({ cv_url: null }).eq("id", userId);

    setCvUrl(null);
  };

  // -------------------------------------------------------
  // SAVE PROFILE
  // -------------------------------------------------------
  const saveProfile = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    let skillsToSave = selectedSkills.filter((s) => s !== "Other");

    if (isOtherSelected && otherSkill.trim()) {
      skillsToSave.push(
        ...otherSkill.split(",").map((x) => x.trim())
      );
    }

    const { error: updateErr } = await supabase
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

    if (updateErr) setError("Failed to save.");
    else {
      setSuccess("Profile updated ✔");
      setTimeout(() => navigate("/profile/white-summary"), 900);
    }

    setSaving(false);
  };

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  if (loading) return <p style={{ padding: "2rem" }}>Loading...</p>;

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "2.5rem auto",
        padding: "2rem",
        borderRadius: "20px",
        background: "white",
        boxShadow: "0 15px 40px rgba(0,0,0,0.15)",
      }}
    >
      {/* ---------------- PROFILE PHOTO + TITLE ---------------- */}
      <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem" }}>
        <div>
          <h3 style={sectionTitle}>Upload Profile Picture</h3>

          <img
            src={
              profileImage ||
              "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
            }
            alt="Profile"
            style={{
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "4px solid #1e40af",
              marginBottom: "0.5rem",
            }}
          />

          <input type="file" accept="image/*" onChange={handleProfileImageUpload} />

          {profileImage && (
            <button
              onClick={handleDeletePhoto}
              style={{
                marginTop: "0.6rem",
                background: "red",
                color: "white",
                border: "none",
                padding: "0.35rem 1rem",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Delete Photo
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <h2 style={{ color: "#1e3a8a", margin: 0 }}>White Collar Profile</h2>
        </div>
      </div>

      {/* ---------------- BASIC INFO + SKILLS ---------------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
        }}
      >
        {/* LEFT */}
        <div style={card}>
          <h3 style={sectionTitle}>Basic Information</h3>

          <label style={label}>
            Full Name
            <input style={input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>

          <label style={label}>
            Phone
            <input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} />
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
            Education
            <input style={input} value={education} onChange={(e) => setEducation(e.target.value)} />
          </label>
        </div>

        {/* RIGHT */}
        <div style={card}>
          <h3 style={sectionTitle}>Skills</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "0.7rem",
              maxHeight: "260px",
              overflowY: "auto",
            }}
          >
            {WHITE_SKILL_OPTIONS.map((skill) => (
              <label key={skill} style={skillChip(selectedSkills.includes(skill))}>
                <input
                  type="checkbox"
                  checked={selectedSkills.includes(skill)}
                  onChange={() =>
                    setSelectedSkills((prev) =>
                      prev.includes(skill)
                        ? prev.filter((s) => s !== skill)
                        : [...prev, skill]
                    )
                  }
                />
                {skill}
              </label>
            ))}
          </div>

          {isOtherSelected && (
            <label style={{ ...label, marginTop: "1rem" }}>
              Other Skills
              <input
                style={input}
                placeholder="Separated by commas"
                value={otherSkill}
                onChange={(e) => setOtherSkill(e.target.value)}
              />
            </label>
          )}
        </div>
      </div>

      {/* ---------------- CV UPLOAD ---------------- */}
      <div style={{ marginTop: "2.5rem" }}>
        <h3 style={sectionTitle}>Upload CV</h3>

        <input type="file" accept=".pdf,.doc,.docx" onChange={handleCvUpload} />

        {cvUrl && (
          <>
            <p style={{ marginTop: "0.4rem" }}>
              <a
                href={cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#1e3a8a", textDecoration: "underline", fontWeight: "bold" }}
              >
                View Uploaded CV
              </a>
            </p>

            <button
              onClick={handleDeleteCv}
              style={{
                background: "red",
                color: "white",
                border: "none",
                padding: "0.3rem 0.8rem",
                borderRadius: "6px",
                cursor: "pointer",
                marginTop: "0.4rem",
              }}
            >
              Delete CV
            </button>
          </>
        )}
      </div>

      {/* ---------------- SAVE BUTTON ---------------- */}
      <div style={{ marginTop: "2rem", textAlign: "right" }}>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <button
          onClick={saveProfile}
          disabled={saving}
          style={{
            padding: "0.9rem 1.8rem",
            borderRadius: "999px",
            background: "#1e3a8a",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

/* -------------------- STYLES -------------------- */

const card = {
  background: "white",
  padding: "1.4rem",
  borderRadius: "16px",
  boxShadow: "0 8px 20px rgba(148,163,184,0.35)",
};

const label = {
  display: "flex",
  flexDirection: "column",
  marginBottom: "1rem",
  fontSize: "0.9rem",
  color: "#374151",
};

const input = {
  padding: "0.7rem",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
};

const textarea = {
  padding: "0.7rem",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  minHeight: "90px",
};

const sectionTitle = {
  marginBottom: "1rem",
  fontSize: "1.1rem",
  fontWeight: "bold",
  color: "#1e3a8a",
};

const skillChip = (selected) => ({
  padding: "0.4rem 0.6rem",
  borderRadius: "999px",
  border: selected ? "1px solid #1e3a8a" : "1px solid #ddd",
  background: selected ? "rgba(30,58,138,0.1)" : "white",
  cursor: "pointer",
  display: "flex",
  gap: "0.4rem",
  alignItems: "center",
  fontSize: "0.9rem",
});
