export type TravelMode = "walk" | "car";

const EARTH_RADIUS_METERS = 6_371_000;

export function distanceBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(b.lat - a.lat);
  const longitudeDelta = radians(b.lng - a.lng);
  const latitudeA = radians(a.lat);
  const latitudeB = radians(b.lat);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) *
      Math.cos(latitudeB) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

export function routeDistanceMeters(points: [number, number][]): number {
  return points.slice(1).reduce((total, point, index) => {
    const previous = points[index];
    return (
      total +
      distanceBetween(
        { lat: previous[0], lng: previous[1] },
        { lat: point[0], lng: point[1] },
      )
    );
  }, 0);
}

export function remainingRouteDistanceMeters(
  position: { lat: number; lng: number },
  points: [number, number][],
): number {
  if (points.length < 2) return 0;

  let totalMeters = 0;
  let bestDistance = Infinity;
  let bestProgress = 0;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;

  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const latitudeScale =
      Math.cos(radians((start[0] + end[0] + position.lat) / 3)) *
      EARTH_RADIUS_METERS *
      (Math.PI / 180);
    const meterPoint = (lat: number, lng: number) => ({
      x: lng * latitudeScale,
      y: lat * EARTH_RADIUS_METERS * (Math.PI / 180),
    });
    const startMeters = meterPoint(start[0], start[1]);
    const endMeters = meterPoint(end[0], end[1]);
    const positionMeters = meterPoint(position.lat, position.lng);
    const segmentX = endMeters.x - startMeters.x;
    const segmentY = endMeters.y - startMeters.y;
    const segmentLengthSquared = segmentX ** 2 + segmentY ** 2;
    const progressOnSegment =
      segmentLengthSquared === 0
        ? 0
        : Math.max(
            0,
            Math.min(
              1,
              ((positionMeters.x - startMeters.x) * segmentX +
                (positionMeters.y - startMeters.y) * segmentY) /
                segmentLengthSquared,
            ),
          );
    const closestX = startMeters.x + progressOnSegment * segmentX;
    const closestY = startMeters.y + progressOnSegment * segmentY;
    const distanceToSegment = Math.hypot(
      positionMeters.x - closestX,
      positionMeters.y - closestY,
    );
    const segmentMeters = distanceBetween(
      { lat: start[0], lng: start[1] },
      { lat: end[0], lng: end[1] },
    );

    if (distanceToSegment < bestDistance) {
      bestDistance = distanceToSegment;
      bestProgress = totalMeters + segmentMeters * progressOnSegment;
    }
    totalMeters += segmentMeters;
  }

  return Math.max(0, totalMeters - bestProgress);
}

export function formatDistance(meters: number): string {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}

export function estimateTravelTime(
  meters: number,
  mode: TravelMode,
): string {
  const minutes = estimateTravelMinutes(meters, mode);
  return `${minutes} min ${mode === "walk" ? "walk" : "drive"}`;
}

export function estimateTravelMinutes(
  meters: number,
  mode: TravelMode,
): number {
  const speedMetersPerSecond = mode === "walk" ? 1.4 : 2.8;
  return Math.max(1, Math.ceil(meters / speedMetersPerSecond / 60));
}
