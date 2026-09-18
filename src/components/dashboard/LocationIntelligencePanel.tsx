import { useMemo } from 'react';
import {
  Activity,
  LocateFixed,
  MapPin,
  Navigation,
  ShieldCheck,
} from 'lucide-react';
import type { ScheduleItem } from '../../types';
import { MASTER_LOCATIONS } from '../../location/masterLocations';
import { useLocationIntelligence } from '../../hooks/useLocationIntelligence';
import GoogleLocationMap from './GoogleLocationMap';

function statusText(status: string) {
  const map: Record<string, string> = {
    UNKNOWN: 'Lokasi belum dikenali',
    AT_HOME: 'Sedang di Rumah',
    AT_SCHOOL: 'Sedang di Sekolah',
    AT_TUTORING: 'Sedang di Tempat Les',
    LEAVING_HOME: 'Baru meninggalkan Rumah',
    LEAVING_SCHOOL: 'Baru meninggalkan Sekolah',
    LEAVING_TUTORING: 'Baru meninggalkan Tempat Les',
    TRAVELING_TO_HOME: 'Dalam perjalanan ke Rumah',
    TRAVELING_TO_SCHOOL: 'Dalam perjalanan ke Sekolah',
    TRAVELING_TO_TUTORING: 'Dalam perjalanan ke Tempat Les',
    NOT_MOVING: 'Belum bergerak',
    LATE_RISK: 'Risiko terlambat',
    LATE: 'Terlambat',
    NOT_ARRIVED: 'Belum tiba',
    LOCATION_UNCERTAIN: 'Lokasi belum cukup pasti',
    ARRIVED_ON_TIME: 'Tiba tepat waktu',
    ARRIVED_LATE: 'Tiba terlambat',
  };
  return map[status] ?? 'Mendeteksi konteks lokasi';
}

function metersText(value: number) {
  if (!Number.isFinite(value)) return '—';
  if (value >= 1000) return `${(value / 1000).toFixed(1)} km`;
  return `${Math.round(value)} m`;
}

