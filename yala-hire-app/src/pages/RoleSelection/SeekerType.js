import React from "react";
import { useNavigate } from "react-router-dom";
import { FaHardHat, FaUserTie } from "react-icons/fa";

export default function SeekerType() {
  const navigate = useNavigate();

  const goToRegister = (type) => {
    navigate(`/register?role=seeker&collar=${type}`);
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "5rem auto",
        background: "#F0F4F8",
        borderRadius: "12px",
        padding: "2rem",
        textAlign: "center",
        boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
      }}
    >
      <h1 style={{ color: "#004080" }}>Choose Job Type</h1>

      <div style={{ display: "flex", justifyContent: "center", gap: "4rem", marginTop: "2rem" }}>
        <button
          onClick={() => goToRegister("blue")}
          style={{
            background: "none",
            border: "1px solid #004080",
            padding: "2rem",
            borderRadius: "8px",
            cursor: "pointer",
            width: "200px",
          }}
        >
          <FaHardHat size={60} color="#004080" />
          <p style={{ fontWeight: "bold", color: "#004080", marginTop: "10px" }}>
            Blue Collar
          </p>
        </button>

        <button
          onClick={() => goToRegister("white")}
          style={{
            background: "none",
            border: "1px solid #B3C5DD",
            padding: "2rem",
            borderRadius: "8px",
            cursor: "pointer",
            width: "200px",
          }}
        >
          <FaUserTie size={60} color="#B3C5DD" />
          <p style={{ fontWeight: "bold", color: "#B3C5DD", marginTop: "10px" }}>
            White Collar
          </p>
        </button>
      </div>
    </div>
  );
}
