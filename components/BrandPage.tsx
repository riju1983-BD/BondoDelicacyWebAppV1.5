import React, { useState, useEffect, useMemo } from "react";
import {
  MenuCategory,
  CartItem,
  RestaurantMenu,
  RestaurantTable,
} from "../types";
import { Icon } from "./Icon";
import { useCart } from "../context/CartContext";
import CartModal from "./CartModal";
import { useAuth } from "../context/AuthContext";
import {
  apiCreateReservation,
  apiGetAvailableTables,
  apiSendReservationOTP,
  apiVerifyReservationOTP,
  apiGetMenu,
  apiGetCategories,
  getMealRecommendation,
  apiGetRestaurantById, // ✅ must exist in apiService
} from "../services/apiService";
import { ItemData } from "@/model/menu_list";
import AddonModal, { EnrichedItemData } from "./AddonModal";
import { IMAGE_BASE_URL, SUPABASE_URL } from "../src/config";
const buildCartKey = (item: any) => {
  const variationPart = item.selectedVariation?.variationid ?? "no-variation";

  const addonsArray = item.selectedAddons
    ? Object.values(item.selectedAddons).flat()
    : [];

  const addonPart =
    addonsArray.length > 0
      ? addonsArray
        .map((a: any) => `${a.id}:${a.quantity}`)
        .sort()
        .join("|")
      : "no-addons";

  return `${item.itemid}__${variationPart}__${addonPart}`;
};

const ShimmerCard: React.FC = () => (
  <div className="animate-pulse bg-gray-900 rounded-lg overflow-hidden shadow-md">
    <div className="h-48 bg-gray-700 w-full"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      <div className="h-3 bg-gray-700 rounded w-full"></div>
      <div className="h-3 bg-gray-700 rounded w-5/6"></div>
    </div>
  </div>
);

const CategoryShimmer: React.FC = () => (
  <div className="flex justify-center flex-wrap gap-2 mb-10">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="h-10 w-24 rounded-md bg-gray-700 animate-pulse"
      ></div>
    ))}
  </div>
);

