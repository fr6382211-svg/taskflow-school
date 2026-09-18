import { supabase } from '../lib/supabase';
import { getStoredSessionKey } from './loginSessionService';

export type LoginActivityEvent =
  | 'login'
  | 'heartbeat'
  | 'logout'
  | 'revoke'
  | 'ip_change'
  | 'device_change'
  | 'security_check';

let lastHeartbeatLogAt = 0;
const HEARTBEAT_LOG_INTERVAL_MS = 5 * 60 * 1000;

export async function recordLoginActivity(
  eventType: LoginActivityEvent,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const deviceId = getStoredSessionKey();
  if (!deviceId) return;

  if (
    eventType === 'heartbeat' &&
    Date.now() - lastHeartbeatLogAt < HEARTBEAT_LOG_INTERVAL_MS
  ) {
    return;
  }

  if (eventType === 'heartbeat') {
    lastHeartbeatLogAt = Date.now();
  }

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) return;

  let sessionId: string | null = null;
  let deviceType: string | null = null;
  let manufacturer: string | null = null;
  let deviceModel: string | null = null;
  let deviceName: string | null = null;
  let os: string | null = null;
  let osVersion: string | null = null;
  let browser: string | null = null;
  let browserVersion: string | null = null;
  let timezone: string | null = null;

  try {
    const { data: session } = await supabase
      .from('login_sessions')
      .select(
        'id,device_type,manufacturer,device_model,device_name_exact,os,os_version,browser,browser_version,client_timezone',
      )
      .eq('user_id', userId)
      .eq('session_key', deviceId)
      .order('login_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (session) {
      sessionId = String(session.id);
      deviceType = session.device_type;
      manufacturer = session.manufacturer;
      deviceModel = session.device_model;
      deviceName = session.device_name_exact;
      os = session.os;
      osVersion = session.os_version;
      browser = session.browser;
      browserVersion = session.browser_version;
      timezone = session.client_timezone;
    }
  } catch (error) {
    console.warn('Could not enrich login activity:', error);
  }

  const { error } = await supabase.rpc(
    'record_login_activity_v2',
    {
      p_event_type: eventType,
      p_session_id: sessionId,
      p_device_id: deviceId,
      p_device_type: deviceType,
      p_manufacturer: manufacturer,
      p_device_model: deviceModel,
      p_device_name: deviceName,
      p_os: os,
      p_os_version: osVersion,
      p_browser: browser,
      p_browser_version: browserVersion,
      p_client_timezone: timezone,
      p_metadata: metadata,
    },
  );

  if (error) {
    console.warn(
      'Login activity logging failed:',
      error.message,
    );
  }
}
