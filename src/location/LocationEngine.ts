import type { ScheduleItem } from '../types';
import type {
  LocationSnapshot,
  LocationState,
  MasterLocationType,
  MovementState,
  TrackingStatus,
} from '../location-types';
import { MASTER_LOCATIONS } from './masterLocations';
import { angularDifference, bearingDegrees, distanceMeters, distanceToLocations, isInsideGeofence } from './geo';

const DEFAULT_STATE: LocationState = {
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

function activeScheduleTarget(
  now: Date,
  schedule: ScheduleItem[],
): MasterLocationType | null {
  const day = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
  }).format(now);

  const dayName = ({
    Sunday: 'Minggu',
    Monday: 'Senin',
    Tuesday: 'Selasa',
    Wednesday: 'Rabu',
    Thursday: 'Kamis',
    Friday: 'Jumat',
    Saturday: 'Sabtu',
  } as Record<string, string>)[day] ?? day;

  const item = schedule.find((candidate) => {
    return candidate.active && candidate.day === dayName && candidate.type === 'subject';
  });

  if (!item) return null;

  const text = `${item.subject} ${item.location ?? ''}`.toLowerCase();
  if (text.includes('les') || text.includes('tutoring')) return 'tutoring';
  if (text.includes('sekolah') || text.includes('school')) return 'school';
  return null;
}

function statusForLocation(location: MasterLocationType | null): TrackingStatus {
  if (location === 'home') return 'AT_HOME';
  if (location === 'school') return 'AT_SCHOOL';
  if (location === 'tutoring') return 'AT_TUTORING';
  return 'UNKNOWN';
}

function leavingStatus(location: MasterLocationType): TrackingStatus {
  if (location === 'home') return 'LEAVING_HOME';
  if (location === 'school') return 'LEAVING_SCHOOL';
  return 'LEAVING_TUTORING';
}

function travelingStatus(destination: MasterLocationType | null): TrackingStatus {
  if (destination === 'home') return 'TRAVELING_TO_HOME';
  if (destination === 'school') return 'TRAVELING_TO_SCHOOL';
  if (destination === 'tutoring') return 'TRAVELING_TO_TUTORING';
  return 'UNKNOWN';
}

export class LocationEngine {
  private readonly history: LocationSnapshot[] = [];
  private previousState: LocationState = { ...DEFAULT_STATE };

  detect(
    snapshot: LocationSnapshot,
    schedule: ScheduleItem[] = [],
  ): LocationState {
    const distanceTo = distanceToLocations(
      snapshot.latitude,
      snapshot.longitude,
      MASTER_LOCATIONS,
    ) as Record<MasterLocationType, number>;

    const candidates = (Object.keys(MASTER_LOCATIONS) as MasterLocationType[])
      .filter((key) => {
        const location = MASTER_LOCATIONS[key];
        return isInsideGeofence(
          distanceTo[key],
          location.radiusMeters,
          snapshot.accuracy,
        );
      })
      .sort((a, b) => distanceTo[a] - distanceTo[b]);

    const inside = candidates[0];

    let movement: MovementState = 'STATIONARY';
    let movementConfidence = 0.55;

    const previous = this.history[this.history.length - 1];
    if (previous) {
      const dt = Math.max((snapshot.timestamp - previous.timestamp) / 1000, 1);
      const moved = distanceMeters(
        snapshot.latitude,
        snapshot.longitude,
        previous.latitude,
        previous.longitude,
      );
      const speed = snapshot.speed ?? moved / dt;
      if (speed > 1.3 || moved > 30) {
        movement = 'MOVING';
        movementConfidence = 0.85;
      }
    }

    let destination: MasterLocationType | null = null;
    if (!inside) {
      const scheduleTarget = activeScheduleTarget(new Date(snapshot.timestamp), schedule);
      if (
        scheduleTarget &&
        this.previousState.currentLocation &&
        scheduleTarget !== this.previousState.currentLocation
      ) {
        destination = scheduleTarget;
      } else if (this.previousState.currentLocation) {
        const previousLocation = MASTER_LOCATIONS[this.previousState.currentLocation];
        const heading = snapshot.heading;
        if (typeof heading === 'number') {
          const ranked = (Object.keys(MASTER_LOCATIONS) as MasterLocationType[])
            .filter((key) => key !== this.previousState.currentLocation)
            .map((key) => {
              const target = MASTER_LOCATIONS[key];
              const bearing = bearingDegrees(
                snapshot.latitude,
                snapshot.longitude,
                target.latitude,
                target.longitude,
              );
              return {
                key,
                score: angularDifference(heading, bearing),
              };
            })
            .sort((a, b) => a.score - b.score);
          destination = ranked[0]?.score <= 65 ? ranked[0].key : null;
        }

        if (!destination) {
          const nearest = (Object.keys(distanceTo) as MasterLocationType[])
            .filter((key) => key !== this.previousState.currentLocation)
            .sort((a, b) => distanceTo[a] - distanceTo[b])[0];
          destination = nearest ?? null;
        }

        if (
          destination &&
          distanceTo[destination] < distanceTo[this.previousState.currentLocation]
        ) {
          movementConfidence = Math.max(movementConfidence, 0.8);
        }

        void previousLocation;
      }
    }

    const locationConfidence = inside
      ? Math.min(
          0.99,
          0.8 +
            Math.max(0, 1 - distanceTo[inside] / MASTER_LOCATIONS[inside].radiusMeters) * 0.19,
        )
      : 0.35;

    let confidence = locationConfidence * 0.58 + movementConfidence * 0.17;

    if (destination) {
      confidence = Math.min(
        0.98,
        confidence + (this.previousState.currentLocation ? 0.18 : 0.08),
      );
    }

    let status: TrackingStatus = inside
      ? statusForLocation(inside)
      : travelingStatus(destination);

    if (
      !inside &&
      this.previousState.currentLocation &&
      movement === 'MOVING'
    ) {
      status = leavingStatus(this.previousState.currentLocation);
      if (destination) {
        status = travelingStatus(destination);
      }
    }

    if (inside && this.previousState.currentLocation !== inside && movement === 'MOVING') {
      movement = 'ARRIVING';
    }

    if (inside) {
      destination = null;
    }

    const state: LocationState = {
      currentLocation: inside ?? null,
      previousLocation: this.previousState.currentLocation,
      destination,
      status,
      movement,
      confidence: Math.round(confidence * 100) / 100,
      lastUpdate: snapshot.timestamp,
      currentSnapshot: snapshot,
      distanceTo,
    };

    this.history.push(snapshot);
    if (this.history.length > 5) this.history.shift();
    this.previousState = state;
    return state;
  }

  reset() {
    this.history.length = 0;
    this.previousState = { ...DEFAULT_STATE };
  }
}
