import { supabase } from './supabase';
export async function trackEvent(name:string, metadata:Record<string,unknown>={}) {
  try { await supabase.from('analytics_events').insert({event_name:name,metadata}); } catch { /* analytics must never block UX */ }
}
