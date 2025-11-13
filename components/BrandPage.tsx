
import React, { useState, useEffect, useMemo } from 'react';
import { getMealRecommendation } from '../services/geminiService';
import { BrandData, BrandMenuCategory, MenuItem, RestaurantTable } from '../types';
import { Icon } from './Icon';
import { useCart } from '../context/CartContext';
import CartModal from './CartModal';
import { useAuth } from '../context/AuthContext';
import { apiCreateReservation, apiGetLiveMenu, apiGetAvailableTables, apiSendReservationOTP, apiVerifyReservationOTP } from '../services/apiService';

const Spinner: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ChefRecommenderModal: React.FC<{isOpen: boolean; onClose: () => void; brandData: BrandData; menuData: BrandMenuCategory[];}> = ({ isOpen, onClose, brandData, menuData }) => {
    const [preferences, setPreferences] = useState('');
    const [recommendation, setRecommendation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const handleGetRecommendation = async () => {
        if (!preferences.trim()) { setError('Please tell us what you are in the mood for!'); return; }
        setIsLoading(true); setError(''); setRecommendation('');
        try {
            const allItems = menuData.flatMap(cat => cat.items);
            const result = await getMealRecommendation(preferences, allItems, brandData.name);
            setRecommendation(result);
        } catch (err) { setError(err instanceof Error ? err.message : 'An unexpected error occurred.'); } finally { setIsLoading(false); }
    };
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <Icon type="chef-hat" className="w-8 h-8 text-[var(--accent-color)]"/>
                        <h2 className="text-2xl font-serif text-white">Chef's Recommendation</h2>
                    </div>
                    <p className="mt-2 text-gray-400">Tell me what you're craving, and I'll suggest the perfect dish from our {brandData.name} menu!</p>
                    <textarea value={preferences} onChange={(e) => setPreferences(e.target.value)} placeholder="e.g., 'something spicy and vegetarian'" className="mt-4 w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none" rows={3}/>
                    <button onClick={handleGetRecommendation} disabled={isLoading} style={{ backgroundColor: 'var(--primary-color)', color: 'var(--text-on-primary-color)' }} className="mt-4 w-full flex items-center justify-center gap-2 font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-500 hover:opacity-90">{isLoading ? <Spinner /> : <Icon type="star" className="w-5 h-5"/>} Ask the Chef</button>
                    {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
                    {recommendation && <div className="mt-4 p-4 bg-gray-700 rounded-md border border-[var(--primary-color)]/50"><p className="text-white">{recommendation}</p></div>}
                </div>
            </div>
        </div>
    );
};
const CartIcon: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const { itemCount } = useCart();
    if (itemCount === 0) return null;
    return (<button onClick={onClick} className="fixed bottom-6 right-6 bg-[var(--primary-color)] text-[var(--text-on-primary-color)] w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-50 hover:scale-110 transition-transform" aria-label={`View cart with ${itemCount} items`}><Icon type="shopping-cart" className="w-8 h-8" /><span className="absolute -top-1 -right-1 bg-[var(--accent-color)] text-gray-900 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-[var(--primary-color)]">{itemCount}</span></button>);
};

