import React, { createContext, useContext, useState, useEffect } from "react";

interface OutletLocation {
  lat: number;
  lng: number;
  contact?: string;
  address?: string;
  city?: string;
  brandName?: string; // ← ADD
}

interface OutletContextType {
  outletLocation: OutletLocation | null;
  setOutletLocation: (loc: OutletLocation | null) => void;
}

const OutletContext = createContext<OutletContextType | undefined>(undefined);

export const OutletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [outletLocation, setOutletLocationState] =
    useState<OutletLocation | null>(null);

  // Load from localStorage on start
  useEffect(() => {
    const saved = localStorage.getItem("selectedOutletLocation");
    if (saved) {
      setOutletLocationState(JSON.parse(saved));
    }
  }, []);

  // Save whenever changes
  const setOutletLocation = (loc: OutletLocation | null) => {
    setOutletLocationState(loc);

    if (loc) {
      localStorage.setItem("selectedOutletLocation", JSON.stringify(loc));
    } else {
      localStorage.removeItem("selectedOutletLocation");
    }
  };

  return (
    <OutletContext.Provider value={{ outletLocation, setOutletLocation }}>
      {children}
    </OutletContext.Provider>
  );
};

export const useOutlet = () => {
  const ctx = useContext(OutletContext);
  if (!ctx) throw new Error("useOutlet must be used inside OutletProvider");
  return ctx;
};
