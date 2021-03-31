import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // buscar dados do localStorage
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    
    //se string transformar em json para retornar em array de Product
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    //se null retornar array vazio
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // adicionar um produto ao carrinho
      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);
      const productStock = await api.get(`/stock/${productId}`);
      const productStockAmount = productStock.data.amount;
      const productCurrentAmount = productExists ? productExists.amount : 0;
      const amount = productCurrentAmount + 1;

      // verificar stock do produto
      if (amount > productStockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      // verificar se o produto já existe
      // se existe atualizar o stock
      if (productExists) {
        productExists.amount = amount;
      } // se não existir 
      else {
        const product = await api.get(`/products/${productId}`);
        const newProduct = {...product.data, amount: 1};
        
        updatedCart.push(newProduct);
      }

      // atualizar carrinho
      setCart(updatedCart);

      // salvar no localStorage
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    
    } catch {
      // msg de erro
      toast.error('Erro na adição do produto');
    }
  };

  // remover um produto do carrinho
  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart]
      const productItem = updatedCart.findIndex(product => product.id === productId)
      
      // carrinho atualizado e salvo no localStorage
      if (productItem >= 0) {
        updatedCart.splice(productItem, 1)
        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

      } else {
        throw Error()
      }
    } catch {
      // msg de erro
      toast.error('Erro na remoção do produto');
    }
  };

  // atualizar a quantidade de um produto no carrinho
  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // O valor atualizado do carrinho, salvar no localStorage e sair da função caso a qtd do produto for menor ou igual a 0
      if (amount <= 0) {
        return;
      }
      
      const productStock = await api.get(`/stock/${productId}`)
      const productStockAmount = productStock.data.amount;

        if (amount > productStockAmount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      
      const updatedCart = [...cart]
      const productExists = updatedCart.find(product => product.id === productId)

       if (productExists) {
        productExists.amount = amount;
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
       } else {
         throw Error();
       } 
    
    } catch {
      // msg de erro
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
