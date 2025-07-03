import { createContext, useState, useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import cartAddSound from '@/assets/cart-add-sound.wav'; // Import your sound file

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL || 'FCFA'
  const deliveryFee = 900;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [token, setToken] = useState(null);
  const [affiliateCode, setAffiliateCode] = useState(null);
  const [affiliateInfo, setAffiliateInfo] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Create an Audio object for the notification sound
  const notificationSound = new Audio(cartAddSound);

  // Храним локальное состояние корзины
  const [cartItems, setCartItems] = useState({});

  // Get token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Handle affiliate code tracking
  useEffect(() => {
    // Check for affiliate code in URL on any page
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode) {
      // Store affiliate code in localStorage and state
      localStorage.setItem('affiliateCode', refCode);
      setAffiliateCode(refCode);

      // Track the click
      fetch(`${backendUrl}/api/affiliate/track/${refCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch(error => {
        console.error('Error tracking affiliate click:', error);
      });

      // Validate and get affiliate info
      fetch(`${backendUrl}/api/affiliate/validate/${refCode}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setAffiliateInfo(data.affiliate);
            localStorage.setItem('affiliateInfo', JSON.stringify(data.affiliate));
            toast.success(`Welcome! You were referred by ${data.affiliate.name}. Sign up to get started!`);
          }
        })
        .catch(error => {
          console.error('Error validating affiliate code:', error);
        });

      // Clean URL by removing the ref parameter but keep the affiliate code in storage
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('ref');
      window.history.replaceState({}, '', newUrl.toString());
    } else {
      // Check if we have a stored affiliate code from previous visit
      const storedCode = localStorage.getItem('affiliateCode');
      const storedInfo = localStorage.getItem('affiliateInfo');

      if (storedCode) {
        setAffiliateCode(storedCode);
      }

      if (storedInfo) {
        try {
          setAffiliateInfo(JSON.parse(storedInfo));
        } catch (error) {
          console.error('Error parsing stored affiliate info:', error);
        }
      }
    }
  }, [backendUrl]);

  // Clear affiliate data when user logs in (optional - you might want to keep it)
  useEffect(() => {
    if (token) {
      // Optionally clear affiliate data when user logs in
      // localStorage.removeItem('affiliateCode');
      // localStorage.removeItem('affiliateInfo');
      // setAffiliateCode(null);
      // setAffiliateInfo(null);
    }
  }, [token]);

  // Load products list
  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await axios.get(`${backendUrl}/api/product/list`);
      console.log("Products loaded:", data.products);
      return data.products;
    },
  });

  // Load user cart if token exists
  const {
    data: cartData,
    isLoading: isCartLoading,
    refetch,
  } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data } = await axios.get(`${backendUrl}/api/cart/get`, {
        headers: { token },
      });
      return data?.cartData || {};
    },
    enabled: !!token,
    onError: () => {
      toast.error("Failed to load cart.");
    },
  });

  // Refetch cart after login/logout
  useEffect(() => {
    if (token) {
      refetch().then((res) => {
        setCartItems(res.data || {});
      });
    }
  }, [token, refetch]);

  // Add item to cart
  const addToCartMutation = useMutation({
    mutationFn: async ({ itemId, size, color }) => {
      await axios.post(
        `${backendUrl}/api/cart/add`,
        { itemId, size, color },
        { headers: { token } }
      );
    },
    onMutate: ({ itemId, size, color }) => {
      if (!size) {
        toast.error("Select Product Size");
        return;
      }

      const updatedCart = structuredClone(cartItems);
      if (!updatedCart[itemId]) updatedCart[itemId] = {};
      
      // Create a unique key combining size and color
      const cartKey = color ? `${size}-${color}` : size;
      updatedCart[itemId][cartKey] = (updatedCart[itemId][cartKey] || 0) + 1;
      setCartItems(updatedCart);
    },
    onSuccess: (data, variables) => {
      // Find product name for the toast message
      const product = products.find(p => p._id === variables.itemId);
      const productName = product ? product.name : 'Item';
      const colorName = variables.color ? products.find(p=>p._id === variables.itemId)?.colors.find(c=>c.colorHex === variables.color)?.colorName : '';
      const sizeName = variables.size;

      toast.success(`${productName} ${colorName ? `(${colorName}, ${sizeName})` : `(${sizeName})`} added to cart!`);
      notificationSound.play().catch(error => console.error("Error playing sound:", error)); // Play sound
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || "Failed to add item to cart."),
    onSettled: () => {
      queryClient.invalidateQueries(["cart"]);
    },
  });

  const addToCart = (itemId, size, color) => {
    if (!size) {
      toast.error("Select Product Size");
      return;
    }
    addToCartMutation.mutate({ itemId, size, color });
  };

  // Update cart item quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, size, quantity, color }) => {
      await axios.post(
        `${backendUrl}/api/cart/update`,
        { itemId, size, quantity, color },
        { headers: { token } }
      );
    },
    onMutate: ({ itemId, size, quantity, color }) => {
      const updatedCart = structuredClone(cartItems);

      if (!updatedCart[itemId]) updatedCart[itemId] = {};
      const cartKey = color ? `${size}-${color}` : size;
      updatedCart[itemId][cartKey] = quantity;

      if (quantity === 0) {
        delete updatedCart[itemId][cartKey];
        if (Object.keys(updatedCart[itemId]).length === 0) {
          delete updatedCart[itemId];
        }
      }

      setCartItems(updatedCart);
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => {
      queryClient.invalidateQueries(["cart"]);
    },
  });

  const updateQuantity = (productId, cartKey, quantity, newCartItems = null) => {
    setCartItems(prev => {
      // If a complete cart object is provided, use it directly
      if (newCartItems) {
        return newCartItems;
      }
      
      // Create a deep copy of the previous cart state
      const updated = JSON.parse(JSON.stringify(prev));
      
      // If the product doesn't exist in the cart, initialize it
      if (!updated[productId]) {
        updated[productId] = {};
      }
      
      if (quantity === 0) {
        // Remove the specific size/color variant
        if (updated[productId][cartKey] !== undefined) {
          delete updated[productId][cartKey];
          
          // If no more variants for this product, remove the product entirely
          if (Object.keys(updated[productId]).length === 0) {
            delete updated[productId];
          }
        }
      } else {
        // Update the quantity for this specific variant
        updated[productId][cartKey] = quantity;
      }
      
      return updated;
    });
    
    // If we're removing an item, also update the server
    if (quantity === 0 && token) {
      // Parse the cartKey to extract size and color
      const [size, color] = cartKey.includes('-') ? cartKey.split('-') : [cartKey, undefined];
      
      // Call the update mutation
      updateQuantityMutation.mutate({
        itemId: productId,
        size: size,
        quantity: 0,
        color: color
      });
    }
  };

  // Reset cart (e.g., after purchase)
  const resetCart = () => {
    setCartItems({});
    queryClient.removeQueries(["cart"]); // очистка кэша cart
  };

  // Get total item count in cart
  const getCartCount = () => {
    return Object.values(cartItems).reduce(
      (total, cartKeys) =>
        total + Object.values(cartKeys).reduce((sum, qty) => sum + qty, 0),
      0
    );
  };

  // Get total price of items in cart with bulk discount
  const getCartAmount = () => {
    // Bulk discount configuration from environment variables
    const bulkDiscountPercentage = Number(import.meta.env.VITE_BULK_DISCOUNT_PERCENTAGE) || 5;
    const bulkDiscountMinQuantity = Number(import.meta.env.VITE_BULK_DISCOUNT_MIN_QUANTITY) || 10;

    // Helper function to calculate discounted price for an item
    const calculateDiscountedPrice = (originalPrice, quantity) => {
      if (quantity >= bulkDiscountMinQuantity) {
        const discountAmount = originalPrice * (bulkDiscountPercentage / 100);
        return originalPrice - discountAmount;
      }
      return originalPrice;
    };

    return Object.entries(cartItems).reduce((totalAmount, [itemId, cartKeys]) => {
      const itemInfo = products.find((product) => product._id === itemId);
      if (!itemInfo) return totalAmount;
      return (
        totalAmount +
        Object.values(cartKeys).reduce((sum, qty) => {
          // Apply bulk discount if quantity qualifies
          const discountedPrice = calculateDiscountedPrice(itemInfo.price, qty);
          return sum + discountedPrice * qty;
        }, 0)
      );
    }, 0);
  };

  const value = {
    products,
    isLoading: isProductsLoading || isCartLoading,
    currency,
    deliveryFee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    setCartItems,
    addToCart,
    getCartCount,
    updateQuantity,
    getCartAmount,
    resetCart,
    navigate,
    backendUrl,
    token,
    setToken,
    refetch,
    affiliateCode,
    setAffiliateCode,
    affiliateInfo,
    setAffiliateInfo,
  };

  return (
    <ShopContext.Provider value={value}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
