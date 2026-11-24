# Code review

This review covers the app source, routing, map implementations, shared data and
storage utilities, styling, project configuration, and the existing Supabase
schema. Generated output, dependency caches, environment files, and
`supabase/functions` were not inspected.

## Functionality

- [`src/app/index.web.tsx`](./src/app/index.web.tsx) — The landing page copy and
  feature content are hard-coded to NAUTH, and the page offers no routes to
  learn about other campuses. Keep the product description generic and make
  the current campus information explicit but non-exclusive.
- [`src/app/onboarding.tsx`](./src/app/onboarding.tsx) — Onboarding also
  describes the product as being specifically for NAUTH. Keep campus-specific
  claims in campus data/content rather than shared product messaging.
- [`src/lib/pathfinding.ts`](./src/lib/pathfinding.ts) and
  [`src/data/graph.ts`](./src/data/graph.ts) — Pathfinding uses straight-line
  distances between hand-authored nodes and an undirected graph. Validate each
  campus graph against actual accessible routes and maintain a mapping from
  route steps to graph segments.
- [`src/lib/directions.ts`](./src/lib/directions.ts) — Maneuvers are inferred
  from coordinate bearings and nearby place pins, not surveyed street names or
  landmarks. Store verified route descriptions and segment ranges with route
  data before presenting instructions as turn-by-turn guidance.
- [`src/app/(tabs)/map/index.tsx`](./src/app/(tabs)/map/index.tsx) — Live
  navigation updates the location marker and step index but does not detect
  meaningful off-route movement or calculate a replacement route. Add
  route-progress matching and an explicit off-route/re-route state.
- [`src/app/(tabs)/map/index.tsx`](./src/app/(tabs)/map/index.tsx) and
  [`src/components/CampusMapWebView.web.tsx`](./src/components/CampusMapWebView.web.tsx)
  — The web map is a Leaflet document embedded in an iframe, not `react-leaflet`.
  Route/map behavior is bridged through messages; keep the two map adapters'
  capabilities and message shapes in sync.
- [`src/lib/visitStore.ts`](./src/lib/visitStore.ts) and
  [`src/lib/savedPlacesStore.ts`](./src/lib/savedPlacesStore.ts) — Visit and
  saved-place records are stored in per-user/device AsyncStorage, not synced
  through Supabase. Add backend tables and migration/RLS policies if users
  should see the same records across devices.
- [`src/app/(tabs)/profile/settings.tsx`](./src/app/(tabs)/profile/settings.tsx)
  — The notification preferences are persisted, but the UI correctly notes
  that push delivery is not implemented. Connect them to a notification
  delivery feature before representing them as active alerts.
- [`src/app/(tabs)/map/search.tsx`](./src/app/(tabs)/map/search.tsx) and
  [`src/lib/searchPlaces.ts`](./src/lib/searchPlaces.ts) — Search only returns
  places with resolvable coordinates on the map screen; unlocated services
  are therefore undiscoverable there. Add a clear “location not mapped” state
  or complete and verify the missing place coordinates.
- [`src/lib/locationStore.ts`](./src/lib/locationStore.ts) — Corrupt saved
  location JSON is silently treated as no location. Report malformed storage
  through the app's normal diagnostics/error path rather than masking it.

## Design/UX

- [`src/app/index.web.tsx`](./src/app/index.web.tsx) — The page is a
  single-screen hero with no lower-page content, shared footer, or product
  information routes. Build a scrollable landing page and real supporting
  routes.
- [`src/app/(tabs)/map/index.tsx`](./src/app/(tabs)/map/index.tsx) — Several
  map overlays use fixed top offsets and different card treatments on desktop
  and mobile. Centralize responsive sheet placement, safe-area spacing, and
  surface styles so route, search, arrival, and place cards remain legible
  across viewport sizes.
- [`src/app/(tabs)/map/index.tsx`](./src/app/(tabs)/map/index.tsx) — The route
  summary does not distinguish an estimated route from a verified path, and
  its desktop placement competes with map controls. Clarify the estimate and
  reserve space around map controls.
- [`src/app/(tabs)/profile/visitHistory.tsx`](./src/app/(tabs)/profile/visitHistory.tsx),
  [`src/app/(tabs)/profile/tripSummary.tsx`](./src/app/(tabs)/profile/tripSummary.tsx),
  [`src/app/(tabs)/profile/savedPlaces.tsx`](./src/app/(tabs)/profile/savedPlaces.tsx),
  and [`src/app/(tabs)/profile/settings.tsx`](./src/app/(tabs)/profile/settings.tsx)
  — These nested profile screens hide stack headers and have no in-page back
  control. Add a consistent back/home affordance for web and touch users.
- [`src/app/onboarding.tsx`](./src/app/onboarding.tsx) — The horizontal
  onboarding flow has no explicit skip action. Let returning or time-pressed
  users enter the map directly.
