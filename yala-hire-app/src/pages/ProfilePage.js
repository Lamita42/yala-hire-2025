// src/pages/ProfilePage.jsx
import React, { useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      console.log("USER METADATA:", user.user_metadata);

      const type = user.user_metadata?.type;     // seeker | company
      const collar = user.user_metadata?.collar; // white | blue

      // Company → dashboard
      if (type === "company") {
        navigate("/profile/company-summary");
        return;
      }

      // Blue collar → blue summary
      if (type === "seeker" && collar === "blue") {
        navigate("/profile/blue-summary");
        return;
      }

      // White collar → white summary
      if (type === "seeker" && collar === "white") {
        navigate("/profile/white-summary");
        return;
      }

      // Seeker but no collar chosen yet
      if (type === "seeker" && !collar) {
        navigate("/choose-seeker-type");
        return;
      }

      // Fallback → home
      navigate("/");
    };

    loadUser();
  }, [navigate]);

  return <p>Loading profile...</p>;
}
