import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://avnnmcgzwurwwdbgwmuv.supabase.co"; // Ersetze mit deiner Supabase-URL
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bm5tY2d6d3Vyd3dkYmd3bXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NzIyMzksImV4cCI6MjA1NTA0ODIzOX0.6RcLMjGF-XwH4dL2BM15ljpT4lyvFDtPx8hR1F-54fg"; // Ersetze mit deinem Supabase-Key

export const supabase = createClient(supabaseUrl, supabaseKey);
