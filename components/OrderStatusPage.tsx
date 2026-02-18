import React, { useState, useEffect } from "react";
import { Order } from "../types";

import { Icon } from "./Icon";
import { apiCancelOrder, apiGetOrderById } from "../services/apiService";
import { normalizeOrderStatus } from "../model/status";

const steps = [
  "Order Placed",
  "Accepted",
  "Food Ready",
  "Out For Delivery",
  "Delivered",
];

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
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-start min-w-max px-4 md:px-0 md:w-full">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center flex-shrink-0 w-24 md:flex-1">
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
                className={`mt-2 text-xs sm:text-sm text-center font-semibold whitespace-nowrap ${
                  index <= currentIndex ? "text-white" : "text-gray-400"
                }`}
              >
                {step}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-shrink-0 w-12 md:flex-1 h-1 mt-4 ${
                  index < currentIndex ? "bg-green-500" : "bg-gray-600"
                }`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
interface OrderStatusPageProps {
  orderId?: string;
  isEmbedded?: boolean;
}

const OrderStatusPage: React.FC<OrderStatusPageProps> = ({
  orderId,
  isEmbedded = false,
}) => {
  const [trackingId, setTrackingId] = useState("");
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchOrder = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const order = await apiGetOrderById(id);
      setFoundOrder(order || null);
      if (!order && !isEmbedded) setError("Order not found.");
    } catch {
      setError("Failed to fetch order.");
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
    if (!trackingId.trim()) {
      setError("Please enter an order ID.");
      return;
    }
    fetchOrder(trackingId.trim());
  };

  const normalizedStatus = normalizeOrderStatus(foundOrder?.status ?? "");

  // REFUND LOGIC UPDATED
  const refundPercent =
    normalizedStatus === "Food Ready"
      ? 40
      : ["Order Placed", "Accepted", "pending"].includes(normalizedStatus)
        ? 60
        : 0;

  // CANCEL RULE
  const canCancel =
    normalizedStatus !== "Cancelled" &&
    normalizedStatus !== "Delivered" &&
    normalizedStatus !== "Out For Delivery" &&
    refundPercent > 0;

  const handleConfirmCancel = async () => {
    if (!foundOrder) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      // original order amount from DB
      const orderAmount = Number(foundOrder.totalAmount || 0);

      // calculate refundable amount based on your percentage rules
      const refundAmount = Math.round((orderAmount * refundPercent) / 100);
      await apiCancelOrder(foundOrder.id, refundAmount, cancelReason);

      setShowCancelModal(false);
      fetchOrder(foundOrder.id);
    } catch (err: any) {
      setCancelError(err.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  const OrderContent = (
    <>
      {error && !isEmbedded && (
        <div className="p-4 bg-red-900/50 border border-red-600 text-red-200 rounded-md text-center">
          <p>{error}</p>
        </div>
      )}

      {foundOrder && (
        <div className="bg-gray-900 p-8 border border-gray-700 rounded-lg space-y-10">
          <header>
            <h2 className="text-xl sm:text-2xl font-serif">
              Order from {foundOrder?.resturantName || "Unknown Restaurant"}
            </h2>
            <p className="text-gray-400 text-sm font-mono">
              ID: {foundOrder.id}
            </p>
          </header>

          {normalizedStatus !== "Delivered" && (
            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-center text-lg font-semibold mb-6">
                Current Status
              </h3>
              <StatusTracker status={normalizedStatus} />

              {canCancel && (
                <div className="flex flex-col items-center mt-6 gap-3">
                  <p className="text-sm text-gray-300 text-center max-w-md">
                    If you cancel now, you'll receive{" "}
                    <span className="font-semibold text-cyan-400">
                      {refundPercent}% refund
                    </span>
                    .
                  </p>

                  <button
                    className="px-6 py-2 rounded-md bg-red-600 text-white hover:bg-red-500 shadow-md"
                    onClick={() => {
                      setCancelReason("");
                      setCancelError(null);
                      setShowCancelModal(true);
                    }}
                  >
                    Cancel Order
                  </button>
                </div>
              )}

              {!canCancel && normalizedStatus !== "Cancelled" && (
                <p className="text-xs text-gray-400 mt-4 text-center">
                  This order can no longer be cancelled at this stage.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {showCancelModal && foundOrder && (
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
              onChange={(e) => setCancelReason(e.target.value)}
            />

            {cancelError && (
              <p className="text-sm text-red-400 mt-2">{cancelError}</p>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                className="px-4 py-2 text-sm rounded-md border border-gray-600 text-gray-200 hover:bg-gray-800"
                disabled={isCancelling}
                onClick={() => setShowCancelModal(false)}
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
    </>
  );

  if (isEmbedded) return OrderContent;

  return (
    <div className="min-h-screen bg-gray-800 text-white p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 p-6 sm:p-10 rounded-lg shadow-xl">
        <header className="text-center mb-6 sm:mb-10">
          <Icon
            type="credit-card"
            className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-cyan-400"
          />
          <h1 className="text-2xl sm:text-4xl font-serif mt-4">
            Track Your Order
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Enter your order ID to see its status
          </p>
        </header>

        <form
          className="flex flex-col sm:flex-row gap-2 mb-6 sm:mb-10"
          onSubmit={handleTrack}
        >
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Enter your order ID..."
            className="flex-grow bg-gray-800 border border-gray-600 text-white rounded-md py-3 px-4 focus:ring-2 focus:ring-cyan-500 text-sm sm:text-base"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-cyan-600 px-6 py-3 rounded-md text-white hover:bg-cyan-500 disabled:opacity-70 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {isLoading ? "..." : <Icon type="search" className="w-5 h-5" />}
            {!isLoading && "Track"}
          </button>
        </form>

        {/* Wrapper for horizontal scroll on mobile */}
        <div className="mb-6 sm:mb-10">{OrderContent}</div>

        <div className="text-center mt-6 sm:mt-10">
          <button
            onClick={() => (window.location.hash = "#")}
            className="text-xs sm:text-sm text-cyan-400 hover:underline"
          >
            ← Back to Main Site
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusPage;
