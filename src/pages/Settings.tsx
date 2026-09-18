import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Bell,
  Check,
  Eye,
  Gauge,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
  Sun,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSettings, saveSettings } from '../services/settingsService';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

type ThemeMode = 'system' | 'light' | 'dark';
type Accent = 'blue' | 'violet' | 'cyan' | 'emerald';
type Density = 'compact' | 'comfortable' | 'spacious';

const themes: Array<{ id: ThemeMode; label: string; description: string; Icon: typeof Monitor }> = [
  { id: 'system', label: 'System', description: 'Mengikuti perangkat', Icon: Monitor },
  { id: 'light', label: 'Light', description: 'Terang & bersih', Icon: Sun },
  { id: 'dark', label: 'Dark', description: 'Gelap & nyaman', Icon: Moon },
];

const accents: Array<{ id: Accent; label: string; dot: string }> = [
  { id: 'blue', label: 'Ocean', dot: 'bg-blue-500' },
  { id: 'violet', label: 'Violet', dot: 'bg-violet-500' },
  { id: 'cyan', label: 'Cyan', dot: 'bg-cyan-500' },
  { id: 'emerald', label: 'Emerald', dot: 'bg-emerald-500' },
];

const densities: Array<{ id: Density; label: string; description: string }> = [
  { id: 'compact', label: 'Compact', description: 'Lebih padat' },
  { id: 'comfortable', label: 'Comfort', description: 'Seimbang' },
  { id: 'spacious', label: 'Spacious', description: 'Lebih lega' },
];

function validTheme(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}
function validAccent(value: unknown): value is Accent {
  return value === 'blue' || value === 'violet' || value === 'cyan' || value === 'emerald';
}
function validDensity(value: unknown): value is Density {
  return value === 'compact' || value === 'comfortable' || value === 'spacious';
}

