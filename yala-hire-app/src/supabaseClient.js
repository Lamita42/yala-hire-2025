// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// ⚠️ Replace with your actual values from Supabase settings
const SUPABASE_URL = "https://eujkriiqwgzrdvxuhdwx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1amtyaWlxd2d6cmR2eHVoZHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjEzNzgsImV4cCI6MjA3OTQ5NzM3OH0.di7u05vKlYKCr1-yg3gQLd3ImLBmcdidWoV5RcdCxu8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
