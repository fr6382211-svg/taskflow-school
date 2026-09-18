import type { MasterLocation } from '../location-types';

const EARTH_RADIUS_M = 6_371_000;

export function distanceMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number {
  const lat1 = (latitudeA * Math.PI) / 180;
  const lat2 = (latitudeB * Math.PI) / 180;
  const dLat = ((latitudeB - latitudeA) * Math.PI) / 180;
  const dLon = ((longitudeB - longitudeA) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function distanceToLocations(
  latitude: number,
  longitude: number,
  locations: Record<string, MasterLocation>,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(locations).map(([key, location]) => [
      key,
      distanceMeters(latitude, longitude, location.latitude, location.longitude),
    ]),
  );
}

export function isInsideGeofence(
  distance: number,
  radiusMeters: number,
  accuracy: number | null,
): boolean {
  const uncertainty = Math.min(Math.max(accuracy ?? 0, 0), 100);
  return distance <= radiusMeters + uncertainty * 0.5;
}

export function bearingDegrees(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number {
  const phi1 = (latitudeA * Math.PI) / 180;
  const phi2 = (latitudeB * Math.PI) / 180;
  const lambda1 = (longitudeA * Math.PI) / 180;
  const lambda2 = (longitudeB * Math.PI) / 180;

  const y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1);

  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return (deg + 360) % 360;
}

export function angularDifference(a: number, b: number): number {
  const diff = Math.abs(((a - b + 540) % 360) - 180);
  return diff;
}
