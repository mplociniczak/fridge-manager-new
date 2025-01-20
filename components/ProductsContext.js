import React, { createContext, useContext, useState } from 'react';

const ProductsContext = createContext();

export function useProducts() {
  return useContext(ProductsContext);
}

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [deletedProducts, setDeletedProducts] = useState([]);

  const addProduct = (product) => {
    setProducts(currentProducts => [...currentProducts, product]);
  };

  const removeProduct = (productId) => {
    const productToRemove = products.find(p => p.id === productId);
    if (productToRemove) {
      setDeletedProducts(current => [productToRemove, ...current]);
      setProducts(currentProducts => 
        currentProducts.filter(product => product.id !== productId)
      );
    }
  };

  const undoDelete = () => {
    if (deletedProducts.length > 0) {
      const [productToRestore, ...remainingDeleted] = deletedProducts;
      setDeletedProducts(remainingDeleted);
      setProducts(current => [...current, productToRestore]);
      return productToRestore.name; // zwracamy nazwę do wyświetlenia w komunikacie
    }
    return null;
  };

  return (
    <ProductsContext.Provider value={{ 
      products, 
      addProduct, 
      removeProduct, 
      undoDelete,
      hasDeletedProducts: deletedProducts.length > 0 
    }}>
      {children}
    </ProductsContext.Provider>
  );
}