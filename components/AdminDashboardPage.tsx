
import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from './Icon';
import { Brand, BrandMenuCategory, LoyaltyConfig, Order, Reservation } from '../types';
import { apiGetLoyaltyConfig, apiSetLoyaltyConfig, apiGetLiveMenu, apiUpdateItemAvailability, apiGetAllBrands, apiGetComplaints, apiProcessRefundApproval, apiRejectComplaint, apiGetAllActiveReservations, apiUpdateReservation, apiGetAdminCategoriesMenu } from '../services/apiService';
import { supabase } from '../services/supabaseClient';
import { brandsData } from '../data';

const Spinner: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const AdminDashboardPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'menu' | 'loyalty' | 'complaints' | 'reservations'>('menu');

    // Menu State
    const [menu, setMenu] = useState<BrandMenuCategory[] | null>(null);
    const [isLoadingMenu, setIsLoadingMenu] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedBrandId, setSelectedBrandId] = useState<Brand['id']>('c9ignw2k50');

    // Loyalty State
    const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>({ rupeesPerPoint: 100 });
    const [isSavingLoyalty, setIsSavingLoyalty] = useState(false);
    const [loyaltySuccess, setLoyaltySuccess] = useState('');

    // Complaints State
    const [complaints, setComplaints] = useState<Order[]>([]);
    const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);
    const [complaintFilter, setComplaintFilter] = useState<'active' | 'resolved'>('active');
    const [processingComplaintId, setProcessingComplaintId] = useState<string | null>(null);

    // Reservations State
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoadingReservations, setIsLoadingReservations] = useState(false);
    const [processingResId, setProcessingResId] = useState<string | null>(null);
