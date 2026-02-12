import React, { useState, useEffect } from "react";
import { Reservation } from "../types";
import { Icon } from "./Icon";
import {
    apiTrackReservations,
    apiUpdateReservation,
    //   apiCancelReservation,
} from "../services/apiService";

/* =====================================================
   STATUS TRACKER
===================================================== */

interface StatusTrackerProps {
    status: Reservation["status"];
}

const StatusTracker: React.FC<StatusTrackerProps> = ({ status }) => {
    const statuses: Reservation["status"][] = [
        "pending",
        "confirmed",
        "completed",
    ];

    const isCancelled = status === "cancelled" || status === "expired";
    const currentStatusIndex = statuses.indexOf(status);

    const getStatusClass = (index: number) => {
        if (isCancelled) return "bg-gray-500";
        if (index < currentStatusIndex) return "bg-green-500";
        if (index === currentStatusIndex) return "bg-cyan-500 animate-pulse";
        return "bg-gray-500";
    };

    const getTextColor = (index: number) => {
        if (isCancelled) return "text-gray-400";
        if (index <= currentStatusIndex) return "text-white";
        return "text-gray-400";
    };

    if (isCancelled) {
        return (
            <div className="flex items-center justify-center gap-3 p-4 bg-red-900/50 border border-red-700 rounded-md">
                <Icon type="x-circle" className="w-8 h-8 text-red-400" />
                <div>
                    <h4 className="font-bold text-red-200">
                        Reservation {status === "expired" ? "Expired" : "Cancelled"}
                    </h4>
                    <p className="text-sm text-red-300">
                        This reservation is no longer active.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center">
            {statuses.map((s, index) => (
                <React.Fragment key={s}>
                    <div className="flex flex-col items-center flex-1">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusClass(
                                index
                            )} transition`}
                        >
                            <Icon type="check-circle" className="w-5 h-5 text-white" />
                        </div>

                        <p
                            className={`mt-2 text-sm font-semibold capitalize ${getTextColor(
                                index
                            )}`}
                        >
                            {s}
                        </p>
                    </div>

                    {index < statuses.length - 1 && (
                        <div
                            className={`flex-1 h-1 mx-2 ${index < currentStatusIndex ? "bg-green-500" : "bg-gray-500"
                                }`}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

/* =====================================================
   CONFIRM MODAL
===================================================== */

interface ConfirmModalProps {
    open: boolean;
    title: string;
    message: string;
    loading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    open,
    title,
    message,
    loading,
    onConfirm,
    onClose,
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-xl">
                <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>

                <p className="text-gray-300 mb-6">{message}</p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600"
                    >
                        No
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 disabled:bg-gray-600"
                    >
                        {loading ? "Cancelling..." : "Yes, Cancel"}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* =====================================================
   ORDER TRACKING PAGE
===================================================== */

const OrderTrackingPage: React.FC = () => {
    const [trackingQuery, setTrackingQuery] = useState("");
    const [foundReservations, setFoundReservations] = useState<Reservation[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [cancelId, setCancelId] = useState<string | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);

    /* ---------------- FIND RESERVATIONS ---------------- */

    const findReservations = async (query: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const results = await apiTrackReservations(query);
            setFoundReservations(results);

            if (results.length === 0) {
                setError("No active or future reservations found.");
            }
        } catch {
            setError("Failed to search reservations.");
        } finally {
            setIsLoading(false);
        }
    };

    /* ---------------- CANCEL RESERVATION ---------------- */

    const handleCancelReservation = async () => {
        if (!cancelId) return;

        try {
            setCancelLoading(true);

            // ✅ same logic as admin dashboard
            await apiUpdateReservation(cancelId, { status: "cancelled" });

            // update UI instantly
            setFoundReservations(prev =>
                prev.map(r =>
                    r.id === cancelId ? { ...r, status: "cancelled" } : r
                )
            );

            setCancelId(null);
        } catch {
            alert("Failed to cancel reservation");
        } finally {
            setCancelLoading(false);
        }
    };


    /* ---------------- READ ID FROM URL ---------------- */

    useEffect(() => {
        const params = new URLSearchParams(window.location.hash.split("?")[1]);
        const idFromUrl = params.get("id");

        if (idFromUrl) {
            setTrackingQuery(idFromUrl);
            findReservations(idFromUrl);
        }
    }, []);

    /* ---------------- FORM SUBMIT ---------------- */

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();

        if (!trackingQuery.trim()) {
            setError("Enter mobile number or booking ID.");
            return;
        }

        findReservations(trackingQuery.trim());
    };

    const handleNavigate = (route: string) => {
        window.location.hash = route;
    };

    const formatTimeToAMPM = (time: string) => {
        if (!time) return "";
        const [h, m] = time.split(":");
        let hour = parseInt(h, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        return `${hour}:${m} ${ampm}`;
    };

    /* ===================================================== */

    return (
        <div className="min-h-screen bg-gray-800 text-white p-4 flex items-center justify-center">
            <div className="w-full max-w-3xl bg-gray-900 rounded-xl shadow-2xl p-8">
                {/* HEADER */}
                <header className="text-center mb-10">
                    <Icon type="calendar" className="mx-auto h-12 w-12 text-cyan-400" />

                    <h1 className="text-3xl font-semibold mt-4">
                        Track Your Reservation
                    </h1>

                    <p className="text-gray-400 mt-2">
                        Enter mobile number or booking ID.
                    </p>
                </header>

                {/* SEARCH */}
                <form className="flex gap-3 mb-8" onSubmit={handleTrack}>
                    <input
                        type="text"
                        value={trackingQuery}
                        onChange={e => setTrackingQuery(e.target.value)}
                        placeholder="Mobile number or booking ID..."
                        className="flex-grow rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
                    />

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 flex items-center gap-2"
                    >
                        {isLoading ? "Searching..." : "Track"}
                    </button>
                </form>

                {/* ERROR */}
                {error && (
                    <div className="p-3 mb-6 text-center bg-red-900/50 border border-red-600 rounded-md">
                        {error}
                    </div>
                )}

                {/* RESULTS */}
                <div className="space-y-6">
                    {foundReservations.map(res => {
                        const canCancel =
                            res.status === "pending" || res.status === "confirmed";

                        return (
                            <div
                                key={res.id}
                                className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow hover:border-cyan-500 transition"
                            >
                                {/* HEADER */}
                                <div className="flex justify-between items-start mb-5">
                                    <div>
                                        <h2 className="text-xl font-semibold">
                                            {res.name || "Reservation"}
                                        </h2>

                                        <p className="text-cyan-400 font-mono text-sm">
                                            {res.bookingId}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-semibold">
                                            {new Date(res.date).toLocaleDateString()}
                                        </p>

                                        <p className="text-gray-400 text-sm">
                                            {formatTimeToAMPM(res.time)} —{" "}
                                            {formatTimeToAMPM(res.endtime)}
                                        </p>
                                    </div>
                                </div>

                                {/* INFO */}
                                <div className="grid grid-cols-2 gap-4 text-sm mb-6 bg-gray-900/50 p-4 rounded-lg">
                                    <p>
                                        <span className="text-gray-400">Guest:</span> {res.name}
                                    </p>

                                    <p>
                                        <span className="text-gray-400">Guests:</span> {res.guests}
                                    </p>

                                    {res.tableId && (
                                        <p>
                                            <span className="text-gray-400">Table:</span>{" "}
                                            {res.tableNumber?.toUpperCase()}
                                        </p>
                                    )}
                                </div>

                                {/* STATUS */}
                                <div className="border-t border-gray-700 pt-6">
                                    <h3 className="text-lg font-semibold text-center mb-6">
                                        Reservation Status
                                    </h3>

                                    <StatusTracker status={res.status} />
                                </div>

                                {/* ACTIONS */}
                                {canCancel && (
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={() => setCancelId(res.id)}
                                            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500"
                                        >
                                            Cancel Reservation
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* BACK */}
                <div className="text-center mt-10">
                    <button
                        onClick={() => handleNavigate("#")}
                        className="text-cyan-400 hover:underline"
                    >
                        ← Back to Main Site
                    </button>
                </div>
            </div>

            {/* CONFIRM CANCEL MODAL */}
            <ConfirmModal
                open={!!cancelId}
                title="Cancel Reservation?"
                message="This action cannot be undone. Are you sure you want to cancel this reservation?"
                loading={cancelLoading}
                onConfirm={handleCancelReservation}
                onClose={() => setCancelId(null)}
            />
        </div>
    );
};

export default OrderTrackingPage;
