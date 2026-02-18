import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Order,
  LoyaltyConfig,
  DishRecommendation,
  User,
  Reservation,
} from "../types";

import { Icon } from "./Icon";
import OrderStatusPage from "./OrderStatusPage";
import {
  apiGetUserOrders,
  apiUpdateOrder,
  apiGetUserValidPoints,
  apiGetLoyaltyConfig,
  apiUpdateUser,
  apiRaiseComplaint,
  apiGetUserReservations,
  apiGetUserAIRecommendation,
  apiGetRestaurants,
  apiGetOutlet, // ✅ use restaurants from Supabase (same as LandingPage)
} from "../services/apiService";
import { normalizeOrderStatus } from "../model/status";

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

// RatingModal (unchanged UI)
const RatingModal: React.FC<{
  order: Order;
  onClose: () => void;
  onSave: (orderId: string, rating: number, feedback: string) => void;
}> = ({ order, onClose, onSave }) => {
  const [rating, setRating] = useState(order.rating || 0);
  const [feedback, setFeedback] = useState(order.feedback || "");
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
          <h3 className="text-xl font-semibold text-white mb-4">
            Rate your order
          </h3>
          <div className="flex justify-center mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <Icon
                  type="star"
                  className={`w-8 h-8 ${rating >= star ? "text-yellow-400" : "text-gray-500"
                    }`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Leave your feedback (optional)..."
            rows={4}
            className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 text-white"
          ></textarea>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(order.id, rating, feedback);
                onClose();
              }}
              className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ComplaintModal (unchanged UI)
