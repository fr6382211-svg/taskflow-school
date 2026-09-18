import type { ScheduleItem } from '../types';
import type {
  ArrivalStatus,
  DepartureStatus,
  LocationSnapshot,
  LocationState,
  MasterLocationType,
  MovementState,
} from '../location-types';
import { MASTER_LOCATIONS } from './masterLocations';
import {
  angularDifference,
  bearingDegrees,
  distanceMeters,
  distanceToLocations,
  isInsideGeofence,
} from './geo';

const DAY_NAMES = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

export type RouteRule = {
  origin: MasterLocationType;
  destination: MasterLocationType;
  departureTime: string;
  arrivalDeadline: string;
  reminderBeforeMinutes: number;
  noMovementAfterMinutes: number;
  gracePeriodMinutes: number;
  activeDays: string[];
  label: string;
};

export type ContextResult = LocationState;

function minutesOfTime(value: string): number | null {
  const match = value.replace('.', ':').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function localParts(timestamp: number) {
  const date = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? '';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  const dayName = ({
    Monday: 'Senin',
    Tuesday: 'Selasa',
    Wednesday: 'Rabu',
    Thursday: 'Kamis',
    Friday: 'Jumat',
    Saturday: 'Sabtu',
    Sunday: 'Minggu',
  } as Record<string, string>)[weekday] ?? weekday;
  return { hour, minute, currentMinutes: hour * 60 + minute, dayName };
}

function todayRouteDeadlineTimestamp(timestamp: number, time: string): number | null {
  const mins = minutesOfTime(time);
  if (mins === null) return null;
  const d = new Date(timestamp);
  const text = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  return new Date(`${text}T${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}:00+07:00`).getTime();
}

function currentSchoolTarget(timestamp: number, schedule: ScheduleItem[]): { target: MasterLocationType | null; firstStart: number | null } {
  const parts = localParts(timestamp);
  const subjects = schedule
    .filter((item) => item.active && item.type === 'subject' && item.day === parts.dayName)
    .map((item) => ({ ...item, minutes: minutesOfTime(item.startTime) }))
    .filter((item) => item.minutes !== null)
    .sort((a, b) => (a.minutes as number) - (b.minutes as number));

  const first = subjects[0];
  if (!first || first.minutes === null) {
    return { target: null, firstStart: null };
  }

  return { target: 'school', firstStart: first.minutes };
}

function distanceTrend(
  snapshot: LocationSnapshot,
  previous: LocationSnapshot,
  target: MasterLocationType,
): number {
  const before = distanceMeters(
    previous.latitude,
    previous.longitude,
    MASTER_LOCATIONS[target].latitude,
    MASTER_LOCATIONS[target].longitude,
  );
  const after = distanceMeters(
    snapshot.latitude,
    snapshot.longitude,
    MASTER_LOCATIONS[target].latitude,
    MASTER_LOCATIONS[target].longitude,
  );
  return before - after;
}

function mergeConfidence(
  proximity: number,
  movement: number,
  destinationConfidence: number,
  scheduleConfidence: number,
): number {
  const score =
    proximity * 0.46 +
    movement * 0.22 +
    destinationConfidence * 0.20 +
    scheduleConfidence * 0.12;
  return Math.max(0, Math.min(0.99, Math.round(score * 100) / 100));
}

export class LocationContextEngine {
  private history: LocationSnapshot[] = [];
  private previousState: LocationState = {
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
  };

  detect(
    snapshot: LocationSnapshot,
    schedule: ScheduleItem[] = [],
    tutoringSchedule: Array<{ scheduleDate: string; startTimeLabel: string; subjectName: string }> = [],
  ): ContextResult {
    const distances = distanceToLocations(
      snapshot.latitude,
      snapshot.longitude,
      MASTER_LOCATIONS,
    ) as Record<MasterLocationType, number>;

    const keys = Object.keys(MASTER_LOCATIONS) as MasterLocationType[];
    const insideCandidates = keys
      .filter((key) =>
        isInsideGeofence(
          distances[key],
          MASTER_LOCATIONS[key].radiusMeters,
          snapshot.accuracy,
        ),
      )
      .sort((a, b) => distances[a] - distances[b]);

    const inside = insideCandidates[0] ?? null;

    const previousSnapshot = this.history[this.history.length - 1];
    let movement: MovementState = 'STATIONARY';
    let movementScore = 0.55;
    let noMovementSince: number | null = null;

    if (previousSnapshot) {
      const seconds = Math.max(
        1,
        (snapshot.timestamp - previousSnapshot.timestamp) / 1000,
      );

      const movedMeters = distanceMeters(
        snapshot.latitude,
        snapshot.longitude,
        previousSnapshot.latitude,
        previousSnapshot.longitude,
      );

      const derivedSpeed = movedMeters / seconds;
      const actualSpeed = snapshot.speed ?? derivedSpeed;

      if (actualSpeed >= 1.25 || movedMeters >= 25) {
        movement = 'MOVING';
        movementScore = 0.92;
      } else {
        movement = 'STATIONARY';
        movementScore = snapshot.accuracy !== null && snapshot.accuracy <= 50 ? 0.75 : 0.6;
        noMovementSince = this.previousState.noMovementSince ?? previousSnapshot.timestamp;
      }
    }

    const nowParts = localParts(snapshot.timestamp);
    const schoolTarget = currentSchoolTarget(snapshot.timestamp, schedule);

    let destination: MasterLocationType | null = null;
    let destinationConfidence = 0.25;
    let scheduleConfidence = 0.25;

    const tutoringToday = tutoringSchedule
      .filter((item) => item.scheduleDate === new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(snapshot.timestamp)))
      .sort((a, b) => {
        const am = minutesOfTime(a.startTimeLabel) ?? 9999;
        const bm = minutesOfTime(b.startTimeLabel) ?? 9999;
        return am - bm;
      });

    if (!inside && this.previousState.currentLocation) {
      const previousLocation = this.previousState.currentLocation;

      const possible: Array<{ key: MasterLocationType; score: number }> = [];
      for (const key of keys) {
        if (key === previousLocation) continue;
        const targetBearing = bearingDegrees(
          snapshot.latitude,
          snapshot.longitude,
          MASTER_LOCATIONS[key].latitude,
          MASTER_LOCATIONS[key].longitude,
        );
        const headingScore =
          typeof snapshot.heading === 'number'
            ? Math.max(0, 1 - angularDifference(snapshot.heading, targetBearing) / 180)
            : 0.35;
        const trend = previousSnapshot
          ? distanceTrend(snapshot, previousSnapshot, key)
          : 0;
        const trendScore = trend > 0 ? Math.min(1, trend / 100) : 0;
        const proximityScore = 1 / Math.max(1, distances[key]);
        possible.push({
          key,
          score: headingScore * 0.45 + trendScore * 0.35 + proximityScore * 0.20,
        });
      }

      possible.sort((a, b) => b.score - a.score);
      const best = possible[0];

      if (best && best.score >= 0.48) {
        destination = best.key;
        destinationConfidence = Math.min(0.95, best.score);
      }

      if (schoolTarget.firstStart !== null) {
        const isBeforeFirstClass =
          nowParts.currentMinutes <= schoolTarget.firstStart + 90;
        if (isBeforeFirstClass && previousLocation === 'home') {
          destination = 'school';
          scheduleConfidence = 0.9;
          destinationConfidence = Math.max(destinationConfidence, 0.88);
        }
      }

      const tutoringStart = tutoringToday
        .map((item) => minutesOfTime(item.startTimeLabel))
        .filter((value): value is number => value !== null)
        .find((value) => value >= nowParts.currentMinutes - 15);

      if (
        tutoringStart !== undefined &&
        previousLocation === 'school' &&
        nowParts.currentMinutes >= tutoringStart - 120
      ) {
        destination = 'tutoring';
        scheduleConfidence = Math.max(scheduleConfidence, 0.88);
        destinationConfidence = Math.max(destinationConfidence, 0.86);
      }
    }

    const currentProximity = inside
      ? Math.min(
          0.99,
          0.78 +
            Math.max(
              0,
              1 -
                distances[inside] /
                  Math.max(1, MASTER_LOCATIONS[inside].radiusMeters),
            ) *
              0.21,
        )
      : 0.25;

    let status: LocationState['status'] = 'UNKNOWN';

    if (inside) {
      status =
        inside === 'home'
          ? 'AT_HOME'
          : inside === 'school'
            ? 'AT_SCHOOL'
            : 'AT_TUTORING';

      destination = null;
    } else if (destination) {
      status =
        destination === 'home'
          ? 'TRAVELING_TO_HOME'
          : destination === 'school'
            ? 'TRAVELING_TO_SCHOOL'
            : 'TRAVELING_TO_TUTORING';

      if (
        movement === 'STATIONARY' &&
        noMovementSince &&
        snapshot.timestamp - noMovementSince >= 5 * 60 * 1000
      ) {
        status = 'NOT_MOVING';
      }
    } else {
      status = 'UNKNOWN';
    }

    if (
      !inside &&
      this.previousState.currentLocation &&
      movement === 'MOVING' &&
      !destination
    ) {
      status =
        this.previousState.currentLocation === 'home'
          ? 'LEAVING_HOME'
          : this.previousState.currentLocation === 'school'
            ? 'LEAVING_SCHOOL'
            : 'LEAVING_TUTORING';
    }

    const distanceImproving =
      destination && previousSnapshot
        ? distanceTrend(snapshot, previousSnapshot, destination) > 0
        : false;

    const confidence = mergeConfidence(
      currentProximity,
      movementScore,
      destination ? Math.max(destinationConfidence, distanceImproving ? 0.9 : 0.35) : 0.25,
      scheduleConfidence,
    );

    const routeDestination = destination;
    let departureStatus: DepartureStatus = 'IDLE';
    let arrivalStatus: ArrivalStatus = 'NOT_APPLICABLE';
    let departureTime: number | null = null;
    let routeDeadline: number | null = null;
    let reminderAt: number | null = null;
    let delayMinutes: number | null = null;
    let nextAction: string | null = null;
    let routeLabel: string | null = null;

    if (routeDestination === 'school' && this.previousState.currentLocation === 'home' && schoolTarget.firstStart !== null) {
      const schoolStart = schoolTarget.firstStart;
      departureTime = todayRouteDeadlineTimestamp(snapshot.timestamp, `${String(Math.max(0, Math.floor((schoolStart - 10) / 60))).padStart(2, '0')}:${String(Math.max(0, schoolStart - 10) % 60).padStart(2, '0')}`);
      routeDeadline = todayRouteDeadlineTimestamp(snapshot.timestamp, `${String(Math.floor(schoolStart / 60)).padStart(2, '0')}:${String(schoolStart % 60).padStart(2, '0')}`);
      reminderAt = departureTime;
      routeLabel = 'Rumah → Sekolah';

      if (inside === 'home') {
        const reminderReached = departureTime !== null && snapshot.timestamp >= departureTime;
        const noMoveReached = noMovementSince !== null && snapshot.timestamp - noMovementSince >= 5 * 60 * 1000;

        if (reminderReached && movement === 'STATIONARY') {
          departureStatus = noMoveReached ? 'NOT_MOVING' : 'DEPARTURE_REMINDER';
          nextAction = noMoveReached
            ? 'Segera bergerak menuju Sekolah.'
            : 'Bersiap meninggalkan Rumah.';
        } else {
          departureStatus = 'SCHEDULED';
        }
      }

      if (inside !== 'school' && snapshot.timestamp > (routeDeadline ?? Number.POSITIVE_INFINITY)) {
        arrivalStatus = 'DEADLINE_REACHED';
        nextAction = 'Belum terdeteksi tiba di Sekolah.';
      }

      if (inside === 'school') {
        arrivalStatus = snapshot.timestamp <= (routeDeadline ?? Number.POSITIVE_INFINITY)
          ? 'ARRIVED_ON_TIME'
          : 'ARRIVED_LATE';
        if (arrivalStatus === 'ARRIVED_LATE') {
          delayMinutes = routeDeadline ? Math.max(0, Math.round((snapshot.timestamp - routeDeadline) / 60000)) : null;
        }
        departureStatus = 'DEPARTED';
        nextAction = 'Kedatangan tercatat.';
      }
    }

    if (
      !inside &&
      movement === 'STATIONARY' &&
      noMovementSince &&
      snapshot.timestamp - noMovementSince >= 5 * 60 * 1000
    ) {
      departureStatus = 'NOT_MOVING';
    }

    const etaMinutes =
      destination && previousSnapshot
        ? (() => {
            const seconds = Math.max(
              1,
              (snapshot.timestamp - previousSnapshot.timestamp) / 1000,
            );
            const distanceGain =
              distanceTrend(snapshot, previousSnapshot, destination);
            const speedMps = Math.max(1, distanceGain / seconds);
            return Math.max(1, Math.round((distances[destination] / speedMps) / 60));
          })()
        : null;

    if (destination && routeDeadline && etaMinutes !== null) {
      const etaTimestamp = snapshot.timestamp + etaMinutes * 60 * 1000;
      if (etaTimestamp > routeDeadline) {
        arrivalStatus = 'LATE_RISK';
        status = confidence >= 0.55 ? 'LATE_RISK' : 'LOCATION_UNCERTAIN';
        nextAction = 'Risiko terlambat. Percepat perjalanan bila memungkinkan.';
      } else if (movement === 'MOVING') {
        arrivalStatus = 'ON_TRACK';
      }
    }

    if (snapshot.accuracy !== null && snapshot.accuracy > 250 && !inside) {
      status = 'LOCATION_UNCERTAIN';
      arrivalStatus =
        arrivalStatus === 'NOT_APPLICABLE'
          ? 'LOCATION_UNKNOWN'
          : arrivalStatus;
    }

    const result: LocationState = {
      currentLocation: inside,
      previousLocation: this.previousState.currentLocation,
      destination,
      status,
      movement,
      confidence,
      lastUpdate: snapshot.timestamp,
      currentSnapshot: snapshot,
      distanceTo: distances,
      departureStatus,
      arrivalStatus,
      routeDeadline,
      departureTime,
      reminderAt,
      gracePeriodMinutes: 5,
      noMovementSince,
      etaMinutes,
      delayMinutes,
      nextAction,
      routeLabel,
    };

    this.history.push(snapshot);
    if (this.history.length > 8) this.history.shift();
    this.previousState = result;
    return result;
  }

  reset(): void {
    this.history = [];
    this.previousState = {
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
    };
  }
}
