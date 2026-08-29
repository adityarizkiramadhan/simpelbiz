// ============================================================
// SIMPELBIZ - KONFIGURASI SUPABASE
// ============================================================

const SUPABASE_URL = "https://gpispzkwbrbuszyuayka.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fIAZxcdjtx8ZXxTtqSyVMQ_HJ1Co928";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

const DEFAULT_EMAIL = "admin@simpelbiz.id";
const DEFAULT_PASSWORD = "admin123";
const TABLE_NAME = "folders";
const TABLE_PENGIRIMAN = "pengiriman";

console.log("✅ Config loaded!");
console.log("📋 Tabel:", TABLE_NAME);
console.log("📋 Tabel Pengiriman:", TABLE_PENGIRIMAN);
console.log("🔗 URL:", SUPABASE_URL);
console.log("🔑 Key:", SUPABASE_PUBLISHABLE_KEY.substring(0, 20) + "...");