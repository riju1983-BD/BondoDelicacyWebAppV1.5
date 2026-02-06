import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "./Icon";
import { LoyaltyConfig, Order, Reservation } from "../types";
import {
  apiGetLoyaltyConfig,
  apiSetLoyaltyConfig,
  apiGetLiveMenu,
  apiUpdateItemAvailability,
  apiGetComplaints,
  apiProcessRefundApproval,
  apiRejectComplaint,
  apiGetAllActiveReservations,
  apiUpdateReservation,
  apiGetAdminCategoriesMenu,
  apiGetOrders,
  apiCancelOrder,
  apiFetchRestaurantMapping,
  apiAddRestaurant,
  apiAddTable,
  apiGetTables,
  apiToggleTable,
  apiUploadRestaurantImage,
  apiGetRestaurantById,
} from "../services/apiService";
import { BASE_URL } from "../src/config";
import { supabase } from "../services/supabaseClient";

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

const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    | "menu"
    | "orders"
    | "loyalty"
    | "complaints"
    | "reservations"
    | "restaurants"
    | "addRestaurant"
    | "addOutlet"
  >("menu");

  // Menu State
  const [menu, setMenu] = useState<any[] | null>(null);

  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restaurants dropdown for Live Menu
  const [restaurantOptions, setRestaurantOptions] = useState<
    { rest_id: string; name: string }[]
  >([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [isLoadingRestaurantOptions, setIsLoadingRestaurantOptions] =
    useState(false);

  const [restId, setRestId] = useState("");
  const [fetchedData, setFetchedData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);

  const [themePrimary, setThemePrimary] = useState("#000000");
  const [themeAccent, setThemeAccent] = useState("#FFAB00");
  const [themeText, setThemeText] = useState("#FFFFFF");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const DEFAULT_IMAGE = "https://via.placeholder.com/400x300?text=No+Image";
  // --- Add Restaurant: Extra fields + uploads ---
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [aboutText, setAboutText] = useState("");

  const [logoUrl, setLogoUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [aboutImageUrl, setAboutImageUrl] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ✅ change this bucket to your real bucket name in Supabase Storage
  const RESTAURANT_BUCKET = "restaurant-images";
  // Loyalty State
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>({
    rupeesPerPoint: 100,
  });
  const [isSavingLoyalty, setIsSavingLoyalty] = useState(false);
  const [loyaltySuccess, setLoyaltySuccess] = useState("");

  // Complaints State
  const [complaints, setComplaints] = useState<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [complaintFilter, setComplaintFilter] = useState<"active" | "resolved">(
    "active",
  );
  const [processingComplaintId, setProcessingComplaintId] = useState<
    string | null
  >(null);
  // 🔸 CANCEL ORDER MODAL STATE
  const [cancelOrderFor, setCancelOrderFor] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);
  // Reservations State
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [processingResId, setProcessingResId] = useState<string | null>(null);
  // useEffect(() => {
  //   const brands = apiGetAllBrands(); // already synchronous in your code
  //   if (!selectedBrandId && brands.length > 0) {
  //     setSelectedBrandId(brands[0].id); // pick the first brand
  //   }
  // }, [selectedBrandId]);
  // *** REAL-TIME SETUP ***
  // Restaurants State
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);

  // Add Table Modal State
  const [addTableFor, setAddTableFor] = useState<string | null>(null);
  const [TableId, setTableId] = useState<string | null>(null);
  const [resturent, setresturent] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isSavingTable, setIsSavingTable] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [showTablesFor, setShowTablesFor] = useState<string | null>(null);
  const [loadingTables, setLoadingTables] = useState(false);
  const buildStoragePath = (restId: string, filename: string) => {
    const safeName = filename.replace(/\s+/g, "-").toLowerCase();
    return `restaurants/${restId || "unknown"}/${Date.now()}-${safeName}`;
  };

  const uploadImage = async (file: File, type: "logo" | "hero" | "about") => {
    setUploadError(null);
    setIsUploading(true);

    try {
      if (!restId) throw new Error("Please enter Rest ID first");

      const form = new FormData();
      form.append("rest_id", restId);
      form.append("type", type);
      form.append("file", file);

      // ✅ change URL if your backend prefix is different
      const res = await fetch(`${BASE_URL}/resturents/upload-image`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      return data.url as string;
    } catch (e: any) {
      setUploadError(e?.message || "Image upload failed");
      return "";
    } finally {
      setIsUploading(false);
    }
  };

  async function loadTables(restId: string) {
    setLoadingTables(true);
    const res = await apiGetTables(restId);
    setTables(res.tables || []);
    setLoadingTables(false);
  }
  async function loadResturent(restId: string) {
    setLoadingTables(true);
    const res = await apiGetRestaurantById(restId);
    console.log(res);
    setresturent(res);
    setTagline(res.tagline || "");
    setDescription(res.description || "");
    setHeroImageUrl(res.hero_image || "");
    setLogoUrl(res.logo || "");
    setAboutText(res.about_text || "");
    setAboutImageUrl(res.about_image || "");
    setLoadingTables(false);
  }

  useEffect(() => {
    // Subscribe to 'orders'
    const orderSubscription = supabase
      .channel("realtime:admin_orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          if (activeTab === "complaints") fetchComplaints();
        },
      )
      .subscribe();
    const ordersSubscription = supabase
      .channel("realtime:admin_orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          if (activeTab === "complaints") fetchComplaints();
        },
      )
      .subscribe();
    // Subscribe to 'reservations'
    const reservationSubscription = supabase
      .channel("realtime:admin_reservations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => {
          if (activeTab === "reservations") fetchReservations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderSubscription);
      supabase.removeChannel(reservationSubscription);
    };
  }, [activeTab]);

  const fetchMenu = useCallback(async (restId: string) => {
    if (!restId) return;

    setIsLoadingMenu(true);
    setError(null);

    try {
      const adminMenu = await apiGetAdminCategoriesMenu(restId);
      setMenu(adminMenu);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch menu");
    } finally {
      setIsLoadingMenu(false);
    }
  }, []);

  const fetchComplaints = useCallback(async () => {
    setIsLoadingComplaints(true);
    try {
      const allComplaints = await apiGetComplaints();
      setComplaints(allComplaints);
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
    } finally {
      setIsLoadingComplaints(false);
    }
  }, []);
  const fetchRestaurants = useCallback(async () => {
    setIsLoadingRestaurants(true);
    setTableError(null);
    try {
      const { data, error } = await supabase.from("restaurants").select("*");
      if (error) {
        console.error("Failed to fetch restaurants:", error);
        setTableError("Failed to fetch restaurants");
        return;
      }
      setRestaurants(data || []);
    } catch (err) {
      console.error("Failed to fetch restaurants:", err);
      setTableError("Failed to fetch restaurants");
    } finally {
      setIsLoadingRestaurants(false);
    }
  }, []);
  const fetchRestaurantOptions = useCallback(async () => {
    setIsLoadingRestaurantOptions(true);
    try {
 const { data, error } = await supabase
   .from("petpooja_menu_cache")
   .select("rest_id,payload,last_pushed_at,restaurant_name")
   .order("last_pushed_at", { ascending: false });

      if (error) throw error;

      const list = (data || []).filter((r) => r.rest_id);

      setRestaurantOptions(list);

      // auto-select first item if nothing selected
      if (!selectedRestaurantId && list.length > 0) {
        setSelectedRestaurantId(list[0].rest_id);
      }
    } catch (e) {
      console.error("fetchRestaurantOptions:", e);
    } finally {
      setIsLoadingRestaurantOptions(false);
    }
  }, [selectedRestaurantId]);

  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const allOrders = await apiGetOrders();
      setOrders(allOrders);
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);
  const fetchReservations = useCallback(async () => {
    setIsLoadingReservations(true);
    try {
      const res = await apiGetAllActiveReservations();
      setReservations(res);
    } catch (err) {
      console.error("Failed to fetch reservations:", err);
    } finally {
      setIsLoadingReservations(false);
    }
  }, []);
  useEffect(() => {
    if (activeTab === "menu") {
      fetchRestaurantOptions();
      if (selectedRestaurantId) {
        fetchMenu(selectedRestaurantId);
      }
    } else if (activeTab === "orders") fetchOrders();
    else if (activeTab === "loyalty")
      apiGetLoyaltyConfig().then(setLoyaltyConfig);
    else if (activeTab === "complaints") fetchComplaints();
    else if (activeTab === "reservations") fetchReservations();
    else if (activeTab === "restaurants") fetchRestaurants();
  }, [
    activeTab,
    selectedRestaurantId,
    fetchMenu,
    fetchOrders,
    fetchComplaints,
    fetchReservations,
    fetchRestaurants,
  ]);

  const handleFetchRestaurantData = async () => {
    setIsFetching(true);

    const res = await apiFetchRestaurantMapping(restId);

    let d: any = null;

    if (Array.isArray(res.data) && res.data.length > 0) {
      d = res.data[0].details || res.data[0];
    } else if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
      d = res.data.data[0].details || res.data.data[0];
    }

    setFetchedData(d || null);

    // ✅ Prefill new fields
    if (d) {
      setTagline(d.tagline || "");
      setDescription(d.description || "");
      setAboutText(d.about_text || "");

      setLogoUrl(d.logo || d.images?.[0] || "");
      setHeroImageUrl(d.hero_image || "");
      setAboutImageUrl(d.about_image || "");
    } else {
      setTagline("");
      setDescription("");
      setAboutText("");

      setLogoUrl("");
      setHeroImageUrl("");
      setAboutImageUrl("");
    }

    setIsFetching(false);
  };

  const StarRating: React.FC<{ value: number }> = ({ value }) => {
    const fullStars = Math.floor(value);

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${
              i <= fullStars ? "text-yellow-400" : "text-gray-600"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.174c.969 0 1.371 1.24.588 1.81l-3.377 2.455a1 1 0 00-.364 1.118l1.286 3.966c.3.921-.755 1.688-1.538 1.118l-3.377-2.455a1 1 0 00-1.175 0l-3.377 2.455c-.783.57-1.838-.197-1.538-1.118l1.286-3.966a1 1 0 00-.364-1.118L2.002 9.393c-.783-.57-.38-1.81.588-1.81h4.174a1 1 0 00.95-.69l1.286-3.966z" />
          </svg>
        ))}
      </div>
    );
  };

  const handleUpdateRestaurant = async () => {
    setIsSubmitting(true);

    const payload = {
      rest_id: restId,
      name: fetchedData.restaurantname || "",

      // ✅ from new inputs
      tagline: tagline,
      description: description,

      address: fetchedData.address || "",
      city: fetchedData.city || "",

      // ✅ image urls from uploads
      logo: logoUrl,
      hero_image: heroImageUrl,

      // ✅ about section
      about_text: aboutText,
      about_image: aboutImageUrl,

      // theme
      theme_primary: themePrimary,
      theme_accent: themeAccent,
      theme_text_on_primary: themeText,

      Latitude: fetchedData.latitude ? Number(fetchedData.latitude) : null,
      Longitude: fetchedData.longitude ? Number(fetchedData.longitude) : null,
    };

    const res = await apiAddRestaurant(payload);

    if (!res.error) {
      setFetchedData(null);
      setRestId("");
      setActiveTab("restaurants");
      fetchRestaurants();
    }

    setIsSubmitting(false);
  };

  const handleSubmitRestaurant = async () => {
    if (!fetchedData) return;
    setIsSubmitting(true);

    const payload = {
      rest_id: restId,
      name: fetchedData.restaurantname || "",

      // ✅ from new inputs
      tagline: tagline,
      description: description,

      address: fetchedData.address || "",
      city: fetchedData.city || "",

      // ✅ image urls from uploads
      logo: logoUrl,
      hero_image: heroImageUrl,

      // ✅ about section
      about_text: aboutText,
      about_image: aboutImageUrl,

      // theme
      theme_primary: themePrimary,
      theme_accent: themeAccent,
      theme_text_on_primary: themeText,

      Latitude: fetchedData.latitude ? Number(fetchedData.latitude) : null,
      Longitude: fetchedData.longitude ? Number(fetchedData.longitude) : null,
    };

    const res = await apiAddRestaurant(payload);

    if (!res.error) {
      setFetchedData(null);
      setRestId("");
      setActiveTab("restaurants");
      fetchRestaurants();
    }

    setIsSubmitting(false);
  };

  // const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   setSelectedBrandId(e.target.value as Brand["id"]);
  //   setMenu(null);
  // };
  // const handleToggleAvailability = async (itemName: string) => { if (!menu) return; const isCurrentlyAvailable = !!menu.flatMap(c => c.items).find(i => i.name === itemName)?.isAvailable; const updatedMenu = menu.map(category => ({ ...category, items: category.items.map(item => item.name === itemName ? { ...item, isAvailable: !item.isAvailable } : item) })); try { await apiUpdateItemAvailability(selectedBrandId, itemName, !isCurrentlyAvailable); setMenu(updatedMenu); } catch (err) { setError(err instanceof Error ? err.message : "Failed to update item."); } };
  const handleLoyaltyConfigChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseInt(e.target.value, 10);
    setLoyaltyConfig({ rupeesPerPoint: isNaN(value) || value < 1 ? 1 : value });
  };
  const handleSaveLoyaltyConfig = async () => {
    setIsSavingLoyalty(true);
    setLoyaltySuccess("");
    await apiSetLoyaltyConfig(loyaltyConfig);
    setIsSavingLoyalty(false);
    setLoyaltySuccess("Loyalty settings saved!");
    setTimeout(() => setLoyaltySuccess(""), 3000);
  };
  const calculateComplaintRefundAmount = (
    order: Order,
    requestedAmount?: number,
  ) => {
    const totalAmount = Number(order.totalAmount || 0);

    if (totalAmount <= 0) return 0;

    // If no specific amount requested, default to full refund
    if (requestedAmount === undefined || requestedAmount === null) {
      return totalAmount;
    }

    const amount = Number(requestedAmount);

    if (isNaN(amount) || amount <= 0) {
      return 0;
    }

    // 🔒 HARD GUARANTEE: refund never exceeds order total
    return Math.min(amount, totalAmount);
  };
  const handleApproveRefund = (order: Order) => {
    const total =
      Number(order.complaint?.totalAmount) || Number(order.totalAmount) || 0;

    setRefundOrder(order);
    setRefundAmount(total);
    setRefundError(null);
  };
  const handleConfirmRefund = async () => {
    if (!refundOrder) return;

    const maxAmount =
      Number(refundOrder.complaint?.totalAmount) ||
      Number(refundOrder.totalAmount) ||
      0;

    if (refundAmount <= 0) {
      setRefundError("Refund amount must be greater than 0");
      return;
    }

    if (refundAmount > maxAmount) {
      setRefundError("Refund amount cannot exceed order value");
      return;
    }

    setIsRefunding(true);
    try {
      await apiProcessRefundApproval(
        refundOrder.id,
        refundAmount,
        "Approved complaint refund",
      );
      setRefundOrder(null);
      await fetchComplaints();
    } catch (e) {
      setRefundError("Refund failed. Please try again.");
    } finally {
      setIsRefunding(false);
    }
  };

  const handleRejectComplaint = async (orderId: string) => {
    if (!window.confirm("Reject this complaint?")) return;
    setProcessingComplaintId(orderId);
    try {
      await apiRejectComplaint(orderId);
      await fetchComplaints();
    } catch (err) {
      console.error(err);
      alert("Failed to reject.");
    } finally {
      setProcessingComplaintId(null);
    }
  };
  const handleNavigate = (route: string) => (window.location.hash = route);

  const handleReservationAction = async (
    resId: string,
    action: "seated" | "cancel",
  ) => {
    if (
      action === "cancel" &&
      !window.confirm("Are you sure you want to cancel this reservation?")
    )
      return;
    setProcessingResId(resId);
    try {
      // 'seated' moves to 'completed' history. 'cancel' moves to 'cancelled' history.
      const newStatus = action === "seated" ? "completed" : "cancelled";
      await apiUpdateReservation(resId, { status: newStatus });
      await fetchReservations();
    } catch (e) {
      console.error("Error updating reservation:", e);
      alert(
        "Action failed. You may need to check database permissions (RLS policies).",
      );
    } finally {
      setProcessingResId(null);
    }
  };
  // 🔸 REFUND PERCENT LOGIC (same as tracking page)
  const calculateRefundPercent = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "food ready") return 40;
    if (["received", "accepted", "pending"].includes(normalized)) return 60;
    return 0;
  };

  // 🔸 OPEN CANCEL MODAL
  const handleOpenCancelModal = (order: Order) => {
    setCancelOrderFor(order);
    setCancelReason("");
    setCancelError(null);
  };

  // 🔸 CONFIRM CANCEL
  const handleConfirmCancel = async () => {
    if (!cancelOrderFor) return;

    if (!cancelReason.trim()) {
      setCancelError("Please provide a reason for cancellation.");
      return;
    }

    setIsCancelling(true);
    try {
      const orderAmount = Number(cancelOrderFor.totalAmount || 0);
      const refundPercent = calculateRefundPercent(cancelOrderFor.status);
      const refundAmount = Math.round((orderAmount * refundPercent) / 100);

      await apiCancelOrder(cancelOrderFor.id, refundAmount, cancelReason);

      setCancelOrderFor(null);
      await fetchOrders();
    } catch (e: any) {
      setCancelError(e.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredComplaints = complaints.filter((order) => {
    if (!order.complaint) return false;
    if (complaintFilter === "active")
      return order.complaint.status === "pending";
    return (
      order.complaint.status === "approved" ||
      order.complaint.status === "rejected"
    );
  });

  // Helper to check if reservation is overdue by 20 mins
  const isOverdue = (date: string, time: string) => {
    const resTime = new Date(`${date}T${time}`);
    const now = new Date();
    const diffMinutes = (now.getTime() - resTime.getTime()) / 60000;
    // Only overdue if it's today and past time, or a previous date
    const isPastDate = new Date(date) < new Date(now.toDateString());
    return (
      isPastDate ||
      (new Date(date).toDateString() === now.toDateString() && diffMinutes > 20)
    );
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-6xl bg-gray-900 rounded-lg shadow-2xl p-8">
        <header className="text-center mb-6">
          <h1 className="text-4xl font-serif">Admin Dashboard</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-xs text-green-400">Real-time Connected</span>
          </div>
        </header>
        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("menu")}
            className={`flex-shrink-0 py-2 px-4 font-semibold ${
              activeTab === "menu"
                ? "border-b-2 border-cyan-400 text-cyan-400"
                : "text-gray-400"
            }`}
          >
            Live Menu
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-shrink-0 py-2 px-4 font-semibold ${
              activeTab === "orders"
                ? "border-b-2 border-cyan-400 text-cyan-400"
                : "text-gray-400"
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab("reservations")}
            className={`flex-shrink-0 py-2 px-4 font-semibold ${
              activeTab === "reservations"
                ? "border-b-2 border-cyan-400 text-cyan-400"
                : "text-gray-400"
            }`}
          >
            Reservations ({reservations.length})
          </button>
          <button
            onClick={() => setActiveTab("complaints")}
            className={`flex-shrink-0 py-2 px-4 font-semibold ${
              activeTab === "complaints"
                ? "border-b-2 border-cyan-400 text-cyan-400"
                : "text-gray-400"
            }`}
          >
            Complaints
          </button>
          <button
            onClick={() => setActiveTab("loyalty")}
            className={`flex-shrink-0 py-2 px-4 font-semibold ${
              activeTab === "loyalty"
                ? "border-b-2 border-cyan-400 text-cyan-400"
                : "text-gray-400"
            }`}
          >
            Loyalty
          </button>
          <button
            onClick={() => setActiveTab("restaurants")}
            className={`flex-shrink-0 py-2 px-4 font-semibold ${
              activeTab === "restaurants"
                ? "border-b-2 border-cyan-400 text-cyan-400"
                : "text-gray-400"
            }`}
          >
            All Restaurants
          </button>

          <button
            onClick={() => setActiveTab("addRestaurant")}
            className={`flex-shrink-0 py-2 px-4 font-semibold ${
              activeTab === "addRestaurant"
                ? "border-b-2 border-cyan-400 text-cyan-400"
                : "text-gray-400"
            }`}
          >
            Add Restaurant
          </button>
          <button
            onClick={() => {
              setActiveTab("addOutlet");
              fetchRestaurants();
            }}
            className={`flex-shrink-0 py-2 px-4 font-semibold ${
              activeTab === "addOutlet"
                ? "border-b-2 border-cyan-400 text-cyan-400"
                : "text-gray-400"
            }`}
          >
            Add Outlet
          </button>
        </div>
        {activeTab === "menu" && (
          <div className="animate-fade-in">
            <div className="mb-4 max-w-xs mx-auto">
              <select
                id="restaurant-select"
                value={selectedRestaurantId}
                onChange={(e) => setSelectedRestaurantId(e.target.value)}
                className="block w-full rounded-md border-gray-600 bg-gray-800 py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 sm:text-sm"
              >
                {isLoadingRestaurantOptions ? (
                  <option value="">Loading restaurants...</option>
                ) : restaurantOptions.length === 0 ? (
                  <option value="">No restaurants found</option>
                ) : (
                  restaurantOptions.map((r) => (
                    <option key={r.rest_id} value={r.rest_id}>
                      {r.restaurant_name
                        ? `${r.restaurant_name} (${r.rest_id})`
                        : r.rest_id}
                    </option>
                  ))
                )}
              </select>
            </div>

            {isLoadingMenu ? (
              <div className="flex justify-center p-8">
                <Spinner className="w-8 h-8" />
              </div>
            ) : Array.isArray(menu) && menu.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
                {menu.map((category) => (
                  <div
                    key={category.category}
                    className="bg-gray-800 p-4 rounded-lg"
                  >
                    <h3 className="text-lg font-semibold text-cyan-400 mb-3">
                      {category.category}
                    </h3>

                    <ul className="space-y-2">
                      {Array.isArray(category.items) &&
                        category.items.map((item) => (
                          <li
                            key={item.name}
                            className="flex items-center justify-between bg-gray-900/50 p-2 rounded-md"
                          >
                            <span className="text-sm">{item.name}</span>

                            <button
                              // onClick={() => handleToggleAvailability(item.name)}
                              className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                                item.isAvailable
                                  ? "bg-green-900 text-green-300 hover:bg-green-800"
                                  : "bg-red-900 text-red-300 hover:bg-red-800"
                              }`}
                            >
                              {item.isAvailable ? "In Stock" : "Unavailable"}
                            </button>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-6">
                No menu data found for this brand.
              </p>
            )}
          </div>
        )}
        {activeTab === "addRestaurant" && (
          <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-semibold text-center">
              Add Restaurant
            </h2>

            {/* STEP 1: ENTER REST ID */}
            <div className="space-y-2">
              <label className="text-gray-300 text-sm">
                PetPuja Restaurant ID
              </label>
              <input
                type="text"
                value={restId}
                onChange={(e) => {
                  setRestId(e.target.value);
                  setFetchedData(null);
                }}
                placeholder="e.g. c9ignw2k50"
                className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-md p-3"
              />

              <button
                onClick={handleFetchRestaurantData}
                disabled={!restId || isFetching}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md disabled:opacity-60 flex items-center gap-2"
              >
                {isFetching ? <Spinner className="w-4 h-4" /> : null}
                Fetch Data
              </button>
            </div>

            {/* STEP 2: SHOW AUTO-FETCHED DATA */}
            {/* STEP 2.5: EDIT FIELDS + UPLOADS */}
            {fetchedData && (
              <div className="bg-gray-900 border border-gray-700 rounded-md p-5 space-y-4">
                <h3 className="text-lg font-semibold text-cyan-400">
                  Restaurant Details
                </h3>

                <div>
                  <label className="text-gray-400 text-sm">Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Short tagline"
                    className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-md p-3"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="About this restaurant"
                    className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-md p-3 h-24"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* LOGO */}
                  <div className="space-y-2">
                    <label className="text-gray-400 text-sm">Logo</label>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // instant preview
                        const localUrl = URL.createObjectURL(file);
                        setLogoUrl(localUrl);

                        // upload to storage
                        const url = await uploadImage(file, "logo");
                        if (url) setLogoUrl(url);
                      }}
                      className="w-full text-sm text-gray-300"
                    />
                    <img
                      src={logoUrl || DEFAULT_IMAGE}
                      alt="Logo Preview"
                      className="w-full h-40 object-cover border border-gray-700 rounded"
                    />
                  </div>

                  {/* HERO IMAGE */}
                  <div className="space-y-2">
                    <label className="text-gray-400 text-sm">Hero Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const localUrl = URL.createObjectURL(file);
                        setHeroImageUrl(localUrl);

                        const url = await uploadImage(file, "hero");
                        if (url) setHeroImageUrl(url);
                      }}
                      className="w-full text-sm text-gray-300"
                    />
                    <img
                      src={heroImageUrl || DEFAULT_IMAGE}
                      alt="Hero Preview"
                      className="w-full h-40 object-cover border border-gray-700 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm">About Text</label>
                  <textarea
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                    placeholder="Story / about section"
                    className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-md p-3 h-24"
                  />
                </div>

                {/* ABOUT IMAGE */}
                <div className="space-y-2">
                  <label className="text-gray-400 text-sm">About Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const localUrl = URL.createObjectURL(file);
                      setAboutImageUrl(localUrl);
                      const url = await uploadImage(file, "about");
                      if (url) setAboutImageUrl(url);
                    }}
                    className="w-full text-sm text-gray-300"
                  />
                  <img
                    src={aboutImageUrl || DEFAULT_IMAGE}
                    alt="About Preview"
                    className="w-full h-56 object-cover border border-gray-700 rounded"
                  />
                </div>

                {uploadError ? (
                  <p className="text-sm text-red-400">{uploadError}</p>
                ) : null}

                {isUploading ? (
                  <p className="text-xs text-gray-400 flex items-center gap-2">
                    <Spinner className="w-4 h-4" /> Uploading image...
                  </p>
                ) : null}
              </div>
            )}

            {/* STEP 3: THEME INPUTS */}
            <div className="bg-gray-900 border border-gray-700 p-5 rounded-md space-y-4">
              <h3 className="text-lg font-semibold text-cyan-400">
                Theme Configuration
              </h3>

              <input
                type="color"
                value={themePrimary}
                onChange={(e) => setThemePrimary(e.target.value)}
                className="w-full h-10 cursor-pointer"
              />
              <label className="text-gray-400 text-sm">Primary Color</label>

              <input
                type="color"
                value={themeAccent}
                onChange={(e) => setThemeAccent(e.target.value)}
                className="w-full h-10 cursor-pointer"
              />
              <label className="text-gray-400 text-sm">Accent Color</label>

              <input
                type="color"
                value={themeText}
                onChange={(e) => setThemeText(e.target.value)}
                className="w-full h-10 cursor-pointer"
              />
              <label className="text-gray-400 text-sm">
                Text Color On Primary
              </label>
            </div>

            {/* STEP 4: SUBMIT */}
            <button
              disabled={!fetchedData || isSubmitting || isUploading}
              onClick={handleSubmitRestaurant}
              className="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-md font-semibold disabled:opacity-50 flex justify-center gap-2"
            >
              {isSubmitting ? <Spinner className="w-5 h-5" /> : null}
              Save Restaurant
            </button>
          </div>
        )}

        {activeTab === "restaurants" && (
          <div className="animate-fade-in">
            {isLoadingRestaurants ? (
              <div className="flex justify-center p-8">
                <Spinner className="w-8 h-8" />
              </div>
            ) : restaurants.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                No restaurants found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Rest ID</th>
                      <th className="px-4 py-3">Tagline</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {restaurants.map((r) => (
                      <tr key={r.rest_id}>
                        <td className="px-4 py-3 text-sm text-white">
                          {r.name}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-cyan-400">
                          {r.rest_id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {r.tagline || "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setAddTableFor(r.rest_id);
                              setTableNumber("");
                              setCapacity("");
                              setTableError(null);
                            }}
                            className="inline-flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold"
                          >
                            <Icon type="plus-circle" className="w-4 h-4" />
                            Add Table
                          </button>{" "}
                          <button
                            onClick={() => {
                              setShowTablesFor(r.rest_id);
                              loadTables(r.rest_id);
                            }}
                            className="inline-flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold"
                          >
                            <Icon type="plus-circle" className="w-4 h-4" />
                            View Tables
                          </button>
                          {""}
                          <button
                            onClick={() => {
                              setTableId(r.id);
                              loadResturent(r.rest_id);
                              // EditTable(r);
                              // setTableNumber("");
                              // setCapacity("");
                              // setTableError(null);
                            }}
                            className="inline-flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 m-1 rounded-md text-xs font-semibold"
                          >
                            <Icon type="plus-circle" className="w-4 h-4" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tableError && (
              <p className="mt-4 text-center text-sm text-red-400">
                {tableError}
              </p>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="animate-fade-in">
            {isLoadingOrders ? (
              <div className="flex justify-center p-8">
                <Spinner className="w-8 h-8" />
              </div>
            ) : orders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No active Orders.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-3">Order Info</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Feedback</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {orders.map((o) => (
                      <tr key={o.id}>
                        {/* ORDER INFO */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-cyan-400 font-mono">
                            {o.id}
                          </div>
                          <div className="text-xs text-gray-400">{o.name}</div>

                          {o.status && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300 mt-1 capitalize">
                              {o.status.replaceAll("-", " ")}
                            </span>
                          )}
                        </td>

                        {/* CUSTOMER */}
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-white">
                            {o.customer.name}
                          </div>
                          <div className="text-sm text-gray-400">
                            {o.customer.phone}
                          </div>
                          <div className="text-xs text-gray-500">
                            {o.customer.email}
                          </div>
                        </td>

                        {/* DATE & TIME */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(o.createdAt).toLocaleTimeString()}
                          </div>
                        </td>

                        {/* PRICE */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-white font-bold">
                          ₹{o.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {o.rating != null ? (
                            <StarRating value={o.rating} />
                          ) : null}
                        </td>
                        <td className="px-4 py-4 max-w-xs">
                          {o.feedback ? (
                            <p className="text-sm text-gray-300 line-clamp-2">
                              {o.feedback}
                            </p>
                          ) : null}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {calculateRefundPercent(o.status) > 0 ? (
                            <button
                              className="bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-bold uppercase flex items-center gap-1"
                              onClick={() => handleOpenCancelModal(o)}
                            >
                              <Icon type="x-circle" className="w-4 h-4" />
                              Cancel Order
                            </button>
                          ) : (
                            <span className="text-xs text-gray-500">
                              Not cancellable
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "reservations" && (
          <div className="animate-fade-in">
            {isLoadingReservations ? (
              <div className="flex justify-center p-8">
                <Spinner className="w-8 h-8" />
              </div>
            ) : reservations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No active reservations.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-3">Info</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3">Table</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {reservations.map((res) => {
                      const overdue = isOverdue(res.date, res.time);
                      return (
                        <tr
                          key={res.id}
                          className={overdue ? "bg-red-900/20" : ""}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-cyan-400 font-mono">
                              {res.bookingId}
                            </div>
                            <div className="text-xs text-gray-400">
                              {res.name}
                            </div>
                            {overdue && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900 text-red-200 mt-1">
                                Overdue {">"} 20m
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-white">
                              {res.name}
                            </div>
                            <div className="text-sm text-gray-400">
                              {res.phone}
                            </div>
                            <div className="text-xs text-gray-500">
                              {res.guests} Guests
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">
                              {new Date(res.date).toLocaleDateString()}
                            </div>
                            <div className="text-2xl font-light text-white">
                              {res.time}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-white font-bold">
                            {res.tableId ? res.tableId.toUpperCase() : "N/A"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  handleReservationAction(res.id, "seated")
                                }
                                disabled={!!processingResId}
                                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-md text-xs font-bold uppercase disabled:opacity-50 flex items-center gap-1"
                              >
                                {processingResId === res.id ? (
                                  <Spinner className="w-3 h-3" />
                                ) : (
                                  <Icon
                                    type="check-circle"
                                    className="w-4 h-4"
                                  />
                                )}
                                Seated
                              </button>
                              <button
                                onClick={() =>
                                  handleReservationAction(res.id, "cancel")
                                }
                                disabled={!!processingResId}
                                className="bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-bold uppercase disabled:opacity-50 flex items-center gap-1"
                              >
                                <Icon type="x-circle" className="w-4 h-4" />{" "}
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "complaints" && (
          <div className="animate-fade-in">
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={() => setComplaintFilter("active")}
                className={`px-4 py-2 rounded-full font-semibold text-sm ${
                  complaintFilter === "active"
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Active (
                {
                  complaints.filter((c) => c.complaint?.status === "pending")
                    .length
                }
                )
              </button>
              <button
                onClick={() => setComplaintFilter("resolved")}
                className={`px-4 py-2 rounded-full font-semibold text-sm ${
                  complaintFilter === "resolved"
                    ? "bg-green-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Resolved
              </button>
            </div>
            {isLoadingComplaints ? (
              <div className="flex justify-center p-8">
                <Spinner className="w-8 h-8" />
              </div>
            ) : filteredComplaints.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No complaints found.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredComplaints.map((order) => (
                  <div
                    key={order.id}
                    className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row gap-4"
                  >
                    <div className="flex-1 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <p>
                          <strong className="text-gray-400">
                            Complaint ID:
                          </strong>{" "}
                          <span className="text-white font-mono">
                            {order.complaint?.id}
                          </span>
                        </p>
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded-full capitalize ${
                            order.complaint?.status === "pending"
                              ? "bg-yellow-900 text-yellow-300"
                              : order.complaint?.status === "approved"
                                ? "bg-green-900 text-green-300"
                                : "bg-red-900 text-red-300"
                          }`}
                        >
                          {order.complaint?.status}
                        </span>
                      </div>
                      <p>
                        <strong className="text-gray-400">Order ID:</strong>{" "}
                        <span className="text-cyan-400 font-mono">
                          {order.id}
                        </span>
                      </p>
                      <p>
                        <strong className="text-gray-400">Customer:</strong>{" "}
                        {order.customer.name} ({order.customer.phone})
                      </p>
                      <div className="mt-2 p-2 bg-gray-900/50 rounded border border-gray-700/50">
                        <p className="font-semibold text-red-300 mb-1">
                          Issue Items:
                        </p>
                        <ul className="list-disc list-inside pl-1 text-gray-300">
                          {order.complaint?.itemNames.map((name) => (
                            <li key={name}>{name}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-2 p-2 bg-gray-900/50 rounded border border-gray-700/50">
                        <p className="font-semibold text-gray-300 mb-1">
                          Comments:
                        </p>
                        <p className="italic text-gray-400">
                          "{order.complaint?.comments}"
                        </p>
                      </div>
                    </div>
                    {order.complaint?.status === "pending" && (
                      <div className="flex flex-col justify-center gap-2 min-w-[150px]">
                        <button
                          onClick={() => handleApproveRefund(order)}
                          disabled={!!processingComplaintId}
                          className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-md text-sm flex items-center justify-center gap-2"
                        >
                          {processingComplaintId === order.id ? (
                            <Spinner className="w-4 h-4" />
                          ) : (
                            <Icon type="check-circle" className="w-4 h-4" />
                          )}
                          Approve Refund
                        </button>

                        <button
                          onClick={() => handleRejectComplaint(order.id)}
                          disabled={!!processingComplaintId}
                          className="bg-red-700 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md text-sm disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <Icon type="x-circle" className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "loyalty" && (
          <div className="space-y-6 animate-fade-in max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-center">
              Loyalty Configuration
            </h2>
            {loyaltySuccess && (
              <p className="text-green-400 text-center font-semibold">
                {loyaltySuccess}
              </p>
            )}
            <div className="bg-gray-800 p-6 rounded-lg">
              <label
                htmlFor="rupeesPerPoint"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Spend amount (₹) to earn 1 Point
              </label>
              <input
                id="rupeesPerPoint"
                type="number"
                value={loyaltyConfig.rupeesPerPoint}
                onChange={handleLoyaltyConfigChange}
                className="block w-full rounded-md border-gray-600 bg-gray-900 py-3 px-4 text-white text-lg focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <button
              onClick={handleSaveLoyaltyConfig}
              disabled={isSavingLoyalty}
              className="w-full rounded-md bg-cyan-600 px-4 py-3 text-lg font-semibold text-white shadow-sm hover:bg-cyan-500 disabled:bg-gray-600 transition-colors"
            >
              {isSavingLoyalty ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        )}
        {activeTab === "addOutlet" && (
          <div className="space-y-6 animate-fade-in max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-cyan-400">
              Outlet Details
            </h3>

            <div>
              <label className="text-gray-400 text-sm">Resturent</label>
              <select
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-md p-3"
              >
                <option value="" disabled>
                  Select a restaurant
                </option>
                {restaurants.map((r) => (
                  <option value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm">Open Time</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="About this restaurant"
                  className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-md p-3"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm">Close Time</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="About this restaurant"
                  className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-md p-3"
                />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm">
                Link With Petpooja Outlet
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="About this restaurant"
                className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-md p-3"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Status</label>
              <select
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-md p-3"
              >
                <option value="" disabled>
                  Select a status
                </option>
                <option value="active">Enable</option>
                <option value="inactive">Disable</option>
              </select>
            </div>
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  // Add your save logic here
                  console.log("Saving restaurant details...");
                  // setTableId(null); // Uncomment to close after saving
                }}
                disabled={isUploading}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <button
            onClick={() => handleNavigate("#")}
            className="text-sm text-cyan-400 hover:underline bg-transparent border-none p-0 cursor-pointer"
          >
            ← Back to Main Site
          </button>
        </div>
      </div>
      {addTableFor && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              Add Table for{" "}
              <span className="font-mono text-cyan-400">{addTableFor}</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Table Number
                </label>
                <input
                  type="number"
                  className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-md p-2"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-md p-2"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>
              {tableError && (
                <p className="text-sm text-red-400">{tableError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 text-sm rounded-md border border-gray-600 text-gray-200 hover:bg-gray-800"
                disabled={isSavingTable}
                onClick={() => {
                  setAddTableFor(null);
                  setTableNumber("");
                  setCapacity("");
                  setTableError(null);
                }}
              >
                Close
              </button>
              <button
                className="px-4 py-2 text-sm rounded-md bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-60"
                disabled={isSavingTable}
                onClick={async () => {
                  if (!tableNumber || !capacity) {
                    setTableError("Table number and capacity are required.");
                    return;
                  }

                  setIsSavingTable(true);
                  setTableError(null);

                  const tableName = `Table ${tableNumber}`;

                  const res = await apiAddTable(addTableFor!, {
                    table_number: Number(tableNumber),
                    capacity: Number(capacity),
                    table_name: tableName, // 🔥 passes table_name properly
                  });

                  if (res.error) {
                    setTableError(res.error);
                  } else {
                    setAddTableFor(null);
                    setTableNumber("");
                    setCapacity("");
                    await fetchRestaurants(); // reload restaurants
                  }

                  setIsSavingTable(false);
                }}
              >
                {isSavingTable ? "Saving..." : "Save Table"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showTablesFor && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold flex items-center justify-between mb-4">
              Tables for{" "}
              <span className="font-mono text-cyan-400">{showTablesFor}</span>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => {
                  setShowTablesFor(null);
                  setTables([]);
                }}
              >
                ✕
              </button>
            </h3>

            {loadingTables ? (
              <p className="text-gray-400 text-sm">Loading tables...</p>
            ) : tables.length === 0 ? (
              <p className="text-gray-400 text-sm">No tables found.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {tables.map((t) => (
                  <div
                    key={t.id}
                    className="flex justify-between bg-gray-800 border border-gray-700 px-3 py-2 rounded"
                  >
                    <span className="text-sm">
                      {t.table_name} ({t.capacity} seats)
                    </span>

                    <button
                      className={`px-2 py-1 rounded text-xs text-white ${
                        t.is_active
                          ? "bg-green-600 hover:bg-green-500"
                          : "bg-red-600 hover:bg-red-500"
                      }`}
                      onClick={async () => {
                        await apiToggleTable(t.id, !t.is_active);
                        loadTables(showTablesFor!);
                      }}
                    >
                      {t.is_active ? "Active" : "Inactive"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {TableId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto scrollbar-hide">
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>

            {/* Sticky Header */}
            <div className="sticky top-0 bg-gray-900 px-6 py-4 border-b border-gray-700 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-cyan-400">
                Restaurant Details
              </h3>
              <button
                onClick={() => setTableId(null)}
                className="text-gray-400 hover:text-gray-200 transition-colors"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Short tagline"
                  className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-md p-3"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="About this restaurant"
                  className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-md p-3 h-24"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* LOGO */}
                <div className="space-y-2">
                  <label className="text-gray-400 text-sm">Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      // instant preview
                      const localUrl = URL.createObjectURL(file);
                      setLogoUrl(localUrl);

                      // upload to storage
                      const url = await uploadImage(file, "logo");
                      if (url) setLogoUrl(url);
                    }}
                    className="w-full text-sm text-gray-300"
                  />
                  <img
                    src={logoUrl || DEFAULT_IMAGE}
                    alt="Logo Preview"
                    className="w-full h-40 object-cover border border-gray-700 rounded"
                  />
                </div>

                {/* HERO IMAGE */}
                <div className="space-y-2">
                  <label className="text-gray-400 text-sm">Hero Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const localUrl = URL.createObjectURL(file);
                      setHeroImageUrl(localUrl);

                      const url = await uploadImage(file, "hero");
                      if (url) setHeroImageUrl(url);
                    }}
                    className="w-full text-sm text-gray-300"
                  />
                  <img
                    src={heroImageUrl || DEFAULT_IMAGE}
                    alt="Hero Preview"
                    className="w-full h-40 object-cover border border-gray-700 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm">About Text</label>
                <textarea
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  placeholder="Story / about section"
                  className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-md p-3 h-24"
                />
              </div>

              {/* ABOUT IMAGE */}
              <div className="space-y-2">
                <label className="text-gray-400 text-sm">About Image</label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const localUrl = URL.createObjectURL(file);
                    setAboutImageUrl(localUrl);
                    const url = await uploadImage(file, "about");
                    if (url) setAboutImageUrl(url);
                  }}
                  className="w-full text-sm text-gray-300"
                />
                <img
                  src={aboutImageUrl || DEFAULT_IMAGE}
                  alt="About Preview"
                  className="w-full h-56 object-cover border border-gray-700 rounded"
                />
              </div>

              {uploadError ? (
                <p className="text-sm text-red-400">{uploadError}</p>
              ) : null}

              {isUploading ? (
                <p className="text-xs text-gray-400 flex items-center gap-2">
                  <Spinner className="w-4 h-4" /> Uploading image...
                </p>
              ) : null}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setTableId(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-md transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Add your save logic here
                    console.log("Saving restaurant details...");
                    // setTableId(null); // Uncomment to close after saving
                  }}
                  disabled={isUploading}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {cancelOrderFor && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Icon type="alert-triangle" className="w-5 h-5 text-yellow-400" />
              Confirm Cancellation
            </h3>

            <textarea
              placeholder="Reason for cancellation..."
              className="w-full h-24 mt-4 bg-gray-800 text-gray-200 border border-gray-700 p-3 rounded-md"
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                setCancelError(null);
              }}
            />

            {cancelError && (
              <p className="text-sm text-red-400 mt-2">{cancelError}</p>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                className="px-4 py-2 text-sm rounded-md border border-gray-600 text-gray-200 hover:bg-gray-800"
                disabled={isCancelling}
                onClick={() => setCancelOrderFor(null)}
              >
                Keep Order
              </button>

              <button
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-500 disabled:opacity-70"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
      {refundOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-3">Approve Refund</h3>

            <p className="text-sm text-gray-400 mb-1">Order ID:</p>
            <p className="font-mono text-cyan-400 mb-3">{refundOrder.id}</p>

            <p className="text-sm text-gray-400 mb-1">Order Value:</p>
            <p className="text-white font-bold mb-4">
              ₹{refundOrder.complaint?.totalAmount}
            </p>

            <label className="block text-sm text-gray-300 mb-1">
              Refund Amount
            </label>

            <input
              type="number"
              min={0}
              max={refundOrder.complaint?.totalAmount}
              value={refundAmount}
              onChange={(e) => {
                const value = Number(e.target.value);
                setRefundAmount(value);
                setRefundError(
                  value > Number(refundOrder.complaint?.totalAmount)
                    ? "Refund cannot exceed order value"
                    : null,
                );
              }}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-md p-2"
            />

            {refundError && (
              <p className="text-sm text-red-400 mt-2">{refundError}</p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setRefundOrder(null)}
                className="px-4 py-2 rounded-md border border-gray-600 text-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmRefund}
                disabled={isRefunding}
                className="px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-60"
              >
                {isRefunding ? "Processing..." : "Confirm Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