const TableMap: React.FC<{ tables: RestaurantTable[], selectedTableId: string | undefined, onSelect: (id: string) => void }> = ({ tables, selectedTableId, onSelect }) => {
    if (tables.length === 0) {
        return <div className="text-center p-6 bg-gray-700/50 rounded-md border border-dashed border-gray-600 text-gray-400">No tables available for this slot. Please try another time.</div>;
    }
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
            {tables.map(table => (
                <button
                    key={table.id}
                    type="button"
                    onClick={() => onSelect(table.id)}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${selectedTableId === table.id ? 'border-[var(--accent-color)] bg-[var(--primary-color)]/20' : 'border-gray-600 bg-gray-800 hover:border-gray-500'}`}
                >
                    <Icon type="users" className={`w-8 h-8 mb-2 ${selectedTableId === table.id ? 'text-[var(--accent-color)]' : 'text-gray-500'}`} />
                    <span className="font-semibold text-white">{table.name}</span>
                    <span className="text-xs text-gray-400">{table.capacity} Seats</span>
                </button>
            ))}
        </div>
    );
};


interface BrandPageProps {
    brandData: BrandData;
    onBack: () => void;
}

const BrandPage: React.FC<BrandPageProps> = ({ brandData, onBack }) => {
    const [menuData, setMenuData] = useState<BrandMenuCategory[]>([]);
    const [isLoadingMenu, setIsLoadingMenu] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [isRecommenderOpen, setIsRecommenderOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { addItem } = useCart();
    const { currentUser } = useAuth();

    // --- Reservation State ---
    const [resStep, setResStep] = useState<1|2|3|4>(1);
    const [resForm, setResForm] = useState({ name: '', email: '', phone: '', date: '', time: '', guests: 2, requests: '', tableId: '' });
    const [availableTables, setAvailableTables] = useState<RestaurantTable[]>([]);
    const [isLoadingTables, setIsLoadingTables] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [resError, setResError] = useState('');
    const [lastReservationId, setLastReservationId] = useState<string|null>(null);
    const [isBooking, setIsBooking] = useState(false);

    // Date Constraints
    const toLocalISOString = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };
    const today = new Date();
    const minDateStr = toLocalISOString(today);
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 14);
    const maxDateStr = toLocalISOString(maxDate);

    const timeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 11; hour <= 22; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        return slots;
    }, []);

    const availableTimeSlots = useMemo(() => {
        if (!resForm.date) return timeSlots;
        const selectedDate = new Date(resForm.date);
        const currentDate = new Date();
        const isToday = selectedDate.getDate() === currentDate.getDate() &&
                        selectedDate.getMonth() === currentDate.getMonth() &&
                        selectedDate.getFullYear() === currentDate.getFullYear();
        if (isToday) {
            const currentHour = currentDate.getHours();
            return timeSlots.filter(slot => parseInt(slot.split(':')[0]) > currentHour + 1);
        }
        return timeSlots;
    }, [resForm.date, timeSlots]);

    useEffect(() => {
        apiGetLiveMenu(brandData.id).then(data => { setMenuData(data); setActiveCategory(data[0]?.category || ''); }).catch(() => { setMenuData(brandData.menu); setActiveCategory(brandData.menu[0]?.category || ''); }).finally(() => setIsLoadingMenu(false));
    }, [brandData.id]);

    useEffect(() => {
        if (currentUser) setResForm(prev => ({ ...prev, name: currentUser.name, email: currentUser.email, phone: currentUser.phone }));
    }, [currentUser]);

    const handleResFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setResForm(prev => ({ ...prev, [name]: name === 'guests' ? parseInt(value) : value }));
    };

    const fetchTables = async () => {
        if (!resForm.date || !resForm.time) { setResError('Please select date and time first.'); return; }
        setIsLoadingTables(true); setResError('');
        try {
            const tables = await apiGetAvailableTables(brandData.id, resForm.date, resForm.time, resForm.guests);
            setAvailableTables(tables);
            setResStep(2);
        } catch (e) { console.error(e); setResError('Failed to load tables. Please try again.'); } finally { setIsLoadingTables(false); }
    };

    const sendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resForm.name || !resForm.phone) { setResError('Name and Phone are required.'); return; }
        setResError('');
        try {
             await apiSendReservationOTP(resForm.phone);
             setOtpSent(true);
             alert(`MOCK OTP: 1234`);
        } catch (e) { setResError('Failed to send OTP.'); }
    };

    const confirmBooking = async () => {
        if (isBooking) return;
        setResError('');
        setIsBooking(true);
        try {
            const isValid = await apiVerifyReservationOTP(resForm.phone, otp);
            if (!isValid) { setResError('Invalid OTP'); return; }
            const res = await apiCreateReservation(brandData.id, currentUser?.id, resForm);
            setLastReservationId(res.bookingId);
            setResStep(4);
        } catch (e) { 
            console.error(e);
            setResError(e instanceof Error ? e.message : 'Booking failed. Please try again.'); 
        } finally {
            setIsBooking(false);
        }
    };

    const filteredMenu = useMemo(() => {
        if (!searchQuery.trim()) return menuData;
        const lowercasedQuery = searchQuery.toLowerCase();
        return menuData.map(category => ({ ...category, items: category.items.filter(item => item.name.toLowerCase().includes(lowercasedQuery) || item.description.toLowerCase().includes(lowercasedQuery)) })).filter(category => category.items.length > 0);
    }, [searchQuery, menuData]);
    const handleAddToCart = (item: MenuItem) => addItem(item);
    const handleScrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

    const brandThemeStyle = { '--primary-color': brandData.theme.primary, '--accent-color': brandData.theme.accent, '--text-on-primary-color': brandData.theme.textOnPrimary } as React.CSSProperties;

    return (
        <div className="bg-gray-900" style={brandThemeStyle}>
            <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
                    <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-[var(--accent-color)]"><Icon type="arrow-left" className="w-5 h-5"/><span className="hidden sm:inline">All Brands</span></button>
                    <div className="flex items-center gap-4"><img src={brandData.logo} alt={`${brandData.name} logo`} className="h-8 object-contain"/><h1 className="text-2xl font-bold font-serif text-white hidden sm:block">{brandData.name}</h1></div>
                    <ul className="hidden md:flex space-x-6 text-gray-300">{['home', 'about', 'menu', 'gallery', 'contact'].map(item => (<li key={item}><button onClick={() => handleScrollTo(item)} className="capitalize hover:text-[var(--accent-color)] transition-colors bg-transparent border-none cursor-pointer p-0">{item}</button></li>))}</ul>
                </nav>
            </header>
            <main>
                 <section id="home" className="h-screen bg-cover bg-center flex items-center justify-center" style={{backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${brandData.heroImage}')`}}>
                    <div className="text-center text-white p-4 animate-fade-in-slow"><h2 className="text-5xl md:text-7xl font-serif">{brandData.tagline}</h2><button onClick={() => handleScrollTo('menu')} style={{ backgroundColor: 'var(--primary-color)', color: 'var(--text-on-primary-color)' }} className="mt-8 inline-block font-bold py-3 px-8 rounded-md hover:opacity-90 transition-opacity">Explore Menu</button></div>
                </section>
                <section id="about" className="py-20 bg-gray-900"><div className="container mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center"><div className="animate-fade-in"><img src={brandData.aboutImage} alt="Restaurant Interior" className="rounded-lg shadow-2xl"/></div><div className="animate-fade-in"><h3 className="text-4xl font-serif text-white">Our Story</h3><p className="mt-4 text-gray-400">{brandData.aboutText}</p></div></div></section>
                <section id="menu" className="py-20 bg-gray-800"><div className="container mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center mb-12 animate-fade-in"><h3 className="text-4xl font-serif text-white">Our Menu</h3></div><div className="mb-8 max-w-lg mx-auto"><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><Icon type="search" className="w-5 h-5 text-gray-400" /></span><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search for a dish..." className="w-full bg-gray-700 text-white p-3 pl-10 rounded-full border border-gray-600 focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none"/></div></div>{isLoadingMenu ? <div className="flex justify-center p-8"><Spinner className="w-8 h-8"/></div> : <>{!searchQuery.trim() && (<div className="flex justify-center flex-wrap gap-2 mb-8 animate-fade-in">{menuData.map(cat => (<button key={cat.category} onClick={() => setActiveCategory(cat.category)} className={`px-4 py-2 rounded-md font-semibold transition-colors ${activeCategory === cat.category ? 'text-[var(--text-on-primary-color)]' : 'bg-gray-700 text-white hover:bg-gray-600'}`} style={activeCategory === cat.category ? {backgroundColor: 'var(--primary-color)'} : {}}>{cat.category}</button>))}</div>)}<div className="space-y-12">{(searchQuery.trim() ? filteredMenu : menuData.filter(cat => cat.category === activeCategory)).map(category => (<div key={category.category}><h4 className="text-2xl font-serif text-white mb-6">{category.category}</h4><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">{category.items.map(item => (<div key={item.name} className="bg-gray-900 rounded-lg flex flex-col shadow-lg animate-fade-in"><div className="relative"><img src={item.image} alt={item.name} className="w-full h-48 object-cover"/>{!item.isAvailable && <div className="absolute inset-0 bg-black/70 flex items-center justify-center"><span className="text-white font-bold text-lg bg-red-600 px-3 py-1 rounded-md">Out of Stock</span></div>}</div><div className="p-4 flex flex-col flex-grow"><div className="flex justify-between items-start"><h4 className="text-xl font-semibold text-white flex-1">{item.name}</h4><p className="text-lg font-bold text-[var(--accent-color)] ml-2">{item.price}</p></div><p className="text-gray-400 mt-2 text-sm flex-grow">{item.description}</p><button onClick={() => handleAddToCart(item)} disabled={!item.isAvailable} style={{borderColor: 'var(--primary-color)', color: 'var(--primary-color)'}} className="mt-4 w-full font-semibold py-2 px-4 rounded-md border-2 hover:bg-[var(--primary-color)] hover:text-[var(--text-on-primary-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{item.isAvailable ? 'Add to Cart' : 'Unavailable'}</button></div></div>))}</div></div>))}</div></>}</div></section>
                <section id="gallery" className="py-20 bg-gray-900"><div className="container mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center mb-12 animate-fade-in"><h3 className="text-4xl font-serif text-white">Visual Feast</h3></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{brandData.gallery.map((src, index) => (<div key={index} className="overflow-hidden rounded-lg shadow-lg animate-fade-in"><img src={src} alt={`Gallery image ${index + 1}`} className="w-full h-full object-cover aspect-square hover:scale-105 transition-transform duration-300"/></div>))}</div></div></section>

                <section id="contact" className="py-20 bg-gray-800">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12 animate-fade-in"><h3 className="text-4xl font-serif text-white">Make a Reservation</h3></div>
                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="animate-fade-in bg-gray-900 p-6 rounded-lg border border-gray-700">
                                {resError && <p className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-md text-sm">{resError}</p>}
                                {resStep === 1 && (
                                    <div className="space-y-4 animate-fade-in">
                                        <h4 className="text-xl font-semibold text-white mb-4">Step 1: Booking Details</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-400">Date</label>
                                                <input type="date" name="date" min={minDateStr} max={maxDateStr} required value={resForm.date} onChange={handleResFormChange} className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 text-white focus:ring-2 focus:ring-[var(--primary-color)]"/>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400">Guests</label>
                                                <select name="guests" value={resForm.guests} onChange={handleResFormChange} className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 text-white focus:ring-2 focus:ring-[var(--primary-color)]">
                                                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} Guests</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                             <label className="text-xs text-gray-400">Time (Hourly Slots)</label>
                                             <select name="time" required value={resForm.time} onChange={handleResFormChange} className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 text-white focus:ring-2 focus:ring-[var(--primary-color)]">
                                                <option value="">Select Time</option>
                                                {availableTimeSlots.length > 0 ? availableTimeSlots.map(t => <option key={t} value={t}>{t}</option>) : <option disabled>No slots available today</option>}
                                            </select>
                                        </div>
                                        <button onClick={fetchTables} disabled={isLoadingTables || availableTimeSlots.length === 0} className="w-full font-bold py-3 px-4 rounded-md transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: 'var(--primary-color)', color: 'var(--text-on-primary-color)' }}>{isLoadingTables ? <Spinner/> : 'Find Tables'}</button>
                                    </div>
                                )}
                                {resStep === 2 && (
                                     <div className="space-y-4 animate-fade-in">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-xl font-semibold text-white">Step 2: Select a Table</h4>
                                            <button onClick={() => setResStep(1)} className="text-sm text-gray-400 hover:text-white">Change Details</button>
                                        </div>
                                        <p className="text-sm text-gray-400">Found {availableTables.length} tables for {resForm.guests} guests at {resForm.time}.</p>
                                        <TableMap tables={availableTables} selectedTableId={resForm.tableId} onSelect={(id) => setResForm(prev => ({ ...prev, tableId: id }))} />
                                        <button onClick={() => setResStep(3)} disabled={!resForm.tableId} className="w-full font-bold py-3 px-4 rounded-md transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-4" style={{ backgroundColor: 'var(--primary-color)', color: 'var(--text-on-primary-color)' }}>Continue to Contact</button>
                                    </div>
                                )}
                                {resStep === 3 && (
                                    <div className="space-y-4 animate-fade-in">
                                         <div className="flex justify-between items-center">
                                            <h4 className="text-xl font-semibold text-white">Step 3: Confirm Details</h4>
                                            <button onClick={() => setResStep(2)} className="text-sm text-gray-400 hover:text-white">Change Table</button>
                                        </div>
                                        <form onSubmit={otpSent ? (e) => { e.preventDefault(); confirmBooking(); } : sendOtp} className="space-y-4">
                                            <input type="text" name="name" placeholder="Your Name" required value={resForm.name} onChange={handleResFormChange} disabled={otpSent} className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 text-white disabled:opacity-50"/>
                                            <input type="tel" name="phone" placeholder="Phone Number" required value={resForm.phone} onChange={handleResFormChange} disabled={otpSent} className="w-full bg-gray-700 p-3 rounded-md border border-gray-600 text-white disabled:opacity-50"/>
                                            {!otpSent ? (
                                                <button type="submit" className="w-full font-bold py-3 px-4 rounded-md transition-opacity" style={{ backgroundColor: 'var(--primary-color)', color: 'var(--text-on-primary-color)' }}>Send Verification OTP</button>
                                            ) : (
                                                <div className="animate-fade-in space-y-4">
                                                    <input type="text" placeholder="Enter OTP" required value={otp} onChange={e => setOtp(e.target.value)} className="w-full bg-gray-700 p-3 rounded-md border border-[var(--accent-color)] text-white text-center tracking-widest font-bold"/>
                                                    <button type="submit" disabled={isBooking} className="w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-md transition-opacity bg-green-600 text-white hover:bg-green-500 disabled:bg-gray-500">
                                                        {isBooking ? <Spinner className="text-white"/> : 'Verify & Book'}
                                                    </button>
                                                </div>
                                            )}
                                        </form>
                                    </div>
                                )}
                                {resStep === 4 && (
                                    <div className="animate-fade-in text-center py-8 space-y-4">
                                        <Icon type="check-circle" className="w-16 h-16 text-green-400 mx-auto" />
                                        <h4 className="text-2xl font-bold text-white">Booking Confirmed!</h4>
                                        <p className="text-gray-300">We look forward to seeing you.</p>
                                        <div className="bg-gray-800 p-4 rounded-md inline-block text-left mt-4">
                                            <p className="text-sm text-gray-400">Booking ID: <span className="text-cyan-400 font-mono">{lastReservationId}</span></p>
                                            <p className="text-sm text-gray-400">Date: <span className="text-white">{new Date(resForm.date).toLocaleDateString()}</span> at <span className="text-white">{resForm.time}</span></p>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-4">Please arrive on time. Bookings are held for 20 minutes.</p>
                                        <button onClick={() => { setResStep(1); setResForm(prev => ({ ...prev, date: '', time: '', tableId: '' })); setOtpSent(false); setOtp(''); }} className="text-cyan-400 hover:underline mt-4 block mx-auto">Make another booking</button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-6 text-gray-300 animate-fade-in">
                                 <div><h4 className="text-2xl font-serif text-white mb-3">Contact Us</h4><p className="flex items-center gap-3"><Icon type="map-pin" className="w-5 h-5 text-[var(--accent-color)]"/> {brandData.contactInfo.address}</p><p className="flex items-center gap-3 mt-2"><Icon type="phone" className="w-5 h-5 text-[var(--accent-color)]"/> {brandData.contactInfo.phone}</p></div>
                                <div><h4 className="text-2xl font-serif text-white mb-3">Operating Hours</h4><p className="flex items-center gap-3"><Icon type="clock" className="w-5 h-5 text-[var(--accent-color)]"/> {brandData.contactInfo.hours}</p></div>
                                <div><button onClick={() => setIsRecommenderOpen(true)} className="w-full flex items-center justify-center gap-3 bg-gray-700 p-4 rounded-md hover:bg-gray-600 transition-colors"><Icon type="chef-hat" className="w-6 h-6 text-[var(--accent-color)]"/><div><p className="font-semibold text-white">Feeling Indecisive?</p><p className="text-sm text-gray-400">Get an AI-powered recommendation!</p></div></button></div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="bg-gray-900 py-12"><div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500"><p>&copy; {new Date().getFullYear()} {brandData.name}. Part of Bongo Delicacy Group.</p></div></footer>
            <ChefRecommenderModal isOpen={isRecommenderOpen} onClose={() => setIsRecommenderOpen(false)} brandData={brandData} menuData={menuData} />
            <CartIcon onClick={() => setIsCartOpen(true)} />
            <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} brandId={brandData.id} />
        </div>
    );
};

export default BrandPage;
