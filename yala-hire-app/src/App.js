// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { useSession } from "./useSession";
import { supabase } from "./supabaseClient";

// Public pages
import Home from "./pages/Home/Home";
import SeekerType from "./pages/RoleSelection/SeekerType";
import Register from "./pages/Auth/Register";
import Login from "./pages/Auth/Login";
import SeekerPublicProfile from "./pages/SeekerPublicProfile";

// Edit Pages
import WhiteCollarProfile from "./pages/WhiteCollarProfile";
import BlueCollarProfile from "./pages/BlueCollarProfile";
import CompanyProfile from "./pages/CompanyProfile";
import JobApplicants from "./pages/JobApplicants";

// ⭐ ADDED
import EditCompanyProfile from "./pages/EditCompanyProfile"; 

// Summary Pages
import BlueCollarSummary from "./pages/BlueCollarSummary";
import WhiteCollarSummary from "./pages/WhiteCollarSummary";
import CompanySummary from "./pages/CompanySummary";
import CompanyJobsForm from "./pages/CompanyJobsForm";
import JobDetails from "./pages/JobDetails";

// Auto-router
import ProfilePage from "./pages/ProfilePage";


// ---------------- NAVBAR ----------------
function NavBar({ session }) {
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
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
        {!session && <a href="/">Home</a>}
        {!session && <a href="/login">Login</a>}
      </div>

      {session && (
        <button onClick={logout} style={{ cursor: "pointer" }}>
          Logout
        </button>
      )}
    </nav>
  );
}


// ---------------- FLOATING LOGOUT BUTTON ----------------
function FloatingLogout() {
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <button
      onClick={logout}
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        zIndex: 999,
        padding: "0.5rem 1rem",
        background: "#0b7ad1",
        color: "white",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      Logout
    </button>
  );
}


// ---------------- LAYOUT WRAPPER ----------------
function LayoutWrapper({ session, children }) {
  const location = useLocation();
  const path = location.pathname;

  const hideNav =
    path.startsWith("/edit-") ||
    path.startsWith("/jobs/") ||
    path.startsWith("/profile/company-summary") ||
    path.startsWith("/company/jobs") ||
    path.startsWith("/profile/");

  return (
    <>
      {!hideNav && <NavBar session={session} />}
      {hideNav && session && <FloatingLogout />}
      {children}
    </>
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
      <LayoutWrapper session={session}>
        <Routes>

          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Home />} />
          <Route path="/choose-seeker-type" element={<SeekerType />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* AUTO PROFILE REDIRECT */}
          <Route
            path="/profile"
            element={
              session ? <ProfilePage /> : <Navigate to="/login" replace />
            }
          />

          {/* BLUE COLLAR EDIT */}
          <Route
            path="/edit-blue-profile"
            element={
              session && role === "seeker" && collar === "blue"
                ? <BlueCollarProfile />
                : <Navigate to="/profile" replace />
            }
          />

          {/* BLUE SUMMARY */}
          <Route
            path="/profile/blue-summary"
            element={
              session && role === "seeker" && collar === "blue"
                ? <BlueCollarSummary />
                : <Navigate to="/profile" replace />
            }
          />

          {/* WHITE COLLAR EDIT */}
          <Route
            path="/edit-white-profile"
            element={
              session && role === "seeker" && collar === "white"
                ? <WhiteCollarProfile />
                : <Navigate to="/profile" replace />
            }
          />

          {/* WHITE SUMMARY */}
          <Route
            path="/profile/white-summary"
            element={
              session && role === "seeker" && collar === "white"
                ? <WhiteCollarSummary />
                : <Navigate to="/profile" replace />
            }
          />

          {/* COMPANY PROFILE VIEW */}
          <Route
            path="/profile/company-summary"
            element={
              session && role === "company"
                ? <CompanyProfile />
                : <Navigate to="/profile" replace />
            }
          />

          {/* PUBLIC SEEKER PAGE */}
          <Route path="/seeker/:seekerId" element={<SeekerPublicProfile />} />

          {/* COMPANY SUMMARY PAGE */}
          <Route
            path="/profile/company-summary"
            element={
              session && role === "company"
                ? <CompanySummary />
                : <Navigate to="/profile" replace />
            }
          />

          {/* ⭐ ADDED: EDIT COMPANY PROFILE */}
          <Route
            path="/company/edit-profile"
            element={
              session && role === "company"
                ? <EditCompanyProfile />
                : <Navigate to="/login" replace />
            }
          />

          {/* JOB DETAILS */}
          <Route path="/jobs/:jobId" element={<JobDetails />} />

          {/* ADD JOB */}
          <Route
            path="/company/jobs/new"
            element={
              session && role === "company"
                ? <CompanyJobsForm />
                : <Navigate to="/login" replace />
            }
          />

          {/* APPLICANTS */}
          <Route path="/jobs/:jobId/applicants" element={<JobApplicants />} />

          {/* EDIT JOB */}
          <Route
            path="/company/jobs/:jobId/edit"
            element={
              session && role === "company"
                ? <CompanyJobsForm />
                : <Navigate to="/login" replace />
            }
          />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </LayoutWrapper>
    </Router>
  );
}
