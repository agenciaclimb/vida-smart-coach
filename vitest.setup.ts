import '@testing-library/jest-dom';

// Setup environment variables for tests
// These are fake values used only for testing - not real credentials
if (!import.meta.env.VITE_SUPABASE_URL) {
  import.meta.env.VITE_SUPABASE_URL = 'https://fake-project.supabase.co';
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  import.meta.env.VITE_SUPABASE_ANON_KEY = 'fake-anon-key-for-testing-only';
}
