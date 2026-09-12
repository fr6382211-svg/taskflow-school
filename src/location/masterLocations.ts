import type { MasterLocation } from '../location-types';

export const MASTER_LOCATIONS: Record<string, MasterLocation> = {
  school: {
    id: 'school',
    label: 'Sekolah',
    shortLabel: 'School',
    latitude: -6.900682597550797,
    longitude: 112.04823280837307,
    radiusMeters: 400,
    emoji: '🏫',
  },
  home: {
    id: 'home',
    label: 'Rumah',
    shortLabel: 'Home',
    latitude: -6.913402437279368,
    longitude: 112.05846677928949,
    radiusMeters: 100,
    emoji: '🏠',
  },
  tutoring: {
    id: 'tutoring',
    label: 'Tempat Les',
    shortLabel: 'Tutoring',
    latitude: -6.902286975850672,
    longitude: 112.05698734436636,
    radiusMeters: 200,
    emoji: '📚',
  },
};

export const MASTER_LOCATION_LIST = Object.values(MASTER_LOCATIONS);
