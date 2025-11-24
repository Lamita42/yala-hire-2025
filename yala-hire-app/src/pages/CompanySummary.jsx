import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaBuilding, FaMapMarkerAlt, FaEdit, FaInfoCircle } from "react-icons/fa";

export default function CompanySummary() {
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
        .from("company_profiles")
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
    return <p style={{ padding: "2rem" }}>Loading company profile...</p>;
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
            Company Profile
          </h2>

          <p
            style={{
              margin: "0.3rem 0 0 0",
              display: "flex",
              alignItems: "center",
              color: "#475569",
              fontWeight: "bold",
            }}
          >
            <FaBuilding style={{ marginRight: 6 }} /> Registered Company
          </p>
        </div>

        <button
          onClick={() => navigate("/edit-company-profile")}
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
          <FaEdit style={{ marginRight: 6 }} /> Edit
        </button>
      </div>

      <hr style={{ margin: "1.5rem 0", borderColor: "#d0d8e0" }} />

      {/* Company Name */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#004080" }}>Company Name</h3>
        <p style={{ margin: "0.5rem 0" }}>{profile.company_name}</p>
      </div>

      {/* Location */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#004080" }}>
          <FaMapMarkerAlt style={{ marginRight: 8 }} />
          Location
        </h3>
        <p style={{ margin: "0.5rem 0" }}>
          {profile.location || "Location not added"}
        </p>
      </div>

      {/* Description */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: "#004080" }}>
          <FaInfoCircle style={{ marginRight: 8 }} />
          Description
        </h3>
        <p style={{ margin: "0.5rem 0" }}>
          {profile.description || "No company description added."}
        </p>
      </div>
    </div>
  );
}
