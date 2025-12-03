import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { brandsData } from '../data';
import { Icon } from './Icon';
import { apiGetOrderById, apiUpdateOrder } from '../services/apiService';

interface StatusTrackerProps {
    status: Order['status'];
}

const StatusTracker: React.FC<StatusTrackerProps> = ({ status }) => {
    const statuses: Order['status'][] = ['received', 'preparing', 'out-for-delivery', 'delivered'];
    const isCancelled = status === 'cancelled';
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
                    <h4 className="font-bold text-red-200">Order Cancelled</h4>
                    <p className="text-sm text-red-300">This order has been cancelled.</p>
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
                            <p className={`mt-2 text-xs sm:text-sm text-center font-semibold capitalize ${getTextColor(index)}`}>{s.replace('-', ' ')}</p>
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

interface OrderStatusPageProps {
    orderId?: string;
    isEmbedded?: boolean;
}

const OrderStatusPage: React.FC<OrderStatusPageProps> = ({ orderId, isEmbedded = false }) => {
    const [trackingId, setTrackingId] = useState('');
    const [foundOrder, setFoundOrder] = useState<Order | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Get order ID from URL or prop and fetch data
    useEffect(() => {
        const findOrder = async (id: string) => {
            setIsLoading(true);
            setError(null);
            try {
                const order = await apiGetOrderById(id);
                if (order) {
                    setFoundOrder(order);
                } else {
                    if (!isEmbedded) setError('Order not found. Please check the ID and try again.');
                }
            } catch (err) {
                 if (!isEmbedded) setError('Failed to fetch order details.');
            } finally {
                setIsLoading(false);
            }
        };

        let idToTrack = orderId;
        if (!idToTrack && !isEmbedded) {
            const params = new URLSearchParams(window.location.hash.split('?')[1]);
            idToTrack = params.get('id');
        }

        if (idToTrack) {
            setTrackingId(idToTrack);
            findOrder(idToTrack);
        }
    }, [orderId, isEmbedded]);

    // Mock status updater for demonstration
    useEffect(() => {
        if (foundOrder && foundOrder.status !== 'delivered' && foundOrder.status !== 'cancelled') {
             const statuses: Order['status'][] = ['received'];
            //  const statuses: Order['status'][] = ['received', 'preparing', 'out-for-delivery', 'delivered'];
             const currentIndex = statuses.indexOf(foundOrder.status);
             if (currentIndex < statuses.length - 1) {
                const timer = setTimeout(async () => {
                    const nextStatus = statuses[currentIndex + 1];
                    try {
                        const updatedOrder = await apiUpdateOrder(foundOrder.id, { status: nextStatus });
                        setFoundOrder(updatedOrder);
                    } catch (error) {
                        console.error("Failed to update order status:", error);
                    }
                }, 7000); // 7-second delay for each stage
                return () => clearTimeout(timer);
             }
        }
    }, [foundOrder]);

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingId.trim()) {
            setError('Please enter an order ID.');
            return;
        }
        
        const findOrder = async (id: string) => {
            setIsLoading(true);
            setError(null);
            setFoundOrder(null);
            try {
                const order = await apiGetOrderById(id);
                if (order) {
                    setFoundOrder(order);
                } else {
                    setError('Order not found. Please check the ID and try again.');
                }
            } catch (err) {
                setError('Failed to fetch order details.');
            } finally {
                setIsLoading(false);
            }
        };
        findOrder(trackingId.trim());
    };
    
    const handleNavigate = (route: string) => {
        window.location.hash = route;
    };
    
    const OrderContent = (
        <>
            {error && !isEmbedded && (
                <div className="p-3 bg-red-900/50 border border-red-600 text-red-200 rounded-md animate-fade-in text-center">
                    <p>{error}</p>
                </div>
            )}
            
            {foundOrder && (
                <div className={`space-y-6 ${isEmbedded ? 'bg-gray-900' : 'bg-gray-800 p-6 rounded-lg border border-gray-700'} animate-fade-in`}>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-serif">Order from {brandsData[foundOrder.brandId]?.name || 'Unknown Restaurant'}</h2>
                        <p className="text-gray-400 text-sm font-mono">ID: {foundOrder.id}</p>
                    </div>
                    
                    {!isEmbedded && <div className="border-y border-gray-700 py-4">
                         <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
                         {foundOrder.items.map(item => (
                             <div key={item.name} className="flex justify-between items-center text-sm">
                                 <p className="text-gray-300">{item.name} <span className="text-gray-400">x{item.quantity}</span></p>
                                 <p className="text-gray-400">₹{(parseFloat(item.price.replace(/[^0-9.-]+/g,"")) * item.quantity).toFixed(2)}</p>
                             </div>
                         ))}
                         <div className="flex justify-between items-center font-bold mt-2 pt-2 border-t border-gray-700/50">
                             <p>Total Paid</p>
                             <p>₹{foundOrder.totalAmount.toFixed(2)}</p>
                         </div>
                    </div>}

                    <div>
                        <h3 className="text-lg font-semibold text-center mb-6">Current Status</h3>
                        <StatusTracker status={foundOrder.status} />
                    </div>
                </div>
            )}
        </>
    );
    
    if (isEmbedded) {
        return OrderContent;
    }

    return (
        <div className="min-h-screen bg-gray-800 text-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-gray-900 rounded-lg shadow-2xl p-8">
                <header className="text-center mb-8">
                    <Icon type="credit-card" className="mx-auto h-12 w-12 text-cyan-400" />
                    <h1 className="text-4xl font-serif mt-4">Track Your Order</h1>
                    <p className="text-gray-400 mt-2">Enter your order ID to see its current status.</p>
                </header>
                
                <form className="flex gap-2 mb-8" onSubmit={handleTrack}>
                    <input
                        type="text"
                        value={trackingId}
                        onChange={e => setTrackingId(e.target.value)}
                        placeholder="Enter your order ID..."
                        className="flex-grow block w-full rounded-md border-gray-600 bg-gray-800 py-2 px-3 text-white focus:ring-2 focus:ring-inset focus:ring-cyan-500 sm:text-sm"
                        aria-label="Order ID"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500"
                        disabled={isLoading}
                    >
                        {isLoading ? '...' : <Icon type="search" className="w-5 h-5" />}
                        {isLoading ? 'Searching' : 'Track'}
                    </button>
                </form>

                {OrderContent}

                <div className="text-center mt-8">
                     <button onClick={() => handleNavigate('#')} className="text-sm text-cyan-400 hover:underline bg-transparent border-none p-0 cursor-pointer">← Back to Main Site</button>
                </div>
            </div>
        </div>
    );
};

export default OrderStatusPage;