const ComplaintModal: React.FC<{
  order: Order;
  onClose: () => void;
  onSave: (orderId: string, itemNames: string[], comments: string) => void;
}> = ({ order, onClose, onSave }) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [error, setError] = useState("");

  const handleItemToggle = (itemName: string) =>
    setSelectedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((item) => item !== itemName)
        : [...prev, itemName],
    );

  const handleSave = () => {
    if (selectedItems.length === 0) {
      setError("Please select at least one item.");
      return;
    }
    if (!comments.trim()) {
      setError("Please provide comments.");
      return;
    }
    onSave(order.id, selectedItems, comments);
    onClose();
  };

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
          <h3 className="text-xl font-semibold text-white mb-4">
            Raise a Complaint
          </h3>
          <p className="text-sm text-gray-400 mb-2">Select issue items:</p>
          <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-700 p-3 rounded-md">
            {order.items.map((item) => (
              <label
                key={item.name}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.name)}
                  onChange={() => handleItemToggle(item.name)}
                  className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600"
                />
                <span className="text-white">
                  {item.name} x{item.quantity}
                </span>
              </label>
            ))}
          </div>

          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Describe the issue..."
            rows={4}
            className="mt-4 w-full bg-gray-700 p-2 rounded-md border border-gray-600 text-white"
          ></textarea>
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AccountPage: React.FC = () => {
  const { currentUser, logout, isAuthenticated, refreshCurrentUser } =
    useAuth();

  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "for-you" | "active" | "history" | "reservations" | "loyalty" | "profile"
  >("for-you");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);

  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig | null>(
    null,
  );

  // ✅ restaurants instead of brands
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");

  const [recommendation, setRecommendation] =
    useState<DishRecommendation | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<Partial<User>>({});
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (isLoading) return;        // ⛔ wait
    if (!isAuthenticated) {
      window.location.hash = "#login";
    }
  }, [isLoading, isAuthenticated]);

  // ✅ load restaurants from Supabase (same as landing)
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const res = await apiGetOutlet();

        const list = res?.data?.result || [];

        setRestaurants(list);

        if (list.length && !selectedRestaurantId) {
          setSelectedRestaurantId(list[0].petpooja_outlet_id);
        }
      } catch (e) {
        console.error("Failed to load restaurants:", e);
        setRestaurants([]);
      }
    };

    loadRestaurants();
  }, []);


  // build map: rest_id -> name (used for reservations display)
  const restaurantNameById = useMemo(() => {
    const m: Record<string, string> = {};

    for (const outlet of restaurants) {
      if (outlet?.petpooja_outlet_id) {
        m[outlet.petpooja_outlet_id] =
          outlet.restaurants?.name || outlet.petpooja_outlet_id;
      }
    }

    return m;
  }, [restaurants]);
  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);

      setProfileData({
        name: currentUser.name,
        phone: currentUser.phone,
        dob: currentUser.dob,
        anniversaryDate: currentUser.anniversaryDate,
        dietaryPreferences: currentUser.dietaryPreferences,
      });

      Promise.all([
        apiGetUserOrders(currentUser.id),
        apiGetUserReservations(currentUser.id),
        apiGetUserValidPoints(currentUser.id),
        apiGetLoyaltyConfig(),
      ])
        .then(([orders, reservations, points, config]) => {
          setUserOrders(orders);
          setUserReservations(reservations);
          setLoyaltyPoints(points);
          setLoyaltyConfig(config);
        })
        .finally(() => setIsLoading(false));
    }
  }, [currentUser]);

  const handleSaveRating = async (
    orderId: string,
    rating: number,
    feedback: string,
  ) => {
    try {
      const updatedOrder = await apiUpdateOrder(orderId, { rating, feedback });
      setUserOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updatedOrder : o)),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveComplaint = async (
    orderId: string,
    itemNames: string[],
    comments: string,
  ) => {
    try {
      const updatedOrder = await apiRaiseComplaint(
        orderId,
        itemNames,
        comments,
      );
      setUserOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updatedOrder : o)),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleNavigate = (route: string) => (window.location.hash = route);

  // ✅ AI recommendation uses restaurantId (rest_id), not brandId
  const handleGetRecommendation = async () => {
    if (!currentUser || !selectedRestaurantId) return;

    setIsLoadingRecommendation(true);
    setRecommendation(null);
    setRecommendationError("");

    try {
      const result = await apiGetUserAIRecommendation(
        currentUser.id,
        selectedRestaurantId,
      );

      setRecommendation({
        dishName: "Chef's Picks",
        reason: result.recommendation,
        offer: null,
      });
    } catch (err: any) {
      setRecommendationError(err.message || "Something went wrong");
    } finally {
      setIsLoadingRecommendation(false);
    }
  };
  const handleDietaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setProfileData((prev: any) => ({
      ...prev,
      dietaryPreferences: {
        ...prev.dietaryPreferences,
        [name]: value.split(",").map(v => v.trim()).filter(Boolean),
      },
    }));
  };

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setProfileData((prev) => ({
        ...prev,
        [parent]: { ...(prev as any)[parent], [child]: value },
      }));
    } else {
      setProfileData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    setProfileMessage({ type: "", text: "" });
    try {
      await apiUpdateUser(currentUser.id, profileData);
      await refreshCurrentUser();
      setIsEditingProfile(false);
      setProfileMessage({ type: "success", text: "Updated!" });
    } catch (err) {
      setProfileMessage({ type: "error", text: "Failed." });
    }
    setTimeout(() => setProfileMessage({ type: "", text: "" }), 4000);
  };

  const activeOrders = userOrders.filter(
    (o) =>
      normalizeOrderStatus(o.status) !== "Delivered" &&
      normalizeOrderStatus(o.status) !== "Cancelled" &&
      normalizeOrderStatus(o.status) !== "Refunded",
  );

  const pastOrders = userOrders.filter(

    (o) =>
      normalizeOrderStatus(o.status) === "Delivered" ||
      normalizeOrderStatus(o.status) === "Cancelled" ||
      normalizeOrderStatus(o.status) === "Refunded",

  );

  // Reservation logic (unchanged UI)
  const now = new Date();
  const processedReservations = userReservations.map((res) => {
    const resDateTime = new Date(`${res.date}T${res.time}`);
    const expiryTime = new Date(resDateTime.getTime() + 20 * 60000);
    let displayStatus = res.status as any;
    if (res.status === "confirmed" && now > expiryTime) {
      displayStatus = "expired";
    }
    return { ...res, displayStatus, resDateTime };
  });

  const activeReservations = processedReservations.filter(
    (r: any) =>
      r.displayStatus === "confirmed" || r.displayStatus === "pending",
  );
  const pastReservations = processedReservations.filter((r: any) =>
    ["completed", "cancelled", "expired"].includes(r.displayStatus),
  );

  if (!currentUser)
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <Spinner className="w-10 h-10 text-white" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-800 text-white p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-serif">My Account</h1>
            <p className="text-gray-400">Welcome back, {currentUser.name}!</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => handleNavigate("#")}
              className="text-sm text-cyan-400 hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              ← Home
            </button>

            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600"
            >
              <Icon type="log-out" className="w-4 h-4" /> Logout
            </button>
          </div>
        </header>

        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
          {[
            "for-you",
            "active",
            "history",
            "reservations",
            "loyalty",
            "profile",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-shrink-0 py-2 px-4 font-semibold capitalize ${activeTab === tab
                ? "border-b-2 border-cyan-400 text-cyan-400"
                : "text-gray-400"
                }`}
            >
              {tab.replace("-", " ")}{" "}
              {tab === "active" && `(${activeOrders.length})`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Spinner className="w-8 h-8 text-white" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* For You Tab */}
            {activeTab === "for-you" && (
              <div className="bg-gray-900 p-6 rounded-lg shadow-lg animate-fade-in">
                <h2 className="text-2xl font-serif mb-4">
                  AI-Powered Recommendations
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300">
                      Get a recommendation for:
                    </label>

                    {/* ✅ restaurant dropdown (rest_id + name from Supabase) */}
                    <select
                      value={selectedRestaurantId}
                      onChange={(e) => setSelectedRestaurantId(e.target.value)}
                      className="block w-full rounded-md border-gray-600 bg-gray-800 py-2 px-3 text-white mt-1"
                    >
                      {restaurants.map((r) => (
                        <option
                          key={r.petpooja_outlet_id}
                          value={r.petpooja_outlet_id}
                        >
                          {r.name} ({r.state})
                        </option>
                      ))}
                    </select>

                    {/* optional error text (keeps UI minimal) */}
                    {restaurants.length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        No restaurants found.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleGetRecommendation}
                    disabled={isLoadingRecommendation || !selectedRestaurantId}
                    className="w-full flex justify-center items-center gap-2 font-bold py-2 px-4 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-500 transition-colors"
                  >
                    {isLoadingRecommendation ? (
                      <Spinner />
                    ) : (
                      <Icon type="chef-hat" className="w-5 h-5" />
                    )}{" "}
                    Ask the Chef!
                  </button>
                </div>

                {recommendationError && (
                  <p className="mt-4 text-sm text-red-400">
                    {recommendationError}
                  </p>
                )}

                {recommendation && (
                  <div className="mt-6 p-4 bg-gray-800 rounded-md border border-cyan-700/50 animate-fade-in">
                    <h3 className="text-xl font-semibold text-cyan-300">
                      {recommendation.dishName}
                    </h3>
                    <p className="mt-2 text-gray-300">
                      {recommendation.reason}
                    </p>
                    {recommendation.offer && (
                      <div className="mt-3 pt-3 border-t border-gray-700 text-yellow-400 font-semibold">
                        <p>🎉 Special Offer: {recommendation.offer}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Orders Tabs */}
            {activeTab === "active" &&
              (activeOrders.filter(
                (order) => normalizeOrderStatus(order.status) !== "Delivered",
              ).length > 0 ? (
                activeOrders
                  .filter(
                    (order) =>
                      normalizeOrderStatus(order.status) !== "Delivered",
                  )
                  .map((order) => (
                    <OrderStatusPage
                      key={order.id}
                      orderId={order.id}
                      isEmbedded={true}
                    />
                  ))
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No active orders.
                </p>
              ))}

            {activeTab === "history" &&
              (pastOrders.length > 0 ? (
                pastOrders.map((order) => {
                  const deliveredTime = new Date(order.createdAt).getTime();
                  const within24hrs =
                    Date.now() - deliveredTime < 24 * 60 * 60 * 1000;
                  const isDelivered = order.status === "DELIVERED";

                  return (
                    <div
                      key={order.id}
                      className="bg-gray-900 p-4 rounded-lg shadow-lg animate-fade-in space-y-3 border border-gray-700"
                    >
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <div>
                          <p className="font-bold">
                            ID:{" "}
                            <span className="font-mono text-cyan-400">
                              {order.id}
                            </span>
                          </p>
                          <p className="text-sm text-gray-400">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <span
                          className={`px-2 py-1 text-xs font-bold rounded-full ${isDelivered ? "bg-green-600" : "bg-red-600"
                            }`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <div className="text-sm text-gray-300 space-y-1">
                        {order.items.map((item) => (
                          <div key={item.name} className="flex justify-between">
                            <span>
                              {item.name} x {item.quantity}
                            </span>
                            <span>
                              ₹
                              {(
                                parseFloat(
                                  item.price.replace(/[^0-9.-]+/g, ""),
                                ) * item.quantity
                              ).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                        <span className="font-bold">
                          Total: ₹{order.totalAmount.toFixed(2)}
                        </span>
                        {order?.refundAmount != null && (
                          <span className="font-bold">
                            Refund Amount: ₹{order.refundAmount.toFixed(2)}
                          </span>
                        )}


                        {isDelivered && (
                          <>
                            {order.rating ? (
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Icon
                                    key={i}
                                    type="star"
                                    className={`w-5 h-5 ${i < order.rating!
                                      ? "text-yellow-400"
                                      : "text-gray-600"
                                      }`}
                                  />
                                ))}
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsRatingModalOpen(true);
                                }}
                                className="text-cyan-400 hover:underline"
                              >
                                Rate Order
                              </button>
                            )}

                            {within24hrs && (!order.complaint || Object.keys(order.complaint).length === 0) && (
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsComplaintModalOpen(true);
                                }}
                                className="ml-4 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500"
                              >
                                Raise Complaint
                              </button>
                            )}

                          </>
                        )}
                      </div>
                      <div className="text-sm text-gray-300 space-y-1">
                        {order.complaint && Object.keys(order.complaint).length > 0 && (
                          <div className="mt-2 p-2 bg-gray-900/60 rounded border border-red-900/40 text-xs space-y-1">

                            {order.complaint?.itemNames?.length > 0 && (
                              <div>
                                <span
                                  className={`px-2 py-0.5 text-xs font-bold rounded-full capitalize ${order.complaint.status === "pending"
                                    ? "bg-yellow-900 text-yellow-300"
                                    : order.complaint.status === "approved"
                                      ? "bg-green-900 text-green-300"
                                      : "bg-red-900 text-red-300"
                                    }`}
                                >
                                  {order.complaint.status}
                                </span>

                                <p className="font-semibold text-red-400 mt-1">Issue Items:</p>

                                <p className="text-gray-300 text-[11px]">
                                  {order.complaint.itemNames.join(", ")}
                                </p>
                              </div>
                            )}


                            {/* Comments */}
                            {order.complaint.comments && (
                              <div>
                                <p className="font-semibold text-gray-400">Comments:</p>
                                <p className="italic text-gray-500 text-[11px]">
                                  “{order.complaint.comments}”
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No past orders.
                </p>
              ))}

            {/* Reservations Tab */}
            {activeTab === "reservations" && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-cyan-400">
                    Active Reservations
                  </h3>
                  {activeReservations.length === 0 ? (
                    <p className="text-gray-500 bg-gray-900 p-4 rounded-md">
                      No upcoming bookings.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {activeReservations.map((res: any) => (
                        <div
                          key={res.id}
                          className="bg-gray-900 p-4 rounded-lg border-l-4 border-green-500 flex justify-between items-center"
                        >
                          <div>
                            {/* ✅ restaurant name from Supabase list */}
                            <h4 className="font-bold text-lg">
                              {restaurantNameById[res.brandId] ||
                                res.brandId ||
                                "Restaurant"}
                            </h4>
                            <p className="text-gray-300 flex items-center gap-2">
                              <Icon type="calendar" className="w-4 h-4" />{" "}
                              {new Date(res.date).toLocaleDateString()} at{" "}
                              {res.time}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {res.guests} Guests{" "}
                              {res.tableId &&
                                `• Table ${res.tableId.toUpperCase()}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="bg-green-900 text-green-300 px-3 py-1 rounded-full text-xs font-bold uppercase">
                              {res.displayStatus}
                            </span>
                            <p className="text-xs text-cyan-400 mt-2 font-mono font-semibold">
                              {res.bookingId}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-400">
                    Past Reservations
                  </h3>
                  {pastReservations.length === 0 ? (
                    <p className="text-gray-500 bg-gray-900 p-4 rounded-md">
                      No past bookings.
                    </p>
                  ) : (
                    <div className="space-y-4 opacity-75">
                      {pastReservations.map((res: any) => (
                        <div
                          key={res.id}
                          className={`bg-gray-900 p-4 rounded-lg border-l-4 flex justify-between items-center ${res.displayStatus === "completed"
                            ? "border-gray-600"
                            : "border-red-800"
                            }`}
                        >
                          <div>
                            {/* ✅ restaurant name from Supabase list */}
                            <h4 className="font-bold text-gray-300">
                              {restaurantNameById[res.brandId] ||
                                res.brandId ||
                                "Restaurant"}
                            </h4>
                            <p className="text-gray-500 text-sm">
                              {new Date(res.date).toLocaleDateString()} at{" "}
                              {res.time}
                            </p>
                            <p className="text-xs text-gray-600 font-mono mt-1">
                              {res.bookingId}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${res.displayStatus === "completed"
                              ? "bg-gray-700 text-gray-300"
                              : "bg-red-900/50 text-red-400"
                              }`}
                          >
                            {res.displayStatus === "expired"
                              ? "Expired / No-Show"
                              : res.displayStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loyalty Tab */}
            {activeTab === "loyalty" && (
              <div className="bg-gray-900 p-6 rounded-lg shadow-lg animate-fade-in text-center">
                <Icon
                  type="award"
                  className="w-16 h-16 text-yellow-400 mb-4 mx-auto"
                />
                <h2 className="text-2xl font-serif">Your Loyalty Points</h2>
                <p className="text-6xl font-bold text-cyan-400 my-2">
                  {loyaltyPoints}
                </p>
                <p className="text-gray-400">Available to redeem</p>
                {loyaltyConfig && (
                  <p className="mt-4 text-sm text-gray-500 pt-4 border-t border-gray-800">
                    Earn 1 point per ₹{loyaltyConfig.rupeesPerPoint} spent.
                    Redeem 1 point = ₹1.
                  </p>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="bg-gray-900 p-6 rounded-lg shadow-lg animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-serif">Profile</h2>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="text-sm font-semibold text-cyan-400 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {profileMessage.text && (
                  <p
                    className={`text-sm text-center mb-4 ${profileMessage.type === "success" ? "text-green-400" : "text-red-400"
                      }`}
                  >
                    {profileMessage.text}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* NAME */}
                  <div>
                    <label className="text-xs text-gray-400">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={profileData.name || ""}
                      onChange={handleProfileChange}
                      disabled={!isEditingProfile}
                      className="w-full bg-gray-800 p-2 rounded-md border border-gray-700 disabled:bg-gray-900"
                    />
                  </div>

                  {/* PHONE */}
                  <div>
                    <label className="text-xs text-gray-400">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone || ""}
                      onChange={handleProfileChange}
                      disabled={!isEditingProfile}
                      className="w-full bg-gray-800 p-2 rounded-md border border-gray-700 disabled:bg-gray-900"
                    />
                  </div>

                  {/* EMAIL */}
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-400">Email</label>
                    <input
                      type="email"
                      value={currentUser.email}
                      disabled
                      className="w-full bg-gray-900 p-2 rounded-md border border-gray-700 text-gray-400"
                    />
                  </div>

                  {/* DIETARY PREFERENCES */}
                  <div className="md:col-span-2 border-t border-gray-700 pt-3 mt-2">
                    <h3 className="text-sm font-semibold text-cyan-400 mb-2">
                      Dietary Preferences
                    </h3>

                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-400">Likes</label>
                        <input
                          type="text"
                          name="likes"
                          placeholder="spicy food, fish"
                          value={profileData.dietaryPreferences?.likes?.join(", ") || ""}
                          onChange={handleDietaryChange}
                          disabled={!isEditingProfile}
                          className="w-full bg-gray-800 p-2 rounded-md border border-gray-700 disabled:bg-gray-900"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-400">Dislikes</label>
                        <input
                          type="text"
                          name="dislikes"
                          placeholder="mushroom, bitter gourd"
                          value={profileData.dietaryPreferences?.dislikes?.join(", ") || ""}
                          onChange={handleDietaryChange}
                          disabled={!isEditingProfile}
                          className="w-full bg-gray-800 p-2 rounded-md border border-gray-700 disabled:bg-gray-900"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-400">Allergies</label>
                        <input
                          type="text"
                          name="allergies"
                          placeholder="peanuts, gluten"
                          value={profileData.dietaryPreferences?.allergies?.join(", ") || ""}
                          onChange={handleDietaryChange}
                          disabled={!isEditingProfile}
                          className="w-full bg-gray-800 p-2 rounded-md border border-gray-700 disabled:bg-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SAVE BUTTONS */}
                  {isEditingProfile && (
                    <div className="col-span-2 flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {isRatingModalOpen && selectedOrder && (
        <RatingModal
          order={selectedOrder}
          onClose={() => setIsRatingModalOpen(false)}
          onSave={handleSaveRating}
        />
      )}
      {isComplaintModalOpen && selectedOrder && (
        <ComplaintModal
          order={selectedOrder}
          onClose={() => setIsComplaintModalOpen(false)}
          onSave={handleSaveComplaint}
        />
      )}
    </div>
  );
};

export default AccountPage;
