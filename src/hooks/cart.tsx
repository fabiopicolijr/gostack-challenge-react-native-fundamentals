import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storagedProducts) {
        setProducts([...JSON.parse(storagedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async newProduct => {
      const newProductExists = products.find(
        cartProduct => cartProduct.id === newProduct.id,
      );
      // nesse caso, o map está jogando pro setProducts todos os produtos.
      // quando o produto for igual do produto inserido, soma mais 1 na quantidade.
      // quando o produto for diferente do produto inserido, inclui ele de volta na lista.
      if (newProductExists) {
        setProducts(
          products.map(cartProduct =>
            cartProduct.id === newProduct.id
              ? { ...newProduct, quantity: cartProduct.quantity + 1 }
              : cartProduct,
          ),
        );
      } else {
        // quando o novo produto não existe, adiciona ele na lista.
        setProducts([...products, { ...newProduct, quantity: 1 }]);
      }

      console.log(`addCart: ${JSON.stringify(products[0])}`);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const updatedProducts = products.map(cartProduct =>
        cartProduct.id === id
          ? { ...cartProduct, quantity: cartProduct.quantity + 1 }
          : cartProduct,
      );

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const updatedProducts = products.map(cartProduct =>
        cartProduct.id === id
          ? { ...cartProduct, quantity: cartProduct.quantity - 1 }
          : cartProduct,
      );

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
