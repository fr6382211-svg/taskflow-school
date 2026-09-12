import { supabase } from '../lib/supabase';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type LoginSession = {
  id: string;
  user_id: string;
  session_key: string;
  login_at: string;
  last_seen_at: string;
  logout_at?: string | null;
  device_type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os: string;
  browser: string;
  device_name: string;
  manufacturer?: string | null;
  device_model?: string | null;
  device_name_exact?: string | null;
  os_version?: string | null;
  browser_version?: string | null;
  ip_address?: string | null;
  client_timezone?: string | null;
  screen_width?: number | null;
  screen_height?: number | null;
  user_agent?: string | null;
  is_current: boolean;
  revoked_at?: string | null;
  revoked_reason?: string | null;
};

const SESSION_STORAGE_KEY = 'fathur_school_hub_device_session';

function storageForRemember(remember: boolean): StorageLike | null {
  if (typeof window === 'undefined') return null;
  return remember ? window.localStorage : window.sessionStorage;
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function detectOS(userAgent: string): string {
  if (/Windows NT/i.test(userAgent)) return 'Windows';
  if (/CrOS/i.test(userAgent)) return 'ChromeOS';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  if (/Mac OS X/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'Unknown OS';
}

function detectOSVersion(userAgent: string): string {
  const android = userAgent.match(/Android\s([\d.]+)/i);
  if (android) return android[1];

  const ios = userAgent.match(/(?:OS|iPhone OS)\s([\d_]+)/i);
  if (ios) return ios[1].replace(/_/g, '.');

  const windows = userAgent.match(/Windows NT\s([\d.]+)/i);
  if (windows) return windows[1];

  const mac = userAgent.match(/Mac OS X\s?([\d_\.]+)/i);
  if (mac) return mac[1].replace(/_/g, '.');

  return '';
}

function detectBrowser(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) return 'Microsoft Edge';
  if (/OPR\//i.test(userAgent)) return 'Opera';
  if (/SamsungBrowser\//i.test(userAgent)) return 'Samsung Internet';
  if (/Firefox\//i.test(userAgent)) return 'Firefox';
  if (/Chrome\//i.test(userAgent)) return 'Google Chrome';
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return 'Safari';
  return 'Browser';
}

function detectBrowserVersion(userAgent: string): string {
  const match = userAgent.match(/(?:Edg|OPR|SamsungBrowser|Firefox|Chrome|Version)\/([\d.]+)/i);
  return match?.[1] ?? '';
}

function detectDeviceType(userAgent: string): LoginSession['device_type'] {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)) return 'tablet';
  if (/Mobile|iPhone|iPod|Android/i.test(userAgent)) return 'mobile';
  if (userAgent) return 'desktop';
  return 'unknown';
}

function detectManufacturer(userAgent: string): string {
  if (/Samsung/i.test(userAgent)) return 'Samsung';
  if (/Xiaomi|Miui|Redmi|Poco/i.test(userAgent)) return 'Xiaomi';
  if (/OPPO/i.test(userAgent)) return 'OPPO';
  if (/vivo/i.test(userAgent)) return 'vivo';
  if (/realme/i.test(userAgent)) return 'realme';
  if (/Huawei|Honor/i.test(userAgent)) return 'Huawei/Honor';
  if (/OnePlus/i.test(userAgent)) return 'OnePlus';
  if (/Pixel/i.test(userAgent)) return 'Google';
  if (/iPhone|iPad|Macintosh/i.test(userAgent)) return 'Apple';
  return '';
}

function detectApproxModel(userAgent: string): string {
  const samsung = userAgent.match(/SM-[A-Z0-9-]+/i);
  if (samsung) return samsung[0].toUpperCase();

  const pixel = userAgent.match(/Pixel\s[\w -]+/i);
  if (pixel) return pixel[0];

  return '';
}

async function getHighEntropyModel(): Promise<string> {
  if (typeof navigator === 'undefined') return '';

  const ua = (navigator as Navigator & {
    userAgentData?: {
      getHighEntropyValues?: (
        hints: string[],
      ) => Promise<{ model?: string }>;
    };
  }).userAgentData;

  if (!ua?.getHighEntropyValues) return '';

  try {
    const values = await ua.getHighEntropyValues(['model']);
    return values.model?.trim() ?? '';
  } catch {
    return '';
  }
}

function getDeviceName(
  type: LoginSession['device_type'],
  os: string,
  browser: string,
  manufacturer: string,
  model: string,
): string {
  if (manufacturer && model) return `${manufacturer} ${model}`;
  if (model) return model;
  const label = type === 'mobile' ? 'HP' : type === 'tablet' ? 'Tablet' : type === 'desktop' ? 'PC/Desktop' : 'Perangkat';
  return `${label} • ${os} • ${browser}`;
}

export function getOrCreateClientSessionKey(remember = true): string {
  const storage = storageForRemember(remember);
  if (!storage) return randomId();
  const existing = storage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const key = randomId();
  storage.setItem(SESSION_STORAGE_KEY, key);
  return key;
}

export function clearClientSessionKey(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function recordLoginSession(userId: string, remember = true): Promise<void> {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const deviceType = detectDeviceType(userAgent);
  const os = detectOS(userAgent);
  const osVersion = detectOSVersion(userAgent);
  const browser = detectBrowser(userAgent);
  const browserVersion = detectBrowserVersion(userAgent);
  const manufacturer = detectManufacturer(userAgent);
  const model = (await getHighEntropyModel()) || detectApproxModel(userAgent);
  const sessionKey = getOrCreateClientSessionKey(remember);
  const exactDeviceName = getDeviceName(deviceType, os, browser, manufacturer, model);

  const { error } = await supabase.rpc('register_login_session_v2', {
    p_device_id: sessionKey,
    p_device_type: deviceType,
    p_manufacturer: manufacturer || null,
    p_device_model: model || null,
    p_device_name_exact: exactDeviceName,
    p_os: os,
    p_os_version: osVersion || null,
    p_browser: browser,
    p_browser_version: browserVersion || null,
    p_client_timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : null,
    p_screen_width: typeof window !== 'undefined' ? window.screen.width : null,
    p_screen_height: typeof window !== 'undefined' ? window.screen.height : null,
  });

  if (error) throw error;

  void userId;
}

export async function touchCurrentLoginSession(userId: string): Promise<void> {
  const sessionKey = getStoredSessionKey();
  if (!sessionKey) return;

  const { error } = await supabase.rpc('touch_login_session_v2', {
    p_device_id: sessionKey,
  });

  if (error) {
    console.warn('Login session heartbeat failed:', error.message);
  }

  void userId;
}

export async function recordLogoutSession(userId: string): Promise<void> {
  const sessionKey = getStoredSessionKey();
  if (!sessionKey) return;

  await supabase.rpc('end_login_session_v2', {
    p_device_id: sessionKey,
  });

  clearClientSessionKey();
  void userId;
}

export function getStoredSessionKey(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(SESSION_STORAGE_KEY) ?? window.localStorage.getItem(SESSION_STORAGE_KEY);
}

export async function getRecentLoginSessions(userId: string, limit = 8): Promise<LoginSession[]> {
  const { data, error } = await supabase
    .from('login_sessions')
    .select('id,user_id,session_key,login_at,last_seen_at,logout_at,device_type,os,browser,device_name,manufacturer,device_model,device_name_exact,os_version,browser_version,ip_address,client_timezone,screen_width,screen_height,user_agent,is_current,revoked_at,revoked_reason')
    .eq('user_id', userId)
    .order('login_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as LoginSession[];
}
