import { create } from 'zustand';

export type CartItem = {
  menuItemId: string;
  name: string;
  portion: 'M' | 'L' | 'Single';
  price: number;
  quantity: number;
};

interface CartState {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (menuItemId: string, portion: string) => void;
  updateQuantity: (menuItemId: string, portion: string, delta: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addToCart: (newItem) => {
    set((state) => {
      const existingIdx = state.items.findIndex(
        (i) => i.menuItemId === newItem.menuItemId && i.portion === newItem.portion
      );
      if (existingIdx >= 0) {
        const updated = [...state.items];
        updated[existingIdx].quantity += newItem.quantity;
        return { items: updated };
      }
      return { items: [...state.items, newItem] };
    });
  },
  removeFromCart: (menuItemId, portion) => {
    set((state) => ({
      items: state.items.filter(
        (i) => !(i.menuItemId === menuItemId && i.portion === portion)
      ),
    }));
  },
  updateQuantity: (menuItemId, portion, delta) => {
    set((state) => ({
      items: state.items.map((i) => {
        if (i.menuItemId === menuItemId && i.portion === portion) {
          return { ...i, quantity: Math.max(1, i.quantity + delta) };
        }
        return i;
      }),
    }));
  },
  clearCart: () => set({ items: [] }),
  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
}));
