
import React, { useState, useEffect } from 'react';
import { Reservation } from '../types';
// import { brandsData } from '../data';
import { Icon } from './Icon';
import { apiTrackReservations } from '../services/apiService';

interface StatusTrackerProps {
    status: Reservation['status'];
}

const StatusTracker: React.FC<StatusTrackerProps> = ({ status }) => {
    const statuses: Reservation['status'][] = ['pending', 'confirmed', 'completed'];
    const isCancelled = status === 'cancelled' || status === 'expired';
    const currentStatusIndex = statuses.indexOf(status);

    const getStatusClass = (index: number) => {
        if (isCancelled) return 'bg-gray-500';
        if (index < currentStatusIndex) return 'bg-green-500';
        if (index === currentStatusIndex) return 'bg-cyan-500 animate-pulse';
        return 'bg-gray-500';
    };
    
    const getTextColor = (index: number) => {
        if (isCancelled) return 'text-gray-400';
        if (index <= currentStatusIndex) return 'text-white';
        return 'text-gray-400';
    }

    if (isCancelled) {
        return (
            <div className="flex items-center justify-center gap-3 p-4 bg-red-900/50 border border-red-700 rounded-md">
                <Icon type="x-circle" className="w-8 h-8 text-red-400" />
                <div>
                    <h4 className="font-bold text-red-200">Reservation {status === 'expired' ? 'Expired' : 'Cancelled'}</h4>
                    <p className="text-sm text-red-300">This reservation is no longer active.</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center">
                {statuses.map((s, index) => (
                    <React.Fragment key={s}>
                        <div className="flex flex-col items-center flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusClass(index)} transition-colors duration-500`}>
                                <Icon type="check-circle" className="w-5 h-5 text-white" />
                            </div>
                            <p className={`mt-2 text-sm font-semibold capitalize ${getTextColor(index)}`}>{s}</p>
                        </div>
                        {index < statuses.length - 1 && (
                            <div className={`flex-1 h-1 mx-2 ${index < currentStatusIndex ? 'bg-green-500' : 'bg-gray-500'} transition-colors duration-500`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

const OrderTrackingPage: React.FC = () => {
    const [trackingQuery, setTrackingQuery] = useState('');
    const [foundReservations, setFoundReservations] = useState<Reservation[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    
    const findReservations = async (query: string) => {
        setIsLoading(true);
        setError(null);
        setHasSearched(true);
        try {
            const results = await apiTrackReservations(query);
            setFoundReservations(results);
            if (results.length === 0) {
                setError('No active or future reservations found for these details.');
            }
        } catch (err) {
            setError("An error occurred while searching for reservations.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Read ID from URL on initial load if present
    useEffect(() => {
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const idFromUrl = params.get('id');
        if (idFromUrl) {
            setTrackingQuery(idFromUrl);
            findReservations(idFromUrl);
        }
    }, []);


    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingQuery.trim()) {
            setError('Please enter a Mobile Number or Booking ID.');
            return;
        }
        findReservations(trackingQuery.trim());
    };
    
    const handleNavigate = (route: string) => {
        window.location.hash = route;
    };

    return (
        <div className="min-h-screen bg-gray-800 text-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
            <div className="w-full max-w-3xl bg-gray-900 rounded-lg shadow-2xl p-8">
                <header className="text-center mb-8">
                    <Icon type="calendar" className="mx-auto h-12 w-12 text-cyan-400" />
                    <h1 className="text-3xl sm:text-4xl font-serif mt-4">Track Your Reservation</h1>
                    <p className="text-gray-400 mt-2">Enter your Mobile Number or Booking ID to see status.</p>
                </header>
                
                <form className="flex gap-2 mb-8" onSubmit={handleTrack}>
                    <input
                        type="text"
                        value={trackingQuery}
                        onChange={e => setTrackingQuery(e.target.value)}
                        placeholder="Enter Mobile Number or Booking ID..."
                        className="flex-grow block w-full rounded-md border-gray-600 bg-gray-800 py-2 px-3 text-white focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm"
                        aria-label="Tracking Query"
                    />
                    <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 disabled:bg-gray-600"
                        disabled={isLoading}
                    >
                        {isLoading ? '...' : <Icon type="search" className="w-5 h-5" />}
                        {isLoading ? 'Searching' : 'Track'}
                    </button>
                </form>

                {error && (
                    <div className="p-3 bg-red-900/50 border border-red-600 text-red-200 rounded-md animate-fade-in text-center mb-6">
                        <p>{error}</p>
                    </div>
                )}
                
                <div className="space-y-6">
                    {foundReservations.map(res => (
                        <div key={res.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700 animate-fade-in">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                                <div>
                                    <h2 className="text-xl font-serif text-white">{res.name || 'Unknown Restaurant'}</h2>
                                    <p className="text-cyan-400 font-mono text-sm font-semibold">{res.bookingId}</p>
                                </div>
                                <div className="text-right mt-2 sm:mt-0">
                                     <p className="text-lg font-bold text-white">{new Date(res.date).toLocaleDateString()}</p>
                                     <p className="text-gray-300">{res.time}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm mb-6 bg-gray-900/50 p-4 rounded-md">
                                <p><strong className="font-semibold text-gray-300">Name:</strong> {res.name}</p>
                                <p><strong className="font-semibold text-gray-300">Guests:</strong> {res.guests}</p>
                                {res.tableId && <p><strong className="font-semibold text-gray-300">Table:</strong> {res.tableId.toUpperCase()}</p>}
                            </div>
                            <div className="border-t border-gray-700 pt-6">
                                <h3 className="text-lg font-semibold text-center mb-6">Current Status</h3>
                                <StatusTracker status={res.status} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-8">
                     <button onClick={() => handleNavigate('#')} className="text-sm text-cyan-400 hover:underline bg-transparent border-none p-0 cursor-pointer">← Back to Main Site</button>
                </div>
            </div>
        </div>
    );
};

export default OrderTrackingPage;
