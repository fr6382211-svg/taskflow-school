import type { LocationSnapshot, LocationState } from '../location-types';
import type { ScheduleItem } from '../types';
import { supabase } from '../lib/supabase';

export async function recordLocationEvent(
  snapshot: LocationSnapshot,
  state: LocationState,
): Promise<void> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id ?? null;

    if (!userId) {
      return;
    }

    const { error } = await supabase
      .from('location_events')
      .insert({
        user_id: userId,
        latitude: snapshot.latitude,
        longitude: snapshot.longitude,
        accuracy_m: snapshot.accuracy,
        speed_mps: snapshot.speed,
        heading_deg: snapshot.heading,
        recorded_at: new Date(snapshot.timestamp).toISOString(),
        detected_location: state.currentLocation,
        previous_location: state.previousLocation,
        destination: state.destination,
        status: state.status,
        confidence: state.confidence,
        distance_to_home_m: state.distanceTo.home,
        distance_to_school_m: state.distanceTo.school,
        distance_to_tutoring_m: state.distanceTo.tutoring,
        source: 'browser_geolocation',
      });

    if (error) {
      console.warn(
        'Location event was not persisted:',
        error.message,
      );
    }
  } catch (error) {
    console.warn(
      'Location event persistence failed:',
      error,
    );
  }
}

export async function recordLocationJourneyEvent(
  snapshot: LocationSnapshot,
  state: LocationState,
): Promise<void> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user?.id) return;

    await supabase
      .from('location_events')
      .insert({
        user_id: authData.user.id,
        latitude: snapshot.latitude,
        longitude: snapshot.longitude,
        accuracy_m: snapshot.accuracy,
        speed_mps: snapshot.speed,
        heading_deg: snapshot.heading,
        recorded_at: new Date(snapshot.timestamp).toISOString(),
        detected_location: state.currentLocation,
        previous_location: state.previousLocation,
        destination: state.destination,
        status: state.status,
        confidence: state.confidence,
        distance_to_home_m: state.distanceTo.home,
        distance_to_school_m: state.distanceTo.school,
        distance_to_tutoring_m: state.distanceTo.tutoring,
        source: 'journey_engine',
      });
  } catch (error) {
    console.debug('Journey event persistence skipped:', error);
  }
}

export function getActiveSchedule(
  schedule: ScheduleItem[],
): ScheduleItem[] {
  return schedule.filter((item) => item.active);
}
