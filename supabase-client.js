// Conexão com Supabase — compartilhada por todas as páginas que precisam dela
// (cadastrar.html, denuncia.html)

const SUPABASE_URL = 'https://sanqscxbgbhkmikfgxoj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhbnFzY3hiZ2Joa21pa2ZneG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNTE4MTEsImV4cCI6MjEwMzcyNzgxMX0.BRLSoM--33stbf45vHS2BV5MMHiE06VwLkPrlJSEGQ4';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
