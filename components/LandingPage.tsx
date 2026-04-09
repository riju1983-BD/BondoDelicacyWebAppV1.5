import React, { useState, useEffect, useCallback } from "react";
import bongoDelicacyLogo from "../src/assets/bongodelicacylogo.png";
import { useAuth } from "../context/AuthContext";
import HelpBuddyIcon from "./HelpBuddyIcon";
import HelpBuddyModal from "./HelpBuddyModal";
import { Icon } from "./Icon";
import { useOutlet } from "../context/OutletContext";
import { apiGetBrandsWithOutlet } from "../services/apiService";
import { IMAGE_BASE_URL, SUPABASE_URL } from "../src/config";
import { useCart } from "../context/CartContext"; // ✅ Added

interface LandingPageProps {
  onSelectBrand: (petpoojaOutletId: string, resturentId: string, outletId: string) => void;
}

function toUTCDate(raw: string): Date {
  const s = raw.trim();
  if (s.endsWith("Z") || s.includes("+")) return new Date(s);
  return new Date(s.replace(" ", "T") + "Z");
}

function isStillClosedUntil(outlet_open_date_time: string | null | undefined): boolean {
  if (!outlet_open_date_time) return false;
  return Date.now() < toUTCDate(outlet_open_date_time).getTime();
}

