import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export function useSession() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get current session
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    getSession();

    // Listen to login/logout/update events
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return session;
}
