import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "./Icon";
import {
  Brand,
  BrandMenuCategory,
  LoyaltyConfig,
  Order,
  Reservation,
} from "../types";
import {
  apiGetLoyaltyConfig,
  apiSetLoyaltyConfig,
  apiGetLiveMenu,
  apiUpdateItemAvailability,
  apiGetAllBrands,
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
} from "../services/apiService";
import { supabase } from "../services/supabaseClient";
import { brandsData } from "../data";

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
  >("menu");


  // Menu State
  const [menu, setMenu] = useState<BrandMenuCategory[] | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] =
    useState<Brand["id"]>("c9ignw2k50");
  const [restId, setRestId] = useState("");
  const [fetchedData, setFetchedData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);

  const [themePrimary, setThemePrimary] = useState("#000000");
  const [themeAccent, setThemeAccent] = useState("#FFAB00");
  const [themeText, setThemeText] = useState("#FFFFFF");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const DEFAULT_IMAGE = "https://via.placeholder.com/400x300?text=No+Image";

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
    "active"
  );
  const [processingComplaintId, setProcessingComplaintId] = useState<
    string | null
  >(null);
  // 🔸 CANCEL ORDER MODAL STATE
  const [cancelOrderFor, setCancelOrderFor] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Reservations State
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [processingResId, setProcessingResId] = useState<string | null>(null);
  useEffect(() => {
    const brands = apiGetAllBrands(); // already synchronous in your code
    if (!selectedBrandId && brands.length > 0) {
      setSelectedBrandId(brands[0].id); // pick the first brand
    }
  }, [selectedBrandId]);
  // *** REAL-TIME SETUP ***
  // Restaurants State
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);

  // Add Table Modal State
  const [addTableFor, setAddTableFor] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isSavingTable, setIsSavingTable] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [showTablesFor, setShowTablesFor] = useState<string | null>(null);
  const [loadingTables, setLoadingTables] = useState(false);

  async function loadTables(restId: string) {
    setLoadingTables(true);
    const res = await apiGetTables(restId);
    setTables(res.tables || []);
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
        }
      )
      .subscribe();
    const ordersSubscription = supabase
      .channel("realtime:admin_orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          if (activeTab === "complaints") fetchComplaints();
        }
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderSubscription);
      supabase.removeChannel(reservationSubscription);
    };
  }, [activeTab]);

  const fetchMenu = useCallback(async (brandId: Brand["id"]) => {
    setIsLoadingMenu(true);
    setError(null);
    try {
      const adminMenu = await apiGetAdminCategoriesMenu(brandId); // <-- use new API
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
    if (activeTab === "menu") fetchMenu(selectedBrandId);
    else if (activeTab === "orders") fetchOrders();
    else if (activeTab === "loyalty")
      apiGetLoyaltyConfig().then(setLoyaltyConfig);
    else if (activeTab === "complaints") fetchComplaints();
    else if (activeTab === "reservations") fetchReservations();
    else if (activeTab === "restaurants") fetchRestaurants();
  }, [
    activeTab,
    selectedBrandId,
    fetchMenu,
    fetchOrders,
    fetchComplaints,
    fetchReservations,
    fetchRestaurants,
  ]);

  const handleFetchRestaurantData = async () => {
    setIsFetching(true);

    const res = await apiFetchRestaurantMapping(restId);

    if (Array.isArray(res.data) && res.data.length > 0) {
      setFetchedData(res.data[0].details || res.data[0]); // Use details if present
    } else if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
      setFetchedData(res.data.data[0].details || res.data.data[0]);
    } else {
      setFetchedData(null);
    }

    setIsFetching(false);
  };

  const handleSubmitRestaurant = async () => {
    if (!fetchedData) return;
    setIsSubmitting(true);

    const payload = {
      rest_id: restId,
      name: fetchedData.restaurantname || "",
      tagline: fetchedData.tagline || "",
      description: fetchedData.description || "",
      address: fetchedData.address || "",
      city: fetchedData.city || "",
      logo: fetchedData.logo || fetchedData.images?.[0] || "",
      hero_image: fetchedData.hero_image || "",
      about_text: fetchedData.about_text || "",
      about_image: fetchedData.about_image || "",
      theme_primary: themePrimary,
      theme_accent: themeAccent,
      theme_text_on_primary: themeText,
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



  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBrandId(e.target.value as Brand["id"]);
    setMenu(null);
  };
  // const handleToggleAvailability = async (itemName: string) => { if (!menu) return; const isCurrentlyAvailable = !!menu.flatMap(c => c.items).find(i => i.name === itemName)?.isAvailable; const updatedMenu = menu.map(category => ({ ...category, items: category.items.map(item => item.name === itemName ? { ...item, isAvailable: !item.isAvailable } : item) })); try { await apiUpdateItemAvailability(selectedBrandId, itemName, !isCurrentlyAvailable); setMenu(updatedMenu); } catch (err) { setError(err instanceof Error ? err.message : "Failed to update item."); } };
  const handleLoyaltyConfigChange = (
    e: React.ChangeEvent<HTMLInputElement>
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
  const handleApproveRefund = async (orderId: string) => {
    setProcessingComplaintId(orderId);
    try {
      await apiProcessRefundApproval(orderId);
      await fetchComplaints();
    } catch (err) {
      console.error(err);
      alert("Failed to process refund.");
    } finally {
      setProcessingComplaintId(null);
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
    action: "seated" | "cancel"
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
        "Action failed. You may need to check database permissions (RLS policies)."
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
            className={`flex-shrink-0 py-2 px-4 font-semibold ${activeTab === "menu"
              ? "border-b-2 border-cyan-400 text-cyan-400"
              : "text-gray-400"
              }`}
          >
            Live Menu
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-shrink-0 py-2 px-4 font-semibold ${activeTab === "orders"
              ? "border-b-2 border-cyan-400 text-cyan-400"
              : "text-gray-400"
              }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab("reservations")}
            className={`flex-shrink-0 py-2 px-4 font-semibold ${activeTab === "reservations"
              ? "border-b-2 border-cyan-400 text-cyan-400"
              : "text-gray-400"
              }`}
          >
            Reservations ({reservations.length})
          </button>
          <button
            onClick={() => setActiveTab("complaints")}
            className={`flex-shrink-0 py-2 px-4 font-semibold ${activeTab === "complaints"
              ? "border-b-2 border-cyan-400 text-cyan-400"
              : "text-gray-400"
              }`}
          >
            Complaints
          </button>
          <button
            onClick={() => setActiveTab("loyalty")}
            className={`flex-shrink-0 py-2 px-4 font-semibold ${activeTab === "loyalty"
              ? "border-b-2 border-cyan-400 text-cyan-400"
              : "text-gray-400"
              }`}
          >
            Loyalty
          </button>
          <button
            onClick={() => setActiveTab("restaurants")}
            className={`flex-shrink-0 py-2 px-4 font-semibold ${activeTab === "restaurants"
              ? "border-b-2 border-cyan-400 text-cyan-400"
              : "text-gray-400"
              }`}
          >
            All Restaurants
          </button>

          <button
            onClick={() => setActiveTab("addRestaurant")}
            className={`flex-shrink-0 py-2 px-4 font-semibold ${activeTab === "addRestaurant"
              ? "border-b-2 border-cyan-400 text-cyan-400"
              : "text-gray-400"
              }`}
          >
            Add Restaurant
          </button>

        </div>
        {activeTab === "menu" && (
          <div className="animate-fade-in">
            <div className="mb-4 max-w-xs mx-auto">
              <select
                id="brand-select"
                value={selectedBrandId}
                onChange={handleBrandChange}
                className="block w-full rounded-md border-gray-600 bg-gray-800 py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 sm:text-sm"
              >
                {(apiGetAllBrands() || []).map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
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
                              className={`px-2 py-1 text-xs font-bold rounded transition-colors ${item.isAvailable
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

            <h2 className="text-2xl font-semibold text-center">Add Restaurant</h2>

            {/* STEP 1: ENTER REST ID */}
            <div className="space-y-2">
              <label className="text-gray-300 text-sm">PetPuja Restaurant ID</label>
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
            {fetchedData && (
              <div className="bg-gray-900 border border-gray-700 rounded-md p-5 space-y-3">
                <h3 className="text-lg font-semibold text-cyan-400">Fetched Details</h3>

                <p><span className="text-gray-400">Name:</span> {fetchedData.restaurantname}</p>
                <p><span className="text-gray-400">Address:</span> {fetchedData.address}</p>
                <p><span className="text-gray-400">City:</span> {fetchedData.city}</p>

                <img
                  src={
                    fetchedData.logo ||
                    fetchedData.images?.[0] ||
                    DEFAULT_IMAGE
                  }
                  alt="Restaurant Logo"
                  className="w-40 h-40 object-cover border border-gray-700 rounded"
                />
              </div>
            )}


            {/* STEP 3: THEME INPUTS */}
            <div className="bg-gray-900 border border-gray-700 p-5 rounded-md space-y-4">
              <h3 className="text-lg font-semibold text-cyan-400">Theme Configuration</h3>

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
              <label className="text-gray-400 text-sm">Text Color On Primary</label>
            </div>

            {/* STEP 4: SUBMIT */}
            <button
              disabled={!fetchedData || isSubmitting}
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
                        <td className="px-4 py-3 text-sm text-white">{r.name}</td>
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
                          </button>   <button
                            onClick={() => {
                              setShowTablesFor(r.rest_id);
                              loadTables(r.rest_id);
                            }}
                            className="inline-flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold"
                          >
                            <Icon type="plus-circle" className="w-4 h-4" />
                            View Tables
                          </button>


                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tableError && (
              <p className="mt-4 text-center text-sm text-red-400">{tableError}</p>
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
                          <div className="text-xs text-gray-400">
                            {brandsData[o.brandId]?.name}
                          </div>

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
                              {brandsData[res.brandId]?.name}
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
                className={`px-4 py-2 rounded-full font-semibold text-sm ${complaintFilter === "active"
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
                className={`px-4 py-2 rounded-full font-semibold text-sm ${complaintFilter === "resolved"
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
                          className={`px-2 py-0.5 text-xs font-bold rounded-full capitalize ${order.complaint?.status === "pending"
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
                          onClick={() => handleApproveRefund(order.id)}
                          disabled={!!processingComplaintId}
                          className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-md text-sm disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                        >
                          {processingComplaintId === order.id ? (
                            <Spinner className="w-4 h-4" />
                          ) : (
                            <Icon type="check-circle" className="w-4 h-4" />
                          )}{" "}
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
                    table_name: tableName,  // 🔥 passes table_name properly
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
              Tables for <span className="font-mono text-cyan-400">{showTablesFor}</span>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => {
                  setShowTablesFor(null)
                  setTables([])
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
                    <span className="text-sm">{t.table_name} ({t.capacity} seats)</span>

                    <button
                      className={`px-2 py-1 rounded text-xs text-white ${t.is_active ? "bg-green-600 hover:bg-green-500"
                        : "bg-red-600 hover:bg-red-500"
                        }`}
                      onClick={async () => {
                        await apiToggleTable(t.id, !t.is_active)
                        loadTables(showTablesFor!)
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
    </div>
  );
};

export default AdminDashboardPage;
