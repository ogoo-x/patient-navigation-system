export const BIRD_AVATARS = [
  {
    id: "woodpecker",
    label: "Woodpecker",
    emoji: "🐦",
    fact: "Woodpeckers use their strong bills to find insects in trees.",
    africaOdds: 45,
  },
  {
    id: "eagle",
    label: "Eagle",
    emoji: "🦅",
    fact: "Eagles are powerful birds of prey found in many regions.",
    africaOdds: 38,
  },
  {
    id: "parrot",
    label: "Parrot",
    emoji: "🦜",
    fact: "Many parrot species live in Africa's forests and savannas.",
    africaOdds: 82,
  },
  {
    id: "hummingbird",
    label: "Hummingbird",
    emoji: "🕊️",
    fact: "Hummingbirds are native to the Americas, not Africa.",
    africaOdds: 8,
  },
  {
    id: "owl",
    label: "Owl",
    emoji: "🦉",
    fact: "Owls live in habitats across Africa, from woodland to desert.",
    africaOdds: 57,
  },
  {
    id: "bat",
    label: "Bat",
    emoji: "🦇",
    fact: "Bats are mammals, and many African species help pollinate plants.",
    africaOdds: 63,
  },
] as const;

export type BirdAvatarId = (typeof BIRD_AVATARS)[number]["id"];

export function getBirdEmoji(id: string | null | undefined): string {
  if (id === "macaw") return "🦜";
  return BIRD_AVATARS.find((bird) => bird.id === id)?.emoji ?? "🐦";
}
