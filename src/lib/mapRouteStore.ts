// lib/mapRouteStore.ts
export type PendingPick = {
  role: "origin" | "destination";
  placeId: string;
  name: string;
  lat: number;
  lng: number;
};

let pending: PendingPick | null = null;

export function setPendingPick(pick: PendingPick) {
  pending = pick;
}

export function consumePendingPick(): PendingPick | null {
  const value = pending;
  pending = null;
  return value;
}
