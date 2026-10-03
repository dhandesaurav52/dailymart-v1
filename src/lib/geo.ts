import { Shop, UserLocation } from '../types';

/**
 * Calculates geographic distance in kilometers between two points using the Haversine formula.
 * Does NOT use simple latitude/longitude subtraction.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Earth's mean radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place (e.g. 1.8 km)
}

/**
 * Filters shops within a given radius (default 12 km) from customer location,
 * attaches distanceKm, and sorts ascending by distance.
 */
export function getNearbyShops(
  shops: Shop[],
  userLocation: UserLocation | null,
  maxRadiusKm = 12
): Shop[] {
  if (!userLocation) {
    return shops.map((s) => ({ ...s, distanceKm: undefined }));
  }

  const nearby = shops
    .map((shop) => {
      const distance = calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        shop.latitude,
        shop.longitude
      );
      return {
        ...shop,
        distanceKm: distance,
      };
    })
    .filter((shop) => {
      const radius = shop.deliveryRadius || maxRadiusKm;
      // Only show shops within both the shop's delivery radius and the 12 km maximum
      return shop.distanceKm <= radius && shop.distanceKm <= maxRadiusKm;
    })
    .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

  return nearby;
}

export function formatDistance(distanceKm?: number): string {
  if (distanceKm === undefined || isNaN(distanceKm)) return 'Nearby';
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Popular pre-configured delivery areas for quick selection when GPS is denied or unavailable.
 */
export const POPULAR_DELIVERY_LOCATIONS: UserLocation[] = [
  {
    address: 'Indiranagar 100ft Road, Stage 2',
    area: 'Indiranagar',
    city: 'Bengaluru',
    pincode: '560038',
    lat: 12.9784,
    lng: 77.6408,
  },
  {
    address: 'Koramangala 4th Block, 80ft Road',
    area: 'Koramangala',
    city: 'Bengaluru',
    pincode: '560034',
    lat: 12.9352,
    lng: 77.6245,
  },
  {
    address: 'HSR Layout, Sector 2, 27th Main',
    area: 'HSR Layout',
    city: 'Bengaluru',
    pincode: '560102',
    lat: 12.9121,
    lng: 77.6446,
  },
  {
    address: 'Bandra West, Linking Road',
    area: 'Bandra West',
    city: 'Mumbai',
    pincode: '400050',
    lat: 19.0596,
    lng: 72.8295,
  },
  {
    address: 'Connaught Place, Radial Road 3',
    area: 'Connaught Place',
    city: 'New Delhi',
    pincode: '110001',
    lat: 28.6304,
    lng: 77.2177,
  },
];
