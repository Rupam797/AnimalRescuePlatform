import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { adoptionService } from "../services/api";
import {
  Heart,
  Search,
  PawPrint,
  Check,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const SPECIES_OPTIONS = ["All", "Dog", "Cat", "Puppy", "Kitten", "Bird", "Other"];

export default function AdoptionList() {
  const [animals, setAnimals] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnimals() {
      try {
        setLoading(true);
        const params = {
          species: selectedSpecies !== "All" ? selectedSpecies : undefined,
          search: searchQuery.trim() || undefined,
        };
        const res = await adoptionService.getAdoptable(params);
        const content = res.data.content || res.data;
        setAnimals(Array.isArray(content) ? content : []);
      } catch (err) {
        setError("Failed to load adoptable animals.");
      } finally {
        setLoading(false);
      }
    }

    loadAnimals();
  }, [selectedSpecies, searchQuery]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8faf8" }}>
      <Navbar />

      <main style={{ maxWidth: "1140px", margin: "32px auto 56px", padding: "0 16px" }}>
        {/* Title & Search bar */}
        <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "#e8f5ec",
              color: "#1b7a43",
              padding: "4px 10px",
              borderRadius: "16px",
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "uppercase",
              marginBottom: "8px",
              border: "1px solid #c9e4d1",
            }}
          >
            <Heart size={12} />
            <span>ADOPT &middot; FOSTER &middot; SAVE A LIFE</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#263b31", margin: "0 0 8px" }}>
            Adopt a Rehabilitated Pet
          </h1>
          <p style={{ fontSize: "14px", color: "#5d7367", lineHeight: 1.5, margin: 0 }}>
            Every animal here has survived distress or abandonment, received clinical treatment, and is now vaccinated
            and ready for a permanent loving home.
          </p>

          {/* Search Input with Integrated Icon */}
          <div style={{ position: "relative", marginTop: "18px" }}>
            <Search
              size={17}
              color="#7d9185"
              style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search by animal name, breed, or personality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 16px 11px 40px",
                borderRadius: "10px",
                border: "1px solid #d2ded5",
                fontSize: "14px",
                color: "#263b31",
                background: "#ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            />
          </div>

          {/* Species Filter Pills */}
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap", marginTop: "14px" }}>
            {SPECIES_OPTIONS.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => setSelectedSpecies(spec)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: selectedSpecies === spec ? "1px solid #1b7a43" : "1px solid #d4ded7",
                  background: selectedSpecies === spec ? "#1b7a43" : "#ffffff",
                  color: selectedSpecies === spec ? "#ffffff" : "#455a4e",
                  fontSize: "13px",
                  fontWeight: selectedSpecies === spec ? "700" : "500",
                  cursor: "pointer",
                }}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#991b1b",
              padding: "10px 14px",
              borderRadius: "8px",
              textAlign: "center",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "13px",
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="status-spinner" style={{ margin: "0 auto 12px" }}></div>
            <p style={{ color: "#61776b", fontSize: "14px" }}>Loading adoptable pets...</p>
          </div>
        ) : animals.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "50px 20px",
              textAlign: "center",
              border: "1px solid #e2ebe4",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "12px",
                  background: "#f0fdf4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PawPrint size={24} color="#1b7a43" />
              </div>
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#263b31", margin: 0 }}>
              No Animals Match Your Filters
            </h3>
            <p style={{ color: "#61776b", fontSize: "13px", marginTop: "4px" }}>
              Try selecting another species category or clearing your search keywords.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {animals.map((animal) => (
              <div
                key={animal.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid #e1ece3",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Photo */}
                <div style={{ height: "200px", background: "#eef2ef", position: "relative" }}>
                  <img
                    src={animal.photoUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80"}
                    alt={animal.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      background: "rgba(255, 255, 255, 0.95)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#1b7a43",
                      border: "1px solid #d4dfd7",
                    }}
                  >
                    {animal.species}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#263b31", margin: 0 }}>
                      {animal.name}
                    </h3>
                    <span style={{ fontSize: "12px", color: "#61776b", fontWeight: "600" }}>
                      {animal.age || "Young"}
                    </span>
                  </div>

                  <div style={{ fontSize: "12px", color: "#6c8376", marginBottom: "10px" }}>
                    {animal.breed || animal.species} &middot; {animal.gender || "Unknown"}
                  </div>

                  {animal.healthNotes && (
                    <div
                      style={{
                        background: "#f0f8f3",
                        color: "#1b7a43",
                        padding: "5px 9px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "600",
                        marginBottom: "10px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        border: "1px solid #cce8d4",
                      }}
                    >
                      <Check size={12} flexShrink={0} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{animal.healthNotes}</span>
                    </div>
                  )}

                  <p
                    style={{
                      fontSize: "13px",
                      color: "#4e6557",
                      lineHeight: 1.5,
                      flex: 1,
                      margin: "0 0 16px",
                    }}
                  >
                    {animal.description
                      ? animal.description.slice(0, 100) + "..."
                      : "A sweet rehabilitated rescue ready to join a loving home."}
                  </p>

                  <Link
                    to={`/adoptions/${animal.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      textAlign: "center",
                      padding: "10px",
                      borderRadius: "8px",
                      background: "#1b7a43",
                      color: "#ffffff",
                      textDecoration: "none",
                      fontWeight: "700",
                      fontSize: "13px",
                    }}
                  >
                    <span>View & Apply to Adopt</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
