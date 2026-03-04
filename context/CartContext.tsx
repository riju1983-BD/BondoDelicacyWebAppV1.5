import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
} from "react";
import { CartItem } from "../types";

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;

  addItem: (item: CartItem) => void;
  removeItem: (cartKey: string) => void;
  updateItemQuantity: (cartKey: string, quantity: number) => void;

  clearCart: () => void;
  switchRestaurant: (restaurantId: string) => void;

  itemCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  /* =========================
     Switch restaurant
     ✅ Clears cart automatically when outlet.id changes
  ========================= */

  const switchRestaurant = (newRestaurantId: string) => {
    setRestaurantId((prev) => {
      if (prev && prev !== newRestaurantId) {
        setItems([]); // ✅ Cart cleared here when switching outlets
      }
      return newRestaurantId;
    });
  };

  /* =========================
     Add item (cartKey based)
  ========================= */

  const addItem = (itemToAdd: CartItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.cartKey === itemToAdd.cartKey,
      );

      if (existingItem) {
        return prevItems.map((item) =>
          item.cartKey === itemToAdd.cartKey
            ? { ...item, quantity: item.quantity + itemToAdd.quantity }
            : item,
        );
      }

      return [...prevItems, { ...itemToAdd }];
    });
  };

  /* =========================
     Remove item
  ========================= */

  const removeItem = (cartKey: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.cartKey !== cartKey),
    );
  };

  /* =========================
     Update quantity
  ========================= */

  const updateItemQuantity = (cartKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartKey);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.cartKey === cartKey ? { ...item, quantity } : item,
      ),
    );
  };

  /* =========================
     Clear cart
  ========================= */

  const clearCart = () => {
    setItems([]);
  };

  /* =========================
     Derived values
  ========================= */

  const itemCount = useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const totalPrice = useMemo(() => {
    return items.reduce((total, item) => {
      const unitPrice = Number(item.unit_price) || 0;
      return total + unitPrice * item.quantity;
    }, 0);
  }, [items]);

  /* =========================
     Context value
  ========================= */

  const value: CartContextType = {
    items,
    restaurantId,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    switchRestaurant,
    itemCount,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
