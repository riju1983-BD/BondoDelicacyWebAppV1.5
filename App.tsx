import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import BrandPage from "./components/BrandPage";
import AdminDashboardPage from "./components/AdminDashboardPage";
import OrderTrackingPage from "./components/OrderTrackingPage";
import OrderStatusPage from "./components/OrderStatusPage";
import LoginPage from "./components/LoginPage";
import AccountPage from "./components/AccountPage";
import AdminLoginPage from "./components/AdminLoginPage";
import { useAuth } from "./context/AuthContext";
import { apiGetRestaurantById } from "./services/apiService";
import { Restaurant } from "./types";
import PrivacyPolicy from "./components/TermsAndConditions";
import RefundPolicy from "./components/RefundPolicy";

// Routes that are "top-level" — they reset the brand session
const MAIN_ROUTES = new Set([
  "",
  "admin",
  "tracking",
  "login",
  "account",
  "admin-login",
  "terms",
  "refund",
]);

const getRoute = () => window.location.hash.replace(/^#/, "").split("?")[0];

const App: React.FC = () => {
  // Redirect from API subdomain
  useEffect(() => {
    if (window.location.hostname === "api.bongodelicacy.com") {
      window.location.href = `https://bongodelicacy.com${window.location.pathname}${window.location.hash}${window.location.search}`;
    }
  }, []);

  // Always initialise from the current hash — covers direct URL loads
  const [route, setRoute] = useState<string>(getRoute);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(false);

  const { currentUser } = useAuth();

  // Safety-net: re-read hash after first paint (Vite HMR / StrictMode edge-cases)
  useEffect(() => {
    const current = getRoute();
    setRoute(current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for ALL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const newRoute = getRoute();

      // Always update the displayed route
      setRoute(newRoute);

      // Only reset the brand session when navigating to a top-level route
      const isTopLevel =
        MAIN_ROUTES.has(newRoute) || newRoute.startsWith("order-status");

      if (isTopLevel) {
        setSelectedRestaurantId(null);
        setRestaurant(null);
      }

      window.scrollTo(0, 0);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleSelectRestaurant = (
    _petpoojaOutletId: string,
    resturentId: string,
    _outletId: string
  ) => {
    setSelectedRestaurantId(resturentId);
    window.scrollTo(0, 0);
  };

  const handleGoBack = () => {
    setSelectedRestaurantId(null);
    setRestaurant(null);
    window.location.hash = "";
    window.scrollTo(0, 0);
  };

  // Load restaurant data whenever the selected ID changes
  useEffect(() => {
    if (!selectedRestaurantId) return;

    setLoadingRestaurant(true);
    apiGetRestaurantById(selectedRestaurantId)
      .then((data) => setRestaurant(data))
      .catch((err) => {
        console.error("Failed to load restaurant:", err);
        setRestaurant(null);
      })
      .finally(() => setLoadingRestaurant(false));
  }, [selectedRestaurantId]);

  // ─── ROUTES ────────────────────────────────────────────────────────────────


  if (route === "admin-login") return <AdminLoginPage />;

  if (route === "admin") {
    if (currentUser?.isAdmin) return <AdminDashboardPage />;
    window.location.hash = "#admin";
    return null;
  }

  if (route === "tracking") return <OrderTrackingPage />;
  if (route === "login") return <LoginPage />;
  if (route === "account") return <AccountPage />;
  if (route.startsWith("order-status")) return <OrderStatusPage />;
  if (route === "terms") return <PrivacyPolicy />;
  if (route === "refund") return <RefundPolicy />;

  // ─── BRAND / LANDING FLOW ──────────────────────────────────────────────────

  if (!selectedRestaurantId) {
    return <LandingPage onSelectBrand={handleSelectRestaurant} />;
  }

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Loading restaurant…
      </div>
    );
  }

  if (!restaurant) {
    return <LandingPage onSelectBrand={handleSelectRestaurant} />;
  }

  return <BrandPage restId={selectedRestaurantId} onBack={handleGoBack} />;
};

export default App;
