import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { reportService } from "../services/api";
import Navbar from "../components/Navbar";
import MapPicker from "../components/MapPicker";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  AlertCircle,
  Send,
} from "lucide-react";

export default function ReportAnimal() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [animalType, setAnimalType] = useState("Dog");
  const [animalName, setAnimalName] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [landmark, setLandmark] = useState("");
  const [contactPhone, setContactPhone] = useState(user?.phone || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Geolocation State
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [address, setAddress] = useState("");
  const [geoStatus, setGeoStatus] = useState("detecting"); // 'detecting', 'success', 'denied', 'error'
  const [geoMessage, setGeoMessage] = useState("Detecting GPS location via device sensors...");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-detect GPS location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setGeoMessage("Geolocation is not supported by your browser. Please position pin manually.");
      return;
    }

    setGeoStatus("detecting");
    setGeoMessage("Detecting your location via GPS...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setGeoStatus("success");
        setGeoMessage(`Location auto-detected (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`);

        // Reverse geocode via Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              setAddress(data.display_name);
            }
          }
        } catch (err) {
          console.warn("Reverse geocode error:", err);
        }
      },
      (err) => {
        console.warn("Geolocation permission error:", err);
        setGeoStatus("denied");
        setGeoMessage(
          err.code === 1
            ? "Location permission denied. You can drag the pin on the map or enter the address manually."
            : "Could not retrieve GPS location. Please position the pin on the map."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Selected image exceeds 5 MB limit.");
        return;
      }
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      setError("");
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleLocationUpdate = (loc) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    if (loc.address) {
      setAddress(loc.address);
    }
    setGeoStatus("success");
    setGeoMessage("Location pin updated manually");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: { pathname: "/report" },
          notice: "Please log in or create an account to submit an animal rescue report.",
        },
      });
      return;
    }

    if (!description.trim()) {
      setError("Please describe the animal's condition and injuries.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("animalType", animalType);
      formData.append("animalName", animalName.trim() || `Injured ${animalType}`);
      formData.append("description", description.trim());
      formData.append("severity", severity);
      formData.append("latitude", latitude.toString());
      formData.append("longitude", longitude.toString());
      formData.append("address", address.trim());
      formData.append("landmark", landmark.trim());
      formData.append("contactPhone", contactPhone.trim());

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      await reportService.createMultipart(formData);

      navigate("/my-reports", {
        state: {
          successMessage: "Your rescue report has been filed! Admin and volunteers have been notified.",
        },
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to submit report. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8faf8" }}>
      <Navbar />

      <main style={{ maxWidth: "680px", margin: "28px auto 48px", padding: "0 16px" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "28px 24px",
            border: "1px solid #e2ebe4",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: "22px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "#fef2f2",
                color: "#dc2626",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: "700",
                marginBottom: "8px",
                border: "1px solid #fecaca",
              }}
            >
              <AlertTriangle size={13} />
              <span>EMERGENCY RESCUE REPORT</span>
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#263b31", margin: 0 }}>
              Report an Injured Animal
            </h1>
            <p style={{ fontSize: "13px", color: "#61776b", marginTop: "4px" }}>
              Provide photos and location so our nearest rescue volunteer can respond promptly.
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "#fdf2f2",
                border: "1px solid #f8b4b4",
                color: "#c81e1e",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} flexShrink={0} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Camera / Photo Capture */}
            <div style={{ marginBottom: "22px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#263b31", marginBottom: "6px" }}>
                1. Animal Photo <span style={{ color: "#dc2626" }}>*</span>
              </label>

              {imagePreview ? (
                <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", border: "1px solid #c9d8ce" }}>
                  <img
                    src={imagePreview}
                    alt="Animal preview"
                    style={{ width: "100%", maxHeight: "300px", objectFit: "cover", display: "block" }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      background: "rgba(15, 23, 42, 0.75)",
                      color: "#ffffff",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <X size={14} />
                    <span>Retake photo</span>
                  </button>
                </div>
              ) : (
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "30px 16px",
                    border: "2px dashed #a5cfb2",
                    borderRadius: "12px",
                    background: "#f6fbf7",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <Camera size={28} color="#1b7a43" style={{ marginBottom: "6px" }} />
                  <span style={{ fontWeight: "700", fontSize: "14px", color: "#1b7a43" }}>
                    Tap to Open Camera or Upload Photo
                  </span>
                  <span style={{ fontSize: "12px", color: "#6c8376", marginTop: "2px" }}>
                    JPG, PNG, or WebP up to 5 MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </label>
              )}
            </div>

            {/* Step 2: Location Auto-detection & Map Preview */}
            <div style={{ marginBottom: "22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#263b31" }}>
                  2. Incident Location (GPS Auto-detected)
                </label>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    color: geoStatus === "success" ? "#1b7a43" : geoStatus === "detecting" ? "#c27803" : "#d97706",
                  }}
                >
                  {geoStatus === "detecting" && (
                    <>
                      <Clock size={13} />
                      <span>Detecting...</span>
                    </>
                  )}
                  {geoStatus === "success" && (
                    <>
                      <CheckCircle2 size={13} />
                      <span>GPS Locked</span>
                    </>
                  )}
                  {geoStatus === "denied" && (
                    <>
                      <AlertTriangle size={13} />
                      <span>Manual Pin</span>
                    </>
                  )}
                </div>
              </div>

              {/* Status banner */}
              <div
                style={{
                  background: geoStatus === "success" ? "#eef8f1" : "#fef9ee",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: geoStatus === "success" ? "#196c3c" : "#8a5800",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  border: geoStatus === "success" ? "1px solid #cce8d4" : "1px solid #fde68a",
                }}
              >
                <MapPin size={14} flexShrink={0} />
                <span>{geoMessage}</span>
              </div>

              {/* Map Picker with Pin */}
              <MapPicker
                latitude={latitude}
                longitude={longitude}
                onLocationSelect={handleLocationUpdate}
              />

              {/* Reverse Geocoded Address Fallback */}
              <div style={{ marginTop: "10px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#5d7367", marginBottom: "4px" }}>
                  Detected Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / locality address"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d4dfd7",
                    fontSize: "13px",
                    color: "#263b31",
                  }}
                />
              </div>

              <div style={{ marginTop: "8px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#5d7367", marginBottom: "4px" }}>
                  Nearby Landmark (helps volunteers locate quickly)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite BDA Complex, near the blue tea stall"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d4dfd7",
                    fontSize: "13px",
                    color: "#263b31",
                  }}
                />
              </div>
            </div>

            {/* Step 3: Animal Details & Severity */}
            <div style={{ marginBottom: "22px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#263b31", marginBottom: "8px" }}>
                3. Animal Information
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#5d7367", marginBottom: "4px" }}>
                    Animal Type
                  </label>
                  <select
                    value={animalType}
                    onChange={(e) => setAnimalType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #d4dfd7",
                      fontSize: "13px",
                      color: "#263b31",
                      background: "#ffffff",
                    }}
                  >
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Puppy">Puppy</option>
                    <option value="Kitten">Kitten</option>
                    <option value="Bird">Bird</option>
                    <option value="Cow">Cow</option>
                    <option value="Other">Other Species</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#5d7367", marginBottom: "4px" }}>
                    Temporary Name / Identifier (Optional)
                  </label>
                  <input
                    type="text"
                    value={animalName}
                    onChange={(e) => setAnimalName(e.target.value)}
                    placeholder="e.g. Brownie / Stray Pup"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #d4dfd7",
                      fontSize: "13px",
                      color: "#263b31",
                    }}
                  />
                </div>
              </div>

              {/* Severity Selector */}
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#5d7367", marginBottom: "6px" }}>
                  Urgency / Severity Level
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {[
                    { key: "LOW", label: "Low", desc: "Minor scratch, mobile", color: "#1b7a43", bg: "#eef9f2" },
                    { key: "MEDIUM", label: "Medium", desc: "Limping, dehydrated", color: "#c27803", bg: "#fef8ee" },
                    { key: "CRITICAL", label: "Critical", desc: "Severe trauma, bleeding", color: "#c81e1e", bg: "#fdf2f2" },
                  ].map((lvl) => (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => setSeverity(lvl.key)}
                      style={{
                        padding: "8px 6px",
                        borderRadius: "8px",
                        border: severity === lvl.key ? `2px solid ${lvl.color}` : "1px solid #d4dfd7",
                        background: severity === lvl.key ? lvl.bg : "#ffffff",
                        color: lvl.color,
                        textAlign: "center",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: "700", fontSize: "12px" }}>{lvl.label}</div>
                      <div style={{ fontSize: "10px", color: "#61776b", marginTop: "1px" }}>{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition description */}
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#5d7367", marginBottom: "4px" }}>
                  Condition & Visible Injuries <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe visible wounds, behavior, whether animal is mobile..."
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d4dfd7",
                    fontSize: "13px",
                    color: "#263b31",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#5d7367", marginBottom: "4px" }}>
                  Your Contact Phone (for volunteer to coordinate)
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91-9876543210"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d4dfd7",
                    fontSize: "13px",
                    color: "#263b31",
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "10px",
                background: "#1b7a43",
                color: "#ffffff",
                border: "1px solid #1b7a43",
                fontSize: "15px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {loading ? (
                <span>Submitting distress report...</span>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit Rescue Report</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
