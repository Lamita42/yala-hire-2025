// src/pages/RoleSelection/SeekerType.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHardHat, FaUserTie } from "react-icons/fa";

export default function SeekerType() {
  const navigate = useNavigate();
  const [isBlueHovered, setIsBlueHovered] = useState(false);

  const goToRegister = (type) => {
    navigate(`/register?role=seeker&collar=${type}`);
  };

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "5rem auto",
        background: "linear-gradient(135deg, #e3f2fd, #f5f7fb)",
        borderRadius: "18px",
        padding: "2.5rem",
        textAlign: "center",
        boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
      }}
    >
      <h1 style={{ color: "#004080", marginBottom: "0.5rem" }}>
        What type of job are you looking for?
      </h1>
      <p style={{ color: "#4b5563", marginBottom: "2.5rem" }}>
        Choose the option that best matches the kind of work you want.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "3rem",
          position: "relative",
        }}
      >
        {/* BLUE COLLAR CARD */}
        <div style={{ position: "relative" }}>
          {/* Tooltip when hovering on Blue Collar */}
          {isBlueHovered && (
            <div
              style={{
                position: "absolute",
                top: "-120px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "260px",
                background: "#ffffff",
                borderRadius: "12px",
                padding: "0.9rem 1rem",
                boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
                fontSize: "0.85rem",
                textAlign: "left",
                zIndex: 20,
              }}
            >
              <strong style={{ color: "#004080" }}>Blue-collar jobs</strong>{" "}
              are hands-on and practical jobs such as construction, driving,
              maintenance, electrical work, plumbing, and similar{" "}
              <strong>manual / field work</strong>.
              <br />
              <br />
              If you work mostly with your <strong>hands or on-site</strong>,
              you’re probably blue collar.
            </div>
          )}

          <button
            onClick={() => goToRegister("blue")}
            onMouseEnter={() => setIsBlueHovered(true)}
            onMouseLeave={() => setIsBlueHovered(false)}
            style={{
              background: "#ffffff",
              border: "2px solid #0b7ad1",
              cursor: "pointer",
              padding: "2.2rem 1.8rem",
              borderRadius: "14px",
              width: "240px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              boxShadow: "0 5px 14px rgba(11,122,209,0.25)",
            }}
          >
            <FaHardHat size={60} color="#0b7ad1" />
            <p
              style={{
                fontWeight: "bold",
                color: "#0b7ad1",
                marginTop: "12px",
                fontSize: "1.1rem",
              }}
            >
              Blue Collar
            </p>
            <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              Construction, drivers, technicians,
              <br />
              maintenance, delivery, etc.
            </span>
          </button>
        </div>

        {/* WHITE COLLAR CARD */}
        <button
          onClick={() => goToRegister("white")}
          style={{
            background: "#ffffff",
            border: "2px solid #c4cde9",
            cursor: "pointer",
            padding: "2.2rem 1.8rem",
            borderRadius: "14px",
            width: "240px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
            boxShadow: "0 5px 14px rgba(148,163,235,0.25)",
          }}
        >
          <FaUserTie size={60} color="#94a3eb" />
          <p
            style={{
              fontWeight: "bold",
              color: "#4f46e5",
              marginTop: "12px",
              fontSize: "1.1rem",
            }}
          >
            White Collar
          </p>
          <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
            Office work, administration,
            <br />
            IT, finance, management, etc.
          </span>
        </button>
      </div>
    </div>
  );
}
