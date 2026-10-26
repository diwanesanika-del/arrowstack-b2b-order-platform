import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types/index.ts';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; message: string };
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  totalQuantity: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('b2b_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('b2b_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      return { success: false, message: 'This item is currently out of stock.' };
    }

    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    const currentQty = existingIndex > -1 ? cart[existingIndex].quantity : 0;
    const requestedQty = currentQty + quantity;

    if (requestedQty > product.stock) {
      return {
        success: false,
        message: `Cannot add ${quantity} units. Available stock is ${product.stock} (You currently have ${currentQty} in cart).`
      };
    }

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity = requestedQty;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity }]);
    }

    return { success: true, message: `Added ${quantity} × ${product.title} to your cart.` };
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return { success: true, message: 'Item removed from cart.' };
    }

    const item = cart.find((i) => i.product.id === productId);
    if (!item) return { success: false, message: 'Item not in cart.' };

    if (quantity > item.product.stock) {
      return {
        success: false,
        message: `Requested quantity exceeds available stock (${item.product.stock} units available).`
      };
    }

    setCart(cart.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
    return { success: true, message: 'Cart updated successfully.' };
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const subtotal = cart.reduce((sum, item) => sum + parseFloat(String(item.product.unitPrice)) * item.quantity, 0);
  const taxAmount = +(subtotal * 0.08).toFixed(2);
  const totalAmount = +(subtotal + taxAmount).toFixed(2);
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal: +subtotal.toFixed(2),
        taxAmount,
        totalAmount,
        totalQuantity
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
