import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

// Fix for default marker icon in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapPicker({ latitude, longitude, onLocationSelect }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const lat = Number(latitude) || 12.9716;
  const lng = Number(longitude) || 77.5946;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.bindPopup("Rescue Location (Drag to adjust)").openPopup();

      marker.on("dragend", async (event) => {
        const position = event.target.getLatLng();
        await handlePositionUpdate(position.lat, position.lng);
      });

      map.on("click", async (event) => {
        const { lat: clickLat, lng: clickLng } = event.latlng;
        marker.setLatLng([clickLat, clickLng]);
        await handlePositionUpdate(clickLat, clickLng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom());
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }

    async function handlePositionUpdate(newLat, newLng) {
      let resolvedAddress = "";
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&zoom=18&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        if (res.ok) {
          const data = await res.json();
          resolvedAddress = data.display_name || "";
        }
      } catch (err) {
        console.warn("Reverse geocode failed:", err);
      }

      if (onLocationSelect) {
        onLocationSelect({
          latitude: Number(newLat.toFixed(6)),
          longitude: Number(newLng.toFixed(6)),
          address: resolvedAddress,
        });
      }
    }
  }, [lat, lng, onLocationSelect]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "260px",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #dbe6de",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          background: "rgba(255, 255, 255, 0.95)",
          padding: "5px 10px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "600",
          color: "#263b31",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          border: "1px solid #d4dfd7",
        }}
      >
        <MapPin size={13} color="#1b7a43" />
        <span>
          {lat.toFixed(4)}, {lng.toFixed(4)} &middot; Click map or drag pin
        </span>
      </div>
    </div>
  );
}
