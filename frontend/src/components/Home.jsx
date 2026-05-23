import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import axios from "axios";
import { Alert, Snackbar } from "@mui/material";
import {
  AccountBalanceWallet,
  AdminPanelSettings,
  Assignment,
  GroupAdd,
  LocalOffer,
  Payment,
  PeopleOutline,
  Storefront,
  Tune,
  WorkspacePremium,
} from "@mui/icons-material";
import Sidemenu from "./Sidemenu";
import logo from "./renic-tech-logo.svg";
import RenicCopyright from "./common/RenicCopyright";

const API = process.env.REACT_APP_API_URL;

const allFeatures = [
  { label: "Join Scheme", icon: WorkspacePremium, roles: ["customer", "admin", "staff"], route: "/newplan" },
  { label: "My Plans", icon: Assignment, roles: ["customer", "admin", "staff"], route: "/my-plans" },
  { label: "Wallet", icon: AccountBalanceWallet, roles: ["customer", "admin", "staff"], route: "/wallet" },
  { label: "Offers", icon: LocalOffer, roles: ["customer", "admin", "staff", "agent"], route: "/offers" },
  { label: "Manage Center", icon: PeopleOutline, roles: ["admin"], route: "/admin-manage" },
  { label: "Create User", icon: GroupAdd, roles: ["admin"], route: "/CreateAccount" },
  { label: "Create Plan", icon: WorkspacePremium, roles: ["admin"], route: "/createnewplan" },
  { label: "Rate Entry", icon: Tune, roles: ["admin"], route: "/rateentry" },
  { label: "Collections", icon: Payment, roles: ["admin"], route: "/payment-history" },
  { label: "New Arrivals", icon: Storefront, roles: ["customer", "admin", "staff"], route: "/newarrivals" },
  { label: "Manage Arrivals", icon: Storefront, roles: ["admin"], route: "/manage-newarrivals" },
  { label: "Manage Offers",   icon: LocalOffer,          roles: ["admin"], route: "/manage-offers" },
  { label: "Agent Desk", icon: AdminPanelSettings, roles: ["agent", "admin", "staff"], route: "/agent-dashboard" },
  { label: "Manage Agents", icon: GroupAdd, roles: ["admin"], route: "/admin/agents" },
];

const sliderSettings = {
  arrows: false,
  dots: true,
  infinite: true,
  autoplay: true,
  speed: 550,
  autoplaySpeed: 4000,
  slidesToShow: 1,
  slidesToScroll: 1,
};

