import React, { useState, useEffect } from "react";
import bongoDelicacyLogo from "../src/assets/bongodelicacylogo.png";
import { useAuth } from "../context/AuthContext";
import HelpBuddyIcon from "./HelpBuddyIcon";
import HelpBuddyModal from "./HelpBuddyModal";
import { Icon } from "./Icon";
import { apiGetRestaurants, apiResolveRestaurantByName } from "../services/apiService";

interface LandingPageProps {
  onSelectBrand: (brandId: string) => void;
}

/** Skeleton card */
const RestaurantCardSkeleton: React.FC = () => {
  return (
    <div className="group relative h-[350px] rounded-2xl overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80" />

      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        <div className="space-y-3">
          <div className="h-12 w-32 rounded bg-white/10 animate-pulse" />
          <div className="h-6 w-44 rounded bg-white/10 animate-pulse" />
          <div className="h-1 w-16 rounded bg-cyan-500/50" />

          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-white/10 animate-pulse" />
          </div>

          <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onSelectBrand }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const [isHelpBuddyOpen, setIsHelpBuddyOpen] = useState(false);
  const isFirstLoad = React.useRef(true);

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
  const [restaurantsError, setRestaurantsError] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const handleNavigate = (hash: string) => {
    window.location.hash = hash;
  };

  // Normalize isclosed to real boolean (covers true/false, 1/0, "true"/"false")

  useEffect(() => {
    if (!location) return;

    const fetchLocationName = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`
        );
        const data = await res.json();

        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.suburb ||
          "";

        const state = data.address?.state || "";
        const country = data.address?.country || "";

        setLocationName([city, state, country].filter(Boolean).join(", "));
      } catch {
        setLocationName(null);
      }
    };

    fetchLocationName();
  }, [location]);


  const loadRestaurants = async () => {
    if (isFirstLoad.current) {
      setIsLoadingRestaurants(true);
    }

    setRestaurantsError(null);
    try {
      const data = await apiGetRestaurants();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRestaurantsError(e?.message || "Failed to load restaurants");
      setRestaurants([]);
    } finally {
      if (isFirstLoad.current) {
        setIsLoadingRestaurants(false);
        isFirstLoad.current = false;
      }
    }
  };

  useEffect(() => {
    // 1️⃣ If user is logged in and has default address → use it
    if (currentUser?.addresses?.length) {
      const defaultAddress =
        currentUser.addresses.find((a) => a.isDefault) ||
        currentUser.addresses[0];

      if (defaultAddress?.coordinates?.lat && defaultAddress?.coordinates?.lng) {
        setLocation({
          lat: defaultAddress.coordinates.lat,
          lng: defaultAddress.coordinates.lng,
        });
        return; // ⛔ do NOT ask browser for GPS
      }
    }

    // 2️⃣ Otherwise fallback to browser location
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setLocationError("Location permission denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [currentUser]);


  useEffect(() => {
    loadRestaurants();

    // refresh to reflect isclosed updates
    const t = setInterval(() => {
      loadRestaurants();
    }, 5000);

    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* FIXED NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-900/90 backdrop-blur-md z-50 border-b border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => window.location.reload()}
          >
            <img
              src={bongoDelicacyLogo}
              alt="Bongo Delicacy Logo"
              className="h-20 w-auto sm:h-26"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-cyan-500 leading-none">
                Bongo
              </h1>
              <span className="text-sm sm:text-base font-light text-gray-300 tracking-widest">
                DELICACY
              </span>
            </div>
          </div>

          {/* Auth Button & Order Tracking */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleNavigate("#tracking")}
              className="hidden sm:flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors"
            >
              <Icon type="calendar" className="w-5 h-5" />
              <span className="text-sm font-semibold">Track Reservation</span>
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => handleNavigate("#account")}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-full font-semibold transition-all shadow-md hover:shadow-cyan-500/20"
              >
                <Icon type="user" className="w-5 h-5" />
                <span className="hidden sm:inline">
                  {currentUser?.name?.split(" ")[0] || "My"}&apos;s Account
                </span>
                <span className="sm:hidden">Account</span>
              </button>
            ) : (
              <button
                onClick={() => handleNavigate("#login")}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-full font-semibold transition-all shadow-md hover:shadow-cyan-500/20"
              >
                <Icon type="user" className="w-5 h-5" />
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative h-[60vh] flex items-center justify-center overflow-hidden mt-16">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1593560704563-f176a2eb61db?q=80&w=2070&auto=format&fit=crop"
            alt="Bengali Spices"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 animate-fade-in">
          <h2 className="text-5xl md:text-7xl font-serif font-bold mb-6">
            Experience the <span className="text-cyan-500">Essence</span> of
            Bengal
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
            A curated collective of authentic culinary brands, bringing the soul
            of Kolkata to your plate.
          </p>
          {location && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-300">
                Location: {locationName ?? "Detecting location..."}
              </p>

              <p className="text-[11px] text-gray-400">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
            </div>
          )}

          {locationError && (
            <p className="text-xs text-red-400 mt-2">
              {locationError}
            </p>
          )}
        </div>
      </header>

      {/* BRANDS GRID */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-24 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoadingRestaurants ? (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <RestaurantCardSkeleton key={i} />
              ))}
            </>
          ) : restaurantsError ? (
            <div className="col-span-full text-center text-red-400 py-10">
              {restaurantsError}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="col-span-full text-center text-gray-400 py-10">
              No restaurants found.
            </div>
          ) : (
            restaurants.map((r) => {
              const hero =
                r.hero_image ||
                "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?q=80&w=2070&auto=format&fit=crop";

              const logo =
                r.logo?.trim?.() && r.logo.length > 0
                  ? r.logo
                  : "https://placehold.co/160x60?text=Logo";



              return (
                <div
                  key={r.rest_id}
                  onClick={async () => {
                    if (!location) return;

                    try {
                      const resolved = await apiResolveRestaurantByName({
                        restaurant_name: r.name,
                        lat: location.lat,
                        lng: location.lng,
                      });

                      // resolved.menusharing_id comes from backend
                      localStorage.setItem(
                        "selectedRestaurantId",
                        resolved.rest_id
                      );

                      onSelectBrand(resolved.rest_id);
                    } catch (err: any) {
                      alert(err.message || "No open outlet nearby");
                    }
                  }}

                  className={[
                    "group relative h-[350px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500",
                    closed
                      ? "cursor-not-allowed pointer-events-none grayscale"
                      : "cursor-pointer transform hover:-translate-y-2",
                  ].join(" ")}
                  aria-disabled={closed}
                  role="button"
                  tabIndex={closed ? -1 : 0}
                >
                  <div className="absolute inset-0">
                    <img
                      src={hero}
                      alt={r.name}
                      className={[
                        "w-full h-full object-cover transition-transform duration-700",
                        closed ? "" : "group-hover:scale-110",
                      ].join(" ")}
                    />

                    {/* shadow overlay only when closed */}
                    {closed ? (
                      <div className="absolute inset-0 bg-black/70" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                    )}
                  </div>

                  {/* CLOSED badge */}
                  {closed && (
                    <div className="absolute top-4 right-4 z-20 text-xs font-semibold px-3 py-1 rounded-full bg-red-600/90">
                      Closed
                    </div>
                  )}

                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div
                      className={
                        closed
                          ? ""
                          : "transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
                      }
                    >
                      <img
                        src={logo}
                        alt={`${r.name} logo`}
                        className="h-12 w-auto mb-4 opacity-90 bg-white/10 rounded px-2 py-1"
                      />

                      <h3 className="text-2xl font-serif font-bold text-white mb-2">
                        {r.name}
                      </h3>

                      <div
                        className={[
                          "h-1 w-16 mb-3 origin-left duration-500",
                          closed
                            ? ""
                            : "transform scale-x-0 group-hover:scale-x-100 transition-transform",
                        ].join(" ")}
                        style={{ backgroundColor: r.theme_accent || "#06B6D4" }}
                      />

                      <p
                        className={
                          closed
                            ? "text-gray-300 text-sm line-clamp-3"
                            : "text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 line-clamp-3"
                        }
                      >
                        {r.tagline || r.description || ""}
                      </p>

                      <p
                        className={
                          closed
                            ? "text-xs text-gray-400 mt-2 font-mono"
                            : "text-xs text-gray-400 mt-2 font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-150"
                        }
                      >
                        {r.rest_id}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-950 py-12 text-center text-gray-500">
        <p>
          © {new Date().getFullYear()} Bongo Delicacy Group. All rights reserved.
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={() => handleNavigate("#admin-login")}
            className="text-xs hover:text-gray-300 transition-colors"
          >
            Admin Login
          </button>
        </div>
      </footer>

      {/* HELP BUDDY */}
      <HelpBuddyIcon onClick={() => setIsHelpBuddyOpen(true)} />
      <HelpBuddyModal
        isOpen={isHelpBuddyOpen}
        onClose={() => setIsHelpBuddyOpen(false)}
      />
    </div>
  );
};

export default LandingPage;







