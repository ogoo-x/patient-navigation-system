// lib/mapRouteStore.ts
export type PendingPick =
  | {
      kind: "place";
      role: "origin" | "destination";
      placeId: string;
      name: string;
      lat: number;
      lng: number;
    }
  | { kind: "gps"; role: "origin" };

let pending: PendingPick | null = null;

export function setPendingPick(pick: PendingPick) {
  pending = pick;
}

export function setPendingMyLocation() {
  pending = { kind: "gps", role: "origin" };
}

export function consumePendingPick(): PendingPick | null {
  const value = pending;
  pending = null;
  return value;
}
