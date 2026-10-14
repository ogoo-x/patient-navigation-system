// src/components/CampusMapWebView.tsx
import { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

export type CampusMapHandle = {
  setLocation: (lat: number, lng: number) => void;
  setPlaces: (places: { lat: number; lng: number; name?: string }[]) => void;
  setDestination: (lat: number, lng: number, name?: string) => void;
  drawRoute: (points: [number, number][]) => void;
  clearRoute: () => void;
};

type Props = {
  initialCenter?: { lat: number; lng: number };
  onMapReady?: () => void;
  onPlaceTap?: (id: string, name?: string) => void;
};

// NAUTH Akamili approx center (adjust when you have exact campus bounds)
const DEFAULT_CENTER = { lat: 5.999, lng: 6.881 };

const html = (center: { lat: number; lng: number }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: false }).setView([${center.lat}, ${center.lng}], 17);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    let userMarker = null;
    let routeLine = null;
    let destMarker = null;
    let placeMarkers = [];

    function setLocation(lat, lng) {
      if (userMarker) {
        userMarker.setLatLng([lat, lng]);
      } else {
        userMarker = L.circleMarker([lat, lng], {
          radius: 10,
          color: '#187FF6',
          fillColor: '#187FF6',
          fillOpacity: 0.9,
          weight: 3
        }).addTo(map);
      }
      map.panTo([lat, lng]);
    }

    function drawRoute(points) {
      if (routeLine) map.removeLayer(routeLine);
      if (destMarker) map.removeLayer(destMarker);
      if (!points || points.length < 2) return;

      routeLine = L.polyline(points, {
        color: '#EF4444',
        weight: 5,
        opacity: 0.9
      }).addTo(map);

      const last = points[points.length - 1];
      destMarker = L.circleMarker(last, {
        radius: 9,
        color: '#16A34A',
        fillColor: '#22C55E',
        fillOpacity: 1,
        weight: 2
      }).addTo(map);

      map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
    }

    function clearRoute() {
      if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
      if (destMarker) { map.removeLayer(destMarker); destMarker = null; }
    }
    
        function clearPlaceMarkers() {
      placeMarkers.forEach(function (m) { map.removeLayer(m); });
      placeMarkers = [];
    }

    function colorForCategory(category) {
  switch (category) {
    case "emergency": return "#EF4444";
    case "clinic": return "#187FF6";
    case "ward": return "#7C3AED";
    case "diagnostics": return "#F59E0B";
    case "mother-child": return "#EC4899";
    case "theatre": return "#0F766E";
    case "gate": return "#6B7280";
    case "amenity": return "#187FF6";
    default: return "#187FF6";
  }
}

function setPlaces(places) {
  clearPlaceMarkers();
  if (!places || !places.length) return;
  places.forEach(function (p) {
    if (p.lat == null || p.lng == null) return;
    var color = colorForCategory(p.category);
    var m = L.circleMarker([p.lat, p.lng], {
      radius: 9,
      color: color,
      fillColor: color,
      fillOpacity: 0.9,
      weight: 2
    }).addTo(map);

    m.on("click", function () {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: "placeTap", id: p.id, name: p.name })
        );
      }
    });

    placeMarkers.push(m);
  });
}

    function setDestination(lat, lng, name) {
  if (destMarker) map.removeLayer(destMarker);
  destMarker = L.circleMarker([lat, lng], {
    radius: 11,
    color: "#EFC718",
    fillColor: "#EFC718",
    fillOpacity: 1,
    weight: 3
  }).addTo(map);
  if (name) destMarker.bindPopup(name).openPopup();
}

    function handleMessage(raw) {
      try {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (data.type === 'setLocation') setLocation(data.lat, data.lng);
        if (data.type === 'setPlaces') setPlaces(data.places);
        if (data.type === 'setDestination') setDestination(data.lat, data.lng, data.name);
        if (data.type === 'drawRoute') drawRoute(data.points);
        if (data.type === 'clearRoute') clearRoute();
      } catch (e) {}
    }

    // RN WebView
    document.addEventListener('message', function (e) { handleMessage(e.data); });
    // iOS
    window.addEventListener('message', function (e) { handleMessage(e.data); });

    // Tell RN the map is ready
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
    }
  </script>
</body>
</html>
`;

const CampusMapWebView = forwardRef<CampusMapHandle, Props>(
  function CampusMapWebView(
    { initialCenter = DEFAULT_CENTER, onMapReady, onPlaceTap },
    ref,
  ) {
    const webRef = useRef<WebView>(null);

    const post = (payload: object) => {
      const data = JSON.stringify(payload);
      webRef.current?.postMessage(data);
      // Android sometimes needs inject
      webRef.current?.injectJavaScript(
        `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(data)} })); true;`,
      );
    };

    useImperativeHandle(ref, () => ({
      setLocation: (lat, lng) => post({ type: "setLocation", lat, lng }),
      setPlaces: (places) => post({ type: "setPlaces", places }),
      setDestination: (lat, lng, name) =>
        post({ type: "setDestination", lat, lng, name }),
      drawRoute: (points) => post({ type: "drawRoute", points }),
      clearRoute: () => post({ type: "clearRoute" }),
    }));

    return (
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html: html(initialCenter) }}
        style={styles.map}
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data.type === "ready") onMapReady?.();
            if (data.type === "placeTap") onPlaceTap?.(data.id, data.name);
          } catch {}
        }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        allowFileAccess
      />
    );
  },
);

const styles = StyleSheet.create({
  map: { flex: 1, backgroundColor: "#F5F7FB" },
});

export default CampusMapWebView;
