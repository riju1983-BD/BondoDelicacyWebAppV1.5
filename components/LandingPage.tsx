
import React, { useState } from 'react';
import { brandsData, bongoDelicacyLogo } from '../data';
import { useAuth } from '../context/AuthContext';
import HelpBuddyIcon from './HelpBuddyIcon';
import HelpBuddyModal from './HelpBuddyModal';
import { Icon } from './Icon';

interface LandingPageProps {
    onSelectBrand: (brandId: string) => void;
}
 const restaurants = [
 {
        id: "c9ignw2k50",
        petpoojaRestId: "c9ignw2k50",
        name: "Banglar Jhale Jhole",
        tagline: "Authentic Bengali Cuisine from Kolkata.",
        description: "Experience the authentic flavors of Bengali cuisine.",
        logo: "https://placehold.co/400x200/C62828/FFFFFF.png?text=Banglar+Jhale+Jhole",
        heroImage: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?q=80&w=2070&auto=format&fit=crop",
        aboutText: "Step into the heart of Bengal with traditional recipes and rich spices.",
        aboutImage: "https://images.unsplash.com/photo-1596701064049-d822171f11e9?q=80&w=2070&auto=format&fit=crop",
        theme: { primary: "#C62828", accent: "#FFAB00", textOnPrimary: "#FFFFFF" }
    }
]

const LandingPage: React.FC<LandingPageProps> = ({ onSelectBrand }) => {
    const { isAuthenticated, currentUser } = useAuth();
    const [isHelpBuddyOpen, setIsHelpBuddyOpen] = useState(false);

    const handleNavigate = (hash: string) => {
        window.location.hash = hash;
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* FIXED NAVBAR */}
            <nav className="fixed top-0 left-0 right-0 bg-gray-900/90 backdrop-blur-md z-50 border-b border-gray-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    {/* Logo */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
                         <img src={bongoDelicacyLogo} alt="Bongo Delicacy Logo" className="h-10 w-auto sm:h-12" />
                         <div>
                             <h1 className="text-xl sm:text-2xl font-serif font-bold text-cyan-500 leading-none">Bongo</h1>
                             <span className="text-sm sm:text-base font-light text-gray-300 tracking-widest">DELICACY</span>
                         </div>
                    </div>

                    {/* Auth Button & Order Tracking */}
                    <div className="flex items-center gap-4">
                        <button
                             onClick={() => handleNavigate('#tracking')}
                             className="hidden sm:flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors"
                        >
                            <Icon type="calendar" className="w-5 h-5" />
                            <span className="text-sm font-semibold">Track Reservation</span>
                        </button>

                        {isAuthenticated ? (
                            <button
                                onClick={() => handleNavigate('#account')}
                                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-full font-semibold transition-all shadow-md hover:shadow-cyan-500/20"
                            >
                                <Icon type="user" className="w-5 h-5" />
                                <span className="hidden sm:inline">{currentUser?.name.split(' ')[0]}'s Account</span>
                                <span className="sm:hidden">Account</span>
                            </button>
                        ) : (
                             <button
                                onClick={() => handleNavigate('#login')}
                                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-full font-semibold transition-all shadow-md hover:shadow-cyan-500/20"
                            >
                                <Icon type="user" className="w-5 h-5" />
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <header className="relative h-[60vh] flex items-center justify-center overflow-hidden mt-16">
                 <div className="absolute inset-0">
                    <img 
                        src="https://images.unsplash.com/photo-1593560704563-f176a2eb61db?q=80&w=2070&auto=format&fit=crop" 
                        alt="Bengali Spices" 
                        className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
                </div>
                <div className="relative z-10 text-center px-4 animate-fade-in">
                    <h2 className="text-5xl md:text-7xl font-serif font-bold mb-6">
                        Experience the <span className="text-cyan-500">Essence</span> of Bengal
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
                        A curated collective of authentic culinary brands, bringing the soul of Kolkata to your plate.
                    </p>
                </div>
            </header>

            {/* BRANDS GRID */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-24 relative z-20">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* {Object.values(brandsData).map((brand) => (    */}
                          {restaurants.map((brand) => (
                        <div 
                            key={brand.petpoojaRestId}
                            onClick={() => onSelectBrand(brand.petpoojaRestId)}
                            className="group relative h-[350px] rounded-2xl overflow-hidden cursor-pointer shadow-2xl transform hover:-translate-y-2 transition-all duration-500"
                        >
                            <div className="absolute inset-0">
                                <img src={brand.heroImage} alt={brand.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                            </div>
                            
                            <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <img src={brand.logo} alt={`${brand.name} logo`} className="h-12 w-auto mb-4 opacity-90"/>
                                    <h3 className="text-2xl font-serif font-bold text-white mb-2">{brand.name}</h3>
                                    <div className="h-1 w-16 bg-cyan-500 mb-3 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                                    <p className="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 line-clamp-3">
                                        {brand.tagline}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
            
            {/* FOOTER */}
            <footer className="bg-gray-950 py-12 text-center text-gray-500">
                <p>© {new Date().getFullYear()} Bongo Delicacy Group. All rights reserved.</p>
                <div className="mt-4 flex justify-center gap-4">
                    <button onClick={() => handleNavigate('#admin-login')} className="text-xs hover:text-gray-300 transition-colors">Admin Login</button>
                </div>
            </footer>

            {/* HELP BUDDY */}
            <HelpBuddyIcon onClick={() => setIsHelpBuddyOpen(true)} />
            <HelpBuddyModal isOpen={isHelpBuddyOpen} onClose={() => setIsHelpBuddyOpen(false)} />
        </div>
    );
};

export default LandingPage;