const Spinner: React.FC<{ className?: string }> = ({
  className = "h-5 w-5",
}) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const ChefRecommenderModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
}> = ({ isOpen, onClose, restaurantId, restaurantName }) => {
  const [preferences, setPreferences] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetRecommendation = async () => {
    if (!preferences.trim()) {
      setError("Please tell us what you are in the mood for!");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await getMealRecommendation(restaurantId, preferences);
      setRecommendation(result.recommendation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setPreferences("");
      setRecommendation("");
      setError("");
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-3">
            <Icon
              type="chef-hat"
              className="w-8 h-8 text-[var(--accent-color)]"
            />
            <h2 className="text-2xl font-serif text-white">
              Chef&apos;s Recommendation
            </h2>
          </div>

          <p className="mt-2 text-gray-400">
            Tell me what you&apos;re craving, and I&apos;ll suggest the perfect
            dish from {restaurantName}.
          </p>

          <textarea
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="e.g., 'something spicy and vegetarian'"
            className="mt-4 w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"
            rows={3}
          />

          <button
            onClick={handleGetRecommendation}
            disabled={isLoading}
            style={{
              backgroundColor: "var(--primary-color)",
              color: "var(--text-on-primary-color)",
            }}
            className="mt-4 w-full flex items-center justify-center gap-2 font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-500 hover:opacity-90"
          >
            {isLoading ? <Spinner /> : <Icon type="star" className="w-5 h-5" />}{" "}
            Ask the Chef
          </button>

          {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
          {recommendation && (
            <div className="mt-4 p-4 bg-gray-700 rounded-md border border-[var(--primary-color)]/50">
              <p className="text-white">{recommendation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CartIcon: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { itemCount } = useCart();
  if (itemCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-[var(--primary-color)] text-[var(--text-on-primary-color)] w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-50 hover:scale-110 transition-transform"
      aria-label={`View cart with ${itemCount} items`}
    >
      <Icon type="shopping-cart" className="w-8 h-8" />
      <span className="absolute -top-1 -right-1 bg-[var(--accent-color)] text-gray-900 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-[var(--primary-color)]">
        {itemCount}
      </span>
    </button>
  );
};

// ✅ Better TableMap - shows booked/small tables as disabled with reason
const TableMap: React.FC<{
  tables: RestaurantTable[];
  selectedTableId: string | undefined;
  onSelect: (id: string) => void;
}> = ({ tables, selectedTableId, onSelect }) => {
  if (tables.length === 0)
    return (
      <div className="text-center p-6 bg-gray-700/50 rounded-md border border-dashed border-gray-600 text-gray-400">
        No tables found. Please try another time.
      </div>
    );

  return (
    <>
      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-400 mb-3">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />{" "}
          Available
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />{" "}
          Booked
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-600 inline-block" />{" "}
          Too Small
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
        {tables.map((table) => {
          const isAvailable = table._status === "available";
          const isBooked = table._status === "booked";
          const isTooSmall = table._status === "too_small";
          const isSelected = selectedTableId === table.id && isAvailable;

          return (
            <button
              key={table.id}
              type="button"
              disabled={!isAvailable}   // 🔥 only available can be clicked
              onClick={() => isAvailable && onSelect(table.id)}
              className={`
        p-4 rounded-lg border-2 flex flex-col items-center justify-center transition-all relative

        ${isBooked ? "opacity-60 cursor-not-allowed border-red-500 bg-red-900/20" : ""}
        ${isTooSmall ? "opacity-60 cursor-not-allowed border-yellow-700 bg-yellow-900/10" : ""}
        ${isSelected ? "border-green-500 bg-green-900/20 scale-105 shadow-lg" : ""}
        ${isAvailable && !isSelected ? "border-gray-600 bg-gray-800 hover:border-green-500 hover:bg-gray-700" : ""}
      `}
            >
              {/* Status dot */}
              <span
                className={`
                absolute top-2 right-2 w-2.5 h-2.5 rounded-full
                ${isBooked ? "bg-red-500" : isTooSmall ? "bg-yellow-600" : isSelected ? "bg-[var(--accent-color)]" : "bg-green-500"}
              `}
              />

              <Icon
                type="users"
                className={`w-8 h-8 mb-2 ${isBooked
                  ? "text-red-400"
                  : isTooSmall
                    ? "text-yellow-600"
                    : isSelected
                      ? "text-[var(--accent-color)]"
                      : "text-green-400"
                  }`}
              />
              <span className="font-semibold text-white text-sm">
                {table.name}
              </span>
              <span className="text-xs text-gray-400">
                {table.capacity} Seats
              </span>

              {isBooked && (
                <span className="mt-1 text-xs text-red-400 font-semibold">
                  Booked
                </span>
              )}
              {isTooSmall && (
                <span className="mt-1 text-xs text-yellow-500 font-semibold">
                  Too Small
                </span>
              )}
              {isSelected && (
                <span className="mt-1 text-xs text-[var(--accent-color)] font-semibold">
                  Selected ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};
interface BrandPageProps {
  onBack: () => void;
}

const BrandPage: React.FC<BrandPageProps> = ({ onBack }) => {
  const id = localStorage.getItem("selectedRestaurantId") || "";
  console.log(id);

  // ✅ rest id comes from landing page selection
  const restId = localStorage.getItem("selectedPetpoojaOutletId") || "";
  console.log(restId);
  const outletid = localStorage.getItem("SelectedOuletId") || "";
  console.log(outletid, "outletid");
  const [restaurant, setRestaurant] = useState<any>(null);
  const [restaurantLoading, setRestaurantLoading] = useState(true);
  const [restaurantError, setRestaurantError] = useState<string>("");

  const [menuData, setMenuData] = useState<MenuCategory[]>([]);
  const [menuCache, setMenuCache] = useState<Record<string, RestaurantMenu[]>>(
    {},
  );
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [isRecommenderOpen, setIsRecommenderOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addonItem, setAddonItem] = useState<
    EnrichedItemData | ItemData | null
  >(null);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [isMenuChanging, setIsMenuChanging] = useState(false);
  const [isInitialMenuLoading, setIsInitialMenuLoading] = useState(true);

  const { addItem, switchRestaurant } = useCart();

  const { currentUser } = useAuth();
  useEffect(() => {
    if (id) {
      switchRestaurant(id);
    }
  }, [restId]);
  const [resStep, setResStep] = useState<1 | 2 | 3 | 4>(1);
  const [resForm, setResForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    end_time: "",
    guests: 2,
    requests: "",
    tableId: "",
  });
  const [availableTables, setAvailableTables] = useState<RestaurantTable[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resError, setResError] = useState("");
  const [lastReservationId, setLastReservationId] = useState<string | null>(
    null,
  );
  const [isBooking, setIsBooking] = useState(false);

  // ✅ load restaurant details
  useEffect(() => {
    if (!id) {
      setRestaurantError(
        "Restaurant not selected. Please go back and choose a restaurant.",
      );
      setRestaurant(null);
      setRestaurantLoading(false);
      return;
    }

    loadRestaurant();
  }, [id]);
  const loadRestaurant = async () => {
    console.log("hii");

    setRestaurantLoading(true);
    setRestaurantError("");

    try {
      const r = await apiGetRestaurantById(id);
      console.log(r);
      // ✅ ACTUAL CALL
      setRestaurant(r.data);
    } catch (e: any) {
      setRestaurantError(e?.message || "Failed to load restaurant");
      setRestaurant(null);
    } finally {
      setRestaurantLoading(false);
    }
  };
  // ✅ load categories + first menu
  useEffect(() => {
    const loadMenu = async () => {
      if (!restId) return;

      setIsInitialMenuLoading(true);
      try {
        const cats = await apiGetCategories(restId);
        setCategories(cats || []);

        if (cats?.length > 0) {
          setActiveCategory(cats[0].id);

          const items = await apiGetMenu(restId, cats[0].id);

          setMenuCache((prev) => ({ ...prev, [cats[0].id]: items }));
          setMenuData([
            { category: cats[0].name, category_id: cats[0].id, items },
          ]);
        } else {
          setMenuData([]);
        }
      } catch (e) {
        console.error(e);
        setMenuData([]);
      } finally {
        setIsInitialMenuLoading(false);
      }
    };

    loadMenu();
  }, [restId]);
  // ✅ Refresh current menu when user comes back to the tab/app (no polling)
  useEffect(() => {
    if (!restId || !activeCategory) return;

    const refreshCurrentCategory = async () => {
      try {
        const currentCat = categories.find((c) => c.id === activeCategory);
        const items = await apiGetMenu(restId, activeCategory);

        setMenuCache((prev) => ({ ...prev, [activeCategory]: items }));

        // update what you're rendering (menuData)
        if (currentCat) {
          setMenuData([
            { category: currentCat.name, category_id: activeCategory, items },
          ]);
        } else {
          setMenuData([
            {
              category: currentCat?.name || "Menu",
              category_id: activeCategory,
              items,
            },
          ]);
        }
      } catch {
        // ignore
      }
    };

    const onFocus = () => refreshCurrentCategory();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshCurrentCategory();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [restId, activeCategory, categories]);

  const handleCategoryChange = async (cat: any) => {
    setActiveCategory(cat.id);
    setIsMenuChanging(true);

    try {
      const items = await apiGetMenu(restId, cat.id);
      setMenuCache((prev) => ({ ...prev, [cat.id]: items })); // keep cache updated
      setMenuData([{ category: cat.name, category_id: cat.id, items }]);
    } finally {
      setIsMenuChanging(false);
    }
  };

  const filteredMenu = useMemo(() => {
    if (!searchQuery.trim()) return menuData;
    const q = searchQuery.toLowerCase();
    return menuData
      .map((cat: any) => ({
        ...cat,
        items: cat.items.filter(
          (i: any) =>
            (i.itemname || "").toLowerCase().includes(q) ||
            (i.itemdescription || "").toLowerCase().includes(q),
        ),
      }))
      .filter((cat: any) => cat.items.length > 0);
  }, [searchQuery, menuData]);

  const handleAddToCart = (item: any) => {
    const cartKey = buildCartKey(item);

    const flatAddons = item.selectedAddons
      ? Object.values(item.selectedAddons).flat()
      : [];

    const cartItem: CartItem = {
      // 🔒 FORCE canonical fields
      itemid: item.itemid,
      itemname: item.itemname,
      itemdescription: item.itemdescription,
      item_image_url: item.item_image_url,

      // keep everything else
      ...item,

      cartKey,
      quantity: 1,

      variation_id: item.selectedVariation?.variationid || "",
      variation_name: item.selectedVariation?.name || "",

      selected_addons: flatAddons,

      unit_price: item.computed?.final_price ?? Number(item.price || 0),
      base_price: item.computed?.base_price ?? Number(item.price || 0),
      addon_price: item.computed?.addon_price ?? 0,
    };

    addItem(cartItem);
  };

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 11; hour <= 22; hour++)
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
    return slots;
  }, []);

  const today = new Date();
  const toLocalISOString = (d: Date) =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];

  const minDateStr = toLocalISOString(today);
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 14);
  const maxDateStr = toLocalISOString(maxDate);

  // const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  // const [loadingSlots, setLoadingSlots] = useState(false);

  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  // ✅ Auto-populate slots when date is selected
  useEffect(() => {
    if (!resForm.date) {
      setAvailableTimeSlots([]);
      return;
    }

    const now = new Date();
    const selectedDate = resForm.date;
    const todayStr = toLocalISOString(now);
    const isToday = selectedDate === todayStr;

    const slots: string[] = [];
    for (let hour = 11; hour <= 22; hour++) {
      // If today, only show future slots (with 30min buffer)
      if (isToday && hour <= now.getHours()) continue;
      slots.push(`${String(hour).padStart(2, "0")}:00`);
    }

    setAvailableTimeSlots(slots);
    // Reset time if previously selected slot no longer valid
    setResForm((prev) => ({ ...prev, time: "" }));
  }, [resForm.date]);
  const handleResFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setResForm((prev) => ({
      ...prev,
      [name]: name === "guests" ? parseInt(value) : value,
    }));
  };

  const fetchTables = async () => {
    if (!resForm.date || !resForm.time) {
      setResError("Please select date and time first.");
      return;
    }

    setIsLoadingTables(true);
    setResError("");

    // ✅ Reset previously selected table when fetching fresh
    setResForm((prev) => ({ ...prev, tableId: "" }));

    try {
      const tables = await apiGetAvailableTables(
        outletid,
        resForm.date,
        resForm.time,
        resForm.guests,
      );
      setAvailableTables(tables);
      setResStep(2);
    } catch (err: unknown) {
      setResError(
        err instanceof Error ? err.message : "Could not load tables.",
      );
    } finally {
      setIsLoadingTables(false);
    }
  };
  const formatIndianPhone = (phone: string) => {
    let cleaned = phone.replace(/\D/g, ""); // remove spaces, symbols

    if (cleaned.startsWith("91") && cleaned.length === 12) {
      return `+${cleaned}`;
    }

    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }

    if (cleaned.startsWith("0") && cleaned.length === 11) {
      return `+91${cleaned.slice(1)}`;
    }

    return `+${cleaned}`;
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResError("");

    if (!resForm.name || !resForm.phone) {
      setResError("Name and Phone are required.");
      return;
    }

    const formattedPhone = formatIndianPhone(resForm.phone);

    try {
      const success = await apiSendReservationOTP(formattedPhone);

      if (!success) {
        setResError("Failed to send OTP.");
        return;
      }

      setOtpSent(true);

    } catch (err: any) {
      setResError(err?.message || "Failed to send OTP.");
    }
  };




  const confirmBooking = async () => {
    if (isBooking) return;

    setIsBooking(true);
    setResError("");

    const formattedPhone = formatIndianPhone(resForm.phone);

    try {
      const success = await apiVerifyReservationOTP(
        formattedPhone,
        otp
      );

      if (!success) {
        setResError("Invalid or expired OTP.");
        return;
      }

      const reservation = await apiCreateReservation(
        outletid,
        currentUser?.id,
        {
          ...resForm,
          brand_id: restId,     // ✅ correct
          outlet_id: outletid,

        }
      );

      setLastReservationId(reservation.bookingId);
      setResStep(4);

    } catch (err: any) {
      const message = err?.message || "Booking failed.";

      // 🔥 If OTP expired → reset to resend state
      if (message.toLowerCase().includes("expired")) {
        setResError("OTP expired. Please request a new one.");

        setOtp("");
        setOtpSent(false);   // 👈 go back to Send OTP button
        return;
      }

      setResError(message);

    } finally {
      setIsBooking(false);
    }
  };



  const handleScrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  var LogoURL = `${SUPABASE_URL}/${IMAGE_BASE_URL}/restaurant-images/${restaurant?.logo}`;
  var aboutURL = `${SUPABASE_URL}/${IMAGE_BASE_URL}/restaurant-images/${restaurant?.about_image}`;
  var heroURL = `${SUPABASE_URL}/${IMAGE_BASE_URL}/restaurant-images/${restaurant?.hero_image}`;
  // ✅ map restaurant -> theme + UI fields (fallbacks)
  const themePrimary = restaurant?.theme_primary || "#ff0000";
  const themeAccent = restaurant?.theme_accent || "#e5f502";
  const themeText = restaurant?.theme_text_on_primary || "#ffffff";

  const restaurantName = restaurant?.name || "Restaurant";
  const restaurantTagline = restaurant?.tagline || restaurantName;

  const heroImage =
    heroURL ||
    "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?q=80&w=2070&auto=format&fit=crop";

  const aboutImage = aboutURL || heroImage;
  const aboutText = restaurant?.about_text || restaurant?.description || "";

  const logo = LogoURL || "https://placehold.co/160x60?text=Logo";

  // if you have a gallery column as array/json, use it; else fallback
  const gallery =
    Array.isArray(restaurant?.gallery) && restaurant.gallery.length > 0
      ? restaurant.gallery
      : Array.from({ length: 8 }).map(
        (_, i) => [heroImage, aboutImage, logo][i % 3],
      );

  const contactAddress = restaurant?.address
    ? [restaurant.address, restaurant?.city].filter(Boolean).join(", ")
    : restaurant?.contact_address || "";

  const contactPhone = restaurant?.phone || restaurant?.contact_phone || "";
  const contactHours = restaurant?.hours || restaurant?.contact_hours || "";

  const brandThemeStyle = {
    "--primary-color": themePrimary,
    "--accent-color": themeAccent,
    "--text-on-primary-color": themeText,
  } as React.CSSProperties;

  // keep design: show page even if restaurant loading, but you can show minimal message
  if (restaurantLoading) {
    return (
      <div className="bg-gray-900 min-h-screen" style={brandThemeStyle}>
        <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
          <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-300 hover:text-[var(--accent-color)]"
            >
              <Icon type="arrow-left" className="w-5 h-5" />
              <span className="hidden sm:inline">All Brands</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="h-8 w-24 bg-gray-700 animate-pulse rounded" />
              <div className="h-6 w-40 bg-gray-700 animate-pulse rounded hidden sm:block" />
            </div>
            <div className="hidden md:flex space-x-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 w-16 bg-gray-700 animate-pulse rounded"
                />
              ))}
            </div>
          </nav>
        </header>

        <section className="h-screen flex items-center justify-center">
          <div className="container mx-auto px-4">
            <div className="h-16 w-2/3 bg-gray-700 animate-pulse rounded mx-auto" />
            <div className="h-10 w-40 bg-gray-700 animate-pulse rounded mx-auto mt-8" />
          </div>
        </section>
      </div>
    );
  }

  if (restaurantError) {
    return (
      <div
        className="bg-gray-900 min-h-screen flex items-center justify-center text-center p-6"
        style={brandThemeStyle}
      >
        <div>
          <p className="text-red-400 font-semibold">{restaurantError}</p>
          <button
            onClick={onBack}
            className="mt-4 text-cyan-400 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900" style={brandThemeStyle}>
      <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-[var(--accent-color)]"
          >
            <Icon type="arrow-left" className="w-5 h-5" />
            <span className="hidden sm:inline">All Brands</span>
          </button>

          <div className="flex items-center gap-4">
            <img
              src={logo}
              alt={`${restaurantName} logo`}
              className="h-8 object-contain"
            />
            <h1 className="text-2xl font-bold font-serif text-white hidden sm:block">
              {restaurantName}
            </h1>
          </div>

          <ul className="hidden md:flex space-x-6 text-gray-300">
            {["home", "about", "menu", "gallery", "contact"].map((item) => (
              <li key={item}>
                <button
                  onClick={() => handleScrollTo(item)}
                  className="capitalize hover:text-[var(--accent-color)] transition-colors bg-transparent border-none cursor-pointer p-0"
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main>
        <section
          id="home"
          className="h-screen bg-cover bg-center flex items-center justify-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${heroImage}')`,
          }}
        >
          <div className="text-center text-white p-4 animate-fade-in-slow">
            <h2 className="text-5xl md:text-7xl font-serif">
              {restaurantTagline}
            </h2>
            <button
              onClick={() => handleScrollTo("menu")}
              style={{
                backgroundColor: "var(--primary-color)",
                color: "var(--text-on-primary-color)",
              }}
              className="mt-8 inline-block font-bold py-3 px-8 rounded-md hover:opacity-90 transition-opacity"
            >
              Explore Menu
            </button>
          </div>
        </section>

        <section id="about" className="py-20 bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <img
                src={aboutImage}
                alt="Restaurant Interior"
                className="rounded-lg shadow-2xl"
              />
            </div>
            <div className="animate-fade-in">
              <h3 className="text-4xl font-serif text-white">Our Story</h3>
              <p className="mt-4 text-gray-400">{aboutText}</p>
            </div>
          </div>
        </section>

        <section id="menu" className="py-20 bg-gray-800">
          <div className="container mx-auto px-4">
            <h3 className="text-4xl font-serif text-white text-center mb-12">
              Our Menu
            </h3>

            <div className="max-w-lg mx-auto mb-10 relative">
              <Icon
                type="search"
                className="absolute left-3 top-3 w-5 h-5 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes..."
                className="w-full bg-gray-700 text-white pl-10 p-3 rounded-full border border-gray-600 focus:ring-2 focus:ring-[var(--primary-color)] outline-none"
              />
            </div>

            {categories.length === 0 ? (
              <CategoryShimmer />
            ) : (
              <div className="flex justify-center flex-wrap gap-2 mb-10">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-4 py-2 rounded-md font-semibold transition-all 
                      ${activeCategory === cat.id
                        ? "text-[var(--text-on-primary-color)]"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                      }`}
                    style={
                      activeCategory === cat.id
                        ? { backgroundColor: "var(--primary-color)" }
                        : {}
                    }
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {isInitialMenuLoading || isMenuChanging ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ShimmerCard />
                <ShimmerCard />
                <ShimmerCard />
              </div>
            ) : (
              <div className="space-y-12">
                {(searchQuery.trim() ? filteredMenu : menuData).map(
                  (category: any) => (
                    <div key={category.category_id}>
                      <h4 className="text-2xl text-white font-serif mb-6">
                        {category.category}
                      </h4>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {category.items.map((item: any) => {
                          const isAvailable =
                            String(item.active) === "1" &&
                            String(item.in_stock) !== "0";

                          return (
                            <div
                              key={item.itemid}
                              className="bg-gray-900 rounded-lg shadow-lg overflow-hidden flex flex-col"
                            >
                              <div className="relative">
                                <img
                                  src={item.item_image_url}
                                  className="w-full h-48 object-cover"
                                  alt={item.itemname}
                                />
                                {!isAvailable && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="bg-red-600 px-3 py-1 text-white rounded-md font-semibold">
                                      Out of Stock
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="p-4 flex flex-col flex-grow">
                                <div className="flex justify-between items-start">
                                  <h4 className="text-xl text-white flex-1">
                                    {item.itemname}
                                  </h4>
                                  <p className="text-lg font-bold text-[var(--accent-color)]">
                                    {(() => {
                                      const hasVariation =
                                        Array.isArray(item.variation) &&
                                        item.variation.length > 0;

                                      const variationPrices = hasVariation
                                        ? item.variation
                                          .map((v: any) => Number(v.price))
                                          .filter((p: number) => p > 0)
                                        : [];

                                      const minVariationPrice =
                                        variationPrices.length > 0
                                          ? Math.min(...variationPrices)
                                          : null;

                                      const displayPrice =
                                        Number(item.price) > 0
                                          ? Number(item.price)
                                          : minVariationPrice;

                                      return (
                                        <p className="text-lg font-bold text-[var(--accent-color)]">
                                          {displayPrice !== null
                                            ? hasVariation &&
                                              Number(item.price) === 0
                                              ? `From ₹${displayPrice}`
                                              : `₹${displayPrice}`
                                            : "Customisable"}
                                        </p>
                                      );
                                    })()}
                                  </p>
                                </div>

                                <p className="text-gray-400 text-sm mt-2 flex-grow">
                                  {item.itemdescription}
                                </p>

                                <button
                                  onClick={() => {
                                    const hasVariations =
                                      Array.isArray(item.variation) &&
                                      item.variation.length > 0;
                                    const hasAddons =
                                      Array.isArray(item.addons) &&
                                      item.addons.length > 0;

                                    if (hasVariations || hasAddons) {
                                      // Item needs addon/variation modal
                                      setAddonItem(item);
                                      setIsAddonModalOpen(true);
                                    } else {
                                      // Simple item - add directly with computed values
                                      const basePrice = Number(item.price || 0);
                                      const gstPercentage = Array.isArray(
                                        item.tax_breakup,
                                      )
                                        ? item.tax_breakup.reduce(
                                          (sum, t) =>
                                            sum +
                                            Number(t.tax_percentage || 0),
                                          0,
                                        )
                                        : 0;
                                      const gstAmount =
                                        (basePrice * gstPercentage) / 100;

                                      handleAddToCart({
                                        ...item,
                                        selectedVariation: null,
                                        selectedAddons: {},
                                        computed: {
                                          base_price: basePrice,
                                          addon_price: 0,
                                          taxable_amount: basePrice,
                                          gst_percentage: gstPercentage,
                                          gst_amount: gstAmount,
                                          final_price: basePrice + gstAmount,
                                        },
                                      });
                                    }
                                  }}
                                  disabled={!isAvailable}
                                  className="mt-4 w-full py-2 rounded-md border-2 font-semibold transition-all 
    text-[var(--primary-color)]
    disabled:opacity-50 disabled:cursor-not-allowed 
    hover:bg-[var(--primary-color)] hover:text-white"
                                  style={{
                                    borderColor: "var(--primary-color)",
                                  }}
                                >
                                  {isAvailable ? "Add to Cart" : "Unavailable"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </section>

        <section id="gallery" className="py-20 bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 animate-fade-in">
              <h3 className="text-4xl font-serif text-white">Visual Feast</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.map((src: string, index: number) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-lg shadow-lg animate-fade-in"
                >
                  <img
                    src={src}
                    alt={`Gallery image ${index + 1}`}
                    className="w-full h-full object-cover aspect-square hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="py-20 bg-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 animate-fade-in">
              <h3 className="text-4xl font-serif text-white">
                Make a Reservation
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="animate-fade-in bg-gray-900 p-6 rounded-lg border border-gray-700">
                {resError && (
                  <p className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-md text-sm">
                    {resError}
                  </p>
                )}
                {resStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <h4 className="text-xl font-semibold text-white mb-4">
                      Step 1: Booking Details
                    </h4>

                    {/* DATE + GUESTS */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          name="date"
                          min={minDateStr}
                          max={maxDateStr}
                          required
                          value={resForm.date}
                          onChange={handleResFormChange}
                          className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 text-white focus:ring-2 focus:ring-[var(--primary-color)]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">
                          Guests
                        </label>
                        <select
                          name="guests"
                          value={resForm.guests}
                          onChange={handleResFormChange}
                          className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 text-white focus:ring-2 focus:ring-[var(--primary-color)]"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <option key={n} value={n}>
                              {n} Guests
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {/* TIME — simple fixed dropdown */}
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Time Slot
                      </label>
                      <select
                        name="time"
                        required
                        value={resForm.time}
                        onChange={handleResFormChange}
                        className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 text-white focus:ring-2 focus:ring-[var(--primary-color)]"
                      >
                        <option value="">Select Time</option>
                        {Array.from({ length: 12 }, (_, i) => {
                          const hour = 11 + i;
                          const slot = `${String(hour).padStart(2, "0")}:00`;
                          const endSlot = `${String(hour + 2).padStart(2, "0")}:00`;

                          return (
                            <option key={slot} value={slot}>
                              {slot} – {endSlot}
                            </option>
                          );
                        })}
                      </select>

                    </div>
                    {/* Summary */}
                    {resForm.time && resForm.date && (
                      <div className="p-3 bg-gray-700/50 rounded-md border border-gray-600 text-sm text-gray-300">
                        📅{" "}
                        {new Date(resForm.date).toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                        {" · "}
                        🕐 {resForm.time} –{" "}
                        {String(
                          Number(resForm.time.split(":")[0]) + 2,
                        ).padStart(2, "0")}
                        :00
                        {" · "}
                        👥 {resForm.guests} Guests
                      </div>
                    )}

                    <button
                      onClick={fetchTables}
                      disabled={
                        isLoadingTables || !resForm.date || !resForm.time
                      }
                      className="w-full font-bold py-3 px-4 rounded-md transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: "var(--primary-color)",
                        color: "var(--text-on-primary-color)",
                      }}
                    >
                      {isLoadingTables ? (
                        <Spinner />
                      ) : (
                        "Find Available Tables →"
                      )}
                    </button>
                  </div>
                )}

                {resStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xl font-semibold text-white">
                        Step 2: Select a Table
                      </h4>
                      <button
                        onClick={() => setResStep(1)}
                        className="text-sm text-gray-400 hover:text-white"
                      >
                        Change Details
                      </button>
                    </div>

                    <p className="text-sm text-gray-400">
                      Found {availableTables.length} tables for {resForm.guests}{" "}
                      guests at {resForm.time}.
                    </p>

                    <TableMap
                      tables={availableTables}
                      selectedTableId={resForm.tableId}
                      onSelect={(id) =>
                        setResForm((prev) => ({ ...prev, tableId: id }))
                      }
                    />

                    <button
                      onClick={() => setResStep(3)}
                      disabled={!resForm.tableId}
                      className="w-full font-bold py-3 px-4 rounded-md transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                      style={{
                        backgroundColor: "var(--primary-color)",
                        color: "var(--text-on-primary-color)",
                      }}
                    >
                      Continue to Contact
                    </button>
                  </div>
                )}
                {resStep === 3 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xl font-semibold text-white">
                        Step 3: Confirm Details
                      </h4>
                      <button
                        onClick={() => setResStep(2)}
                        className="text-sm text-gray-400 hover:text-white"
                      >
                        Change Table
                      </button>
                    </div>

                    <form
                      onSubmit={
                        otpSent
                          ? (e) => {
                            e.preventDefault();
                            confirmBooking();
                          }
                          : sendOtp
                      }
                      className="space-y-4"
                    >
                      <input
                        type="text"
                        name="name"
                        placeholder="Your Name"
                        required
                        value={resForm.name}
                        onChange={handleResFormChange}
                        disabled={otpSent}
                        className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 text-white disabled:opacity-50"
                      />

                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        required
                        value={resForm.phone}
                        onChange={handleResFormChange}
                        disabled={otpSent}
                        className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 text-white disabled:opacity-50"
                      />

                      {!otpSent ? (
                        <button
                          type="submit"
                          className="w-full font-bold py-3 px-4 rounded-md transition-opacity"
                          style={{
                            backgroundColor: "var(--primary-color)",
                            color: "var(--text-on-primary-color)",
                          }}
                        >
                          Send Verification OTP
                        </button>
                      ) : (
                        <div className="animate-fade-in space-y-4">
                          <input
                            type="text"
                            placeholder="Enter OTP"
                            required
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full bg-gray-700 p-3 rounded-md border border-[var(--accent-color)] text-white text-center tracking-widest font-bold"
                          />

                          <button
                            type="submit"
                            disabled={isBooking}
                            className="w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-md transition-opacity bg-green-600 text-white hover:bg-green-500 disabled:bg-gray-500"
                          >
                            {isBooking ? (
                              <Spinner className="text-white" />
                            ) : (
                              "Verify & Book"
                            )}
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                )}
                {resStep === 4 && (
                  <div className="animate-fade-in text-center py-8 space-y-4">
                    <Icon
                      type="check-circle"
                      className="w-16 h-16 text-green-400 mx-auto"
                    />
                    <h4 className="text-2xl font-bold text-white">
                      Booking Confirmed!
                    </h4>
                    <p className="text-gray-300">
                      We look forward to seeing you.
                    </p>

                    <div className="bg-gray-800 p-4 rounded-md inline-block text-left mt-4">
                      <p className="text-sm text-gray-400">
                        Booking ID:{" "}
                        <span className="text-cyan-400 font-mono">
                          {lastReservationId}
                        </span>
                      </p>
                      <p className="text-sm text-gray-400">
                        Date:{" "}
                        <span className="text-white">
                          {new Date(resForm.date).toLocaleDateString()}
                        </span>{" "}
                        at <span className="text-white">{resForm.time}{resForm.end_time}</span>
                      </p>
                    </div>

                    <p className="text-xs text-gray-500 mt-4">
                      Please arrive on time. Bookings are held for 20 minutes.
                    </p>

                    <button
                      onClick={() => {
                        setResStep(1);
                        setResForm((prev) => ({
                          ...prev,
                          date: "",
                          time: "",
                          tableId: "",
                        }));
                        setOtpSent(false);
                        setOtp("");
                      }}
                      className="text-cyan-400 hover:underline mt-4 block mx-auto"
                    >
                      Make another booking
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6 text-gray-300 animate-fade-in">
                <div>
                  <h4 className="text-2xl font-serif text-white mb-3">
                    Contact Us
                  </h4>

                  {contactAddress ? (
                    <p className="flex items-center gap-3">
                      <Icon
                        type="map-pin"
                        className="w-5 h-5 text-[var(--accent-color)]"
                      />{" "}
                      {contactAddress}
                    </p>
                  ) : null}

                  {contactPhone ? (
                    <p className="flex items-center gap-3 mt-2">
                      <Icon
                        type="phone"
                        className="w-5 h-5 text-[var(--accent-color)]"
                      />{" "}
                      {contactPhone}
                    </p>
                  ) : null}
                </div>

                {contactHours ? (
                  <div>
                    <h4 className="text-2xl font-serif text-white mb-3">
                      Operating Hours
                    </h4>
                    <p className="flex items-center gap-3">
                      <Icon
                        type="clock"
                        className="w-5 h-5 text-[var(--accent-color)]"
                      />{" "}
                      {contactHours}
                    </p>
                  </div>
                ) : null}

                <div>
                  <button
                    onClick={() => setIsRecommenderOpen(true)}
                    className="w-full flex items-center justify-center gap-3 bg-gray-700 p-4 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    <Icon
                      type="chef-hat"
                      className="w-6 h-6 text-[var(--accent-color)]"
                    />
                    <div>
                      <p className="font-semibold text-white">
                        Feeling Indecisive?
                      </p>
                      <p className="text-sm text-gray-400">
                        Get an AI-powered recommendation!
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} {restaurantName}. Part of Bongo
            Delicacy Group.
          </p>
        </div>
      </footer>

      <ChefRecommenderModal
        isOpen={isRecommenderOpen}
        onClose={() => setIsRecommenderOpen(false)}
        restaurantId={restId}
        restaurantName={restaurantName}
      />

      <CartIcon onClick={() => setIsCartOpen(true)} />

      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        brandId={restId} // keep prop name, pass rest_id
      />
      {isAddonModalOpen && addonItem && (
        <AddonModal
          item={addonItem as ItemData} // Type assertion needed here
          onClose={() => {
            setIsAddonModalOpen(false);
            setAddonItem(null);
          }}
          onConfirm={(finalItem: EnrichedItemData) => {
            handleAddToCart(finalItem);
            setIsAddonModalOpen(false);
            setAddonItem(null);
          }}
        />
      )}
    </div>
  );
};

export default BrandPage;
