import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  dish_id: string;
  name: string;
  price: number;
  qty: number;
  image_url: string | null;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">) => void;
  remove: (dish_id: string) => void;
  setQty: (dish_id: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.dish_id === item.dish_id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.dish_id === item.dish_id ? { ...i, qty: i.qty + 1 } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, qty: 1 }] };
        }),
      remove: (dish_id) =>
        set((s) => ({ items: s.items.filter((i) => i.dish_id !== dish_id) })),
      setQty: (dish_id, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.dish_id === dish_id ? { ...i, qty } : i))
            .filter((i) => i.qty > 0),
        })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: "annapurna-cart" },
  ),
);

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);