import type { CSSProperties } from "react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";

export type CampusMapHandle = {
  setLocation: (lat: number, lng: number, center?: boolean) => void;
  setOrigin: (lat: number, lng: number, name?: string) => void;
  resetNorth: () => void;
  setPlaces: (
    places: {
      lat: number;
      lng: number;
      name?: string;
      category?: string;
      id?: string;
    }[],
  ) => void;
  clearPlaceSelection: () => void;
  setDestination: (lat: number, lng: number, name?: string) => void;
  drawRoute: (points: [number, number][]) => void;
  highlightRouteSegment: (
    points: [number, number][],
    startIndex: number,
    endIndex: number,
  ) => void;
  clearRouteHighlight: () => void;
  clearRoute: () => void;
};

type Props = {
  initialCenter?: { lat: number; lng: number };
  onMapReady?: () => void;
  onPlaceTap?: (id: string, name?: string) => void;
  onPlaceDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
};

type MapMessage = {
  type: string;
  id?: unknown;
  name?: unknown;
};

const DEFAULT_CENTER = { lat: 5.999, lng: 6.881 };

const createMapDocument = (center: {
  lat: number;
  lng: number;
}) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { width: 100%; height: 100%; margin: 0; }
    </style>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet-rotate@0.5.4/dist/leaflet-rotate.js"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const map = L.map("map", {
        zoomControl: false,
        rotate: true,
        touchRotate: true,
        rotateControl: false
      }).setView([${center.lat}, ${center.lng}], 17);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap"
      }).addTo(map);

      let userMarker = null;
      let originMarker = null;
      let destinationMarker = null;
      let routeLine = null;
      let selectedRouteLine = null;
      let maneuverMarker = null;
      let selectedPlaceId = null;
      let places = [];
      const placeMarkers = [];

      function sendToApp(message) {
        window.parent.postMessage(message, "*");
      }

      function iconForCategory(category) {
        switch (category) {
          case "emergency":
            return '<path d="M12 3h8v9h9v8h-9v9h-8v-9H3v-8h9z"/>';
          case "clinic":
            return '<path d="M5 28V6h22v22M11 12h3m4 0h3m-10 5h3m4 0h3M12 28v-6h8v6"/>';
          case "ward":
            return '<path d="M5 26V9h3v7h16v-5h3v15h-3v-6H8v6z"/><path d="M10 15v-4h5a4 4 0 0 1 4 4z"/>';
          case "diagnostics":
            return '<path d="M11 4h10M14 4v9L7 25a2 2 0 0 0 2 3h14a2 2 0 0 0 2-3l-7-12V4M11 21h12"/>';
          case "mother-child":
            return '<circle cx="12" cy="10" r="4"/><circle cx="22" cy="13" r="3"/><path d="M4 27v-3a8 8 0 0 1 16 0v3M19 20a6 6 0 0 1 9 5v2h-7"/>';
          case "gate":
            return '<path d="M5 28V11a11 11 0 0 1 22 0v17M10 28V12a6 6 0 0 1 12 0v16M3 28h26"/>';
          case "theatre":
            return '<path d="m7 25 14-14m-8 16 4-4m-3-15 2-2a3 3 0 0 1 4 4l-2 2m4 4 2-2a3 3 0 0 1 4 4l-2 2"/>';
          default:
            return '<path d="M5 28V6h22v22M11 12h3m4 0h3m-10 5h3m4 0h3M12 28v-6h8v6"/>';
        }
      }

      function pinHtml(color) {
        return '<svg viewBox="0 0 32 40" width="32" height="40" aria-hidden="true">' +
          '<path d="M16 1C7.8 1 1.5 7.3 1.5 15.2c0 10.1 14.5 23.3 14.5 23.3s14.5-13.2 14.5-23.3C30.5 7.3 24.2 1 16 1z" fill="' +
          color + '" stroke="#111827" stroke-width="2"/>' +
          '<circle cx="16" cy="15" r="5" fill="#ffffff" stroke="#111827" stroke-width="1.5"/></svg>';
      }

      function locationIcon(color) {
        return L.divIcon({
          className: "",
          html: pinHtml(color),
          iconSize: [32, 40],
          iconAnchor: [16, 38]
        });
      }

      function markerHtml(place, selected) {
        const svg = '<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" fill="#F4CD32" stroke="#111827" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
          iconForCategory(place.category) + '</svg>';
        const icon = selected ? pinHtml("#F4CD32") : svg;
        const label = String(place.name || "").replace(/[&<>"']/g, function (char) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
        });
        return '<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-3px);">' +
          '<div style="filter:drop-shadow(0 1px 1px rgba(0,0,0,.24));' +
          (selected ? 'transform:scale(1.15);' : '') + '">' + icon + '</div>' +
          '<div style="margin-top:2px;max-width:110px;text-align:center;font-size:10px;line-height:12px;font-weight:700;color:#111827;text-shadow:-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff;">' +
          label + '</div></div>';
      }

      function clearPlaces() {
        placeMarkers.forEach(function (marker) { map.removeLayer(marker); });
        placeMarkers.length = 0;
      }

      function setPlaces(nextPlaces) {
        places = Array.isArray(nextPlaces) ? nextPlaces : [];
        clearPlaces();
        places.forEach(function (place) {
          if (typeof place.lat !== "number" || typeof place.lng !== "number") return;
          const selected = selectedPlaceId === place.id;
          const marker = L.marker([place.lat, place.lng], {
            icon: L.divIcon({
              className: "",
              html: markerHtml(place, selected),
              iconSize: [112, 52],
              iconAnchor: [56, 32]
            })
          }).addTo(map);
          marker.on("click", function () {
            selectedPlaceId = place.id || null;
            setPlaces(places);
            sendToApp({ type: "placeTap", id: place.id, name: place.name });
          });
          placeMarkers.push(marker);
        });
      }

      function clearPlaceSelection() {
        if (!selectedPlaceId) return;
        selectedPlaceId = null;
        setPlaces(places);
      }

      function setLocation(lat, lng, center) {
        if (userMarker) {
          userMarker.setLatLng([lat, lng]);
        } else {
          userMarker = L.circleMarker([lat, lng], {
            radius: 8,
            color: "#187FF6",
            fillColor: "#187FF6",
            fillOpacity: 0.9,
            weight: 2
          }).addTo(map);
        }
        if (center !== false) map.panTo([lat, lng]);
      }

      function setOrigin(lat, lng, name) {
        if (originMarker) map.removeLayer(originMarker);
        originMarker = L.marker([lat, lng], {
          icon: locationIcon("#22C55E")
        }).addTo(map);
        if (name) originMarker.bindTooltip(name);
        map.panTo([lat, lng]);
      }

      function resetNorth() {
        if (typeof map.resetNorth === "function") map.resetNorth();
        else if (typeof map.setBearing === "function") map.setBearing(0);
      }

      function clearRoute() {
        if (routeLine) map.removeLayer(routeLine);
        clearRouteHighlight();
        if (destinationMarker) map.removeLayer(destinationMarker);
        routeLine = null;
        destinationMarker = null;
      }

      function clearRouteHighlight() {
        if (selectedRouteLine) map.removeLayer(selectedRouteLine);
        if (maneuverMarker) map.removeLayer(maneuverMarker);
        selectedRouteLine = null;
        maneuverMarker = null;
      }

      function highlightRouteSegment(points, startIndex, endIndex) {
        clearRouteHighlight();
        if (!Array.isArray(points) || points.length < 2) return;
        const start = Math.max(0, Math.min(startIndex, points.length - 1));
        const end = Math.max(start, Math.min(endIndex, points.length - 1));
        const segment = points.slice(start, end + 1);
        if (!segment.length) return;
        if (segment.length > 1) {
          selectedRouteLine = L.polyline(segment, {
            color: "#EFC718",
            weight: 9,
            opacity: 1
          }).addTo(map);
          map.fitBounds(selectedRouteLine.getBounds(), { padding: [48, 48] });
        } else {
          map.setView(segment[0], Math.max(map.getZoom(), 18));
        }
        maneuverMarker = L.circleMarker(segment[0], {
          radius: 8,
          color: "#111827",
          weight: 2,
          fillColor: "#EFC718",
          fillOpacity: 1
        }).addTo(map);
      }

      function drawRoute(points) {
        clearRoute();
        if (!Array.isArray(points) || points.length < 2) return;
        routeLine = L.polyline(points, { color: "#EF4444", weight: 5, opacity: 0.9 }).addTo(map);
        const end = points[points.length - 1];
        destinationMarker = L.marker(end, {
          icon: locationIcon("#F4CD32")
        }).addTo(map);
        map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
      }

      function setDestination(lat, lng, name) {
        if (destinationMarker) map.removeLayer(destinationMarker);
        destinationMarker = L.marker([lat, lng], {
          icon: locationIcon("#F4CD32")
        }).addTo(map);
        if (name) {
          const label = document.createElement("span");
          label.textContent = name;
          destinationMarker.bindPopup(label).openPopup();
        }
      }

      window.addEventListener("message", function (event) {
        if (event.source !== window.parent || !event.data || typeof event.data !== "object") return;
        const message = event.data;
        switch (message.type) {
          case "setLocation": setLocation(message.lat, message.lng, message.center); break;
          case "setOrigin": setOrigin(message.lat, message.lng, message.name); break;
          case "resetNorth": resetNorth(); break;
          case "setPlaces": setPlaces(message.places); break;
          case "clearPlaceSelection": clearPlaceSelection(); break;
          case "setDestination": setDestination(message.lat, message.lng, message.name); break;
          case "drawRoute": drawRoute(message.points); break;
          case "highlightRouteSegment": highlightRouteSegment(message.points, message.startIndex, message.endIndex); break;
          case "clearRouteHighlight": clearRouteHighlight(); break;
          case "clearRoute": clearRoute(); break;
        }
      });

      map.on("click", function () {
        if (!selectedPlaceId) return;
        clearPlaceSelection();
        sendToApp({ type: "placeDismiss" });
      });
      sendToApp({ type: "ready" });
    </script>
  </body>
