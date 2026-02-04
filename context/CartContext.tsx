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
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;

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

  // ✅ Switch outlet → clear cart
  const switchRestaurant = (newRestaurantId: string) => {
    setRestaurantId((prev) => {
      if (prev && prev !== newRestaurantId) {
        setItems([]);
      }
      return newRestaurantId;
    });
  };

  // ✅ Add item (keyed by itemid)
  const addItem = (itemToAdd: CartItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.itemid === itemToAdd.itemid
      );

      if (existingItem) {
        return prevItems.map((item) =>
          item.itemid === itemToAdd.itemid
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevItems, { ...itemToAdd, quantity: 1 }];
    });
  };

  // ✅ Remove item by itemid
  const removeItem = (itemId: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.itemid !== itemId)
    );
  };

  // ✅ Update quantity by itemid
  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.itemid === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const totalPrice = useMemo(() => {
    return items.reduce((total, item) => {
      const priceNumber = Number(item.price) || 0;
      return total + priceNumber * item.quantity;
    }, 0);
  }, [items]);

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

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
