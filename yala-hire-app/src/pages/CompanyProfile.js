// src/pages/CompanyProfile.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import { FaMapMarkerAlt, FaBriefcase, FaPlus, FaUsers } from "react-icons/fa";

export default function CompanyProfile() {
  const navigate = useNavigate();
  const { companyId } = useParams(); // optional: if you later allow viewing other companies

  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Load company profile:
      // if companyId param exists, use it; otherwise use current user.id
      const companyFilterId = companyId || user?.id;

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

      // Load jobs for this company
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("company_id", cp.id)
        .order("created_at", { ascending: false });

      if (!jobsError && jobsData) {
        setJobs(jobsData);
      }

      setLoading(false);
    };

    load();
  }, [companyId]);

  if (loading) {
    return <p style={{ padding: "2rem" }}>Loading company profile...</p>;
  }

  if (!company) {
    return <p style={{ padding: "2rem" }}>Company not found.</p>;
  }

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
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.8rem", color: "#0b3b75" }}>
            {company.company_name}
          </h2>
          {company.location && (
            <p
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                color: "#4b5563",
              }}
            >
              <FaMapMarkerAlt style={{ marginRight: 6 }} /> {company.location}
            </p>
          )}
        </div>

        {isOwner && (
          <button
            onClick={() => navigate("/company/jobs/new")}
            style={{
              alignSelf: "flex-start",
              padding: "0.7rem 1.4rem",
              borderRadius: "10px",
              border: "none",
              background: "#0b7ad1",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <FaPlus /> Add New Position
          </button>
        )}
      </div>

      {/* DESCRIPTION */}
      {company.description && (
        <>
          <hr style={{ margin: "1.5rem 0", borderColor: "#d1d5db" }} />
          <p style={{ margin: 0, color: "#374151" }}>{company.description}</p>
        </>
      )}

      {/* OPEN POSITIONS */}
      <div style={{ marginTop: "2rem" }}>
        <h3
          style={{
            marginTop: 0,
            marginBottom: "0.75rem",
            color: "#0b3b75",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <FaBriefcase /> Open Positions
        </h3>

        {jobs.length === 0 && <p>No open positions yet.</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {jobs.map((job) => (
            <div
              key={job.id}
              style={{
                padding: "0.9rem 1.1rem",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{job.title}</div>
                <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                  {job.collar_type === "blue" ? "Blue Collar" : "White Collar"}
                  {job.location && ` • ${job.location}`}
                  {job.is_remote && " • Remote"}
                </div>
              </div>

              {/* Only owner sees quick actions / applicants count */}
              {isOwner && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <button
                    type="button"
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
                      fontSize: "0.85rem",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/jobs/${job.id}#applicants`);
                    }}
                    style={{
                      padding: "0.35rem 0.7rem",
                      borderRadius: "999px",
                      border: "none",
                      background: "#eef2ff",
                      color: "#4338ca",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <FaUsers /> View applicants
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
