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

// Edit Pages
import WhiteCollarProfile from "./pages/WhiteCollarProfile";
import BlueCollarProfile from "./pages/BlueCollarProfile";
import CompanyProfile from "./pages/CompanyProfile";
import JobApplicants from "./pages/JobApplicants";

// Summary Pages
import BlueCollarSummary from "./pages/BlueCollarSummary";
import WhiteCollarSummary from "./pages/WhiteCollarSummary";   // ✅ NEW
import CompanySummary from "./pages/CompanySummary";
// add imports at the top:
import CompanyJobsForm from "./pages/CompanyJobsForm";
import JobDetails from "./pages/JobDetails";

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

        {/* Always visible for logged-in users */}
        {session && <Link to="/profile">Profile</Link>}

        {/* Role-based links */}
        {session && role === "company" && (
          <Link to="/company-profile">Company</Link>
        )}

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

        {/* AUTO-REDIRECT TO SUMMARY OR EDIT PAGE */}
        <Route
          path="/profile"
          element={
            session ? <ProfilePage /> : <Navigate to="/login" replace />
          }
        />

        {/* BLUE COLLAR EDIT PAGE */}
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

        {/* BLUE COLLAR SUMMARY PAGE */}
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

        {/* WHITE COLLAR EDIT PAGE */}
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

        {/* ✅ WHITE COLLAR SUMMARY PAGE (NEW ROUTE) */}
        <Route
          path="/profile/white-summary"
          element={
            session && role === "seeker" && collar === "white" ? (
              <WhiteCollarSummary />
            ) : (
              <Navigate to="/profile" replace />
            )
          }
        />

        {/* COMPANY PROFILE PAGE */}
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

        <Route
          path="/profile/company-summary"
          element={
            session && role === "company" ? (
              <CompanySummary />
            ) : (
              <Navigate to="/profile" replace />
            )
          }
        />

                {/* JOB DETAILS (any logged-in seeker or guest can view) */}
        <Route path="/jobs/:jobId" element={<JobDetails />} />

        {/* COMPANY CREATE / EDIT JOB (only for company owner) */}
        <Route
          path="/company/jobs/new"
          element={
            session && role === "company" ? (
              <CompanyJobsForm />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/jobs/:jobId/applicants" element={<JobApplicants />} />

        <Route
          path="/company/jobs/:jobId/edit"
          element={
            session && role === "company" ? (
              <CompanyJobsForm />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