export default function LocationIntelligencePanel({
  schedule,
  tutoringSchedule = [],
}: {
  schedule: ScheduleItem[];
  tutoringSchedule?: Array<{
    scheduleDate: string;
    startTimeLabel: string;
    subjectName: string;
  }>;
}) {
  const location = useLocationIntelligence(
    schedule,
    tutoringSchedule,
  );

  const nearest = useMemo(() => {
    const entries = Object.entries(location.distanceTo)
      .sort((a, b) => a[1] - b[1]);
    const key = entries[0]?.[0];
    return key ? MASTER_LOCATIONS[key] : null;
  }, [location.distanceTo]);

  const trackedLabel = location.currentLocation
    ? MASTER_LOCATIONS[location.currentLocation].label
    : location.destination
      ? `Menuju ${MASTER_LOCATIONS[location.destination].label}`
      : nearest?.label ?? 'Belum diketahui';

  return (
    <section className="hub-surface rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-base font-bold text-white">
              <MapPin size={18} className="text-rose-300" />
              Location Intelligence
            </div>
            <span className={`hub-chip normal-case tracking-normal ${location.tracking ? 'location-live' : ''}`}>
              {location.tracking ? 'Live' : 'Standby'}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Lokasi, perjalanan, jadwal, dan confidence diproses menjadi satu konteks.
          </p>
        </div>

        {!location.supported && (
          <span className="text-xs font-semibold text-amber-300">
            Browser tidak mendukung Geolocation API.
          </span>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(330px,0.9fr)]">
        <GoogleLocationMap
          current={location.currentSnapshot}
          destination={location.destination}
        />

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Current context
                </div>
                <div className="mt-2 text-lg font-black text-white">
                  {trackedLabel}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {statusText(location.status)}
                </div>
              </div>
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-500/10 text-rose-300">
                <LocateFixed size={20} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/5 bg-black/10 p-3">
                <div className="text-[10px] font-semibold text-slate-500">Confidence</div>
                <div className="mt-1 text-lg font-black text-white">
                  {Math.round(location.confidence * 100)}%
                </div>
              </div>
              <div className="rounded-xl border border-white/5 bg-black/10 p-3">
                <div className="text-[10px] font-semibold text-slate-500">Movement</div>
                <div className="mt-1 text-sm font-black text-white">
                  {location.movement}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-3">
              <div className="text-[10px] font-semibold text-slate-500">Departure</div>
              <div className="mt-1 text-sm font-black text-white">{location.departureStatus ?? 'IDLE'}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-3">
              <div className="text-[10px] font-semibold text-slate-500">Arrival</div>
              <div className="mt-1 text-sm font-black text-white">{location.arrivalStatus ?? '—'}</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-3">
              <div className="text-[10px] font-semibold text-slate-500">ETA</div>
              <div className="mt-1 text-sm font-black text-white">
                {location.etaMinutes !== null && location.etaMinutes !== undefined
                  ? `${location.etaMinutes} menit`
                  : '—'}
              </div>
            </div>
          </div>

          {location.nextAction && (
            <div className="rounded-2xl border border-indigo-400/10 bg-indigo-500/5 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-300">
                Next action
              </div>
              <div className="mt-1 text-sm font-bold text-white">
                {location.nextAction}
              </div>
              {location.routeLabel && (
                <div className="mt-1 text-[11px] text-slate-500">
                  {location.routeLabel}
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Navigation size={16} className="text-sky-300" />
              Journey context
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="rounded-lg bg-white/5 px-2.5 py-1.5 text-slate-300">
                {location.previousLocation
                  ? MASTER_LOCATIONS[location.previousLocation].label
                  : '—'}
              </span>
              <span className="text-slate-600">→</span>
              <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1.5 font-semibold text-indigo-200">
                {location.destination
                  ? MASTER_LOCATIONS[location.destination].label
                  : location.currentLocation
                    ? MASTER_LOCATIONS[location.currentLocation].label
                    : 'Belum diketahui'}
              </span>
            </div>

            {location.currentSnapshot && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-white/5 bg-black/10 p-3 text-slate-500">
                  <div>Accuracy</div>
                  <div className="mt-1 font-bold text-slate-200">
                    {location.currentSnapshot.accuracy
                      ? `${Math.round(location.currentSnapshot.accuracy)} m`
                      : '—'}
                  </div>
                </div>
                <div className="rounded-xl border border-white/5 bg-black/10 p-3 text-slate-500">
                  <div>Last update</div>
                  <div className="mt-1 font-bold text-slate-200">
                    {location.lastUpdate
                      ? new Date(location.lastUpdate).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false,
                        })
                      : '—'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {(location.status === 'LATE_RISK' ||
            location.status === 'NOT_MOVING' ||
            location.status === 'LATE' ||
            location.arrivalStatus === 'ARRIVED_LATE') && (
            <div
              className={`context-reveal rounded-2xl border p-4 ${
                location.status === 'NOT_MOVING'
                  ? 'border-amber-400/15 bg-amber-400/5'
                  : 'border-rose-400/15 bg-rose-500/5'
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                {location.status === 'NOT_MOVING'
                  ? 'Departure Intelligence'
                  : 'Attendance Intelligence'}
              </div>
              <div className="mt-1 text-sm font-black text-white">
                {statusText(location.status)}
              </div>
              <div className="mt-1 text-[11px] leading-5 text-slate-400">
                {location.nextAction ??
                  'Sistem menunggu bukti lokasi dan pergerakan berikutnya.'}
              </div>
              {location.delayMinutes !== null &&
                location.delayMinutes !== undefined && (
                  <div className="mt-2 inline-flex rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-bold text-rose-200">
                    Delay {location.delayMinutes} menit
                  </div>
                )}
            </div>
          )}

          <div className="rounded-2xl border border-white/5 bg-white/[0.025] p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Activity size={16} className="text-emerald-300" />
              Geofence proximity
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {(['home', 'school', 'tutoring'] as const).map((key) => (
                <div key={key} className="rounded-xl border border-white/5 bg-black/10 p-3">
                  <div className="text-[10px] font-semibold text-slate-500">
                    {MASTER_LOCATIONS[key].label}
                  </div>
                  <div className="mt-1 text-sm font-black text-white">
                    {metersText(location.distanceTo[key])}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-400/10 bg-amber-400/5 p-3 text-[11px] leading-5 text-slate-400">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-amber-300" />
            <span>
              Lokasi diproses dari Geolocation API. Sistem memakai geofence, movement,
              jadwal, dan confidence agar status tidak mudah berubah karena noise GPS.
            </span>
          </div>

          {location.error && (
            <div className="rounded-xl border border-rose-400/10 bg-rose-400/5 p-3 text-xs leading-5 text-rose-200">
              {location.error}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
