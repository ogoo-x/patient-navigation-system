// lib/routePoints.ts
import { nodes } from "../data/graph";
import { findShortestPath, nearestNodeId } from "./pathfinding";

/**
 * Convert an ordered list of node ids into [[lat, lng], ...].
 * Skips unknown ids.
 */
export function pathToLatLng(pathIds: string[]): [number, number][] {
  const points: [number, number][] = [];

  for (const id of pathIds) {
    const n = nodes[id];
    if (!n) continue;
    points.push([n.lat, n.lng]);
  }

  return points;
}
/**
 * Full pipeline: start node id + end node id → route coordinates.
 */
export function routePointsBetween(
  fromId: string,
  toId: string,
): [number, number][] {
  const path = findShortestPath(fromId, toId);
  if (path.length < 2) return [];
  return pathToLatLng(path);
}
/**
 * Route between two geographic points by snapping each to the nearest node.
 * Useful for GPS → place when you only have lat/lng.
 */
export function routePointsFromCoords(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): [number, number][] {
  const fromId = nearestNodeId(fromLat, fromLng);
  const toId = nearestNodeId(toLat, toLng);
  if (!fromId || !toId) return [];
  return routePointsBetween(fromId, toId);
}
