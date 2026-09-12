import { useEffect, useRef, useState } from 'react';
import { MASTER_LOCATION_LIST } from '../../location/masterLocations';
import type { LocationSnapshot, MasterLocationType } from '../../location-types';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_MAPS_API_KEY =
  ((import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '').trim();

function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (!GOOGLE_MAPS_API_KEY) return Promise.reject(new Error('Google Maps API key belum dikonfigurasi.'));

  const existing = document.getElementById('google-maps-sdk');
  if (existing) {
    return new Promise((resolve, reject) => {
      const timer = window.setInterval(() => {
        if (window.google?.maps) {
          window.clearInterval(timer);
          resolve();
        }
      }, 100);
      window.setTimeout(() => {
        window.clearInterval(timer);
        reject(new Error('Google Maps SDK timeout.'));
      }, 15_000);
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'google-maps-sdk';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Maps gagal dimuat.'));
    document.head.appendChild(script);
  });
}

export default function GoogleLocationMap({
  current,
  destination,
}: {
  current: LocationSnapshot | null;
  destination: MasterLocationType | null;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const currentMarker = useRef<any>(null);
  const circles = useRef<any[]>([]);
  const markers = useRef<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapRef.current || mapInstance.current || !window.google?.maps) return;

        const center = {
          lat: MASTER_LOCATION_LIST[0].latitude,
          lng: MASTER_LOCATION_LIST[0].longitude,
        };

        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: 'greedy',
        });

        for (const location of MASTER_LOCATION_LIST) {
          const marker = new window.google.maps.Marker({
            map: mapInstance.current,
            position: {
              lat: location.latitude,
              lng: location.longitude,
            },
            title: location.label,
          });

          markers.current[location.id] = marker;

          const circle = new window.google.maps.Circle({
            map: mapInstance.current,
            center: {
              lat: location.latitude,
              lng: location.longitude,
            },
            radius: location.radiusMeters,
            fillOpacity: 0.05,
            strokeOpacity: 0.35,
            strokeWeight: 1.5,
          });

          circles.current.push(circle);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Google Maps gagal dimuat.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !window.google?.maps) return;

    if (currentMarker.current) {
      currentMarker.current.setMap(null);
    }

    if (current) {
      currentMarker.current = new window.google.maps.Marker({
        map: mapInstance.current,
        position: {
          lat: current.latitude,
          lng: current.longitude,
        },
        title: 'Lokasi sekarang',
        zIndex: 1000,
      });

      mapInstance.current.panTo({
        lat: current.latitude,
        lng: current.longitude,
      });
    }

    for (const location of MASTER_LOCATION_LIST) {
      const marker = markers.current[location.id];
      if (!marker) continue;
      const selected = destination === location.id;
      marker.setAnimation(
        selected ? window.google.maps.Animation.BOUNCE : null,
      );
    }
  }, [current, destination]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950">
      <div ref={mapRef} className="h-[280px] w-full sm:h-[330px]" />
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-slate-950/95 p-6 text-center">
          <div>
            <div className="text-sm font-black text-white">Map belum tersedia</div>
            <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
