import { places } from "../data/places";
import { distanceBetween, formatDistance } from "./eta";
import { getPlaceCoords } from "./searchPlaces";

export type DirectionStep = {
  instruction: string;
  subtitle?: string;
  maneuver: "straight" | "left" | "right" | "arrive";
  distanceMeters: number;
  startIndex: number;
  endIndex: number;
};

function bearingDegrees(
  from: [number, number],
  to: [number, number],
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitude1 = radians(from[0]);
  const latitude2 = radians(to[0]);
  const longitudeDelta = radians(to[1] - from[1]);
  const y = Math.sin(longitudeDelta) * Math.cos(latitude2);
  const x =
    Math.cos(latitude1) * Math.sin(latitude2) -
    Math.sin(latitude1) * Math.cos(latitude2) * Math.cos(longitudeDelta);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function turnAngle(previous: number, next: number): number {
  return ((next - previous + 540) % 360) - 180;
}

function nearbyPlaceName(
  point: [number, number],
  destinationName: string,
): string | undefined {
  let closestName: string | undefined;
  let closestDistance = 15;

  for (const place of places) {
    if (place.name === destinationName) continue;
    const coords = getPlaceCoords(place);
    if (!coords) continue;
    const distance = distanceBetween(
      { lat: point[0], lng: point[1] },
      coords,
    );
    if (distance < closestDistance) {
      closestDistance = distance;
      closestName = place.name;
    }
  }

  return closestName;
}

export function buildDirectionSteps(
  points: [number, number][],
  destinationName: string,
): DirectionStep[] {
  const route: [number, number][] = [];
  const routePointIndices: number[] = [];
  for (const [index, point] of points.entries()) {
    const previous = route[route.length - 1];
    if (
      !previous ||
      distanceBetween(
        { lat: previous[0], lng: previous[1] },
        { lat: point[0], lng: point[1] },
      ) >= 2
    ) {
      route.push(point);
      routePointIndices.push(index);
    }
  }

  if (route.length < 2) {
    return [
      {
        instruction: `You’ve arrived at ${destinationName}`,
        maneuver: "arrive",
        distanceMeters: 0,
        startIndex: 0,
        endIndex: Math.max(points.length - 1, 0),
      },
    ];
  }

  const steps: DirectionStep[] = [];
  let currentDistance = 0;
  let currentStartIndex = routePointIndices[0];
  let currentManeuver: DirectionStep["maneuver"] = "straight";
  let currentLandmark: string | undefined;
  let previousBearing = bearingDegrees(route[0], route[1]);

  const appendStep = (endIndex: number) => {
    if (currentDistance < 1) return;
    const instruction =
      currentManeuver === "straight"
        ? `Continue on this road for ${formatDistance(currentDistance)}`
        : `Turn ${currentManeuver} and continue for ${formatDistance(currentDistance)}`;
    steps.push({
      instruction,
      ...(currentLandmark ? { subtitle: `Pass by ${currentLandmark}` } : {}),
      maneuver: currentManeuver,
      distanceMeters: currentDistance,
      startIndex: currentStartIndex,
      endIndex,
    });
  };

  for (let index = 0; index < route.length - 1; index += 1) {
    const segmentDistance = distanceBetween(
      { lat: route[index][0], lng: route[index][1] },
      { lat: route[index + 1][0], lng: route[index + 1][1] },
    );
    currentDistance += segmentDistance;

    if (index >= route.length - 2) continue;

    const nextBearing = bearingDegrees(route[index + 1], route[index + 2]);
    const angle = turnAngle(previousBearing, nextBearing);
    previousBearing = nextBearing;

    if (Math.abs(angle) < 40 || currentDistance < 8) continue;

    currentLandmark = nearbyPlaceName(route[index + 1], destinationName);
    appendStep(routePointIndices[index + 1]);
    currentStartIndex = routePointIndices[index + 1];
    currentManeuver = angle > 0 ? "right" : "left";
    currentDistance = 0;
    currentLandmark = undefined;
  }

  appendStep(routePointIndices[routePointIndices.length - 1]);
  steps.push({
    instruction: `You’ve arrived at ${destinationName}`,
    maneuver: "arrive",
    distanceMeters: 0,
    startIndex: Math.max(points.length - 1, 0),
    endIndex: Math.max(points.length - 1, 0),
  });
  return steps;
}

export function directionStepAtProgress(
  steps: DirectionStep[],
  progressMeters: number,
): number {
  let distanceThroughRoute = 0;
  for (let index = 0; index < steps.length; index += 1) {
    if (steps[index].maneuver === "arrive") return index;
    distanceThroughRoute += steps[index].distanceMeters;
    if (progressMeters < distanceThroughRoute) return index;
  }
  return Math.max(0, steps.length - 1);
}