function formatISTTime(outlet_open_date_time: string): string {
  return toUTCDate(outlet_open_date_time).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function isOutletDisabled(outlet: any): boolean {
  if (outlet.is_active) return false;
  if (outlet.outlet_open_date_time) {
    if (Date.now() >= toUTCDate(outlet.outlet_open_date_time).getTime()) {
      return false;
    }
  }
  return true;
}

const RestaurantCardSkeleton: React.FC = () => (
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

const HamburgerIcon: React.FC<{ open: boolean; onClick: () => void }> = ({ open, onClick }) => (
  <button
    onClick={onClick}
    className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-gray-800 transition-colors"
    aria-label="Toggle menu"
  >
    <span className={`block h-0.5 w-5 bg-gray-300 transition-all duration-300 origin-center ${open ? "rotate-45 translate-y-2" : ""}`} />
    <span className={`block h-0.5 w-5 bg-gray-300 transition-all duration-300 ${open ? "opacity-0 scale-x-0" : ""}`} />
    <span className={`block h-0.5 w-5 bg-gray-300 transition-all duration-300 origin-center ${open ? "-rotate-45 -translate-y-2" : ""}`} />
  </button>
);

const ClosedBadge: React.FC<{ outlet_open_date_time?: string | null }> = ({ outlet_open_date_time }) => {
  const opensAt =
    outlet_open_date_time && isStillClosedUntil(outlet_open_date_time)
      ? formatISTTime(outlet_open_date_time)
      : null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/60 backdrop-blur-[2px] rounded-2xl">
      <span className="bg-red-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg mb-2">
        Closed
      </span>
      {opensAt && (
        <span className="text-gray-300 text-xs">
          Opens at{" "}
          <span className="text-cyan-400 font-semibold">{opensAt}</span>
        </span>
      )}
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onSelectBrand }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const [isHelpBuddyOpen, setIsHelpBuddyOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isFirstLoad = React.useRef(true);
  const { setOutletLocation } = useOutlet();
  const { switchRestaurant } = useCart(); // ✅ Added
  const selectedAddress = currentUser?.addresses?.find((a: any) => a.isDefault)
    || currentUser?.addresses?.[0];

  const selectedLat = selectedAddress?.coordinates?.lat;
  const selectedLng = selectedAddress?.coordinates?.lng;
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationPending, setLocationPending] = useState(true);
  const locationResolved = React.useRef(false);
  const locationRef = React.useRef<{ lat: number; lng: number } | null>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoadingOutlets, setIsLoadingOutlets] = useState(false);
  const [outletsError, setOutletsError] = useState<string | null>(null);

  const hasFetched = React.useRef(false);

  const handleNavigate = (hash: string) => {
    setIsDrawerOpen(false);
    window.location.hash = hash;
  };

  useEffect(() => { locationRef.current = location; }, [location]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setIsDrawerOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!location) return;
    const fetchLocationName = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`
        );
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || "";
        const state = data.address?.state || "";
        const country = data.address?.country || "";
        setLocationName([city, state, country].filter(Boolean).join(", "));
      } catch { setLocationName(null); }
    };
    fetchLocationName();
  }, [location]);

  useEffect(() => {
  // ✅ LOGIN USER → use selected address
  if (isAuthenticated && selectedLat && selectedLng) {
    setLocation({ lat: selectedLat, lng: selectedLng });
    setLocationPending(false);
    return;
  }

  // ✅ LOGOUT USER → use browser GPS
  if (!navigator.geolocation) {
    setLocationPending(false);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
      setLocationPending(false);
    },
    () => {
      setLocationPending(false);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );

}, [isAuthenticated, selectedLat, selectedLng]);

  const loadOutlets = useCallback(async (coords: { lat: number; lng: number } | null) => {
    locationResolved.current = true;
    setOutletsError(null);
    setIsLoadingOutlets(true);

    try {
      const data = await apiGetBrandsWithOutlet(coords ?? undefined);
      const result = data?.data;

      if (Array.isArray(result)) {
        setBrands(result);
      } else {
        setBrands([]);
      }

    } catch (e: any) {
      setOutletsError(e?.message || "Failed to load brands");
      setBrands([]);
    } finally {
      hasFetched.current = true;
      setIsLoadingOutlets(false);
      isFirstLoad.current = false;
    }
  }, []);

  useEffect(() => {
    if (locationPending) return;
    if (locationResolved.current) return;
    loadOutlets(location);
  }, [locationPending, location, loadOutlets]);

  useEffect(() => {
    const refresh = () => { locationResolved.current = false; loadOutlets(locationRef.current); };
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadOutlets]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  const showSkeleton = locationPending || isLoadingOutlets || !hasFetched.current;

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-900/90 backdrop-blur-md z-50 border-b border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
            <img src={bongoDelicacyLogo} alt="Bongo Delicacy Logo" className="h-12 sm:h-16 lg:h-20 w-auto" />
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-cyan-500 leading-none">Bongo</h1>
              <span className="text-sm sm:text-base font-light text-gray-300 tracking-widest">DELICACY</span>
            </div>
          </div>
          {location && (
            <div className="text-[10px] text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
              📍 Current: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </div>
          )}
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            {locationName && (
              <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                <Icon type="map-pin" className="w-3 h-3 text-cyan-500" />
                {locationName}
              </span>
            )}
            <button onClick={() => handleNavigate("#terms")} className="text-gray-300 hover:text-cyan-400 transition-colors text-sm font-semibold">Privacy Policy</button>
            <button onClick={() => handleNavigate("#refund")} className="text-gray-300 hover:text-cyan-400 transition-colors text-sm font-semibold">Refund Policy</button>
            <button onClick={() => handleNavigate("#tracking")} className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors">
              <Icon type="calendar" className="w-5 h-5" />
              <span className="text-sm font-semibold">Track Reservation</span>
            </button>
            {isAuthenticated ? (
              <button onClick={() => handleNavigate("#account")} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-full font-semibold transition-all shadow-md hover:shadow-cyan-500/20">
                <Icon type="user" className="w-5 h-5" />
                <span>{currentUser?.name?.split(" ")[0] || "My"}&apos;s Account</span>
              </button>
            ) : (
              <button onClick={() => handleNavigate("#login")} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-full font-semibold transition-all shadow-md hover:shadow-cyan-500/20">
                <Icon type="user" className="w-5 h-5" />
                Login
              </button>
            )}
          </div>

          {/* Mobile: Login + Hamburger */}
          <div className="flex md:hidden items-center gap-3">
            {isAuthenticated ? (
              <button onClick={() => handleNavigate("#account")} className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold transition-all">
                <Icon type="user" className="w-4 h-4" />
                Account
              </button>
            ) : (
              <button onClick={() => handleNavigate("#login")} className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-all">
                <Icon type="user" className="w-4 h-4" />
                Login
              </button>
            )}
            <HamburgerIcon open={isDrawerOpen} onClick={() => setIsDrawerOpen((p) => !p)} />
          </div>
        </div>

        {/* Mobile Drawer */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isDrawerOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}>
          <div className="border-t border-gray-800 bg-gray-900/98 backdrop-blur-md px-4 py-3 flex flex-col gap-1">
            {locationName && (
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-800 px-3 py-2 rounded-lg mb-1">
                <Icon type="map-pin" className="w-3 h-3 text-cyan-500 shrink-0" />
                <span className="truncate">{locationName}</span>
              </div>
            )}
            <button onClick={() => handleNavigate("#tracking")} className="flex items-center gap-3 w-full text-left text-gray-300 hover:text-cyan-400 hover:bg-gray-800 px-3 py-3 rounded-lg transition-colors text-sm font-semibold">
              <Icon type="calendar" className="w-5 h-5 shrink-0 text-cyan-500" />
              Track Reservation
            </button>
            <div className="h-px bg-gray-800 my-1" />
            <button onClick={() => handleNavigate("#terms")} className="flex items-center gap-3 w-full text-left text-gray-300 hover:text-cyan-400 hover:bg-gray-800 px-3 py-3 rounded-lg transition-colors text-sm font-semibold">
              <span className="w-5 h-5 flex items-center justify-center text-base shrink-0">🔒</span>
              Privacy Policy
            </button>
            <button onClick={() => handleNavigate("#refund")} className="flex items-center gap-3 w-full text-left text-gray-300 hover:text-cyan-400 hover:bg-gray-800 px-3 py-3 rounded-lg transition-colors text-sm font-semibold">
              <span className="w-5 h-5 flex items-center justify-center text-base shrink-0">↩️</span>
              Refund Policy
            </button>
            <div className="h-px bg-gray-800 my-1" />
            <button onClick={() => { setIsDrawerOpen(false); window.open("#admin-login", "_blank"); }} className="flex items-center gap-3 w-full text-left text-gray-500 hover:text-gray-300 hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors text-xs">
              Admin Login
            </button>
          </div>
        </div>
      </nav>

      {/* Backdrop */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setIsDrawerOpen(false)} />
      )}

      {/* HERO */}
      <header className="relative h-[60vh] flex items-center justify-center overflow-hidden mt-16">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1593560704563-f176a2eb61db?q=80&w=2070&auto=format&fit=crop"
            alt="Bengali Spices"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h2 className="text-5xl md:text-7xl font-serif font-bold mb-6">
            Experience the <span className="text-cyan-500">Essence</span> of Bengal
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
            A curated collective of authentic culinary brands, bringing the soul of Kolkata to your plate.
          </p>
        </div>
      </header>

      {/* BRANDS GRID */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-24 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {showSkeleton ? (
            Array.from({ length: 4 }).map((_, i) => <RestaurantCardSkeleton key={i} />)

          ) : outletsError ? (
            <div className="col-span-full text-center text-red-400 py-10">{outletsError}</div>

          ) : brands.length === 0 ? (
            <div className="col-span-full text-center text-gray-400 py-10">No brands found.</div>

          ) : (
            brands.map((brand) => {
              const disabled = brand.is_closed;
              const outlet = brand.selected_outlet;

              const hero = brand.hero_image
                ? `${SUPABASE_URL}/${IMAGE_BASE_URL}/restaurant-images/${brand.hero_image}`
                : "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?q=80&w=2070";

              const logo = brand.logo
                ? `${SUPABASE_URL}/${IMAGE_BASE_URL}/restaurant-images/${brand.logo}`
                : null;

              return (
                <div
                  key={brand.id}
                  onClick={() => {
                    if (disabled || !outlet) return;

                    setOutletLocation({ lat: outlet.lat, lng: outlet.long });

                    // clear cart if switching outlet
                    switchRestaurant(outlet.outlet_id);

                    localStorage.setItem("selectedPetpoojaOutletId", outlet.petpooja_outlet_id);
                    localStorage.setItem("selectedRestaurantId", outlet.resturent_id);
                    localStorage.setItem("SelectedOuletId", outlet.outlet_id);

                    onSelectBrand(
                      outlet.petpooja_outlet_id,
                      outlet.resturent_id,
                      outlet.outlet_id
                    );
                  }}
                  className={[
                    "group relative h-[320px] rounded-2xl overflow-hidden transition-all duration-500 shadow-xl transform",
                    disabled
                      ? "cursor-not-allowed opacity-75 grayscale"
                      : "cursor-pointer hover:-translate-y-2 hover:shadow-2xl",
                  ].join(" ")}
                >

                  <div className="absolute inset-0">
                    <img
                      src={hero}
                      alt={brand.brand_name}
                      className={`w-full h-full object-cover transition-transform duration-700 ${!disabled ? "group-hover:scale-110" : ""
                        }`}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />
                  </div>

                  {disabled && (
                    <ClosedBadge />
                  )}

                  <div className="absolute inset-0 p-5 flex flex-col justify-end">
                    <div className={`transform transition-transform duration-500 ${!disabled ? "translate-y-2 group-hover:translate-y-0" : ""
                      }`}>

                      {logo && (
                        <img
                          src={logo}
                          alt={`${brand.brand_name} logo`}
                          className="h-10 w-auto mb-3 bg-white/10 rounded px-2 py-1"
                        />
                      )}

                      <h3 className="text-2xl font-serif font-bold text-white mb-2">
                        {brand.brand_name}
                      </h3>
                      {outlet?.city && (
                        <p className="text-xs text-gray-400 mt-1">
                          {outlet.city}
                        </p>
                      )}
                      {!disabled && (
                        <>
                          <div className="h-1 w-16 bg-cyan-500 mb-3 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                          <p className="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75 line-clamp-3">
                            {brand.tagline || brand.description}
                          </p>
                        </>
                      )}
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
        <p>© {new Date().getFullYear()} Bongo Delicacy Group. All rights reserved.</p>
        <div className="mt-4 flex justify-center gap-6">
          <button onClick={() => handleNavigate("#terms")} className="text-xs hover:text-gray-300 transition-colors">Privacy Policy</button>
          <button onClick={() => handleNavigate("#refund")} className="text-xs hover:text-gray-300 transition-colors">Refund Policy</button>
          <button onClick={() => window.open("#admin-login", "_blank")} className="text-xs hover:text-gray-300 transition-colors">Admin Login</button>
        </div>
      </footer>

      <HelpBuddyIcon onClick={() => setIsHelpBuddyOpen(true)} />
      <HelpBuddyModal isOpen={isHelpBuddyOpen} onClose={() => setIsHelpBuddyOpen(false)} />
    </div>
  );
};

export default LandingPage;
