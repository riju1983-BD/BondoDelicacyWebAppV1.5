import React, { useState, useEffect } from "react";
import bongoDelicacyLogo from "../src/assets/bongodelicacylogo.png";
import { useAuth } from "../context/AuthContext";
import HelpBuddyIcon from "./HelpBuddyIcon";
import HelpBuddyModal from "./HelpBuddyModal";
import { Icon } from "./Icon";
import { useOutlet } from "../context/OutletContext";
import {
  apiGetOutlet,
  apiResolveRestaurantByName,
} from "../services/apiService";
import { IMAGE_BASE_URL, SUPABASE_URL } from "../src/config";
interface LandingPageProps {
  onSelectBrand: (petpoojaOutletId: string, resturentId: string) => void;
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
  const { setOutletLocation } = useOutlet();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
  const [restaurantsError, setRestaurantsError] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [resolvedOutlet, setResolvedOutlet] = useState<any | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
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
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`,
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

  useEffect(() => {
    if (!location || restaurants.length === 0) return;

    const resolveNearest = async () => {
      try {
        // const firstRestaurant = restaurants[0]?.restaurants?.name;
        // if (!firstRestaurant) return;

        const resolved = await apiResolveRestaurantByName({
          restaurant_id: restaurants[0].restaurants.id,
          lat: location.lat,
          lng: location.lng,
        });

        setResolvedOutlet(resolved);

        // store for later flows (menu, checkout, etc.)
      } catch (e: any) {
        setResolveError(e.message || "No nearby outlet found");
      }
    };

    resolveNearest();
  }, [location, restaurants]);

  const loadRestaurants = async () => {
    if (isFirstLoad.current) {
      setIsLoadingRestaurants(true);
    }

    setRestaurantsError(null);
    try {
      const data = await apiGetOutlet();
      setRestaurants(Array.isArray(data?.data?.result) ? data.data.result : []);
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

      if (
        defaultAddress?.coordinates?.lat &&
        defaultAddress?.coordinates?.lng
      ) {
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
      },
    );
  }, [currentUser]);

  useEffect(() => {
    loadRestaurants();
  }, []);
  const closestOutlet = resolvedOutlet
    ? restaurants.find(
      (r) => r.petpooja_outlet_id === resolvedOutlet.petpooja_outlet_id,
    )
    : null;

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
          {/* {location && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-300">
                Location: {locationName ?? "Detecting location..."}
              </p>

              <p className="text-[11px] text-gray-400">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
            </div>
          )} */}

          {locationError && (
            <p className="text-xs text-red-400 mt-2">{locationError}</p>
          )}
        </div>
      </header>

      {/* BRANDS GRID */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-24 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoadingRestaurants ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
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
          ) : !resolvedOutlet ? (
            <div>
              {Array.from({ length: 1 }).map((_, i) => (
                <RestaurantCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            (() => {
              const outlet = restaurants.find(
                (r) =>
                  r.petpooja_outlet_id === resolvedOutlet.petpooja_outlet_id,
              );

              if (!outlet) {
                return (
                  <div className="col-span-full text-center text-gray-400 py-10">
                    No service available in your area
                  </div>
                );
              }

              const restaurant = outlet.restaurants;
              const closed = !outlet.is_active;

              const hero =
                restaurant.hero_image ||
                "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?q=80&w=2070";

              const logo =
                restaurant.logo || "https://placehold.co/160x60?text=Logo";

              return (
                <div
                  key={outlet.id}
                  onClick={() => {
                    if (closed) return;
                    const newLoc = {
                      lat: outlet.lat,
                      lng: outlet.long,
                    };
                    setOutletLocation(newLoc);

                    console.log("Outlet Latitude:", newLoc.lat);
                    console.log("Outlet Longitude:", newLoc.lng);


                    localStorage.setItem(
                      "selectedPetpoojaOutletId",
                      outlet.petpooja_outlet_id,
                    );
                    localStorage.setItem(
                      "selectedRestaurantId",
                      outlet.restaurants.id,
                    );
                    localStorage.setItem("SelectedOuletId", outlet.id);
                    onSelectBrand(
                      outlet.petpooja_outlet_id,
                      outlet.restaurants.id,
                      outlet.id,
                    );
                  }}
                  className={[
                    "group relative h-[320px] rounded-2xl overflow-hidden transition-all duration-500 shadow-xl",
                    closed
                      ? "cursor-not-allowed grayscale"
                      : "cursor-pointer transform hover:-translate-y-2",
                  ].join(" ")}
                >
                  {/* Background image */}
                  <div className="absolute inset-0">
                    <img
                      src={`${SUPABASE_URL}/${IMAGE_BASE_URL}/restaurant-images/${hero}`}
                      alt={restaurant.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />
                  </div>

                  {/* Closed badge */}
                  {closed && (
                    <div className="absolute top-4 right-4 z-20 text-xs font-semibold px-3 py-1 rounded-full bg-red-600/90 text-white">
                      Closed
                    </div>
                  )}

                  {/* Content */}
                  <div className="absolute inset-0 p-5 flex flex-col justify-end">
                    <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                      <img
                        src={`${SUPABASE_URL}/${IMAGE_BASE_URL}/restaurant-images/${logo}`}
                        alt={`${restaurant.name} logo`}
                        className="h-10 w-auto mb-3 bg-white/10 rounded px-2 py-1"
                      />

                      <h3 className="text-2xl font-serif font-bold text-white mb-2">
                        {restaurant.name}
                      </h3>

                      <div className="h-1 w-16 bg-cyan-500 mb-3 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />

                      <p className="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75 line-clamp-3">
                        {restaurant.tagline || restaurant.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-950 py-12 text-center text-gray-500">
        <p>
          © {new Date().getFullYear()} Bongo Delicacy Group. All rights
          reserved.
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={() => window.open("#admin-login", "_blank")}
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
