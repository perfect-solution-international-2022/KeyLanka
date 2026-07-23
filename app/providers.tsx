"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, AuthUser, CartItem, WishlistItem } from "@/lib/api";
import { getSessionId } from "@/lib/session";
import { getLineTotal } from "@/lib/pricing";

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  count: number;
  subtotal: number;
  wholesaleMinQty: number;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

interface WishlistContextValue {
  items: WishlistItem[];
  loading: boolean;
  count: number;
  isWishlisted: (productId: number) => boolean;
  toggleWishlist: (productId: number) => Promise<void>;
  refresh: () => Promise<void>;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);
const WishlistContext = createContext<WishlistContextValue | null>(null);
const AuthContext = createContext<AuthContextValue | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [wholesaleMinQty, setWholesaleMinQty] = useState(10);

  useEffect(() => {
    setSessionId(getSessionId());
    api
      .getSettings()
      .then((s) => setWholesaleMinQty(s.wholesaleMinQty))
      .catch(() => {});
  }, []);

  const refreshCart = useCallback(async () => {
    if (!sessionId) return;
    setCartLoading(true);
    try {
      const items = await api.getCart(sessionId);
      setCartItems(items);
    } catch {
      setCartItems([]);
    } finally {
      setCartLoading(false);
    }
  }, [sessionId]);

  const refreshWishlist = useCallback(async () => {
    if (!sessionId) return;
    setWishlistLoading(true);
    try {
      const items = await api.getWishlist(sessionId);
      setWishlistItems(items);
    } catch {
      setWishlistItems([]);
    } finally {
      setWishlistLoading(false);
    }
  }, [sessionId]);

  const refreshAuth = useCallback(async () => {
    setAuthLoading(true);
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      refreshCart();
      refreshWishlist();
    }
  }, [sessionId, refreshCart, refreshWishlist]);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const cartValue = useMemo<CartContextValue>(
    () => ({
      items: cartItems,
      loading: cartLoading,
      count: cartItems.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: cartItems.reduce((sum, i) => sum + getLineTotal(i.product, i.quantity, wholesaleMinQty), 0),
      wholesaleMinQty,
      addToCart: async (productId, quantity = 1) => {
        await api.addToCart(sessionId, productId, quantity);
        await refreshCart();
      },
      updateQuantity: async (id, quantity) => {
        await api.updateCartItem(sessionId, id, quantity);
        await refreshCart();
      },
      removeItem: async (id) => {
        await api.removeCartItem(sessionId, id);
        await refreshCart();
      },
      refresh: refreshCart,
    }),
    [cartItems, cartLoading, sessionId, refreshCart, wholesaleMinQty]
  );

  const wishlistValue = useMemo<WishlistContextValue>(
    () => ({
      items: wishlistItems,
      loading: wishlistLoading,
      count: wishlistItems.length,
      isWishlisted: (productId) => wishlistItems.some((i) => i.productId === productId),
      toggleWishlist: async (productId) => {
        const existing = wishlistItems.find((i) => i.productId === productId);
        if (existing) {
          await api.removeWishlistItem(sessionId, existing.id);
        } else {
          await api.addToWishlist(sessionId, productId);
        }
        await refreshWishlist();
      },
      refresh: refreshWishlist,
    }),
    [wishlistItems, wishlistLoading, sessionId, refreshWishlist]
  );

  const authValue = useMemo<AuthContextValue>(
    () => ({
      user,
      loading: authLoading,
      login: async (email, password) => {
        const u = await api.login({ email, password }, sessionId);
        setUser(u);
        await Promise.all([refreshCart(), refreshWishlist()]);
        return u;
      },
      register: async (name, email, password, phone) => {
        const u = await api.register({ name, email, password, phone }, sessionId);
        setUser(u);
        await Promise.all([refreshCart(), refreshWishlist()]);
        return u;
      },
      logout: async () => {
        await api.logout();
        setUser(null);
      },
      refresh: refreshAuth,
    }),
    [user, authLoading, refreshAuth, sessionId, refreshCart, refreshWishlist]
  );

  return (
    <AuthContext.Provider value={authValue}>
      <CartContext.Provider value={cartValue}>
        <WishlistContext.Provider value={wishlistValue}>{children}</WishlistContext.Provider>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within Providers");
  return ctx;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within Providers");
  return ctx;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within Providers");
  return ctx;
}