const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API}${path}`;
};

function FeatureCard({ item, onClick }) {
  const Icon = item.icon;

  return (
    <motion.button
      className="home-feature-card"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        border: "1px solid rgba(169, 126, 39, 0.14)",
        borderRadius: 20,
        background: "#fffdf9",
        padding: 18,
        textAlign: "left",
        cursor: "pointer",
        boxShadow: "0 14px 30px rgba(133, 104, 74, 0.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        minHeight: 148,
        width: "100%",
      }}
    >
      <div
        className="home-feature-icon"
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(135deg, #fff2d2 0%, #efd08d 100%)",
          color: "#8c6518",
        }}
      >
        <Icon />
      </div>
      <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div className="home-feature-label" style={{ fontWeight: 800, color: "#3e2b16", fontSize: 15, lineHeight: 1.15 }}>
          {item.label}
        </div>
        <div
          className="home-feature-arrow"
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: "rgba(200, 155, 60, 0.12)",
            color: "#8c6518",
            display: "grid",
            placeItems: "center",
            fontSize: 15,
            flexShrink: 0,
          }}
        >
          ›
        </div>
      </div>
    </motion.button>
  );
}

function SectionHead({ title, action, onClick }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#3e2b16" }}>{title}</div>
      {action ? (
        <button
          onClick={onClick}
          style={{
            border: "1px solid rgba(169,126,39,0.12)",
            background: "#fff",
            borderRadius: 999,
            padding: "10px 14px",
            color: "#6f5334",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [homeData, setHomeData] = useState({ rates: {}, banners: [], arrivals: [], offers: [], plans: [] });
  const [liveRates, setLiveRates] = useState({});
  const [summary, setSummary] = useState(null);
  const [agentStats, setAgentStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [updateNotice, setUpdateNotice] = useState({ open: false, message: "" });
  const role = (localStorage.getItem("role") || "customer").toLowerCase();
  const isAdmin = role === "admin";
  const name = localStorage.getItem("name") || "Guest";
  const guest = localStorage.getItem("isGuest") === "true";
  const token = localStorage.getItem("token");

  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    axios
      .get(`${API}/api/home/content`, { headers })
      .then((res) => setHomeData(res.data?.data || { rates: {}, banners: [], arrivals: [], offers: [], plans: [] }))
      .catch(() => setHomeData({ rates: {}, banners: [], arrivals: [], offers: [], plans: [] }));
  }, [token]);

  useEffect(() => {
    axios
      .get(`${API}/api/gold-rate/current`)
      .then((res) => setLiveRates(res.data?.data || {}))
      .catch(() => setLiveRates({}));
  }, []);

  useEffect(() => {
    if (guest || !token) {
      setSummary(null);
      return;
    }

    axios
      .get(`${API}/api/schemes/summary`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setSummary(res.data?.data || null))
      .catch(() => setSummary(null));
  }, [guest, token]);

  useEffect(() => {
    if (role !== "agent" || !token) return;

    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API}/api/agent/dashboard`, { headers }),
      axios.get(`${API}/api/agent/pending-installments?date=today`, { headers }),
    ])
      .then(([statsRes, pendingRes]) => {
        setAgentStats(statsRes.data?.data || null);
        setPending(pendingRes.data?.data || []);
      })
      .catch(() => {
        setAgentStats(null);
        setPending([]);
      });
  }, [role, token]);

  useEffect(() => {
    const arrivalStamp = homeData.arrivals?.[0]?.created_at;
    const bannerStamp = homeData.banners?.[0]?.id;
    const offerStamp = homeData.offers?.[0]?.id;
    const latestStamp = [arrivalStamp, bannerStamp, offerStamp].filter(Boolean).join("|");

    if (!latestStamp) return;

    const previousStamp = localStorage.getItem("home_updates_seen");
    if (previousStamp && previousStamp !== latestStamp) {
      const message = homeData.arrivals?.[0]?.title
        ? `New update: ${homeData.arrivals[0].title} is now live.`
        : "New dashboard updates are available.";

      setUpdateNotice({ open: true, message });

      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("Renic Tech", { body: message });
        } catch (error) {
          // ignore browser notification issues
        }
      }
    }

    localStorage.setItem("home_updates_seen", latestStamp);
  }, [homeData]);

  const features = useMemo(
    () =>
      allFeatures
        .filter((item) => (guest ? item.roles.includes("customer") : item.roles.includes(role)))
        .map((item) => {
          if (isAdmin && item.label === "Join Scheme") {
            return { ...item, label: "Create Scheme", route: "/newplan" };
          }

          return item;
        }),
    [guest, isAdmin, role]
  );

  const rates = Object.keys(homeData.rates || {}).length ? homeData.rates : liveRates;
  const formatRate = (value) => {
    const numericValue = Number(value || 0);
    if (numericValue <= 0) return null;
    return numericValue.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };
  const statCards = [
    {
      label: "22K Gold",
      type: "rate",
      value: formatRate(rates.gold22K),
    },
    {
      label: "Silver",
      type: "rate",
      value: formatRate(rates.silver),
    },
    {
      label: guest ? "Access" : role === "agent" ? "Customers" : isAdmin ? "Plan Catalog" : "Total Savings",
      value: guest
        ? "Guest session"
        : role === "agent"
          ? `${agentStats?.totalCustomers || 0}`
          : isAdmin
            ? `${homeData.plans?.length || 0}`
            : `Rs ${Number(summary?.totalAmountInvested || 0).toLocaleString("en-IN")}`,
    },
    {
      label: guest ? "Plan Access" : role === "agent" ? "Today Collection" : "Active Plans",
      value: guest
        ? "Browse schemes"
        : role === "agent"
          ? `Rs ${Number(agentStats?.todayCollectionAmount || 0).toLocaleString("en-IN")}`
          : isAdmin
            ? `${homeData.plans?.filter((plan) => plan.active !== false).length || 0}`
            : `${summary?.activeSchemes || 0}`,
    },
  ];

  const heroSlides = homeData.banners?.length
    ? homeData.banners
    : [
        {
          id: "fallback",
          title: "Jewellery savings made simple.",
          subtitle: "Schemes, rates, arrivals, and offers in one clean dashboard.",
          description: "",
          image_url: "",
          cta_label: "View plans",
          cta_route: "/newplan",
        },
      ];

  const renderStatValue = (item) => {
    if (item.type !== "rate") return item.value;
    if (!item.value) return "Rate unavailable";

    return (
      <span className="home-rate-value">
        <span className="home-rate-currency">Rs</span>
        <span>{item.value}</span>
        <span className="home-rate-unit">/g</span>
      </span>
    );
  };

  return (
    <div className="app-safe-shell home-screen" style={{ paddingBottom: "max(28px, env(safe-area-inset-bottom, 0px))" }}>
      <div className="home-container" style={{ maxWidth: 1220, margin: "0 auto" }}>
        <div
          className="home-topbar"
          style={{
            position: "sticky",
            top: "env(safe-area-inset-top, 0px)",
            zIndex: 20,
            marginTop: 8,
            borderRadius: 18,
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(169, 126, 39, 0.12)",
            boxShadow: "0 18px 36px rgba(133, 104, 74, 0.08)",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <button
              onClick={() => setMenuOpen(true)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: "1px solid rgba(169, 126, 39, 0.14)",
                background: "#fff",
                cursor: "pointer",
                fontSize: 14,
                color: "#6b4d26",
                flexShrink: 0,
              }}
            >
              ≡
            </button>
            <img src={logo} alt="Renic Tech" style={{ width: 46, height: 38, objectFit: "contain", flexShrink: 0 }} />
            <div style={{ minWidth: 0, fontSize: "clamp(18px, 3.4vw, 24px)", fontWeight: 800, color: "#4b3519", lineHeight: 1.05 }}>
              Renic Tech
            </div>
          </div>

          <button
            onClick={() => navigate("/profile")}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "1px solid rgba(169, 126, 39, 0.14)",
              background: "#fff",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              padding: 0,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <img src={logo} alt="Profile" style={{ width: 28, height: 28, objectFit: "contain" }} />
          </button>
        </div>

        <Sidemenu open={menuOpen} onClose={() => setMenuOpen(false)} />

        <div className="home-main-grid" style={{ marginTop: 20, display: "grid", gap: 22 }}>
          <div
            className="home-hero-shell"
            style={{
              borderRadius: 26,
              overflow: "hidden",
              border: "1px solid rgba(169, 126, 39, 0.12)",
              boxShadow: "0 22px 48px rgba(133, 104, 74, 0.12)",
              background: "#fff",
            }}
          >
            <Slider {...sliderSettings}>
              {heroSlides.map((slide, index) => {
                const imageUrl = getImageUrl(slide.image_url);
                const background = imageUrl
                  ? `linear-gradient(90deg, rgba(56,34,14,0.82) 0%, rgba(56,34,14,0.55) 35%, rgba(56,34,14,0.2) 70%), url(${imageUrl})`
                  : `linear-gradient(135deg, ${index % 2 === 0 ? "#6e3d1f 0%, #b27b36 100%" : "#4e2b19 0%, #9f4b2d 100%"})`;

                return (
                  <div key={slide.id || slide.title}>
                    <div
                      className="home-hero-slide"
                      style={{
                        minHeight: 280,
                        position: "relative",
                        backgroundImage: background,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        padding: "28px 22px",
                        display: "flex",
                        alignItems: "flex-end",
                      }}
                    >
                      <div className="home-hero-content" style={{ maxWidth: 520, color: "#fff7eb" }}>
                        <div className="home-hero-title" style={{ fontSize: "clamp(28px, 5vw, 46px)", lineHeight: 1.02, fontWeight: 800 }}>{slide.title}</div>
                        {(slide.cta_label || slide.cta_route) && (
                          <button
                            className="home-hero-button"
                            onClick={() => navigate(slide.cta_route || "/newplan")}
                            style={{
                              marginTop: 18,
                              height: 44,
                              borderRadius: 999,
                              border: "1px solid rgba(255,255,255,0.18)",
                              background: "rgba(255,255,255,0.14)",
                              color: "#fff",
                              padding: "0 18px",
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            {slide.cta_label || "Explore"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </Slider>
          </div>

          <div
            className="home-stat-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
            }}
          >
            {statCards.map((item) => (
              <div
                key={item.label}
                className="home-stat-card"
                style={{
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.86)",
                  border: "1px solid rgba(169,126,39,0.12)",
                  padding: 18,
                  boxShadow: "0 14px 30px rgba(133, 104, 74, 0.06)",
                }}
              >
                <div style={{ color: "#8a6b49", fontSize: 12 }}>{item.label}</div>
                <div className="home-stat-value" style={{ marginTop: 8, color: "#3e2b16", fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, lineHeight: 1.1 }}>{renderStatValue(item)}</div>
              </div>
            ))}
          </div>

          {homeData.arrivals?.length ? (
            <div style={{ display: "grid", gap: 12 }}>
              <SectionHead title="New Arrivals" action="View all" onClick={() => navigate("/newarrivals")} />
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  overflowX: "auto",
                  paddingBottom: 8,
                  scrollSnapType: "x proximity",
                }}
              >
                {homeData.arrivals.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      minWidth: 220,
                      maxWidth: 220,
                      background: "#fff",
                      borderRadius: 22,
                      overflow: "hidden",
                      border: "1px solid rgba(169,126,39,0.12)",
                      boxShadow: "0 14px 30px rgba(133,104,74,0.06)",
                      scrollSnapAlign: "start",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        height: 170,
                        background: item.image_url
                          ? `center / cover no-repeat url(${getImageUrl(item.image_url)})`
                          : "linear-gradient(135deg, #f4dfb0 0%, #c98b5b 100%)",
                      }}
                    />
                    <div style={{ padding: 14, display: "grid", gap: 6 }}>
                      <div style={{ fontWeight: 800, color: "#3e2b16", fontSize: 17 }}>{item.title}</div>
                      <div style={{ fontWeight: 800, color: "#7b0000", fontSize: 26 }}>Rs {Number(item.price || 0).toLocaleString("en-IN")}</div>
                      {item.offer ? (
                        <div style={{ display: "inline-flex", width: "fit-content", padding: "7px 12px", borderRadius: 999, background: "#fff4e2", color: "#a33a2b", fontWeight: 700, fontSize: 12 }}>
                          {item.offer}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
            }}
          >
            <div
              className="home-snapshot-card"
              style={{
                padding: 22,
                borderRadius: 22,
                background: "linear-gradient(135deg, rgba(255,251,243,0.96) 0%, rgba(255,241,214,0.92) 100%)",
                border: "1px solid rgba(169,126,39,0.12)",
                boxShadow: "0 18px 40px rgba(133, 104, 74, 0.08)",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: "#a9771c", letterSpacing: 1.1, textTransform: "uppercase" }}>Account Snapshot</div>
              <div className="home-snapshot-title" style={{ marginTop: 10, fontSize: "clamp(28px, 5vw, 42px)", lineHeight: 1.04, fontWeight: 800, color: "#3e2b16" }}>
                {guest ? "Browse current plans and rates." : `${name}, your ${isAdmin ? "admin" : "scheme"} dashboard is ready.`}
              </div>

              {!guest && role !== "agent" && !isAdmin && (
                <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
                  <div style={{ padding: 14, borderRadius: 16, background: "#fff", border: "1px solid rgba(169,126,39,0.12)" }}>
                    <div style={{ fontSize: 12, color: "#8a6b49" }}>Current Value</div>
                    <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800, color: "#3e2b16" }}>
                      Rs {Number(summary?.currentValue || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 16, background: "#fff", border: "1px solid rgba(169,126,39,0.12)" }}>
                    <div style={{ fontSize: 12, color: "#8a6b49" }}>Gold Accumulated</div>
                    <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800, color: "#3e2b16" }}>
                      {Number(summary?.totalGoldWeight || 0).toFixed(4)} g
                    </div>
                  </div>
                </div>
              )}

              {!guest && isAdmin && (
                <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
                  <div style={{ padding: 14, borderRadius: 16, background: "#fff", border: "1px solid rgba(169,126,39,0.12)" }}>
                    <div style={{ fontSize: 12, color: "#8a6b49" }}>Available Plans</div>
                    <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800, color: "#3e2b16" }}>
                      {homeData.plans?.length || 0}
                    </div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 16, background: "#fff", border: "1px solid rgba(169,126,39,0.12)" }}>
                    <div style={{ fontSize: 12, color: "#8a6b49" }}>Highlighted Plans</div>
                    <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800, color: "#3e2b16" }}>
                      {homeData.plans?.filter((plan) => plan.popular).length || 0}
                    </div>
                  </div>
                </div>
              )}

              {role === "agent" && (
                <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
                  <div style={{ padding: 14, borderRadius: 16, background: "#fff", border: "1px solid rgba(169,126,39,0.12)" }}>
                    <div style={{ fontSize: 12, color: "#8a6b49" }}>Pending Collections</div>
                    <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800, color: "#3e2b16" }}>{agentStats?.pendingInstallmentsCount || 0}</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 16, background: "#fff", border: "1px solid rgba(169,126,39,0.12)" }}>
                    <div style={{ fontSize: 12, color: "#8a6b49" }}>Total Commission</div>
                    <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800, color: "#3e2b16" }}>
                      Rs {Number(agentStats?.totalCommission || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {role === "agent" && pending.length > 0 ? (
            <div style={{ display: "grid", gap: 14 }}>
              <SectionHead title="Assigned Collections" action="Open Agent Desk" onClick={() => navigate("/agent-dashboard")} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                {pending.slice(0, 4).map((item) => (
                  <div
                    key={`${item.customerId}-${item.schemeId}`}
                    style={{
                      background: "#fff",
                      borderRadius: 20,
                      border: "1px solid rgba(169,126,39,0.12)",
                      boxShadow: "0 14px 30px rgba(133,104,74,0.06)",
                      padding: 18,
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: "#3e2b16" }}>{item.customerName}</div>
                    <div style={{ color: "#8a6b49", fontSize: 13 }}>{item.planName}</div>
                    <div style={{ fontWeight: 800, fontSize: 26, color: "#7b0000" }}>Rs {Number(item.amount || 0).toLocaleString("en-IN")}</div>
                    <button
                      onClick={() => navigate("/agent-dashboard")}
                      style={{
                        height: 42,
                        border: "none",
                        borderRadius: 14,
                        background: "linear-gradient(135deg, #c89b3c, #e0b254)",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Continue collection
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ marginTop: 28, display: "grid", gap: 18 }}>
          <SectionHead title="Available Actions" />
          <div
            className="home-feature-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
            }}
          >
            {features.map((item) => (
              <FeatureCard key={item.label} item={item} onClick={() => navigate(item.route)} />
            ))}
          </div>
        </div>

        <div style={{ marginTop: 28, display: "grid", gap: 18 }}>
          <SectionHead title="New Plan Highlights" action="Browse plans" onClick={() => navigate("/newplan")} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {homeData.plans?.slice(0, 3).map((plan) => (
              <div
                key={plan.name}
                style={{
                  background: "linear-gradient(180deg, #fff 0%, #fff8ec 100%)",
                  borderRadius: 22,
                  border: "1px solid rgba(169,126,39,0.12)",
                  boxShadow: "0 14px 30px rgba(133,104,74,0.06)",
                  padding: 18,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#3e2b16" }}>{plan.name}</div>
                  {plan.popular ? <span style={{ padding: "6px 10px", borderRadius: 999, background: "#fef1cc", color: "#a9771c", fontSize: 12, fontWeight: 800 }}>Popular</span> : null}
                </div>
                <div style={{ color: "#6f5334", lineHeight: 1.55 }}>{plan.description}</div>
                <div style={{ fontWeight: 800, color: "#7b0000" }}>Starts from Rs {Number(plan.minAmount || 0).toLocaleString("en-IN")}</div>
                <button
                  onClick={() => navigate("/newplan")}
                  style={{
                    marginTop: 8,
                    height: 42,
                    borderRadius: 14,
                    border: "none",
                    background: "linear-gradient(135deg, #7b0000, #c0392b)",
                    color: "#fff0c0",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  View plan
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 28, display: "grid", gap: 18 }}>
          <SectionHead title="Active Offers" action="See offers" onClick={() => navigate("/offers")} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, paddingBottom: 24 }}>
            {homeData.offers?.slice(0, 3).map((offer) => (
              <div
                key={offer.id}
                style={{
                  background: "#fff",
                  borderRadius: 22,
                  overflow: "hidden",
                  border: "1px solid rgba(169,126,39,0.12)",
                  boxShadow: "0 14px 30px rgba(133,104,74,0.06)",
                }}
              >
                {(offer.banner_url || offer.image_url) ? (
                  <div style={{ height: 160, background: `center / cover no-repeat url(${getImageUrl(offer.banner_url || offer.image_url)})` }} />
                ) : null}
                <div style={{ padding: 18, display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#3e2b16" }}>{offer.title}</div>
                  <div style={{ color: "#8a6b49", fontWeight: 700 }}>{offer.subtitle}</div>
                  <div style={{ color: "#6f5334", lineHeight: 1.55 }}>{offer.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 10, paddingBottom: 18 }}>
          <RenicCopyright color="#8a6b49" />
        </div>
      </div>

      <Snackbar
        open={updateNotice.open}
        autoHideDuration={3500}
        onClose={() => setUpdateNotice((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" onClose={() => setUpdateNotice((prev) => ({ ...prev, open: false }))}>
          {updateNotice.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
