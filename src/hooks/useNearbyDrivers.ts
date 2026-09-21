import { useEffect, useMemo, useState } from 'react';
import { rideService } from '../services/rideService';
import { calculateDistance } from '../utils/etaCalculation';
import { MapMarker } from '../components/MapLibreMap';

const MAX_DISTANCE_KM = 5;

export const useNearbyDrivers = (latitude: number | null, longitude: number | null): MapMarker[] => {
  const [onlineDrivers, setOnlineDrivers] = useState(new Map<string, { vehicleCategory: string }>());
  const [locations, setLocations] = useState(new Map<string, { lat: number; lng: number }>());

  useEffect(() => {
    const stopDrivers = rideService.startDriversListener((drivers) => {
      setOnlineDrivers(new Map(Array.from(drivers.entries()).map(([id, driver]) => [id, { vehicleCategory: driver.vehicleCategory }])));
    });
    const stopLocations = rideService.startLocationsListener((nextLocations) => {
      setLocations(new Map(nextLocations));
    });
    return () => {
      stopDrivers();
      stopLocations();
    };
  }, []);

  return useMemo(() => {
    if (latitude == null || longitude == null) return [];
    return Array.from(onlineDrivers.entries()).flatMap(([driverId, driver]) => {
      const location = locations.get(driverId);
      if (!location || calculateDistance(latitude, longitude, location.lat, location.lng) > MAX_DISTANCE_KM) return [];
      return [{ id: `nearby-driver-${driverId}`, type: 'driver' as const, lat: location.lat, lng: location.lng, label: driver.vehicleCategory, vehicleType: driver.vehicleCategory }];
    });
  }, [latitude, longitude, locations, onlineDrivers]);
};

export const LUSAKA_DEFAULT = { lat: -15.3875, lng: 28.3228 };

export default useNearbyDrivers;
