import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import BrandPage from './components/BrandPage';
import AdminDashboardPage from './components/AdminDashboardPage';
import OrderTrackingPage from './components/OrderTrackingPage';
import OrderStatusPage from './components/OrderStatusPage';
import LoginPage from './components/LoginPage';
import AccountPage from './components/AccountPage';
import AdminLoginPage from './components/AdminLoginPage';
import { useAuth } from './context/AuthContext';
import { apiGetBrandDetails } from './services/apiService';

const App: React.FC = () => {
    const getRoute = () => window.location.hash.substring(1).split('?')[0];
    const [route, setRoute] = useState(getRoute());
    const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
    const { currentUser } = useAuth();

    useEffect(() => {
        const handleHashChange = () => {
            const newRoute = getRoute();
            const mainRoutes = ['', 'admin', 'tracking', 'login', 'account', 'admin-login'];
            
            const isMainRouteChange = mainRoutes.includes(newRoute) || newRoute.startsWith('order-status');
    
            if (isMainRouteChange) {
                setRoute(newRoute);
                setSelectedBrandId(null); 
                window.scrollTo(0, 0);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);


    const handleSelectBrand = (brandId: string) => {
        setSelectedBrandId(brandId);
        window.scrollTo(0, 0);
    };

    const handleGoBack = () => {
        setSelectedBrandId(null);
        window.location.hash = '#';
        window.scrollTo(0, 0);
    };

    if (route === 'admin-login') {
        return <AdminLoginPage />;
    }

    if (route === 'admin') {
        if (currentUser?.isAdmin) {
            return <AdminDashboardPage />;
        } else {
            window.location.hash = '#admin-login';
            return null;
        }
    }

    if (route === 'tracking') {
        return <OrderTrackingPage />;
    }
    
    if (route === 'login') {
        return <LoginPage />;
    }

    if (route === 'account') {
        return <AccountPage />;
    }

    if (route.startsWith('order-status')) {
        return <OrderStatusPage />;
    }

    if (!selectedBrandId) {
        return <LandingPage onSelectBrand={handleSelectBrand} />;
    }

    const brandData = apiGetBrandDetails(selectedBrandId);
    if (!brandData) {
        console.error(`Invalid brand ID: ${selectedBrandId}`);
        return <LandingPage onSelectBrand={handleSelectBrand} />;
    }

    return <BrandPage brandData={brandData} onBack={handleGoBack} />;
};

export default App;