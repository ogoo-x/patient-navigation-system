// // src/lib/routePoints.ts
// import { findShortestPath, nodes } from "./pathfinding";

// export function routePointsBetween(
//   fromId: string,
//   toId: string,
// ): [number, number][] {
//   const path = findShortestPath(fromId, toId);
//   return path
//     .map((id) => nodes[id])
//     .filter(Boolean)
//     .map((n) => [n.lat, n.lng] as [number, number]);
// }
