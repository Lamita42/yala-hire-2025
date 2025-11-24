// src/pages/JobApplicants.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import { FaUser, FaPhone } from "react-icons/fa";

export default function JobApplicants() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        navigate("/login");
        return;
      }

      // Load job
      const { data: jobData, error: jobErr } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobErr || !jobData) {
        setError("Job not found");
        setLoading(false);
        return;
      }

      // Check ownership
      if (jobData.company_id !== auth.user.id) {
        setError("You cannot view applicants for a job you don't own.");
        setLoading(false);
        return;
      }

      setJob(jobData);

      // Load applications
      const { data: apps } = await supabase
        .from("applications")
        .select("id, user_id, created_at")
        .eq("job_id", jobId);

      if (!apps || apps.length === 0) {
        setApplicants([]);
        setLoading(false);
        return;
      }

      // Fetch seeker profiles
      const seekerIds = apps.map(a => a.user_id);

      const { data: seekers } = await supabase
        .from("job_seekers")
        .select("*")
        .in("id", seekerIds);

      // combine
      const merged = apps.map(app => ({
        ...app,
        seeker: seekers.find(s => s.id === app.user_id),
      }));

      setApplicants(merged);
      setLoading(false);
    };

    loadData();
  }, [jobId, navigate]);

  if (loading) return <p style={{ padding: "2rem" }}>Loading applicants...</p>;
  if (error) return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;

  return (
    <div style={{ maxWidth: "850px", margin: "2rem auto", padding: "2rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>
        Applicants for: <strong>{job.title}</strong>
      </h2>

      {applicants.length === 0 ? (
        <p>No applicants yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {applicants.map(app => (
            <div
              key={app.id}
              style={{
                padding: "1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: "bold" }}>
                  <FaUser /> {app.seeker?.full_name}
                </p>
                <p style={{ margin: "0.3rem 0" }}>
                  <FaPhone /> {app.seeker?.phone}
                </p>
                <p style={{ margin: 0, color: "#555" }}>
                  {app.seeker?.skills || "No skills added"}
                </p>
              </div>

              <button
                onClick={() => navigate(`/seeker/${app.seeker.id}`)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "#0b7ad1",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                View Profile
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
