// ============================================
// Supabase Configuration
// Management System
// ============================================
const SUPABASE_URL = "https://uftqrgpzllvqlaztcjbq.supabase.co";
const SUPABASE_KEY = "sb_publishable_D1KqPT4KxLEJfsQgSTjzcw_qV5vauVB";

// Initialize Supabase client
// NOTE: نسمّي العميل db لتجنب تعارض الاسم مع مكتبة CDN (window.supabase)
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
