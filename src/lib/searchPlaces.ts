// src/lib/searchPlaces.ts
import { places, type Place } from "../data/places";

function norm(s: string) {
  return s.toLowerCase().trim();
}

export function searchPlaces(q: string): Place[] {
  const query = norm(q);

  if (!query) {
    return places.filter((p) => p.popular);
  }

  const scored = places
    .map((p) => {
      const name = norm(p.name);
      const building = norm(p.building || "");
      const aliases = (p.aliases || []).map(norm);
      const words = name.split(/\s+/);

      let score = 0;
      if (name.startsWith(query)) score = 100;
      else if (words.some((w) => w.startsWith(query))) score = 80;
      else if (name.includes(query) || aliases.some((a) => a.includes(query)))
        score = 60;
      else if (building.includes(query)) score = 40;
      else return null;

      if (p.popular) score += 5;
      return { place: p, score };
    })
    .filter(Boolean) as { place: Place; score: number }[];

  scored.sort(
    (a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name),
  );

  return scored.map((s) => s.place);
}

export function getPlaceById(id: string): Place | undefined {
  return places.find((p) => p.id === id);
}
