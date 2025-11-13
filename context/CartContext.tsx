import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { CartItem, MenuItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (itemName: string) => void;
  updateItemQuantity: (itemName: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (itemToAdd: MenuItem) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.name === itemToAdd.name);
      if (existingItem) {
        return prevItems.map(item =>
          item.name === itemToAdd.name ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...itemToAdd, quantity: 1 }];
    });
  };

  const removeItem = (itemName: string) => {
    setItems(prevItems => prevItems.filter(item => item.name !== itemName));
  };

  const updateItemQuantity = (itemName: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemName);
    } else {
      setItems(prevItems =>
        prevItems.map(item =>
          item.name === itemName ? { ...item, quantity } : item
        )
      );
    }
  };
  
  const clearCart = () => {
    setItems([]);
  };

  const itemCount = useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);
  
  const totalPrice = useMemo(() => {
    return items.reduce((total, item) => {
        const priceNumber = parseFloat(item.price.replace(/[^0-9.-]+/g,""));
        return total + (priceNumber * item.quantity);
    }, 0);
  }, [items]);
  

  const value = {
    items,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    itemCount,
    totalPrice
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};