import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
	? createClient(supabaseUrl!, supabaseAnonKey!)
	: null;

export function getSupabase(): SupabaseClient {
	if (!supabase) {
		throw new Error(
			'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file and restart the dev server.'
		);
	}
	return supabase;
}