- [`README.md`](./README.md) — The README still describes the default
  create-expo-app starter rather than the current app, its configuration, and
  development commands. Replace it with project-specific setup and feature
  notes.

## Accessibility

- [`src/app/(tabs)/map/index.tsx`](./src/app/(tabs)/map/index.tsx) —
  Icon-only controls for closing live guidance and rating route feedback lack
  accessible names and selection state. Provide explicit labels and state for
  each control.
- [`src/app/index.web.tsx`](./src/app/index.web.tsx) — The hero and header
  buttons rely on visible text but have no explicit hover/focus treatment.
  Preserve visible keyboard focus as hover effects are added.
- [`src/app/(tabs)/profile/index.tsx`](./src/app/(tabs)/profile/index.tsx) —
  The profile avatar image has no descriptive accessibility label. Name it as
  the current user's avatar, and use decorative semantics for purely visual
  icons elsewhere.
- [`src/components/SheetHandle.tsx`](./src/components/SheetHandle.tsx) — The
  drag handle is exposed as a button but has no keyboard-operable dismissal
  action on web. Add a labeled close control or equivalent keyboard action.
- [`src/app/(tabs)/map/index.tsx`](./src/app/(tabs)/map/index.tsx) — Place
  names are rendered inside Leaflet marker HTML. Ensure generated labels remain
  escaped and marker controls receive accessible names and keyboard behavior.
- [`src/app/login.tsx`](./src/app/login.tsx) — Validation and server errors are
  rendered as ordinary text. Announce them to assistive technology and move
  focus to the error or invalid field when appropriate.

## Performance

- [`assets/places/`](./assets/places) — Most place images are multi-megabyte
  PNGs. Resize and compress these images to appropriate card dimensions and
  formats while retaining acceptable visual quality.
- [`src/components/CampusMapWebView.tsx`](./src/components/CampusMapWebView.tsx)
  and [`src/components/CampusMapWebView.web.tsx`](./src/components/CampusMapWebView.web.tsx)
  — Each map adapter embeds and initializes Leaflet, and place updates remove
  and rebuild every marker. Avoid unnecessary redraws and consider a shared
  map implementation once platform requirements are settled.
- [`src/app/(tabs)/map/index.tsx`](./src/app/(tabs)/map/index.tsx) — The map
  screen owns routing, location subscriptions, place search, overlays, profile
  persistence, and history recording in one component. Extracting focused
  hooks/components would reduce rerender and lifecycle complexity.
- [`src/lib/pathfinding.ts`](./src/lib/pathfinding.ts) — The current
  O(V²) Dijkstra implementation is appropriate for the small campus graph.
  If the graph grows substantially, use a priority queue and measure before
  changing it.
- [`src/app/onboarding.tsx`](./src/app/onboarding.tsx) — Several animated
  values and all slides remain mounted in a horizontally scrolling view.
  Profile actual devices before adding more animation or expanding slide
  content.
- [`src/data/places.ts`](./src/data/places.ts) — Place search rescans and
  rescoring every entry on each query change. This is currently a small data
  set; index it only if the catalog grows enough for profiling to show a cost.

## Code quality

- [`src/components/CampusMapWebView.tsx`](./src/components/CampusMapWebView.tsx)
  and [`src/components/CampusMapWebView.web.tsx`](./src/components/CampusMapWebView.web.tsx)
  — The native WebView and web iframe adapters duplicate substantial inline
  Leaflet logic and can drift. Share typed commands and common map behavior or
  add contract tests for both adapters.
- [`src/app/(tabs)/map/index.tsx`](./src/app/(tabs)/map/index.tsx) — This
  screen is very large and mixes UI with location, routing, and storage
  lifecycles. Extract independently testable navigation and overlay units.
- [`src/lib/visitStore.ts`](./src/lib/visitStore.ts) and
  [`src/lib/notificationSettingsStore.ts`](./src/lib/notificationSettingsStore.ts)
  — Persisted JSON is cast or merged without validating each field. Validate
  records at the storage boundary and surface invalid data.
- [`src/lib/locationStore.ts`](./src/lib/locationStore.ts) — Its storage
  parse failure is swallowed, unlike other stores that reject malformed data.
  Use one consistent validation/error policy.
- [`src/hooks/use-theme.ts`](./src/hooks/use-theme.ts) — The color-scheme
  value is assigned but unused; the hook always returns the light palette.
  Remove the unused variable until theme switching is supported, or implement
  the intended scheme.
- [`src/hooks/use-color-scheme.web.ts`](./src/hooks/use-color-scheme.web.ts)
  — The hydration effect synchronously sets state and currently fails the
  configured React hooks lint rule. Rework hydration using a server-safe
  external snapshot or document and narrowly configure an intentional
  exception.
- [`README.md`](./README.md) and [`package.json`](./package.json) — The README
  recommends `npm install` despite the repository having a pnpm lockfile and
  workspace configuration. Document the package manager actually used.
