export type MasterLocationType = 'home' | 'school' | 'tutoring';

export type TrackingStatus =
  | 'UNKNOWN'
  | 'LOCATION_UNCERTAIN'
  | 'AT_HOME'
  | 'AT_SCHOOL'
  | 'AT_TUTORING'
  | 'LEAVING_HOME'
  | 'LEAVING_SCHOOL'
  | 'LEAVING_TUTORING'
  | 'TRAVELING_TO_HOME'
  | 'TRAVELING_TO_SCHOOL'
  | 'TRAVELING_TO_TUTORING'
  | 'NOT_MOVING'
  | 'LATE_RISK'
  | 'LATE'
  | 'NOT_ARRIVED'
  | 'ARRIVED_ON_TIME'
  | 'ARRIVED_LATE';

export type MovementState =
  | 'STATIONARY'
  | 'MOVING'
  | 'ARRIVING'
  | 'LEAVING';

export type DepartureStatus =
  | 'IDLE'
  | 'SCHEDULED'
  | 'DEPARTURE_REMINDER'
  | 'NOT_MOVING'
  | 'DEPARTED'
  | 'DELAYED';

export type ArrivalStatus =
  | 'NOT_APPLICABLE'
  | 'EXPECTED'
  | 'ON_TRACK'
  | 'LATE_RISK'
  | 'DEADLINE_REACHED'
  | 'ARRIVED_ON_TIME'
  | 'ARRIVED_LATE'
  | 'NOT_ARRIVED'
  | 'LOCATION_UNKNOWN';

export type MasterLocation = {
  id: MasterLocationType;
  label: string;
  shortLabel: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  emoji: string;
};

export type LocationSnapshot = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
};

export type LocationState = {
  currentLocation: MasterLocationType | null;
  previousLocation: MasterLocationType | null;
  destination: MasterLocationType | null;
  status: TrackingStatus;
  movement: MovementState;
  confidence: number;
  lastUpdate: number | null;
  currentSnapshot: LocationSnapshot | null;
  distanceTo: Record<MasterLocationType, number>;

  departureStatus?: DepartureStatus;
  arrivalStatus?: ArrivalStatus;
  routeDeadline?: number | null;
  departureTime?: number | null;
  reminderAt?: number | null;
  gracePeriodMinutes?: number;
  noMovementSince?: number | null;
  etaMinutes?: number | null;
  delayMinutes?: number | null;
  nextAction?: string | null;
  routeLabel?: string | null;
};
