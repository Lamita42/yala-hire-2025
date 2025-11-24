// src/pages/CompanyJobsForm.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

const EDUCATION_LEVELS = [
  { value: "none", label: "No specific requirement" },
  { value: "high_school", label: "High school / Baccalaureate" },
  { value: "technical", label: "Technical diploma / TS / LT" },
  { value: "university", label: "University degree required" },
];

const DEGREES = [
  { value: "bachelor", label: "Bachelor" },
  { value: "master", label: "Master" },
  { value: "phd", label: "PhD" },
  { value: "other", label: "Other" },
];

export default function CompanyJobsForm() {
  const navigate = useNavigate();
  const { jobId } = useParams(); // if present → edit mode

  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [collarType, setCollarType] = useState("blue");
  const [tradeId, setTradeId] = useState(null);
  const [requiredExperienceYears, setRequiredExperienceYears] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [location, setLocation] = useState("");
  const [isRemote, setIsRemote] = useState(false);

  const [educationLevel, setEducationLevel] = useState("none");
  const [educationDegree, setEducationDegree] = useState("");
  const [educationMajor, setEducationMajor] = useState("");

  const [trades, setTrades] = useState([]);

  // ---------- LOAD COMPANY & TRADES & (JOB IF EDIT) ----------
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }
      if (!user) {
        navigate("/login");
        return;
      }

      // Load company profile
      const { data: company, error: cpError } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (cpError || !company) {
        setError("You must have a company profile to post jobs.");
        setLoading(false);
        return;
      }

      setCompanyId(company.id);

      // Load trades for dropdown
      const { data: tradesData, error: tradesError } = await supabase
        .from("trades")
        .select("*")
        .order("name", { ascending: true });

      if (!tradesError && tradesData) {
        setTrades(tradesData);
      }

      // If editing an existing job
      if (jobId) {
        const { data: job, error: jobError } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .single();

        if (jobError) {
          setError(jobError.message);
        } else if (job.company_id !== company.id) {
          setError("You can only edit your own jobs.");
        } else {
          // Fill form
          setTitle(job.title);
          setDescription(job.description);
          setCollarType(job.collar_type);
          setTradeId(job.trade_id);
          setRequiredExperienceYears(job.required_experience_years || "");
          setRequiredSkills(job.required_skills || "");
          setLocation(job.location || "");
          setIsRemote(job.is_remote || false);
          setEducationLevel(job.education_level || "none");
          setEducationDegree(job.education_degree || "");
          setEducationMajor(job.education_major || "");
        }
      }

      setLoading(false);
    };

    load();
  }, [jobId, navigate]);

  // ---------- SAVE ----------
  const handleSave = async (e) => {
    e.preventDefault();
    if (!companyId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      company_id: companyId,
      title,
      description,
      collar_type: collarType,
      trade_id: tradeId ? Number(tradeId) : null,
      required_experience_years: requiredExperienceYears
        ? Number(requiredExperienceYears)
        : null,
      required_skills: requiredSkills,
      location,
      is_remote: isRemote,
      education_level: educationLevel,
      education_degree:
        educationLevel === "university" ? educationDegree || null : null,
      education_major:
        educationLevel === "university" ? educationMajor || null : null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (jobId) {
        const { error } = await supabase
          .from("jobs")
          .update(payload)
          .eq("id", jobId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("jobs").insert(payload);
        if (error) throw error;
      }

      setSuccess("Job saved successfully ✔");
      setTimeout(() => {
        navigate("/company-profile");
      }, 900);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save job.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ padding: "2rem" }}>Loading...</p>;
  }

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "2.5rem auto",
        padding: "2rem",
        borderRadius: "18px",
        background: "#F9FAFB",
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "1rem", color: "#0f172a" }}>
        {jobId ? "Edit Job" : "Create New Job"}
      </h2>
      <form onSubmit={handleSave}>
        {/* TITLE */}
        <div style={fieldWrapper}>
          <label style={label}>Job Title</label>
          <input
            style={input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* DESCRIPTION */}
        <div style={fieldWrapper}>
          <label style={label}>Job Description</label>
          <textarea
            style={textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* COLLAR + TRADE */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ ...fieldWrapper, flex: 1 }}>
            <label style={label}>Collar Type</label>
            <select
              style={input}
              value={collarType}
              onChange={(e) => setCollarType(e.target.value)}
            >
              <option value="blue">Blue Collar</option>
              <option value="white">White Collar</option>
            </select>
          </div>

          <div style={{ ...fieldWrapper, flex: 1 }}>
            <label style={label}>Trade / Category</label>
            <select
              style={input}
              value={tradeId || ""}
              onChange={(e) => setTradeId(e.target.value || null)}
            >
              <option value="">(Optional)</option>
              {trades.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* EXPERIENCE + LOCATION */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ ...fieldWrapper, flex: 1 }}>
            <label style={label}>Required Experience (years)</label>
            <input
              type="number"
              min="0"
              style={input}
              value={requiredExperienceYears}
              onChange={(e) => setRequiredExperienceYears(e.target.value)}
            />
          </div>

          <div style={{ ...fieldWrapper, flex: 2 }}>
            <label style={label}>Location</label>
            <input
              style={input}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Beirut, Lebanon"
            />
          </div>
        </div>

        {/* REMOTE */}
        <div style={fieldWrapper}>
          <label style={{ ...label, display: "flex", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={isRemote}
              onChange={(e) => setIsRemote(e.target.checked)}
              style={{ marginRight: "0.4rem" }}
            />
            Remote / Hybrid possible
          </label>
        </div>

        {/* EDUCATION */}
        <div style={fieldWrapper}>
          <label style={label}>Education Requirement</label>
          <select
            style={input}
            value={educationLevel}
            onChange={(e) => setEducationLevel(e.target.value)}
          >
            {EDUCATION_LEVELS.map((lvl) => (
              <option key={lvl.value} value={lvl.value}>
                {lvl.label}
              </option>
            ))}
          </select>
        </div>

        {educationLevel === "university" && (
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ ...fieldWrapper, flex: 1 }}>
              <label style={label}>Degree</label>
              <select
                style={input}
                value={educationDegree}
                onChange={(e) => setEducationDegree(e.target.value)}
              >
                <option value="">Select degree</option>
                {DEGREES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ ...fieldWrapper, flex: 2 }}>
              <label style={label}>Major</label>
              <input
                style={input}
                value={educationMajor}
                onChange={(e) => setEducationMajor(e.target.value)}
                placeholder="e.g. Computer Science, Business Administration"
              />
            </div>
          </div>
        )}

        {/* REQUIRED SKILLS */}
        <div style={fieldWrapper}>
          <label style={label}>Required Skills</label>
          <textarea
            style={textarea}
            value={requiredSkills}
            onChange={(e) => setRequiredSkills(e.target.value)}
            placeholder="Comma separated: e.g. Excel, Communication, Teamwork"
          />
        </div>

        {/* STATUS + BUTTON */}
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ color: error ? "darkred" : "#15803d" }}>
            {error || success}
          </p>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "0.9rem 2rem",
              borderRadius: "999px",
              border: "none",
              background: saving ? "#9ca3af" : "#0f172a",
              color: "white",
              fontWeight: "bold",
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "Saving..." : jobId ? "Save changes" : "Create job"}
          </button>
        </div>
      </form>
    </div>
  );
}

const fieldWrapper = { marginBottom: "1rem" };
const label = { display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" };
const input = {
  width: "100%",
  padding: "0.6rem 0.8rem",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
};
const textarea = {
  width: "100%",
  padding: "0.6rem 0.8rem",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  minHeight: "100px",
};
