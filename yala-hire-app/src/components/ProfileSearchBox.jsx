import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ProfileSearchBox() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

const search = async () => {
  if (!query.trim()) return;

  setLoading(true);
  setResults([]);

  const q = query.trim();

  // SEEKERS SEARCH
  const seekersQuery = supabase
    .from("job_seekers")
    .select("*")
    .or(
      `full_name.ilike.%${q}%,skills.ilike.%${q}%,experience.ilike.%${q}%,education.ilike.%${q}%,collar.ilike.%${q}%`
    );

  // COMPANY SEARCH
  const companyQuery = supabase
    .from("company_profiles")
    .select("*")
    .or(
      `company_name.ilike.%${q}%,location.ilike.%${q}%,description.ilike.%${q}%`
    );

  const [seekRes, compRes] = await Promise.all([seekersQuery, companyQuery]);

  console.log("Seekers:", seekRes);
  console.log("Companies:", compRes);

  const seekers =
    seekRes.data?.map((s) => ({ ...s, type: "seeker" })) || [];

  const companies =
    compRes.data?.map((c) => ({ ...c, type: "company" })) || [];

  setResults([...seekers, ...companies]);
  setLoading(false);
};


  return (
    <div
      style={{
        marginTop: "2rem",
        padding: "1.5rem",
        background: "#f8fafc",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "0.6rem 1.2rem",
          background: "#0b7ad1",
          color: "white",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        🔍 Search Profiles
      </button>

      {open && (
        <>
          {/* SINGLE SEARCH BOX */}
          <div style={{ marginTop: "1rem" }}>
            <input
              placeholder="Search anything... (name, skills, company, job, location...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.8rem",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "1rem",
              }}
            />
          </div>

          <button
            onClick={search}
            disabled={loading}
            style={{
              marginTop: "1rem",
              padding: "0.7rem 1.4rem",
              background: "#1e3a8a",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {loading ? "Searching..." : "Search"}
          </button>

          {/* RESULTS */}
          <div style={{ marginTop: "1.5rem" }}>
            {results.length === 0 && !loading && (
              <p style={{ color: "#475569" }}>
                No results found.
              </p>
            )}

            {results.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: "1rem",
                  marginBottom: "0.8rem",
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                }}
              >
                <h4 style={{ margin: 0 }}>
                  {r.type === "seeker" ? r.full_name : r.company_name}
                </h4>

                {/* SEEKER CARD */}
                {r.type === "seeker" && (
                  <>
                    <p style={{ margin: "0.2rem 0" }}>
                      <strong>Collar:</strong> {r.collar}
                    </p>
                    <p style={{ margin: "0.2rem 0" }}>
                      <strong>Skills:</strong> {r.skills}
                    </p>
                    <button
                      onClick={() => navigate(`/seeker/${r.id}`)}
                      style={btnSmall}
                    >
                      View Profile
                    </button>
                  </>
                )}

                {/* COMPANY CARD */}
                {r.type === "company" && (
                  <>
                    <p style={{ margin: "0.2rem 0" }}>
                      <strong>Location:</strong> {r.location}
                    </p>
                    <button
                      onClick={() =>
                        navigate(`/profile/company-summary`, { state: { companyId: r.id } })
                      }
                      style={btnSmall}
                    >
                      View Company
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const btnSmall = {
  padding: "0.4rem 1rem",
  background: "#0b7ad1",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  marginTop: "0.4rem",
};