</html>`;

const CampusMapWebView = forwardRef<CampusMapHandle, Props>(
  function CampusMapWebView(
    {
      initialCenter = DEFAULT_CENTER,
      onMapReady,
      onPlaceTap,
      onPlaceDismiss,
      style,
    },
    ref,
  ) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const post = useCallback((message: object) => {
      iframeRef.current?.contentWindow?.postMessage(message, "*");
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        setLocation: (lat, lng, center) =>
          post({ type: "setLocation", lat, lng, center }),
        setOrigin: (lat, lng, name) =>
          post({ type: "setOrigin", lat, lng, name }),
        resetNorth: () => post({ type: "resetNorth" }),
        setPlaces: (places) => post({ type: "setPlaces", places }),
        clearPlaceSelection: () => post({ type: "clearPlaceSelection" }),
        setDestination: (lat, lng, name) =>
          post({ type: "setDestination", lat, lng, name }),
        drawRoute: (points) => post({ type: "drawRoute", points }),
        highlightRouteSegment: (points, startIndex, endIndex) =>
          post({ type: "highlightRouteSegment", points, startIndex, endIndex }),
        clearRouteHighlight: () => post({ type: "clearRouteHighlight" }),
        clearRoute: () => post({ type: "clearRoute" }),
      }),
      [post],
    );

    useLayoutEffect(() => {
      const handleMessage = (event: MessageEvent<MapMessage>) => {
        if (event.source !== iframeRef.current?.contentWindow) return;
        const message = event.data;
        if (!message || typeof message.type !== "string") return;
        if (message.type === "ready") onMapReady?.();
        if (message.type === "placeTap" && typeof message.id === "string") {
          onPlaceTap?.(
            message.id,
            typeof message.name === "string" ? message.name : undefined,
          );
        }
        if (message.type === "placeDismiss") onPlaceDismiss?.();
      };

      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }, [onMapReady, onPlaceDismiss, onPlaceTap]);

    return (
      <View style={[styles.container, style]}>
        <iframe
          ref={iframeRef}
          title="NAUTH campus map"
          srcDoc={createMapDocument(initialCenter)}
          style={frameStyle}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
});

const frameStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: "100%",
  height: "100%",
  border: 0,
};

export default CampusMapWebView;
