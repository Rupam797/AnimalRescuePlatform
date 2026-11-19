import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { adoptionService, reportService } from "../services/api";
import {
  PawPrint,
  AlertTriangle,
  Heart,
  MapPin,
  Ambulance,
  Stethoscope,
  Home as HomeIcon,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState({
    totalReports: 0,
    animalsRescued: 0,
    readyForAdoption: 0,
    volunteersCount: 0,
  });
  const [featuredAnimals, setFeaturedAnimals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, adoptionsRes] = await Promise.allSettled([
          reportService.getStats(),
          adoptionService.getAdoptable({ page: 0, size: 3 }),
        ]);

        if (statsRes.status === "fulfilled" && statsRes.value.data) {
          const d = statsRes.value.data;
          setStats({
            totalReports: d.totalReports || 0,
            animalsRescued: d.rescuedCount || d.animalsRescued || 0,
            readyForAdoption: d.readyForAdoptionCount || 0,
            volunteersCount: d.volunteersCount || 0,
          });
        }

        if (adoptionsRes.status === "fulfilled" && adoptionsRes.value.data) {
          const content = adoptionsRes.value.data.content || adoptionsRes.value.data;
          if (Array.isArray(content)) {
            setFeaturedAnimals(content.slice(0, 3));
          }
        }
      } catch (err) {
        console.warn("Failed loading homepage data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f8faf8" }}>
      <Navbar />

      {/* Hero Section */}
      <section
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e7eee8",
          padding: "56px 20px 48px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#e8f5ec",
              color: "#1b7a43",
              padding: "5px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "700",
              marginBottom: "16px",
              border: "1px solid #cce5d4",
            }}
          >
            <ShieldCheck size={14} />
            <span>Community Animal Rescue & Care Network</span>
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 4.5vw, 48px)",
              fontWeight: "800",
              color: "#182c22",
              lineHeight: 1.2,
              margin: "0 0 16px",
              letterSpacing: "-0.02em",
            }}
          >
            Spot an Injured Animal? <br />
            <span style={{ color: "#1b7a43" }}>Report Instantly. We Respond.</span>
          </h1>
          <p
            style={{
              fontSize: "clamp(15px, 2vw, 18px)",
              color: "#4e6557",
              lineHeight: 1.6,
              maxWidth: "680px",
              margin: "0 auto 32px",
            }}
          >
            Capture a photo and auto-detect your location. Our verified volunteers respond immediately, provide veterinary
            treatment, and prepare recovered animals for adoption.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/report"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "10px",
                background: "#1b7a43",
                color: "#ffffff",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: "700",
                border: "1px solid #1b7a43",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <AlertTriangle size={17} />
              <span>Report Injured Animal</span>
            </Link>

            <Link
              to="/adoptions"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "10px",
                background: "#ffffff",
                color: "#263b31",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: "700",
                border: "1px solid #d4dfd7",
              }}
            >
              <Heart size={16} color="#1b7a43" />
              <span>Browse Adoptable Pets</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Impact Counters */}
      <section style={{ maxWidth: "1100px", margin: "24px auto 48px", padding: "0 20px" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "24px 28px",
            border: "1px solid #e1ebe3",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "32px", fontWeight: "800", color: "#1b7a43" }}>{stats.totalReports}</div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#61776b", marginTop: "4px" }}>
              Total Cases Reported
            </div>
          </div>
          <div>
            <div style={{ fontSize: "32px", fontWeight: "800", color: "#c27803" }}>{stats.animalsRescued}</div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#61776b", marginTop: "4px" }}>
              Animals Safely Rescued
            </div>
          </div>
          <div>
            <div style={{ fontSize: "32px", fontWeight: "800", color: "#2e7d32" }}>{stats.readyForAdoption}</div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#61776b", marginTop: "4px" }}>
              Ready for Adoption
            </div>
          </div>
          <div>
            <div style={{ fontSize: "32px", fontWeight: "800", color: "#263b31" }}>{stats.volunteersCount}</div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#61776b", marginTop: "4px" }}>
              Registered Volunteers
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section style={{ maxWidth: "1100px", margin: "0 auto 56px", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#263b31", margin: 0 }}>
            How PawRescue Operates
          </h2>
          <p style={{ fontSize: "14px", color: "#5d7367", marginTop: "6px" }}>
            From distress alert to verified recovery and adoption in 4 clear steps
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "18px",
          }}
        >
          {[
            {
              step: "01",
              icon: <MapPin size={22} color="#1b7a43" />,
              title: "Spot & Geotag",
              desc: "Take a photo on your device. Exact GPS coordinates and street address are detected automatically.",
            },
            {
              step: "02",
              icon: <Ambulance size={22} color="#1b7a43" />,
              title: "Volunteer Dispatched",
              desc: "Admins assign the closest verified volunteer to reach the animal and transport it for medical triage.",
            },
            {
              step: "03",
              icon: <Stethoscope size={22} color="#1b7a43" />,
              title: "Clinical Treatment",
              desc: "Volunteers and clinics record treatment milestones, upload photos, and nurse the animal back to health.",
            },
            {
              step: "04",
              icon: <HomeIcon size={22} color="#1b7a43" />,
              title: "Forever Adoption",
              desc: "Healthy animals are published to the adoption gallery so community members can apply to adopt.",
            },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "24px 20px",
                border: "1px solid #e2ebe4",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "#e8f5ec",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    color: "#8a9d92",
                    letterSpacing: "0.5px",
                  }}
                >
                  STEP {item.step}
                </div>
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#263b31", margin: "0 0 6px" }}>
                {item.title}
              </h3>
              <p style={{ fontSize: "13px", color: "#5e7568", lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Adoptable Pets */}
      <section style={{ maxWidth: "1100px", margin: "0 auto 60px", padding: "0 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#263b31", margin: 0 }}>
              Animals Looking for Homes
            </h2>
            <p style={{ fontSize: "14px", color: "#5d7367", marginTop: "4px" }}>
              Every adoption creates room to rescue another injured animal
            </p>
          </div>
          <Link
            to="/adoptions"
            style={{
              color: "#1b7a43",
              fontWeight: "700",
              fontSize: "14px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>View all adoptable pets</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {featuredAnimals.map((animal) => (
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
              <div style={{ height: "190px", background: "#eef2ef", overflow: "hidden", position: "relative" }}>
                <img
                  src={animal.photoUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80"}
                  alt={animal.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
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
              <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#263b31", margin: "0 0 4px" }}>
                  {animal.name}
                </h3>
                <div style={{ fontSize: "12px", color: "#6c8376", marginBottom: "10px" }}>
                  {animal.breed || animal.species} &middot; {animal.age || "Young"} &middot; {animal.gender || "Unknown"}
                </div>
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
                    : "Gentle and loving companion waiting for a kind family."}
                </p>
                <Link
                  to={`/adoptions/${animal.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "#e8f5ec",
                    color: "#1b7a43",
                    textDecoration: "none",
                    fontWeight: "700",
                    fontSize: "13px",
                    border: "1px solid #c9e4d1",
                  }}
                >
                  <Heart size={14} />
                  <span>Adopt {animal.name}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #e5ebe5",
          background: "#ffffff",
          padding: "28px 20px",
          textAlign: "center",
          color: "#72887a",
          fontSize: "13px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontWeight: "700",
            color: "#263b31",
            marginBottom: "6px",
          }}
        >
          <PawPrint size={16} color="#1b7a43" />
          <span>PawRescue Community Platform</span>
        </div>
        <div>Dedicated to rapid response, veterinary treatment, and loving adoption for injured animals.</div>
      </footer>
    </div>
  );
}
