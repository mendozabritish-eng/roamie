import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yfvulyqucbjxbnoebmqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdnVseXF1Y2JqeGJub2VibXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNjk1NTQsImV4cCI6MjA5NTk0NTU1NH0.O4B7PtPGV4Lk7N_ORSh5BJcmECbRoK1OrYY1J_iATA0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
