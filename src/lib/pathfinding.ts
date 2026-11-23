// lib/pathfinding.ts
import { edges, nodes } from "../data/graph";

/**
 * Approximate distance in metres between two lat/lng points.
 * Good enough for campus-scale routing weights.
 */
function haversineMetres(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}
/** Adjacency list: nodeId -> list of neighbour nodeIds */
function buildAdjacency(): Record<string, string[]> {
  const adj: Record<string, string[]> = {};

  const add = (from: string, to: string) => {
    if (!adj[from]) adj[from] = [];
    adj[from].push(to);
  };

  for (const [a, b] of edges) {
    // Undirected: walk either way
    add(a, b);
    add(b, a);
  }

  return adj;
}

const ADJ = buildAdjacency();
/**
 * Shortest path as node ids from `startId` to `endId`.
 * Returns [] if start/end missing or no path exists.
 */
export function findShortestPath(startId: string, endId: string): string[] {
  if (!nodes[startId] || !nodes[endId]) return [];
  if (startId === endId) return [startId];

  // Cost from start to each node (metres). Unknown = Infinity.
  const dist: Record<string, number> = {};
  // Previous node on the best path (to reconstruct the route)
  const prev: Record<string, string | null> = {};
  // Nodes still to process
  const open = new Set<string>();

  for (const id of Object.keys(nodes)) {
    dist[id] = Infinity;
    prev[id] = null;
    open.add(id);
  }
  dist[startId] = 0;
  while (open.size > 0) {
    // Pick unsettled node with smallest dist (classic Dijkstra step)
    let u: string | null = null;
    let best = Infinity;
    for (const id of open) {
      if (dist[id] < best) {
        best = dist[id];
        u = id;
      }
    }
    if (u === null || best === Infinity) break;
    open.delete(u);

    if (u === endId) break; // done early — reached destination

    const neighbours = ADJ[u] ?? [];
    for (const v of neighbours) {
      if (!open.has(v)) continue;
      if (!nodes[u] || !nodes[v]) continue;

      const weight = haversineMetres(nodes[u], nodes[v]);
      const alt = dist[u] + weight;

      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
      }
    }
  }
  // Reconstruct path end -> start, then reverse
  if (dist[endId] === Infinity) return [];

  const path: string[] = [];
  let cur: string | null = endId;
  while (cur) {
    path.push(cur);
    cur = prev[cur];
  }
  path.reverse();

  if (path[0] !== startId) return [];
  return path;
}
/**
 * Nearest graph node to a free lat/lng (e.g. GPS or a place without nodeId).
 */
export function nearestNodeId(lat: number, lng: number): string {
  let bestId = "";
  let best = Infinity;

  for (const [id, n] of Object.entries(nodes)) {
    const d = haversineMetres(n, { lat, lng });
    if (d < best) {
      best = d;
      bestId = id;
    }
  }
  return bestId;
}