useEffect(() => {
  const brands = apiGetAllBrands();  // already synchronous in your code
  if (!selectedBrandId && brands.length > 0) {
    setSelectedBrandId(brands[0].id); // pick the first brand
  }
}, [selectedBrandId]);
    // *** REAL-TIME SETUP ***
    useEffect(() => {
        // Subscribe to 'orders'
        const orderSubscription = supabase
            .channel('realtime:admin_orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                if (activeTab === 'complaints') fetchComplaints();
            })
            .subscribe();

        // Subscribe to 'reservations'
        const reservationSubscription = supabase
            .channel('realtime:admin_reservations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
                if (activeTab === 'reservations') fetchReservations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(orderSubscription);
            supabase.removeChannel(reservationSubscription);
        };
    }, [activeTab]);

    const fetchMenu = useCallback(async (brandId: Brand['id']) => {
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
        try { const allComplaints = await apiGetComplaints(); setComplaints(allComplaints); }
        catch (err) { console.error("Failed to fetch complaints:", err); }
        finally { setIsLoadingComplaints(false); }
    }, []);

    const fetchReservations = useCallback(async () => {
        setIsLoadingReservations(true);
        try { const res = await apiGetAllActiveReservations(); setReservations(res); }
        catch (err) { console.error("Failed to fetch reservations:", err); }
        finally { setIsLoadingReservations(false); }
    }, []);

    useEffect(() => {
        if (activeTab === 'menu') fetchMenu(selectedBrandId);
        else if (activeTab === 'loyalty') apiGetLoyaltyConfig().then(setLoyaltyConfig);
        else if (activeTab === 'complaints') fetchComplaints();
        else if (activeTab === 'reservations') fetchReservations();
    }, [activeTab, selectedBrandId, fetchMenu, fetchComplaints, fetchReservations]);

    const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => { setSelectedBrandId(e.target.value as Brand['id']); setMenu(null); };
    // const handleToggleAvailability = async (itemName: string) => { if (!menu) return; const isCurrentlyAvailable = !!menu.flatMap(c => c.items).find(i => i.name === itemName)?.isAvailable; const updatedMenu = menu.map(category => ({ ...category, items: category.items.map(item => item.name === itemName ? { ...item, isAvailable: !item.isAvailable } : item) })); try { await apiUpdateItemAvailability(selectedBrandId, itemName, !isCurrentlyAvailable); setMenu(updatedMenu); } catch (err) { setError(err instanceof Error ? err.message : "Failed to update item."); } };
    const handleLoyaltyConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => { const value = parseInt(e.target.value, 10); setLoyaltyConfig({ rupeesPerPoint: isNaN(value) || value < 1 ? 1 : value }); };
    const handleSaveLoyaltyConfig = async () => { setIsSavingLoyalty(true); setLoyaltySuccess(''); await apiSetLoyaltyConfig(loyaltyConfig); setIsSavingLoyalty(false); setLoyaltySuccess('Loyalty settings saved!'); setTimeout(() => setLoyaltySuccess(''), 3000); };
    const handleApproveRefund = async (orderId: string) => { setProcessingComplaintId(orderId); try { await apiProcessRefundApproval(orderId); await fetchComplaints(); } catch (err) { console.error(err); alert("Failed to process refund."); } finally { setProcessingComplaintId(null); } };
    const handleRejectComplaint = async (orderId: string) => { if (!window.confirm("Reject this complaint?")) return; setProcessingComplaintId(orderId); try { await apiRejectComplaint(orderId); await fetchComplaints(); } catch (err) { console.error(err); alert("Failed to reject."); } finally { setProcessingComplaintId(null); } };
    const handleNavigate = (route: string) => window.location.hash = route;

    const handleReservationAction = async (resId: string, action: 'seated' | 'cancel') => {
        if (action === 'cancel' && !window.confirm("Are you sure you want to cancel this reservation?")) return;
        setProcessingResId(resId);
        try {
            // 'seated' moves to 'completed' history. 'cancel' moves to 'cancelled' history.
            const newStatus = action === 'seated' ? 'completed' : 'cancelled';
            await apiUpdateReservation(resId, { status: newStatus });
            await fetchReservations();
        } catch (e) {
            console.error("Error updating reservation:", e);
            alert("Action failed. You may need to check database permissions (RLS policies).");
        } finally {
            setProcessingResId(null);
        }
    };

    const filteredComplaints = complaints.filter(order => {
        if (!order.complaint) return false;
        if (complaintFilter === 'active') return order.complaint.status === 'pending';
        return order.complaint.status === 'approved' || order.complaint.status === 'rejected';
    });

    // Helper to check if reservation is overdue by 20 mins
    const isOverdue = (date: string, time: string) => {
        const resTime = new Date(`${date}T${time}`);
        const now = new Date();
        const diffMinutes = (now.getTime() - resTime.getTime()) / 60000;
        // Only overdue if it's today and past time, or a previous date
        const isPastDate = new Date(date) < new Date(now.toDateString());
        return isPastDate || (new Date(date).toDateString() === now.toDateString() && diffMinutes > 20);
    };

    return (
        <div className="min-h-screen bg-gray-800 text-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
            <div className="w-full max-w-6xl bg-gray-900 rounded-lg shadow-2xl p-8">
                <header className="text-center mb-6">
                    <h1 className="text-4xl font-serif">Admin Dashboard</h1>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
                        <span className="text-xs text-green-400">Real-time Connected</span>
                    </div>
                </header>
                <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
                    <button onClick={() => setActiveTab('menu')} className={`flex-shrink-0 py-2 px-4 font-semibold ${activeTab === 'menu' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400'}`}>Live Menu</button>
                    <button onClick={() => setActiveTab('reservations')} className={`flex-shrink-0 py-2 px-4 font-semibold ${activeTab === 'reservations' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400'}`}>Reservations ({reservations.length})</button>
                    <button onClick={() => setActiveTab('complaints')} className={`flex-shrink-0 py-2 px-4 font-semibold ${activeTab === 'complaints' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400'}`}>Complaints</button>
                    <button onClick={() => setActiveTab('loyalty')} className={`flex-shrink-0 py-2 px-4 font-semibold ${activeTab === 'loyalty' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400'}`}>Loyalty</button>
                </div>
                {activeTab === 'menu' && (
                    <div className="animate-fade-in">
                        <div className="mb-4 max-w-xs mx-auto">
                            <select
                                id="brand-select"
                                value={selectedBrandId}
                                onChange={handleBrandChange}
                                className="block w-full rounded-md border-gray-600 bg-gray-800 py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 sm:text-sm"
                            >
                                {(apiGetAllBrands() || []).map(brand => (
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
                        ) :
                            Array.isArray(menu) && menu.length > 0 ? (
                                <div className="grid md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
                                    {menu.map(category => (
                                        <div
                                            key={category.category}
                                            className="bg-gray-800 p-4 rounded-lg"
                                        >
                                            <h3 className="text-lg font-semibold text-cyan-400 mb-3">
                                                {category.category}
                                            </h3>

                                            <ul className="space-y-2">
                                                {Array.isArray(category.items) && category.items.map(item => (

                                                    <li
                                                        key={item.name}
                                                        className="flex items-center justify-between bg-gray-900/50 p-2 rounded-md"
                                                    >
                                                        <span className="text-sm">{item.name}</span>

                                                        <button
                                                            // onClick={() => handleToggleAvailability(item.name)}
                                                            className={`px-2 py-1 text-xs font-bold rounded transition-colors ${item.isAvailable
                                                                ? 'bg-green-900 text-green-300 hover:bg-green-800'
                                                                : 'bg-red-900 text-red-300 hover:bg-red-800'
                                                                }`}
                                                        >
                                                            {item.isAvailable ? 'In Stock' : 'Unavailable'}
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



                {activeTab === 'reservations' && (
                    <div className="animate-fade-in">
                        {isLoadingReservations ? <div className="flex justify-center p-8"><Spinner className="w-8 h-8" /></div> :
                            reservations.length === 0 ? <p className="text-center text-gray-500 py-8">No active reservations.</p> :
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
                                            {reservations.map(res => {
                                                const overdue = isOverdue(res.date, res.time);
                                                return (
                                                    <tr key={res.id} className={overdue ? 'bg-red-900/20' : ''}>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-bold text-cyan-400 font-mono">{res.bookingId}</div>
                                                            <div className="text-xs text-gray-400">{brandsData[res.brandId]?.name}</div>
                                                            {overdue && (<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900 text-red-200 mt-1">
                                                                Overdue {'>'} 20m
                                                            </span>
                                                            )}

                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm font-medium text-white">{res.name}</div>
                                                            <div className="text-sm text-gray-400">{res.phone}</div>
                                                            <div className="text-xs text-gray-500">{res.guests} Guests</div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-white">{new Date(res.date).toLocaleDateString()}</div>
                                                            <div className="text-2xl font-light text-white">{res.time}</div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-white font-bold">
                                                            {res.tableId ? res.tableId.toUpperCase() : 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleReservationAction(res.id, 'seated')}
                                                                    disabled={!!processingResId}
                                                                    className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-md text-xs font-bold uppercase disabled:opacity-50 flex items-center gap-1"
                                                                >
                                                                    {processingResId === res.id ? <Spinner className="w-3 h-3" /> : <Icon type="check-circle" className="w-4 h-4" />}
                                                                    Seated
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReservationAction(res.id, 'cancel')}
                                                                    disabled={!!processingResId}
                                                                    className="bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-bold uppercase disabled:opacity-50 flex items-center gap-1"
                                                                >
                                                                    <Icon type="x-circle" className="w-4 h-4" /> Cancel
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                        }
                    </div>
                )}

                {activeTab === 'complaints' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-center gap-4 mb-6">
                            <button onClick={() => setComplaintFilter('active')} className={`px-4 py-2 rounded-full font-semibold text-sm ${complaintFilter === 'active' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Active ({complaints.filter(c => c.complaint?.status === 'pending').length})</button>
                            <button onClick={() => setComplaintFilter('resolved')} className={`px-4 py-2 rounded-full font-semibold text-sm ${complaintFilter === 'resolved' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Resolved</button>
                        </div>
                        {isLoadingComplaints ? <div className="flex justify-center p-8"><Spinner className="w-8 h-8" /></div> : (filteredComplaints.length === 0 ? <p className="text-center text-gray-500 py-8">No complaints found.</p> : <div className="space-y-4">{filteredComplaints.map(order => (<div key={order.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row gap-4"><div className="flex-1 space-y-1 text-sm"><div className="flex justify-between"><p><strong className="text-gray-400">Complaint ID:</strong> <span className="text-white font-mono">{order.complaint?.id}</span></p><span className={`px-2 py-0.5 text-xs font-bold rounded-full capitalize ${order.complaint?.status === 'pending' ? 'bg-yellow-900 text-yellow-300' : (order.complaint?.status === 'approved' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300')}`}>{order.complaint?.status}</span></div><p><strong className="text-gray-400">Order ID:</strong> <span className="text-cyan-400 font-mono">{order.id}</span></p><p><strong className="text-gray-400">Customer:</strong> {order.customer.name} ({order.customer.phone})</p><div className="mt-2 p-2 bg-gray-900/50 rounded border border-gray-700/50"><p className="font-semibold text-red-300 mb-1">Issue Items:</p><ul className="list-disc list-inside pl-1 text-gray-300">{order.complaint?.itemNames.map(name => <li key={name}>{name}</li>)}</ul></div><div className="mt-2 p-2 bg-gray-900/50 rounded border border-gray-700/50"><p className="font-semibold text-gray-300 mb-1">Comments:</p><p className="italic text-gray-400">"{order.complaint?.comments}"</p></div></div>{order.complaint?.status === 'pending' && (<div className="flex flex-col justify-center gap-2 min-w-[150px]"><button onClick={() => handleApproveRefund(order.id)} disabled={!!processingComplaintId} className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-md text-sm disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2">{processingComplaintId === order.id ? <Spinner className="w-4 h-4" /> : <Icon type="check-circle" className="w-4 h-4" />} Approve Refund</button><button onClick={() => handleRejectComplaint(order.id)} disabled={!!processingComplaintId} className="bg-red-700 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md text-sm disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"><Icon type="x-circle" className="w-4 h-4" /> Reject</button></div>)}</div>))}</div>)}
                    </div>
                )}

                {activeTab === 'loyalty' && (
                    <div className="space-y-6 animate-fade-in max-w-md mx-auto"><h2 className="text-2xl font-semibold text-center">Loyalty Configuration</h2>{loyaltySuccess && <p className="text-green-400 text-center font-semibold">{loyaltySuccess}</p>}<div className="bg-gray-800 p-6 rounded-lg"><label htmlFor="rupeesPerPoint" className="block text-sm font-medium text-gray-300 mb-2">Spend amount (₹) to earn 1 Point</label><input id="rupeesPerPoint" type="number" value={loyaltyConfig.rupeesPerPoint} onChange={handleLoyaltyConfigChange} className="block w-full rounded-md border-gray-600 bg-gray-900 py-3 px-4 text-white text-lg focus:ring-2 focus:ring-cyan-500" /></div><button onClick={handleSaveLoyaltyConfig} disabled={isSavingLoyalty} className="w-full rounded-md bg-cyan-600 px-4 py-3 text-lg font-semibold text-white shadow-sm hover:bg-cyan-500 disabled:bg-gray-600 transition-colors">{isSavingLoyalty ? 'Saving...' : 'Save Configuration'}</button></div>
                )}

                <div className="text-center mt-8"><button onClick={() => handleNavigate('#')} className="text-sm text-cyan-400 hover:underline bg-transparent border-none p-0 cursor-pointer">← Back to Main Site</button></div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
