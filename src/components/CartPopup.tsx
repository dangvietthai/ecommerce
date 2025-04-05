import { useState, useEffect } from 'react';
import { ShoppingCart, X, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  setItems: (items: CartItem[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const useCartStore = create<CartStore>((set) => ({
  items: [],
  isLoading: false,
  setItems: (items) => set({ items }),
  setIsLoading: (isLoading) => set({ isLoading }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  updateItemQuantity: (id, quantity) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, quantity } : item
    ),
  })),
  clearCart: () => set({ items: [] }),
}));

export default function CartPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, isLoading, setItems, setIsLoading, removeItem, updateItemQuantity } = useCartStore();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get initial user session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCartItems(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCartItems(session.user.id);
      } else {
        setItems([]);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchCartItems = async (userId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          product:products (
            id,
            name,
            price,
            image_url
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      // Transform the data to match our CartItem interface
      const transformedData = (data || []).map(item => ({
        ...item,
        product: Array.isArray(item.product) ? item.product[0] : item.product
      })) as CartItem[];
      
      setItems(transformedData);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = async (id: string, change: number) => {
    try {
      const item = items.find(item => item.id === id);
      if (!item) return;

      const newQuantity = Math.max(1, item.quantity + change);
      
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', id);

      if (error) throw error;

      updateItemQuantity(id, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      removeItem(id);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(true)}
        className="relative group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <ShoppingCart className="w-6 h-6 text-gray-700 group-hover:text-red-600 transition-colors" />
        <AnimatePresence>
          {totalItems > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full"
            >
              {totalItems}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-lg z-50"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold">Giỏ hàng</h2>
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                    </div>
                  ) : items.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-8"
                    >
                      <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Giỏ hàng trống</p>
                    </motion.div>
                  ) : (
                    <motion.div layout className="space-y-4">
                      <AnimatePresence>
                        {items.map(item => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="flex items-center gap-4"
                          >
                            <div className="w-20 h-20 relative">
                              <Image
                                src={item.product.image_url}
                                alt={item.product.name}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{item.product.name}</h3>
                              <p className="text-red-600 font-semibold">
                                {item.product.price.toLocaleString('vi-VN')}đ
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <motion.button
                                  onClick={() => handleQuantityChange(item.id, -1)}
                                  className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  -
                                </motion.button>
                                <span>{item.quantity}</span>
                                <motion.button
                                  onClick={() => handleQuantityChange(item.id, 1)}
                                  className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  +
                                </motion.button>
                                <motion.button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="ml-auto text-gray-400 hover:text-red-600"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>

                {/* Footer */}
                <AnimatePresence>
                  {items.length > 0 && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                      className="border-t p-4"
                    >
                      <div className="flex justify-between mb-4">
                        <span className="font-medium">Tổng cộng:</span>
                        <motion.span
                          key={totalPrice}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          className="font-semibold text-red-600"
                        >
                          {totalPrice.toLocaleString('vi-VN')}đ
                        </motion.span>
                      </div>
                      <div className="flex gap-4">
                        <Link
                          href="/cart"
                          className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center"
                          onClick={() => setIsOpen(false)}
                        >
                          Xem giỏ hàng
                        </Link>
                        <motion.button
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                          onClick={() => setIsOpen(false)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Thanh toán
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
} 