export default function Settings() {
  const { user } = useAuth();
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [accentColor, setAccentColor] = useState<Accent>('blue');
  const [density, setDensity] = useState<Density>('comfortable');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [deadlineReminder, setDeadlineReminder] = useState(true);
  const [animations, setAnimations] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showLiveBar, setShowLiveBar] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [weekStartsMonday, setWeekStartsMonday] = useState(true);

  const resolvedDark = useMemo(() => {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  }, [themeMode]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userId = user.id;
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getSettings(userId);
        if (!active || !data) return;

        setThemeMode(validTheme(data.theme_mode) ? data.theme_mode : data.dark_mode ? 'dark' : 'system');
        setAccentColor(validAccent(data.accent_color) ? data.accent_color : 'blue');
        setDensity(validDensity(data.density) ? data.density : data.compact_mode ? 'compact' : 'comfortable');
        setEmailNotifications(Boolean(data.email_notifications ?? true));
        setDeadlineReminder(Boolean(data.deadline_reminder ?? true));
        setAnimations(Boolean(data.animations ?? true));
        setReducedMotion(Boolean(data.reduced_motion ?? false));
        setShowLiveBar(Boolean(data.show_live_bar ?? true));
        setShowWatermark(Boolean(data.show_watermark ?? true));
        setWeekStartsMonday(Boolean(data.week_starts_monday ?? true));
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Gagal memuat pengaturan.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedDark);
    root.classList.toggle('reduce-motion', reducedMotion || !animations);
    root.dataset.tfAccent = accentColor;
    root.dataset.tfDensity = density;
    document.body.classList.toggle('compact-mode', density === 'compact');
    window.dispatchEvent(new Event('taskflow:theme-changed'));
  }, [resolvedDark, accentColor, density, reducedMotion, animations]);

  async function save() {
    if (!user) {
      setError('Sesi pengguna tidak ditemukan. Silakan login kembali.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await saveSettings(user.id, {
        email_notifications: emailNotifications,
        deadline_reminder: deadlineReminder,
        dark_mode: resolvedDark,
        compact_mode: density === 'compact',
        reduced_motion: reducedMotion,
        theme_mode: themeMode,
        accent_color: accentColor,
        density,
        show_watermark: showWatermark,
        week_starts_monday: weekStartsMonday,
        animations,
        show_live_bar: showLiveBar,
      });

      window.dispatchEvent(new Event('taskflow:settings-changed'));

      push({
        tone: 'success',
        title: 'Pengaturan tersimpan',
        message: 'Preferensi workspace berhasil disimpan.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.';
      setError(message);
      push({
        tone: 'error',
        title: 'Gagal menyimpan pengaturan',
        message,
      });
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setThemeMode('system');
    setAccentColor('blue');
    setDensity('comfortable');
    setAnimations(true);
    setReducedMotion(false);
    setShowLiveBar(true);
    setShowWatermark(true);
    setWeekStartsMonday(true);
    if (user) {
      setSaving(true);
      try {
        await saveSettings(user.id, {
          dark_mode: false,
          compact_mode: false,
          reduced_motion: false,
          theme_mode: 'system',
          accent_color: 'blue',
          density: 'comfortable',
          show_watermark: true,
          week_starts_monday: true,
          animations: true,
          show_live_bar: true,
        });
        window.dispatchEvent(new Event('taskflow:settings-changed'));
        push({ tone: 'success', title: 'Tampilan direset', message: 'Default visual dipulihkan dan disimpan.' });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal menyimpan reset.';
        setError(message);
        push({ tone: 'error', title: 'Reset gagal', message });
      } finally {
        setSaving(false);
      }
    }
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="text-xl font-black">Pengaturan</h1>
          <p className="mt-2 text-sm text-slate-500">Login untuk membuka pengaturan workspace.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-3 pb-8 sm:px-5 lg:px-6">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <Sparkles size={12} />
              Workspace Studio
            </div>
            <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Pengaturan</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Satu panel terpusat untuk mengatur tema, kenyamanan, realtime, notifikasi, dan branding Taskflow.
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="outline" onClick={reset} icon={<RotateCcw size={15} />}>
              Reset
            </Button>
            <Button type="button" loading={saving} onClick={() => void save()} icon={<Save size={15} />}>
              Simpan
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-950 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full w-1/3 animate-pulse bg-blue-500" />
        </div>
      )}

      <div className="space-y-5">
        <Card className="p-5 sm:p-6">
          <SectionTitle icon={<Palette size={18} />} title="Tema & Visual" description="Atur karakter visual utama workspace." />

          <div className="mt-5">
            <div className="label">Mode tema</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {themes.map(({ id, label, description, Icon }) => {
                const selected = themeMode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setThemeMode(id)}
                    aria-pressed={selected}
                    className={[
                      'rounded-2xl border p-4 text-left transition duration-200',
                      selected
                        ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200'
                        : 'border-slate-200 text-slate-700 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900',
                    ].join(' ')}
                  >
                    <Icon size={19} />
                    <div className="mt-3 text-sm font-extrabold">{label}</div>
                    <div className="mt-1 text-xs text-slate-400">{description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <div className="label">Accent</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {accents.map((accent) => {
                const selected = accentColor === accent.id;
                return (
                  <button
                    key={accent.id}
                    type="button"
                    onClick={() => setAccentColor(accent.id)}
                    className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-xs font-bold transition ${
                      selected
                        ? 'border-blue-300 ring-2 ring-blue-100 dark:border-blue-800 dark:ring-blue-950/40'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900'
                    }`}
                  >
                    <span className={`h-4 w-4 rounded-full ${accent.dot}`} />
                    {accent.label}
                    {selected && <Check size={14} className="ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <div className="label">Kepadatan layout</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {densities.map((item) => {
                const selected = density === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDensity(item.id)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      selected
                        ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="text-xs font-extrabold">{item.label}</div>
                    <div className="mt-1 text-[10px] text-slate-400">{item.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionTitle icon={<Zap size={18} />} title="Experience" description="Kontrol motion, live bar, dan branding." />
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <Toggle icon={<Sparkles size={16} />} label="Animasi antarmuka" description="Transisi dan micro-interaction." value={animations} onChange={setAnimations} />
            <Toggle icon={<Gauge size={16} />} label="Kurangi animasi" description="Minimalkan motion." value={reducedMotion} onChange={setReducedMotion} />
            <Toggle icon={<Zap size={16} />} label="Live Status Bar" description="Status waktu dan jadwal realtime." value={showLiveBar} onChange={setShowLiveBar} />
            <Toggle icon={<Eye size={16} />} label="Watermark @FATHURR" description="Branding kecil profesional." value={showWatermark} onChange={setShowWatermark} />
            <Toggle label="Senin sebagai awal minggu" description="Kalender mingguan dimulai Senin." value={weekStartsMonday} onChange={setWeekStartsMonday} />
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionTitle icon={<Bell size={18} />} title="Notifikasi" description="Pilih pengingat yang ingin kamu terima." />
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <Toggle label="Email notifications" description="Notifikasi penting melalui email." value={emailNotifications} onChange={setEmailNotifications} />
            <Toggle label="Deadline reminder" description="Peringatan saat deadline semakin dekat." value={deadlineReminder} onChange={setDeadlineReminder} />
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-violet-950 p-5 text-white sm:p-6">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">Live Preview</div>
            <div className="mt-1 text-xl font-black">TASKFLOW</div>
            <p className="mt-1 text-xs leading-5 text-slate-300">Preview visual workspace berdasarkan konfigurasi yang sedang dipilih.</p>
          </div>
          <div className="p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <PreviewBox label="Theme" value={themeMode} />
              <PreviewBox label="Accent" value={accents.find((item) => item.id === accentColor)?.label ?? 'Ocean'} />
              <PreviewBox label="Density" value={density === 'comfortable' ? 'Comfort' : density} />
            </div>
            {showWatermark && (
              <div className="mt-5 flex justify-end">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[9px] font-black tracking-[0.14em] text-slate-400 dark:border-slate-800 dark:bg-slate-950">
                  @FATHURR
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="button" loading={saving} onClick={() => void save()} icon={<Save size={15} />}>
          Simpan semua perubahan
        </Button>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">{icon}</span>
      <div className="min-w-0">
        <h2 className="font-extrabold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function Toggle({ icon, label, description, value, onChange }: { icon?: ReactNode; label: string; description: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</div>
          <div className="mt-1 text-xs leading-5 text-slate-500">{description}</div>
        </div>
      </div>
      <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${value ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${value ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}

function PreviewBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 truncate text-sm font-extrabold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}
