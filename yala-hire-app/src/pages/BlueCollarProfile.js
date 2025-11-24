// src/pages/BlueCollarProfile.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";  // <<< ADDED

const BLUE_SKILL_OPTIONS = [
  "Electrician",
  "Plumber",
  "Carpenter",
  "Painter",
  "Construction worker",
  "Mason / Tiler",
  "Welder",
  "Mechanic (cars)",
  "Mechanic (trucks / buses)",
  "AC / Refrigeration technician",
  "Maintenance technician",
  "Warehouse worker",
  "Forklift driver",
  "Delivery driver (car)",
  "Delivery driver (motorbike/scooter)",
  "Truck driver",
  "Security guard",
  "Cleaner / Housekeeping",
  "Gardener / Landscaping",
  "Factory worker / Machine operator",
  "Cook",
  "Kitchen helper",
  "Waiter / Service staff",
  "Barista",
  "Hairdresser",
  "Barber",
  "Tailor / Sewing",
  "Decorator / Events setup",
  "Call center (outbound / inbound)",
  "Cashier",
  "Sales (field / shops)",
  "Storekeeper",
  "Plaster / Gypsum worker",
  "Aluminium / PVC worker",
  "Woodworker / Furniture assembly",
  "Handyman / General repair",
  "Other",
];

export default function BlueCollarProfile() {
  const navigate = useNavigate(); // <<< ADDED

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [otherSkill, setOtherSkill] = useState("");

  const [collar, setCollar] = useState("blue");
  const [userId, setUserId] = useState(null);

  // -------------------------------------------------------
  // LOAD PROFILE
  // -------------------------------------------------------
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("You must be logged in.");
          return;
        }

        setUserId(user.id);

        const meta = user.user_metadata || {};
        const userCollar = meta.collar || "blue";
        setCollar(userCollar);

        let { data: seeker, error: fetchError } = await supabase
          .from("job_seekers")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!seeker) {
          const payload = {
            id: user.id,
            full_name: meta.full_name || "",
            phone: meta.phone || "",
            collar: userCollar,
            experience: "",
            skills: "",
            education: "",
          };

          const { data: inserted, error: insertError } = await supabase
            .from("job_seekers")
            .insert(payload)
            .select()
            .single();

          if (insertError) throw insertError;
          seeker = inserted;
        }

        setFullName(seeker.full_name);
        setPhone(seeker.phone);
        setExperience(seeker.experience || "");
        setEducation(seeker.education || "");

        // Skills → array
        const raw = (seeker.skills || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        const knownOptions = new Set(BLUE_SKILL_OPTIONS);
        const known = [];
        const other = [];

        raw.forEach((s) => {
          if (knownOptions.has(s) && s !== "Other") known.push(s);
          else if (s) other.push(s);
        });

        if (other.length > 0) {
          known.push("Other");
          setOtherSkill(other.join(", "));
        }

        setSelectedSkills(known);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const isOtherSelected = selectedSkills.includes("Other");

  // -------------------------------------------------------
  // SAVE PROFILE
  // -------------------------------------------------------
  const handleSave = async () => {
    if (!userId) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      let skillsToSave = selectedSkills.filter((s) => s !== "Other");

      if (isOtherSelected && otherSkill.trim()) {
        const extra = otherSkill
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        skillsToSave = [...skillsToSave, ...extra];
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

      if (updateError) throw updateError;

      setSuccess("Profile saved successfully ✔");

      // -------------------------------------------------------
      // ⭐ REDIRECT TO SUMMARY PAGE ⭐
      // -------------------------------------------------------
      setTimeout(() => {
        navigate("/profile/blue-summary");
      }, 700);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------
  // UI SECTION
  // -------------------------------------------------------
  if (loading)
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading your blue collar profile...</p>
      </div>
    );

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "2.5rem auto",
        padding: "2rem",
        borderRadius: "20px",
        background:
          "linear-gradient(135deg, rgba(219,234,254,0.95), rgba(239,246,255,0.98))",
        boxShadow: "0 18px 45px rgba(15,23,42,0.18)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#0b3b75" }}>Blue Collar Profile</h2>
          <p style={{ margin: "0.3rem 0", color: "#4b5563" }}>
            Fill your information so we can match you with jobs.
          </p>
        </div>

        <div
          style={{
            background: "#0b7ad1",
            padding: "0.4rem 0.8rem",
            color: "white",
            borderRadius: "999px",
          }}
        >
          Collar type: {collar}
        </div>
      </div>

      {/* LEFT + RIGHT COLUMNS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
        }}
      >
        {/* LEFT PANEL */}
        <div style={panel}>
          <h3 style={sectionTitle}>Basic Information</h3>

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
              placeholder="Describe your experience..."
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

        {/* RIGHT PANEL */}
        <div style={panel}>
          <h3 style={sectionTitle}>Skills (you can choose many)</h3>

          <div style={skillsGrid}>
            {BLUE_SKILL_OPTIONS.map((skill) => (
              <label key={skill} style={skillChip(selectedSkills.includes(skill))}>
                <input
                  type="checkbox"
                  checked={selectedSkills.includes(skill)}
                  onChange={() => {
                    setSelectedSkills((prev) =>
                      prev.includes(skill)
                        ? prev.filter((s) => s !== skill)
                        : [...prev, skill]
                    );
                  }}
                />
                {skill}
              </label>
            ))}
          </div>

          {isOtherSelected && (
            <label style={{ ...label, marginTop: "1rem" }}>
              Other skills
              <input
                style={input}
                placeholder="Write your skills, separated by commas"
                value={otherSkill}
                onChange={(e) => setOtherSkill(e.target.value)}
              />
            </label>
          )}
        </div>
      </div>

      {/* Save */}
      <div
        style={{
          marginTop: "2rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "0.9rem 1.8rem",
            borderRadius: "999px",
            background: saving ? "#9ca3af" : "#0b7ad1",
            color: "white",
            border: "none",
            cursor: saving ? "default" : "pointer",
            fontWeight: "bold",
          }}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

// -------------------- STYLES --------------------
const panel = {
  background: "white",
  padding: "1.4rem",
  borderRadius: "16px",
  boxShadow: "0 8px 20px rgba(148,163,184,0.35)",
};

const label = {
  display: "flex",
  flexDirection: "column",
  gap: "0.3rem",
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
  marginTop: 0,
  marginBottom: "1rem",
  fontSize: "1.1rem",
  color: "#0b3b75",
  fontWeight: "bold",
};

const skillsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "0.8rem",
  maxHeight: "280px",
  overflowY: "auto",
};

const skillChip = (selected) => ({
  padding: "0.4rem 0.6rem",
  borderRadius: "999px",
  border: selected ? "1px solid #0b7ad1" : "1px solid #ddd",
  background: selected ? "rgba(11,122,209,0.08)" : "white",
  cursor: "pointer",
  display: "flex",
  gap: "0.4rem",
  alignItems: "center",
  fontSize: "0.9rem",
});
