// src/pages/CompanyProfile.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaBriefcase,
  FaPlus,
  FaUsers,
  FaBuilding,
  FaEnvelope,
} from "react-icons/fa";

export default function CompanyProfile() {
  const navigate = useNavigate();
  const { companyId } = useParams();

  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const companyFilterId = companyId || user?.id;

      // Fetch company info
      const { data: cp, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("id", companyFilterId)
        .single();

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setCompany(cp);
      setIsOwner(user && user.id === cp.id);
      setEmail(user?.email || "");

      // Fetch company's jobs
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*")
        .eq("company_id", cp.id)
        .order("created_at", { ascending: false });

      setJobs(jobsData || []);
      setLoading(false);
    };

    load();
  }, [companyId]);

  if (loading) return <p style={{ padding: "2rem" }}>Loading...</p>;
  if (!company) return <p style={{ padding: "2rem" }}>Company not found.</p>;

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "2.5rem auto",
        padding: "2rem",
        borderRadius: "18px",
        background: "white",
        boxShadow: "0 8px 28px rgba(0,0,0,0.1)",
      }}
    >
      {/* TOP SECTION — PROFILE */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            background: "white",
            cursor: "pointer",
            marginBottom: "1rem",
          }}
        >
          ← Back
        </button>

        {isOwner && (
          <button
            onClick={() => navigate("/company/edit-profile")}
            style={{
              padding: "0.5rem 1rem",
              background: "#0b7ad1",
              color: "white",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* HEADER WITH PHOTO + INFO */}
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        {/* COMPANY LOGO / IMAGE */}
        <img
          src={
            company.profile_image ||
            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Building_font_awesome.svg/2048px-Building_font_awesome.svg.png"
          }
          alt="Logo"
          style={{
            width: "140px",
            height: "140px",
            borderRadius: "14px",
            objectFit: "cover",
            border: "3px solid #0b7ad1",
          }}
        />

        {/* TEXT INFO */}
        <div>
          <h2 style={{ margin: 0, fontSize: "1.8rem", color: "#0b3b75" }}>
            {company.company_name}
          </h2>

          <p style={{ margin: "0.3rem 0", color: "#4b5563" }}>
            <FaEnvelope style={{ marginRight: 6 }} /> {email}
          </p>

          {company.location && (
            <p style={{ margin: "0.3rem 0", color: "#4b5563" }}>
              <FaMapMarkerAlt style={{ marginRight: 6 }} />
              {company.location}
            </p>
          )}
        </div>
      </div>

      {/* DESCRIPTION */}
      {company.description && (
        <>
          <hr style={{ margin: "1.5rem 0", borderColor: "#d1d5db" }} />
          <h3 style={{ color: "#0b3b75", margin: 0 }}>About Us</h3>
          <p style={{ color: "#374151" }}>{company.description}</p>
        </>
      )}

      {/* OPEN POSITIONS */}
      <div style={{ marginTop: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#0b3b75",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <FaBriefcase /> Open Positions
          </h3>

          {isOwner && (
            <button
              onClick={() => navigate("/company/jobs/new")}
              style={{
                padding: "0.6rem 1.2rem",
                background: "#0b7ad1",
                color: "white",
                borderRadius: "10px",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                cursor: "pointer",
              }}
            >
              <FaPlus /> Add Job
            </button>
          )}
        </div>

        <div style={{ marginTop: "1rem" }}>
          {jobs.length === 0 && <p>No open positions yet.</p>}

          {jobs.map((job) => (
            <div
              key={job.id}
              style={{
                marginBottom: "0.8rem",
                padding: "1rem",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
              }}
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              <div>
                <strong>{job.title}</strong>
                <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                  {job.collar_type === "blue" ? "Blue Collar" : "White Collar"}{" "}
                  {job.location && "• " + job.location}
                  {job.is_remote && " • Remote"}
                </div>
              </div>

              {/* Owner Actions */}
              {isOwner && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/company/jobs/${job.id}/edit`);
                    }}
                    style={{
                      padding: "0.35rem 0.7rem",
                      borderRadius: "999px",
                      border: "1px solid #9ca3af",
                      background: "white",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/jobs/${job.id}#applicants`);
                    }}
                    style={{
                      padding: "0.35rem 0.7rem",
                      borderRadius: "999px",
                      background: "#eef2ff",
                      color: "#4338ca",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <FaUsers /> Applicants
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
