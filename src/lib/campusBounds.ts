export const NAUTH_MAIN_GATE = { lat: 6.001417, lng: 6.882389 };

export const CAMPUS_BOUNDS = {
  south: 5.9947,
  north: 6.0021,
  west: 6.8782,
  east: 6.8833,
};

export function isInsideCampus(lat: number, lng: number): boolean {
  return (
    lat >= CAMPUS_BOUNDS.south &&
    lat <= CAMPUS_BOUNDS.north &&
    lng >= CAMPUS_BOUNDS.west &&
    lng <= CAMPUS_BOUNDS.east
  );
}
