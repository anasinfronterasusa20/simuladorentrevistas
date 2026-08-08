import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cliente server-side. Usa la SERVICE_ROLE_KEY — nunca la expongas al cliente.
// Se instancia perezosamente para no romper el build si las env faltan
// temporalmente en preview (fallará solo cuando el endpoint corra).

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
