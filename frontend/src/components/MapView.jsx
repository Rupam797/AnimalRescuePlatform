import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, ExternalLink } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapView({ latitude, longitude, address, height = "220px", label = "Incident Location" }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  const lat = Number(latitude);
  const lng = Number(longitude);

  useEffect(() => {
    if (!containerRef.current || !lat || !lng) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup(`<b>${label}</b><br/>${address || `${lat}, ${lng}`}`).openPopup();

      mapRef.current = map;
    } else {
      mapRef.current.setView([lat, lng], 15);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, address, label]);

  if (!lat || !lng) {
    return (
      <div
        style={{
          height,
          background: "#f0f4f1",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#72887a",
          fontSize: "14px",
        }}
      >
        No GPS coordinates recorded
      </div>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height,
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #dce5df",
        }}
      />
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "#ffffff",
          color: "#1b7a43",
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "600",
          textDecoration: "none",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          zIndex: 999,
          border: "1px solid #d2e4d8",
        }}
      >
        <MapPin size={13} />
        <span>Open in Google Maps</span>
        <ExternalLink size={12} />
      </a>
    </div>
  );
}
