import React from "react";
import { useNavigate } from "react-router-dom";
import { FaHardHat, FaBriefcase } from "react-icons/fa";

export default function Home() {
  const navigate = useNavigate();

  const handleSelectType = (type) => {
    if (type === "company") {
      navigate("/register?role=company");
    } else {
      navigate("/choose-seeker-type");
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: "600px",
        padding: "2rem",
        textAlign: "center",
        backgroundColor: "#F0F4F8",
        borderRadius: "12px",
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h1 style={{ color: "#004080" }}>Welcome to YalaHire</h1>
      <p style={{ marginBottom: "2rem" }}>Choose what describes you</p>

      <div style={{ display: "flex", justifyContent: "center", gap: "4rem" }}>
        {/* Job Seeker Option */}
        <button
          onClick={() => handleSelectType("seeker")}
          style={{
            background: "none",
            border: "1px solid #004080",
            cursor: "pointer",
            padding: "2rem",
            borderRadius: "8px",
            width: "200px",
          }}
        >
          <FaHardHat size={60} color="#004080" />
          <p style={{ marginTop: "0.5rem", fontWeight: "bold", color: "#004080" }}>
            Job Seeker
          </p>
        </button>

        {/* Hiring Option */}
        <button
          onClick={() => handleSelectType("company")}
          style={{
            background: "none",
            border: "1px solid #B3C5DD",
            cursor: "pointer",
            padding: "2rem",
            borderRadius: "8px",
            width: "200px",
          }}
        >
          <FaBriefcase size={60} color="#B3C5DD" />
          <p style={{ marginTop: "0.5rem", fontWeight: "bold", color: "#B3C5DD" }}>
            I am Hiring
          </p>
        </button>
      </div>

      <p style={{ marginTop: "20px" }}>
        Already have an account?{" "}
        <span
          style={{ color: "#007bff", cursor: "pointer" }}
          onClick={() => navigate("/login")}
        >
          Login
        </span>
      </p>
    </div>
  );
}
