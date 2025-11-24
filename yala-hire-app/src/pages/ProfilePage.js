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
      const type = user.user_metadata?.type;     // "seeker" or "company"
      const collar = user.user_metadata?.collar; // "white" or "blue"

      if (type === "company") {
        navigate("/company-profile");
        return;
      }

      if (type === "seeker") {
        if (collar === "white") {
          navigate("/edit-white-profile");
          return;
        }
        if (collar === "blue") {
          navigate("/edit-blue-profile");
          return;
        }

        // Seeker but no collar yet
        navigate("/choose-seeker-type");
        return;
      }

      // Fallback: go to home
      navigate("/");
    };

    loadUser();
  }, [navigate]);

  return <p>Loading...</p>;
}
