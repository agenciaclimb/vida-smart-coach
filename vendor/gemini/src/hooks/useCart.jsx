import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('vida-smart-cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
        setCartItems([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vida-smart-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((product, variant, quantity, availableQuantity) => {
    if (variant.manage_inventory && quantity > availableQuantity) {
      throw new Error("Not enough stock available.");
    }

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.variant.id === variant.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (variant.manage_inventory && newQuantity > availableQuantity) {
          toast.error(`Only ${availableQuantity} in stock!`);
          return prevItems;
        }
        return prevItems.map(item =>
          item.variant.id === variant.id ? { ...item, quantity: newQuantity } : item
        );
      }
      return [...prevItems, { product, variant, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((variantId) => {
    setCartItems(prevItems => prevItems.filter(item => item.variant.id !== variantId));
    toast.error('Item removido do carrinho.');
  }, []);

  const updateQuantity = useCallback((variantId, quantity) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.variant.id === variantId) {
          if (quantity < 1) {
            return null; 
          }
          const availableQuantity = item.variant.inventory_quantity;
          if (item.variant.manage_inventory && quantity > availableQuantity) {
            toast.error(`Only ${availableQuantity} in stock!`);
            return { ...item, quantity: availableQuantity };
          }
          return { ...item, quantity };
        }
        return item;
      }).filter(Boolean)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      const price = item.variant.sale_price_in_cents ?? item.variant.price_in_cents;
      return total + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    isCartOpen,
    setIsCartOpen,
    loading,
    setLoading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};