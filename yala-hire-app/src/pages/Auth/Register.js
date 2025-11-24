// src/pages/Auth/Register.jsx
import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const role = searchParams.get("role");     // seeker / company
  const collar = searchParams.get("collar"); // blue / white

  // Common fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Seeker fields
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");

  // Company fields
  const [companyLocation, setCompanyLocation] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    // ----------------------------
    // 1) Sign up auth user
    // ----------------------------
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          type: role,             // seeker or company
          collar: collar || null, // blue / white
          phone,
        },
      },
    });

    if (error) return alert(error.message);

    const user = data.user;
    if (!user) {
      return alert("User created but session is null (check email confirmation)");
    }

    try {
      // ----------------------------
      // 2) Insert seeker into job_seekers
      // ----------------------------
      if (role === "seeker") {
        const { error: seekerErr } = await supabase
          .from("job_seekers")
          .insert({
            id: user.id,       // PK (matches profiles table)
            full_name: fullName,
            phone,
            collar,
            experience,
            skills,
            education,
          });

        if (seekerErr) throw seekerErr;
      }

      // ----------------------------
      // 3) Insert company into company_profiles
      // ----------------------------
      if (role === "company") {
        const { error: compErr } = await supabase
          .from("company_profiles")
          .insert({
            id: user.id,   // PK for company table
            company_name: fullName,
            location: companyLocation,
            description: companyDescription,
          });

        if (compErr) throw compErr;
      }

      alert("Registration successful! You can now log in.");
      navigate("/login");

    } catch (err) {
      console.error(err);
      alert("Error saving profile: " + err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
        {role === "company" ? "Company Registration" : "Job Seeker Registration"}
      </h2>

      <form onSubmit={handleRegister} style={styles.form}>

        <input
          type="text"
          placeholder="Full Name"
          style={styles.input}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          style={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Phone Number"
          style={styles.input}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* SEEKER FIELDS */}
        {role === "seeker" && (
          <>
            {collar === "white" && (
              <>
                <input
                  type="text"
                  placeholder="Education"
                  style={styles.input}
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Experience"
                  style={styles.input}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </>
            )}

            <input
              type="text"
              placeholder="Skills"
              style={styles.input}
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </>
        )}

        {/* COMPANY FIELDS */}
        {role === "company" && (
          <>
            <input
              type="text"
              placeholder="Company Location"
              style={styles.input}
              value={companyLocation}
              onChange={(e) => setCompanyLocation(e.target.value)}
            />

            <textarea
              placeholder="Company Description"
              style={styles.textarea}
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
            />
          </>
        )}

        <button type="submit" style={styles.btn}>Register</button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "450px",
    margin: "50px auto",
    padding: "20px",
    borderRadius: "10px",
    background: "#F0F4F8",
    boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
  },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  title: { textAlign: "center", marginBottom: "20px", color: "#004080" },
  input: { padding: "12px", borderRadius: "6px", border: "1px solid #ccc" },
  textarea: { padding: "12px", borderRadius: "6px", border: "1px solid #ccc" },
  btn: {
    marginTop: "15px",
    padding: "14px",
    borderRadius: "6px",
    background: "#004080",
    color: "white",
    cursor: "pointer",
  },
};
