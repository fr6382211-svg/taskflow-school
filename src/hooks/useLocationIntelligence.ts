import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScheduleItem } from '../types';
import type { LocationSnapshot, LocationState } from '../location-types';
import { LocationContextEngine } from '../location/LocationContextEngine';
import { recordLocationEvent } from '../location/locationService';

type TutoringContext = Array<{
  scheduleDate: string;
  startTimeLabel: string;
  subjectName: string;
}>;

const INITIAL_STATE: LocationState = {
  currentLocation: null,
  previousLocation: null,
  destination: null,
  status: 'UNKNOWN',
  movement: 'STATIONARY',
  confidence: 0,
  lastUpdate: null,
  currentSnapshot: null,
  distanceTo: {
    home: Infinity,
    school: Infinity,
    tutoring: Infinity,
  },
  departureStatus: 'IDLE',
  arrivalStatus: 'NOT_APPLICABLE',
  routeDeadline: null,
  departureTime: null,
  reminderAt: null,
  gracePeriodMinutes: 5,
  noMovementSince: null,
  etaMinutes: null,
  delayMinutes: null,
  nextAction: null,
  routeLabel: null,
};

export function useLocationIntelligence(
  schedule: ScheduleItem[],
  tutoringSchedule: TutoringContext = [],
) {
  const engineRef = useRef<LocationContextEngine | null>(null);
  const [state, setState] = useState<LocationState>(INITIAL_STATE);
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastPersistedRef = useRef('');
  const lastPersistedAtRef = useRef(0);

  const stop = useCallback(() => {
    setTracking(false);
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setSupported(false);
      return;
    }

    engineRef.current = new LocationContextEngine();

    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        setPermission('granted');
        setError(null);
        setTracking(true);

        const snapshot: LocationSnapshot = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Number.isFinite(position.coords.accuracy)
            ? position.coords.accuracy
            : null,
          speed: Number.isFinite(position.coords.speed ?? NaN)
            ? position.coords.speed
            : null,
          heading: Number.isFinite(position.coords.heading ?? NaN)
            ? position.coords.heading
            : null,
          timestamp: position.timestamp,
        };

        const engine = engineRef.current;
        if (!engine) return;

        const next = engine.detect(
          snapshot,
          schedule,
          tutoringSchedule,
        );

        setState(next);

        const signature = [
          next.status,
          next.currentLocation ?? '',
          next.destination ?? '',
          next.departureStatus ?? '',
          next.arrivalStatus ?? '',
        ].join('|');

        const changed = signature !== lastPersistedRef.current;
        const elapsed =
          Date.now() - lastPersistedAtRef.current;

        if (changed || elapsed >= 60_000) {
          lastPersistedRef.current = signature;
          lastPersistedAtRef.current = Date.now();
          void recordLocationEvent(snapshot, next);
        }
      },
      (geoError) => {
        setTracking(false);

        if (
          geoError.code ===
          geoError.PERMISSION_DENIED
        ) {
          setPermission('denied');
          setError(
            'Izin lokasi belum diberikan. Aktifkan Location untuk memakai deteksi otomatis.',
          );
        } else if (
          geoError.code ===
          geoError.POSITION_UNAVAILABLE
        ) {
          setError(
            'Lokasi terakhir tidak dapat diperbarui. Status tetap menggunakan data terakhir yang tersedia.',
          );
        } else {
          setError(
            'Lokasi belum dapat dibaca. Coba aktifkan GPS dan izinkan akses lokasi.',
          );
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15_000,
        timeout: 20_000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watcher);
      engineRef.current?.reset();
      engineRef.current = null;
    };
  }, [schedule, tutoringSchedule]);

  return {
    ...state,
    supported,
    permission,
    tracking,
    error,
    stop,
  };
}
