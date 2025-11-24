// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";

import { useSession } from "./useSession";
import { supabase } from "./supabaseClient";

// Public pages
import Home from "./pages/Home/Home";
import SeekerType from "./pages/RoleSelection/SeekerType";
import Register from "./pages/Auth/Register";
import Login from "./pages/Auth/Login";

// Profile Pages
import WhiteCollarProfile from "./pages/WhiteCollarProfile";
import BlueCollarProfile from "./pages/BlueCollarProfile";
import CompanyProfile from "./pages/CompanyProfile";

// Summary Page (NEW)
import BlueCollarSummary from "./pages/BlueCollarSummary";

// Auto-router
import ProfilePage from "./pages/ProfilePage";

// ---------------- NAVBAR ----------------
function NavBar({ session }) {
  const navigate = useNavigate();
  const user = session?.user;

  const role = user?.user_metadata?.type;
  const collar = user?.user_metadata?.collar;

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav
      style={{
        padding: "1rem",
        background: "#f8f8f8",
        display: "flex",
        justifyContent: "space-between",
        borderBottom: "1px solid #ddd",
      }}
    >
      <div style={{ display: "flex", gap: "1rem" }}>
        {!session && <Link to="/">Home</Link>}
        {!session && <Link to="/login">Login</Link>}

        {session && <Link to="/profile">Profile</Link>}

        {session && role === "company" && <Link to="/company-profile">Company</Link>}

        {session && role === "seeker" && collar === "white" && (
          <Link to="/edit-white-profile">Edit White Profile</Link>
        )}

        {session && role === "seeker" && collar === "blue" && (
          <Link to="/edit-blue-profile">Edit Blue Profile</Link>
        )}
      </div>

      {session && (
        <button onClick={logout} style={{ cursor: "pointer" }}>
          Logout
        </button>
      )}
    </nav>
  );
}

// ---------------- APP ROUTES ----------------
export default function App() {
  const session = useSession();
  const user = session?.user;

  const role = user?.user_metadata?.type;
  const collar = user?.user_metadata?.collar;

  return (
    <Router>
      <NavBar session={session} />

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/choose-seeker-type" element={<SeekerType />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* AUTO REDIRECT BASED ON USER TYPE */}
        <Route
          path="/profile"
          element={
            session ? <ProfilePage /> : <Navigate to="/login" replace />
          }
        />

        {/* BLUE COLLAR PROFILE EDIT */}
        <Route
          path="/edit-blue-profile"
          element={
            session && role === "seeker" && collar === "blue" ? (
              <BlueCollarProfile />
            ) : (
              <Navigate to="/profile" replace />
            )
          }
        />

        {/* BLUE COLLAR SUMMARY (AFTER SAVE) */}
        <Route
          path="/profile/blue-summary"
          element={
            session && role === "seeker" && collar === "blue" ? (
              <BlueCollarSummary />
            ) : (
              <Navigate to="/profile" replace />
            )
          }
        />

        {/* WHITE COLLAR PROFILE EDIT */}
        <Route
          path="/edit-white-profile"
          element={
            session && role === "seeker" && collar === "white" ? (
              <WhiteCollarProfile />
            ) : (
              <Navigate to="/profile" replace />
            )
          }
        />

        {/* COMPANY PROFILE */}
        <Route
          path="/company-profile"
          element={
            session && role === "company" ? (
              <CompanyProfile />
            ) : (
              <Navigate to="/profile" replace />
            )
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
