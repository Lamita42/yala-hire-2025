// src/pages/Auth/Login.jsx
import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    const user = data.user;
    console.log("USER METADATA:", user.user_metadata);

    // After login, ALWAYS go to /profile
    navigate("/profile");
  };

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "50px auto" }}>
      <h2>Login</h2>

      <div>
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 5 }}
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 5 }}
        />
      </div>

      {errorMsg && <p style={{ color: "red", marginTop: 10 }}>{errorMsg}</p>}

      <button
        onClick={handleLogin}
        style={{
          marginTop: 20,
          width: "100%",
          padding: 12,
          background: "#004080",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Login
      </button>

      <p style={{ marginTop: 10 }}>
        Don't have an account?{" "}
        <a href="/register" style={{ color: "blue" }}>
          Register
        </a>
      </p>
    </div>
  );
}
