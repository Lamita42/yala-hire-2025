// src/pages/EditCompanyProfile.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function EditCompanyProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [companyId, setCompanyId] = useState(null);

  const [message, setMessage] = useState("");

  // ------------------------------------------------------
  // LOAD EXISTING DATA
  // ------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getUser();
      const user = sessionData?.user;

      if (!user) {
        navigate("/login");
        return;
      }

      const { data: cp, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setCompanyId(cp.id);
      setCompanyName(cp.company_name);
      setLocation(cp.location || "");
      setDescription(cp.description || "");
      setProfileImagePreview(cp.profile_image || null);

      setLoading(false);
    };

    load();
  }, [navigate]);

  // ------------------------------------------------------
  // UPLOAD IMAGE
  // ------------------------------------------------------
  const uploadImage = async (file) => {
    if (!file) return null;

    const ext = file.name.split(".").pop();
    const fileName = `${companyId}.${ext}`;
    const filePath = `company_images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("job-files")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error(uploadError);
      setMessage("❌ Failed to upload image.");
      return null;
    }

    const { data } = supabase.storage
      .from("job-files")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // ------------------------------------------------------
  // DELETE IMAGE
  // ------------------------------------------------------
  const deleteImage = async () => {
    if (!profileImagePreview) return;

    const fileName = profileImagePreview.split("/").pop();
    const filePath = `company_images/${fileName}`;

    await supabase.storage
      .from("job-files")
      .remove([filePath]);

    setProfileImage(null);
    setProfileImagePreview(null);
    setMessage("✔ Image removed. Save to confirm.");
  };

  // ------------------------------------------------------
  // SAVE CHANGES
  // ------------------------------------------------------
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    let uploadedImageUrl = profileImagePreview;

    if (profileImage) {
      uploadedImageUrl = await uploadImage(profileImage);
    }

    const payload = {
      company_name: companyName || null,
      location: location || null,
      description: description || null,
      profile_image: uploadedImageUrl,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined fields
    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key]
    );

    const { error } = await supabase
      .from("company_profiles")
      .update(payload)
      .eq("id", companyId);

    if (error) {
      console.error(error);
      setMessage("❌ Failed to save.");
      setSaving(false);
      return;
    }

    setMessage("✔ Profile updated!");

    setTimeout(() => navigate("/profile/company-summary"), 1000);
  };

  if (loading) {
    return <p style={{ padding: "2rem" }}>Loading...</p>;
  }

  // ------------------------------------------------------
  // UI
  // ------------------------------------------------------
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
      <button
        onClick={() => navigate(-1)}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
          background: "white",
          cursor: "pointer",
          marginBottom: "1.5rem",
        }}
      >
        ← Back
      </button>

      <h2 style={{ marginBottom: "1.5rem", color: "#0b3b75" }}>
        Edit Company Profile
      </h2>

      <form onSubmit={handleSave}>
        {/* IMAGE UPLOAD */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ fontWeight: "bold", display: "block" }}>
            Company Logo
          </label>

          <div
            style={{
              marginTop: "0.5rem",
              display: "flex",
              gap: "1.5rem",
              alignItems: "center",
            }}
          >
            <img
              src={
                profileImagePreview ||
                "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Building_font_awesome.svg/2048px-Building_font_awesome.svg.png"
              }
              alt="Logo"
              style={{
                width: "150px",
                height: "150px",
                objectFit: "cover",
                borderRadius: "12px",
                border: "3px solid #0b7ad1",
              }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setProfileImage(file);
                  if (file) {
                    setProfileImagePreview(URL.createObjectURL(file));
                  }
                }}
              />

              {profileImagePreview && (
                <button
                  type="button"
                  onClick={deleteImage}
                  style={{
                    background: "#dc2626",
                    color: "white",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Delete Logo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* COMPANY NAME */}
        <div style={{ marginBottom: "1.2rem" }}>
          <label style={{ fontWeight: "bold" }}>Company Name</label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        {/* LOCATION */}
        <div style={{ marginBottom: "1.2rem" }}>
          <label style={{ fontWeight: "bold" }}>Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* DESCRIPTION */}
        <div style={{ marginBottom: "1.2rem" }}>
          <label style={{ fontWeight: "bold" }}>Company Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={textareaStyle}
          />
        </div>

        {message && (
          <p
            style={{
              color: message.includes("❌") ? "darkred" : "green",
              fontWeight: "bold",
            }}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "0.8rem 2rem",
            background: saving ? "#9ca3af" : "#0b3b75",
            color: "white",
            borderRadius: "10px",
            border: "none",
            cursor: saving ? "default" : "pointer",
            fontWeight: "bold",
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

// ----------------- STYLES -----------------
const inputStyle = {
  width: "100%",
  padding: "0.7rem",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  marginTop: "0.3rem",
};

const textareaStyle = {
  width: "100%",
  minHeight: "100px",
  padding: "0.7rem",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  marginTop: "0.3rem",
};
