import React, { useState, useEffect } from "react";
import { Order } from "../types";
import { brandsData } from "../data";
import { Icon } from "./Icon";
import { apiGetOrderById } from "../services/apiService";
import { normalizeOrderStatus } from "../model/status";

// FRONTEND ORDER FLOW STEPS
const steps = ["Order Placed", "Accepted", "Food Ready", "Out For Delivery", "Delivered"];

interface StatusTrackerProps {
  status: Order["status"];
}

const StatusTracker: React.FC<StatusTrackerProps> = ({ status }) => {
  if (status === "Cancelled") {
    return (
      <div className="flex items-center justify-center gap-3 p-4 bg-red-900/50 border border-red-700 rounded-md w-full">
        <Icon type="x-circle" className="w-8 h-8 text-red-400" />
        <div>
          <h4 className="font-bold text-red-200">Order Cancelled</h4>
          <p className="text-sm text-red-300">This order has been cancelled.</p>
        </div>
      </div>
    );
  }

  const currentIndex = steps.indexOf(status);

  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500 ${
                index < currentIndex
                  ? "bg-green-500"
                  : index === currentIndex
                  ? "bg-cyan-500 animate-pulse"
                  : "bg-gray-600"
              }`}
            >
              <Icon type="check-circle" className="w-5 h-5 text-white" />
            </div>

            <p
              className={`mt-2 text-xs sm:text-sm text-center font-semibold ${
                index <= currentIndex ? "text-white" : "text-gray-400"
              }`}
            >
              {step}
            </p>
          </div>

          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-1 mx-2 ${index < currentIndex ? "bg-green-500" : "bg-gray-600"}`}
            ></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

interface OrderStatusPageProps {
  orderId?: string;
  isEmbedded?: boolean;
}

const OrderStatusPage: React.FC<OrderStatusPageProps> = ({ orderId, isEmbedded = false }) => {
  const [trackingId, setTrackingId] = useState("");
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrder = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const order = await apiGetOrderById(id);
      setFoundOrder(order || null);
      if (!order && !isEmbedded) setError("Order not found.");
    } catch {
      if (!isEmbedded) setError("Failed to fetch order.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let id = orderId;
    if (!id && !isEmbedded) {
      const params = new URLSearchParams(window.location.hash.split("?")[1]);
      id = params.get("id") || undefined;
    }
    if (id) {
      setTrackingId(id);
      fetchOrder(id);
    }
  }, [orderId, isEmbedded]);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return setError("Please enter an order ID.");
    fetchOrder(trackingId.trim());
  };

  const normalizedStatus = normalizeOrderStatus(foundOrder?.status ?? "");

  const canCancel =
    foundOrder &&
    normalizedStatus !== "Cancelled" &&
    normalizedStatus !== "Delivered" &&
    normalizedStatus !== "Out For Delivery";

const OrderContent = (
  <>
    {error && !isEmbedded && (
      <div className="p-4 bg-red-900/50 border border-red-600 text-red-200 rounded-md text-center">
        <p>{error}</p>
      </div>
    )}

    {foundOrder && (
      <div className="space-y-8 bg-gray-900 p-8 rounded-lg border border-gray-700 w-full">
        {/* ALWAYS SHOW HEADER */}
        <div className="pb-2">
          <h2 className="text-xl sm:text-2xl font-serif">
            Order from {brandsData[foundOrder.brandId]?.name || "Unknown Restaurant"}
          </h2>
          <p className="text-gray-400 text-sm font-mono">ID: {foundOrder.id}</p>
        </div>

        {/* IF NOT DELIVERED, SHOW EVERYTHING ELSE */}
        {normalizedStatus !== "Delivered" && (
          <>
            {!isEmbedded && (
              <div className="py-4 border-y border-gray-700 space-y-2">
                <h3 className="text-lg font-semibold">Order Summary</h3>

                {foundOrder.items.map((item) => (
                  <div key={item.name} className="flex justify-between text-sm">
                    <p className="text-gray-300">
                      {item.name} <span className="text-gray-400">x{item.quantity}</span>
                    </p>
                    <p className="text-gray-400">
                      ₹{(
                        parseFloat(item.price.replace(/[^0-9.-]+/g, "")) * item.quantity
                      ).toFixed(2)}
                    </p>
                  </div>
                ))}

                <div className="flex justify-between font-bold pt-2 border-t border-gray-700/50">
                  <p>Total Paid</p>
                  <p>₹{foundOrder.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* CURRENT STATUS */}
            <div className="pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-center mb-6">Current Status</h3>
              <StatusTracker status={normalizedStatus} />

              {canCancel && (
                <div className="flex justify-center mt-6">
                  <button className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 shadow-md">
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    )}
  </>
);


  if (isEmbedded) return OrderContent;

  return (
    <div className="min-h-screen bg-gray-800 text-white p-8 sm:p-12 lg:p-16 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-gray-900 rounded-lg p-10 shadow-2xl border border-gray-700">
        <header className="text-center mb-10">
          <Icon type="credit-card" className="mx-auto h-12 w-12 text-cyan-400" />
          <h1 className="text-4xl font-serif mt-4">Track Your Order</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Enter your order ID to see its current status.
          </p>
        </header>

        {/* FORM */}
        <form className="flex gap-2 mb-10" onSubmit={handleTrack}>
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Enter your order ID..."
            className="flex-grow rounded-md bg-gray-800 py-3 px-4 text-white border border-gray-600 focus:ring-2 focus:ring-cyan-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-cyan-600 px-6 py-3 rounded-md text-white hover:bg-cyan-500 flex items-center gap-2"
          >
            {isLoading ? "..." : <Icon type="search" className="w-5 h-5" />}
            {isLoading ? "Searching" : "Track"}
          </button>
        </form>

        {OrderContent}

        <div className="text-center mt-10">
          <button
            onClick={() => (window.location.hash = "#")}
            className="text-sm text-cyan-400 hover:underline"
          >
            ← Back to Main Site
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusPage;
