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
import { apiGetRestaurantById } from './services/apiService';
import { Restaurant } from './types';

const App: React.FC = () => {
  const getRoute = () => window.location.hash.substring(1).split('?')[0];

  const [route, setRoute] = useState(getRoute());
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(false);

  const { currentUser } = useAuth();

  useEffect(() => {
    const handleHashChange = () => {
      const newRoute = getRoute();
      const mainRoutes = ['', 'admin', 'tracking', 'login', 'account', 'admin-login'];

      const isMainRouteChange =
        mainRoutes.includes(newRoute) || newRoute.startsWith('order-status');

      if (isMainRouteChange) {
        setRoute(newRoute);
        setSelectedRestaurantId(null);
        setRestaurant(null);
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectRestaurant = (restId: string) => {
    setSelectedRestaurantId(restId);
    window.scrollTo(0, 0);
  };

  const handleGoBack = () => {
    setSelectedRestaurantId(null);
    setRestaurant(null);
    window.location.hash = '#';
    window.scrollTo(0, 0);
  };

  // Load restaurant when rest_id changes
  useEffect(() => {
    if (!selectedRestaurantId) return;

    setLoadingRestaurant(true);
    apiGetRestaurantById(selectedRestaurantId)
      .then(data => setRestaurant(data))
      .catch(err => {
        console.error('Failed to load restaurant:', err);
        setRestaurant(null);
      })
      .finally(() => setLoadingRestaurant(false));
  }, [selectedRestaurantId]);

  // ---------- ROUTES ----------

  if (route === 'admin-login') return <AdminLoginPage />;

  if (route === 'admin') {
    if (currentUser?.isAdmin) return <AdminDashboardPage />;
    window.location.hash = '#admin-login';
    return null;
  }

  if (route === 'tracking') return <OrderTrackingPage />;
  if (route === 'login') return <LoginPage />;
  if (route === 'account') return <AccountPage />;
  if (route.startsWith('order-status')) return <OrderStatusPage />;

  // ---------- MAIN FLOW ----------

  if (!selectedRestaurantId) {
    return <LandingPage onSelectBrand={handleSelectRestaurant} />;
  }

  if (loadingRestaurant) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      Loading restaurant…
    </div>;
  }

  if (!restaurant) {
    console.error(`Invalid restaurant id: ${selectedRestaurantId}`);
    return <LandingPage onSelectBrand={handleSelectRestaurant} />;
  }

  return <BrandPage restId={selectedRestaurantId} onBack={handleGoBack} />;

};

export default App;
