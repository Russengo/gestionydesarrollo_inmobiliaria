const SUPABASE_URL = 'https://kuwdeahynhdjurcpisqx.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1d2RlYWh5bmhkanVyY3Bpc3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNDI2MjMsImV4cCI6MjEwNjcxODYyM30.8_GwoBNuhBvqj2i2uwU7HzBGHoFrbp0r9t_IBY1-0yo';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
window.supabaseClient = supabaseClient;